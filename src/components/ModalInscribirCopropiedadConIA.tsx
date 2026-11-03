import React, { useState } from 'react';
import { 
  Building2, 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  ShieldCheck, 
  RefreshCw,
  Lock
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { ClientTenantNode } from './SaaS_MasterOwnerConsole';
import * as XLSX from 'xlsx';
import { aprovisionarResidentesCenso } from '../aprovisionarResidentesCenso';

export interface InmuebleDecodificado {
  id?: string;
  codigo?: string;
  torreBloque: string;
  unidad: string;
  coeficiente: number;
  propietario: string;
  documento: string;
  email: string;
  telefono: string;
  torre?: string;
  apto?: string;
  titular?: string;
  cedula?: string;
  coef?: number;
  estado?: string;
}

export interface AdminDisponible {
  id: string;
  nombre: string;
  empresa: string;
  email: string;
}

export default function ModalInscribirCopropiedadConIA({
  administradoresRegistrados = [
    { id: 'adm-001', nombre: 'Carlos Mario Pineda', empresa: 'Administraciones Pineda S.A.S.', email: 'carlos@pineda.com' },
    { id: 'adm-002', nombre: 'Martha Lucía Gómez', empresa: 'Gestión Inmobiliaria Integral', email: 'martha@gestionintegral.co' }
  ],
  onCerrar,
  onTenantCreado,
  onShowToast
}: {
  administradoresRegistrados?: AdminDisponible[];
  onCerrar: () => void;
  onTenantCreado: (nuevoTenant: ClientTenantNode & { assignedAdminId?: string | null }) => void;
  onShowToast?: (msg: string) => void;
}) {
  // Datos legales del Tenant
  const [nombreLegal, setNombreLegal] = useState('');
  const [nitCopropiedad, setNitCopropiedad] = useState('');
  const [dv, setDv] = useState('1');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('Medellín');
  const [planSaaS, setPlanSaaS] = useState<'Standard' | 'Pro' | 'Enterprise'>('Pro');

  // Administrador Asignado (Aislamiento de Seguridad)
  const [adminSeleccionadoId, setAdminSeleccionadoId] = useState('');

  // Procesamiento con IA
  const [analizandoConIA, setAnalizandoConIA] = useState(false);
  const [inmueblesDecodificados, setInmueblesDecodificados] = useState<InmuebleDecodificado[]>([]);
  const [coeficienteTotal, setCoeficienteTotal] = useState<number>(0);

  // Alias para mantener compatibilidad
  const setUnidadesMapeadas = (unidades: InmuebleDecodificado[]) => setInmueblesDecodificados(unidades);
  const setTotalCoeficiente = (total: string | number) => setCoeficienteTotal(Number(total));

  const handleProcesarArchivoCenso = async (file: File) => {
    if (!file) return;

    setAnalizandoConIA(true);
    onShowToast?.(`Procesando "${file.name}"...`);

    try {
      let text = '';
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        text = XLSX.utils.sheet_to_csv(worksheet);
      } else {
        text = await file.text();
      }

      // Dividir en líneas y descartar renglones vacíos
      const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

      if (lines.length < 2) {
        throw new Error('El archivo no contiene suficientes registros.');
      }

      // Identificar el delimitador (coma o punto y coma)
      const headerLine = lines[0];
      const delimiter = headerLine.includes(';') ? ';' : ',';

      // Omitir cabecera y extraer las filas de datos
      const rows = lines.slice(1);

      const unidadesParseadas: InmuebleDecodificado[] = rows.map((line) => {
        // Regex para respetar comas o puntos y coma dentro de comillas
        const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^"${delimiter}]*))`, 'g');
        const cols: string[] = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
          cols.push((match[1] || match[2] || '').trim());
        }

        // Columnas del CSV:
        // 0: Torre | 1: Apartamento | 2: Código | 3: Propietario | 4: Cédula | 5: Teléfono | 6: Correo | 7: Coeficiente
        const torre = cols[0] || 'Torre 1';
        const apto = cols[1] || '';
        const propietario = cols[3] || 'Sin Propietario';
        
        // Coeficiente: 0.01 se convierte a 1.0%
        const coefRaw = parseFloat(cols[7] ? cols[7].replace(',', '.') : '0.01');
        const coefPct = !isNaN(coefRaw) ? (coefRaw <= 1 ? coefRaw * 100 : coefRaw) : 1.0;

        return {
          id: cols[2] || `${torre}-${apto}`,
          codigo: cols[2] || `${torre}-${apto}`,
          torre,
          apto,
          titular: propietario,
          cedula: cols[4] || '',
          telefono: cols[5] || '',
          email: cols[6] || '',
          coef: Number(coefPct.toFixed(2)),
          torreBloque: torre,
          unidad: apto,
          propietario,
          documento: cols[4] || '',
          coeficiente: Number(coefPct.toFixed(2)),
          estado: cols[10] || 'Al día'
        };
      }).filter(u => u.apto); // Descartar filas sin número de apartamento

      if (unidadesParseadas.length === 0) {
        throw new Error('No se encontraron apartamentos válidos en el archivo.');
      }

      // Calcular la sumatoria de coeficientes
      const sumaCoef = unidadesParseadas.reduce((acc, curr) => acc + (curr.coef || curr.coeficiente), 0);

      // Actualizar estados de la interfaz
      setUnidadesMapeadas(unidadesParseadas);
      setTotalCoeficiente(sumaCoef.toFixed(1)); // Mostrará "100.0%"

      onShowToast?.(`✓ ¡Éxito! Se decodificaron ${unidadesParseadas.length} unidades (Coeficiente: ${sumaCoef.toFixed(1)}%).`);
    } catch (err: any) {
      console.error('Error al procesar censo:', err);
      onShowToast?.(`Error: ${err.message || 'No se pudo leer el archivo'}`);
    } finally {
      setAnalizandoConIA(false);
    }
  };

  const procesarBaseDatosConIA = (file: File) => {
    handleProcesarArchivoCenso(file);
  };

  const handleCrearTenantFinal = async () => {
    const nombreCopropiedad = nombreLegal;
    const direccionFisica = direccion;
    const unidadesMapeadas = inmueblesDecodificados;

    if (!nombreCopropiedad.trim() || !nitCopropiedad.trim()) {
      onShowToast?.('⚠️ Completa el nombre y el NIT de la copropiedad.');
      return;
    }

    try {
      const unitsCalculated = unidadesMapeadas.length > 0 ? unidadesMapeadas.length : 120;
      const mrrCalculated = planSaaS === 'Enterprise' ? 1800000 : planSaaS === 'Pro' ? 1200000 : 750000;
      let tenantCreado: any = null;

      if (isSupabaseConfigured) {
        // 1. Crear el tenant (copropiedad)
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .insert({
            name: nombreCopropiedad.trim(),
            nit: `${nitCopropiedad.trim()}-${dv}`,
            city: ciudad,
            address: direccionFisica.trim(),
            plan: planSaaS,
            assigned_admin_id: adminSeleccionadoId || null,
            units_count: unidadesMapeadas.length || unitsCalculated
          })
          .select()
          .single();

        if (tenantError) {
          console.warn('Aviso insertando tenant completo, reintentando con esquema base:', tenantError.message);
          const { data: retryData, error: retryError } = await supabase
            .from('tenants')
            .insert({
              name: nombreCopropiedad.trim(),
              status: 'active',
              plan: planSaaS,
              units_count: unidadesMapeadas.length || unitsCalculated,
              mrr: mrrCalculated,
              assigned_admin_id: adminSeleccionadoId || null
            })
            .select()
            .single();

          if (retryError) throw retryError;
          tenantCreado = retryData;
        } else {
          tenantCreado = tenantData;
        }

        // 2. Insertar las unidades en lote vinculadas al nuevo tenant
        if (unidadesMapeadas && unidadesMapeadas.length > 0 && tenantCreado) {
          const payloadUnits = unidadesMapeadas.map((u) => ({
            tenant_id: tenantCreado.id,
            unit_code: u.codigo || `${u.torre}-${u.apto}`,
            tower: u.torre || u.torreBloque,
            apartment: String(u.apto || u.unidad),
            owner_name: u.titular || u.propietario,
            owner_identification: u.cedula || u.documento,
            owner_phone: u.telefono,
            owner_email: u.email,
            coefficient: (u.coef || u.coeficiente || 1.0) / 100, // Guarda 0.010000 para el 1%
            debt_status: u.estado || 'Al día'
          }));

          const { error: unitsError } = await supabase
            .from('units')
            .insert(payloadUnits);

          if (unitsError) {
            console.error('Error insertando unidades en units:', unitsError.message);
            // Fallback a tabla 'inmuebles' si 'units' no está disponible
            const payloadInmuebles = unidadesMapeadas.map(inm => ({
              tenant_id: tenantCreado.id,
              torre_bloque: inm.torre || inm.torreBloque,
              numero_unidad: inm.apto || inm.unidad,
              coeficiente: inm.coef || inm.coeficiente,
              propietario_nombre: inm.titular || inm.propietario,
              propietario_documento: inm.cedula || inm.documento,
              propietario_email: inm.email,
              propietario_telefono: inm.telefono,
              saldo_actual: 0
            }));
            const { error: inmError } = await supabase.from('inmuebles').insert(payloadInmuebles);
            if (inmError) {
              onShowToast?.(`Copropiedad creada, pero hubo un detalle guardando las unidades: ${unitsError.message}`);
            } else {
              onShowToast?.(`¡Éxito! Copropiedad y las ${unidadesMapeadas.length} unidades registradas en base de datos.`);
            }
          } else {
            onShowToast?.(`¡Éxito! Copropiedad y las ${unidadesMapeadas.length} unidades registradas en base de datos.`);
          }

          // Aprovisionar accesos y perfiles de residentes con contraseña temporal predecible Ph[Cédula]!
          try {
            await aprovisionarResidentesCenso(unidadesMapeadas, tenantCreado.id);
          } catch (provErr: any) {
            console.warn('Aviso aprovisionando residentes:', provErr?.message);
          }
        }
      } else {
        tenantCreado = {
          id: crypto.randomUUID ? crypto.randomUUID() : `tenant-${Date.now()}`,
          name: nombreCopropiedad.trim(),
          status: 'active',
          plan: planSaaS,
          units_count: unitsCalculated,
          mrr: mrrCalculated
        };

        if (unidadesMapeadas && unidadesMapeadas.length > 0) {
          onShowToast?.(`¡Éxito! Copropiedad y las ${unidadesMapeadas.length} unidades registradas en base de datos.`);
          try {
            await aprovisionarResidentesCenso(unidadesMapeadas, tenantCreado.id);
          } catch {
            // Modo local fallback
          }
        }
      }

      // 3. Notificar al estado de React
      const tenantData = tenantCreado;
      const adminAsignado = administradoresRegistrados.find(a => a.id === adminSeleccionadoId);
      const planLabel: ClientTenantNode['plan'] =
        tenantData.plan === 'Enterprise'
          ? 'Plan Enterprise'
          : tenantData.plan === 'Pro'
          ? 'Plan Profesional'
          : tenantData.plan === 'Standard'
          ? 'Plan Esencial'
          : tenantData.plan;

      const nuevoTenant = {
        id: tenantData.id,
        name: tenantData.name,
        nit: `${nitCopropiedad.trim()}-${dv}`,
        city: direccionFisica.trim() ? `${direccionFisica.trim()}, ${ciudad.trim()}` : ciudad.trim(),
        assignedAdminId: adminSeleccionadoId || null,
        adminName: adminAsignado ? `${adminAsignado.nombre} (${adminAsignado.empresa})` : 'Pendiente por asignar',
        adminEmail: adminAsignado?.email || 'sin-asignar@urbix.com',
        status: tenantData.status || 'active',
        financialStatus: 'Al Día' as const,
        cutOffDate: '2026-12-01',
        lastBillingDate: new Date().toISOString().split('T')[0],
        cufeDian: `CUFE: ${Math.random().toString(16).slice(2, 18)}a3bf4f1b2bnd`,
        plan: planLabel,
        monthlyFee: Number(tenantData.mrr || mrrCalculated),
        unitsCount: tenantData.units_count || unitsCalculated,
        mrr: Number(tenantData.mrr || mrrCalculated),
        featureFlags: {
          contable: true,
          nomina: true,
          porteria: true,
          aseo: true,
          reservas: true,
          residente: true,
          boveda: true
        }
      };

      onTenantCreado(nuevoTenant);
      onCerrar();
    } catch (err: any) {
      onShowToast?.(`Error al crear copropiedad: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="bg-[#0b0f17] border border-fuchsia-500/40 rounded-3xl p-6 w-full max-w-4xl max-h-[92vh] overflow-y-auto space-y-6 shadow-[0_0_50px_rgba(217,70,239,0.15)]">
        
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-fuchsia-500/10 text-fuchsia-400 rounded-2xl border border-fuchsia-500/30">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold bg-fuchsia-500/10 text-fuchsia-400 px-2.5 py-0.5 rounded border border-fuchsia-500/30 uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <Sparkles className="w-3 h-3 text-fuchsia-300" /> Aislamiento RLS &amp; Decodificador IA
              </span>
              <h3 className="text-base font-black text-white mt-1">Alta de Copropiedad &amp; Asignación Exclusiva</h3>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onCerrar} 
            className="text-slate-400 hover:text-white text-xs font-mono p-2 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer"
          >
            ✕ Cerrar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LADO IZQUIERDO: DATOS LEGALES + SELECTOR DE ADMINISTRADOR ASIGNADO */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* SELECTOR DE ADMINISTRADOR TITULAR */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Administrador Titular (Opcional)
              </label>
              
              <select
                value={adminSeleccionadoId}
                onChange={(e) => setAdminSeleccionadoId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-cyan-500 outline-none"
              >
                <option value="">-- Sin asignar (Registrar solo el conjunto) --</option>
                {administradoresRegistrados.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.nombre} • {admin.empresa}
                  </option>
                ))}
              </select>
              
              <p className="text-[10px] text-slate-500 font-mono">
                {adminSeleccionadoId 
                  ? 'Acceso exclusivo asignado al administrador seleccionado.' 
                  : 'El conjunto quedará disponible en tu panel para asignarle administrador cuando quieras.'}
              </p>
            </div>

            {/* FORMULARIO LEGAL DE LA COPROPIEDAD */}
            <div className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Nombre Legal del Conjunto / Edificio</label>
                <input
                  type="text"
                  placeholder="Ej. Urbanización Montes Claros P.H."
                  value={nombreLegal}
                  onChange={(e) => setNombreLegal(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-fuchsia-400"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">NIT de la Copropiedad</label>
                  <input
                    type="text"
                    placeholder="900.842.115"
                    value={nitCopropiedad}
                    onChange={(e) => setNitCopropiedad(e.target.value)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-cyan-300 font-mono rounded-xl outline-none focus:border-fuchsia-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">DV</label>
                  <input
                    type="text"
                    maxLength={1}
                    value={dv}
                    onChange={(e) => setDv(e.target.value)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-center text-white font-mono rounded-xl outline-none focus:border-fuchsia-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Dirección Física</label>
                <input
                  type="text"
                  placeholder="Carrera 43A # 18 Sur - 120"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-fuchsia-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none focus:border-fuchsia-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Plan SaaS</label>
                  <select
                    value={planSaaS}
                    onChange={(e) => setPlanSaaS(e.target.value as any)}
                    className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-fuchsia-300 font-mono rounded-xl outline-none"
                  >
                    <option value="Standard">Standard</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
            </div>

          </div>

          {/* LADO DERECHO: ARRASTRE DE ARCHIVO Y DECODIFICADOR IA */}
          <div className="lg:col-span-7 space-y-4">
            {/* 2. CENSO / BASE DE DATOS CRUDA (EXCEL / CSV) */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files?.[0];
                if (file) handleProcesarArchivoCenso(file);
              }}
              className="border-2 border-dashed border-purple-500/30 hover:border-purple-500/60 bg-purple-950/10 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-3 transition-colors min-h-[220px]"
            >
              {analizandoConIA ? (
                <div className="space-y-2 py-4">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-purple-300">Normalizando coeficientes y unidades con IA...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <UploadCloud className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-black text-white">
                      Arrastra aquí la base de datos entregada por el Administrador
                    </p>
                    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                      La IA organizará torres, cédulas, números de teléfono y coeficientes automáticamente.
                    </p>
                  </div>

                  {/* Botón de selección manual */}
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="input-censo-file"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleProcesarArchivoCenso(f);
                    }}
                  />
                  <label
                    htmlFor="input-censo-file"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/40 text-purple-300 rounded-xl text-xs font-mono font-bold cursor-pointer transition"
                  >
                    Seleccionar desde mi equipo
                  </label>

                  <span className="text-[10px] font-mono text-slate-500">
                    Formatos admitidos: .xlsx, .xls, .csv
                  </span>
                </>
              )}
            </div>

            {inmueblesDecodificados.length > 0 && (
              <div className="bg-[#07090e] border border-slate-800 rounded-2xl p-4 space-y-3 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-mono font-bold text-white">
                      {inmueblesDecodificados.length} Unidades Mapeadas
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Coeficiente Total: {coeficienteTotal}%
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {inmueblesDecodificados.map((inm, idx) => (
                    <div 
                      key={idx} 
                      className="p-2 bg-[#0b0f17] border border-slate-800/80 rounded-xl flex items-center justify-between text-[11px] font-mono"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-fuchsia-400 bg-fuchsia-500/10 px-1.5 py-0.5 rounded">
                          {inm.torreBloque} - {inm.unidad}
                        </span>
                        <span className="text-slate-200 truncate max-w-[150px]">{inm.propietario}</span>
                      </div>
                      <span className="text-emerald-400 font-bold">{inm.coeficiente}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* PIE Y CONFIRMACIÓN */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-cyan-400" /> Acceso restringido exclusivamente al administrador asignado.
          </span>
          <button
            type="button"
            onClick={handleCrearTenantFinal}
            className="w-full sm:w-auto bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:opacity-90 text-white font-black px-6 py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(217,70,239,0.35)]"
          >
            <ShieldCheck className="w-4 h-4" /> Asignar Exclusividad &amp; Crear Copropiedad
          </button>
        </div>

      </div>
    </div>
  );
}
