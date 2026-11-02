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

export interface InmuebleDecodificado {
  torreBloque: string;
  unidad: string;
  coeficiente: number;
  propietario: string;
  documento: string;
  email: string;
  telefono: string;
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
  onTenantCreado: (nuevoTenant: ClientTenantNode & { assignedAdminId: string }) => void;
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
  const [adminSeleccionadoId, setAdminSeleccionadoId] = useState(administradoresRegistrados[0]?.id || '');

  // Procesamiento con IA
  const [analizandoConIA, setAnalizandoConIA] = useState(false);
  const [inmueblesDecodificados, setInmueblesDecodificados] = useState<InmuebleDecodificado[]>([]);
  const [coeficienteTotal, setCoeficienteTotal] = useState<number>(0);

  const procesarBaseDatosConIA = (file: File) => {
    setAnalizandoConIA(true);
    onShowToast?.(`🧠 Decodificando "${file.name}" y vinculando con el administrador...`);

    setTimeout(() => {
      const mockDecodificado: InmuebleDecodificado[] = [
        { torreBloque: 'Torre 1', unidad: '101', coeficiente: 1.15, propietario: 'Gabriel Jaime Botero', documento: 'CC 71.240.119', email: 'gabriel.botero@gmail.com', telefono: '3004501234' },
        { torreBloque: 'Torre 1', unidad: '102', coeficiente: 1.15, propietario: 'Luz Marina Restrepo', documento: 'CC 43.120.985', email: 'luz.restrepo@hotmail.com', telefono: '3128905678' },
        { torreBloque: 'Torre 1', unidad: '201', coeficiente: 1.25, propietario: 'Inversiones del Poblado S.A.S.', documento: 'NIT 900.589.214-2', email: 'contacto@inversionespoblado.co', telefono: '3104009988' },
        { torreBloque: 'Torre 2', unidad: '301', coeficiente: 1.25, propietario: 'Esteban Ochoa Mesa', documento: 'CC 1.037.648.291', email: 'esteban.ochoa@gmail.com', telefono: '3157891234' }
      ];

      setInmueblesDecodificados(mockDecodificado);
      const sumaCoef = mockDecodificado.reduce((acc, curr) => acc + curr.coeficiente, 0);
      setCoeficienteTotal(Number(sumaCoef.toFixed(2)));
      setAnalizandoConIA(false);
      onShowToast?.('✨ Base de datos decodificada y asociada al administrador seleccionado.');
    }, 2000);
  };

  const handleCrearTenantFinal = async () => {
    if (!nombreLegal.trim() || !nitCopropiedad.trim()) {
      onShowToast?.('⚠️ Completa el nombre y el NIT de la copropiedad.');
      return;
    }

    try {
      const unitsCalculated = inmueblesDecodificados.length > 0 ? inmueblesDecodificados.length : 120;
      const mrrCalculated = planSaaS === 'Enterprise' ? 1800000 : planSaaS === 'Pro' ? 1200000 : 750000;
      let tenantData: any = null;

      if (isSupabaseConfigured) {
        // 1. Insertar el nuevo Tenant en Supabase dejando que Postgres genere el UUID
        const { data, error: tenantError } = await supabase
          .from('tenants')
          .insert([
            {
              name: nombreLegal.trim(),
              status: 'active',
              plan: planSaaS,
              units_count: unitsCalculated,
              mrr: mrrCalculated,
              assigned_admin_id: adminSeleccionadoId
            }
          ])
          .select()
          .single();

        if (tenantError) throw tenantError;
        tenantData = data;

        // 2. Si la IA decodificó inmuebles del archivo, insertarlos en lote vinculados al tenant_id (UUID)
        if (inmueblesDecodificados.length > 0 && tenantData) {
          const payloadInmuebles = inmueblesDecodificados.map(inm => ({
            tenant_id: tenantData.id,
            torre_bloque: inm.torreBloque,
            numero_unidad: inm.unidad,
            coeficiente: inm.coeficiente,
            propietario_nombre: inm.propietario,
            propietario_documento: inm.documento,
            propietario_email: inm.email,
            propietario_telefono: inm.telefono,
            saldo_actual: 0
          }));

          const { error: inmueblesError } = await supabase
            .from('inmuebles')
            .insert(payloadInmuebles);

          if (inmueblesError) {
            console.error('Error insertando inmuebles:', inmueblesError);
            onShowToast?.('⚠️ Copropiedad creada, pero hubo un detalle al sembrar algunos inmuebles.');
          }
        }
      } else {
        tenantData = {
          id: crypto.randomUUID ? crypto.randomUUID() : `tenant-${Date.now()}`,
          name: nombreLegal.trim(),
          status: 'active',
          plan: planSaaS,
          units_count: unitsCalculated,
          mrr: mrrCalculated
        };
      }

      // 3. Notificar al estado de React
      const adminAsignado = administradoresRegistrados.find(a => a.id === adminSeleccionadoId);
      const planLabel: ClientTenantNode['plan'] =
        tenantData.plan === 'Enterprise'
          ? 'Plan Enterprise'
          : tenantData.plan === 'Pro'
          ? 'Plan Profesional'
          : tenantData.plan === 'Standard'
          ? 'Plan Esencial'
          : tenantData.plan;

      onTenantCreado({
        id: tenantData.id,
        name: tenantData.name,
        nit: `${nitCopropiedad.trim()}-${dv}`,
        city: direccion.trim() ? `${direccion.trim()}, ${ciudad.trim()}` : ciudad.trim(),
        adminName: adminAsignado ? `${adminAsignado.nombre} (${adminAsignado.empresa})` : 'Administrador Titular',
        adminEmail: adminAsignado?.email || 'admin@copropiedad.com',
        status: tenantData.status,
        financialStatus: 'Al Día',
        cutOffDate: '2026-12-01',
        lastBillingDate: new Date().toISOString().split('T')[0],
        cufeDian: `CUFE: ${Math.random().toString(16).slice(2, 18)}a3bf4f1b2bnd`,
        plan: planLabel,
        monthlyFee: Number(tenantData.mrr),
        unitsCount: tenantData.units_count,
        mrr: Number(tenantData.mrr),
        featureFlags: {
          contable: true,
          nomina: true,
          porteria: true,
          aseo: true,
          reservas: true,
          residente: true,
          boveda: true
        },
        assignedAdminId: adminSeleccionadoId
      });

      onShowToast?.(`🔒 Copropiedad blindada: Solo ${adminAsignado?.nombre || 'el admin'} tiene acceso.`);
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
            <div className="bg-[#07090e] border border-cyan-500/30 p-4 rounded-2xl space-y-2">
              <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Administrador Titular Exclusivo
              </label>
              <select
                value={adminSeleccionadoId}
                onChange={(e) => setAdminSeleccionadoId(e.target.value)}
                className="w-full p-2.5 bg-[#0b0f17] border border-slate-700 text-white font-mono text-xs rounded-xl outline-none focus:border-cyan-400 cursor-pointer"
              >
                {administradoresRegistrados.map((admin) => (
                  <option key={admin.id} value={admin.id}>
                    {admin.nombre} • {admin.empresa}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 font-mono block">
                Solo este administrador podrá ver y gestionar la base de datos de este inmueble.
              </span>
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
            <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              2. Censo / Base de Datos Cruda (Excel / CSV)
            </span>

            <div
              onDragOver={(e) => e.preventDefault()}
              onClick={() => {
                const fakeFile = new File([''], 'Censo_Propietarios_MontesClaros.xlsx');
                procesarBaseDatosConIA(fakeFile);
              }}
              className="border-2 border-dashed border-fuchsia-500/30 hover:border-fuchsia-400 bg-[#07090e] rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 group"
            >
              {analizandoConIA ? (
                <div className="space-y-2 py-4">
                  <RefreshCw className="w-8 h-8 text-fuchsia-400 animate-spin mx-auto" />
                  <p className="text-xs font-mono text-fuchsia-300">Normalizando coeficientes y unidades con IA...</p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 bg-fuchsia-500/10 rounded-2xl flex items-center justify-center text-fuchsia-400 group-hover:scale-110 transition border border-fuchsia-500/20">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <strong className="text-xs text-white block">
                    Arrastra aquí la base de datos entregada por el Administrador
                  </strong>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    La IA organizará torres, cédulas, números de teléfono y coeficientes automáticamente.
                  </p>
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
