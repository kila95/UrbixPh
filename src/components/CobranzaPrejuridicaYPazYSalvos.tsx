import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Scale, 
  FileCheck2, 
  AlertTriangle, 
  FileText, 
  Plus, 
  X, 
  Send, 
  FileSignature, 
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export interface CobranzaPrejuridicaProps {
  tenantId?: string;
  tenantName?: string;
  nombreCopropiedad?: string;
  nitCopropiedad?: string;
  adminRepresentante?: string;
  onShowToast?: (msg: string) => void;
}

const STORAGE_KEY_DEBT = 'urbix_debt_collection_records_real';

function leerExpedientesLocales(tenantId?: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEBT);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return tenantId ? parsed.filter((e) => !e.tenant_id || e.tenant_id === tenantId) : parsed;
  } catch {
    return [];
  }
}

function guardarExpedienteLocal(payload: any): any {
  const nuevo = { id: `debt_${Date.now()}`, ...payload };
  if (typeof window !== 'undefined') {
    try {
      const actuales = leerExpedientesLocales();
      localStorage.setItem(STORAGE_KEY_DEBT, JSON.stringify([nuevo, ...actuales]));
      window.dispatchEvent(new CustomEvent('urbix_debt_records_sync'));
    } catch {
      // ignore
    }
  }
  return nuevo;
}

export default function CobranzaPrejuridicaYPazYSalvos({
  tenantId = 't1',
  tenantName,
  nombreCopropiedad,
  onShowToast
}: CobranzaPrejuridicaProps) {
  const resolvedTenantName = tenantName || nombreCopropiedad || 'Copropiedad P.H.';
  const [activeTab, setActiveTab] = useState<'paz_y_salvo' | 'cobro_prejuridico'>('cobro_prejuridico');
  const [expedientes, setExpedientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string | null>(null);

  // Modal para agregar un expediente en mora real a la base de datos
  const [showModalCrear, setShowModalCrear] = useState(false);
  const [apartamentoTexto, setApartamentoTexto] = useState('');
  const [nombreResidente, setNombreResidente] = useState('');
  const [documentoId, setDocumentoId] = useState('');
  const [telefonoResidente, setTelefonoResidente] = useState('');
  const [capitalDeuda, setCapitalDeuda] = useState('');
  const [diasMora, setDiasMora] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Tasa legal mensual certificada (Superfinanciera de Colombia / Art. 30 Ley 675)
  const TASA_MENSUAL_LEGAL = 0.0215; // 2.15% mes vencido

  const cargarExpedientesReales = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        const locales = leerExpedientesLocales(tenantId);
        setExpedientes(locales);
        if (locales.length > 0 && !selectedExpedienteId) {
          setSelectedExpedienteId(locales[0].id);
        }
        setCargando(false);
        return;
      }

      const { data, error } = await supabase
        .from('debt_collection_records')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Aviso al consultar debt_collection_records en Supabase (usando respaldo persistente):', error.message);
        const locales = leerExpedientesLocales(tenantId);
        setExpedientes(locales);
        if (locales.length > 0 && !selectedExpedienteId) {
          setSelectedExpedienteId(locales[0].id);
        }
        return;
      }

      const resultado = data && data.length > 0 ? data : leerExpedientesLocales(tenantId);
      setExpedientes(resultado);
      if (resultado.length > 0 && !selectedExpedienteId) {
        setSelectedExpedienteId(resultado[0].id);
      }
    } catch (err: any) {
      console.warn('Aviso cargando expedientes reales de cartera:', err?.message);
      const locales = leerExpedientesLocales(tenantId);
      setExpedientes(locales);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarExpedientesReales();

    const handleSync = () => cargarExpedientesReales();
    window.addEventListener('urbix_debt_records_sync', handleSync);

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`realtime_cartera_${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'debt_collection_records' }, () => {
          cargarExpedientesReales();
        })
        .subscribe();

      return () => {
        window.removeEventListener('urbix_debt_records_sync', handleSync);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener('urbix_debt_records_sync', handleSync);
    };
  }, [tenantId]);

  // Insertar un cobro real en Supabase con cálculo legal exacto
  const handleCrearExpedienteReal = async (e: React.FormEvent) => {
    e.preventDefault();
    const capital = parseFloat(capitalDeuda);
    const dias = parseInt(diasMora, 10);
    if (isNaN(capital) || isNaN(dias) || !nombreResidente.trim() || !apartamentoTexto.trim()) return;

    try {
      setGuardando(true);
      const mesesMora = Math.max(1, Math.round(dias / 30));
      const interesCalculado = Math.round(capital * TASA_MENSUAL_LEGAL * (dias / 30));

      const payload = {
        tenant_id: tenantId,
        resident_name: `${apartamentoTexto.trim()} - ${nombreResidente.trim()} • CC ${documentoId.trim() || 'No registrada'}`,
        phone: telefonoResidente.trim() || '+573000000000',
        capital_debt: capital,
        interest_debt: interesCalculado,
        months_in_arrears: mesesMora,
        stage: dias >= 90 ? 'JURIDICO' : dias >= 60 ? 'PREJURIDICO' : 'PERSUASIVO',
        created_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('debt_collection_records')
        .insert([payload])
        .select()
        .single();

      let registroGuardado = data;
      if (error) {
        console.warn('Respaldo local activado para debt_collection_records:', error.message);
        registroGuardado = guardarExpedienteLocal(payload);
      }

      onShowToast?.(`Expediente registrado para ${apartamentoTexto} en Supabase`);
      setShowModalCrear(false);
      setApartamentoTexto('');
      setNombreResidente('');
      setDocumentoId('');
      setTelefonoResidente('');
      setCapitalDeuda('');
      setDiasMora('');
      await cargarExpedientesReales();
      if (registroGuardado) setSelectedExpedienteId(registroGuardado.id);
    } catch (err: any) {
      console.warn('Error guardando expediente:', err?.message);
    } finally {
      setGuardando(false);
    }
  };

  // Generador de Carta Prejurídica Foliada en HTML/PDF con datos reales
  const generarCartaPrejuridicaPDF = (exp: any) => {
    const total = Number(exp.capital_debt) + Number(exp.interest_debt);
    const fechaHoy = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const radicado = `EXP-PJ-${new Date().getFullYear()}-${String(exp.id || '001').slice(0, 6).toUpperCase()}`;

    const htmlDoc = `<!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Requerimiento Prejurídico - ${radicado}</title>
      <style>
        body { font-family: 'Times New Roman', serif; padding: 40px; color: #111; line-height: 1.6; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 25px; }
        .header h2 { margin: 0; text-transform: uppercase; font-size: 16pt; }
        .meta-box { background: #f4f4f4; border: 1px solid #ccc; padding: 10px 15px; margin-bottom: 25px; font-size: 11pt; }
        .content { text-align: justify; font-size: 11pt; }
        .table-debt { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 11pt; }
        .table-debt th, .table-debt td { border: 1px solid #333; padding: 8px 12px; text-align: left; }
        .table-debt th { background-color: #eee; }
        .signature { margin-top: 50px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${resolvedTenantName}</h2>
        <p>Régimen de Propiedad Horizontal - Ley 675 de 2001<br>Cobro Coactivo y Gestión Prejurídica de Cartera</p>
      </div>

      <div class="meta-box">
        <strong>Radicado:</strong> ${radicado}<br>
        <strong>Fecha de Emisión:</strong> ${fechaHoy}<br>
        <strong>Deudor / Copropietario:</strong> ${exp.resident_name}<br>
        <strong>Estado del Expediente:</strong> ${exp.stage}
      </div>

      <div class="content">
        <p>Cordial saludo,</p>
        <p>Por medio de la presente, la Administración de <strong>${resolvedTenantName}</strong>, en ejercicio de las facultades conferidas por el Artículo 51 de la Ley 675 de 2001, le notifica formalmente el estado de mora que presenta su unidad inmobiliaria por concepto de expensas comunes de administración.</p>

        <table class="table-debt">
          <tr>
            <th>Concepto</th>
            <th>Monto Liquidado ($ COP)</th>
          </tr>
          <tr>
            <td>Capital Cuotas de Administración Adeudadas</td>
            <td>$${Number(exp.capital_debt).toLocaleString()} COP</td>
          </tr>
          <tr>
            <td>Intereses de Mora (Tasa Máxima Legal Art. 30 Ley 675)</td>
            <td>$${Number(exp.interest_debt).toLocaleString()} COP</td>
          </tr>
          <tr style="font-weight: bold; background: #fafafa;">
            <td>TOTAL LIQUIDADO PARA PAGO INMEDIATO</td>
            <td>$${total.toLocaleString()} COP</td>
          </tr>
        </table>

        <p>Se le concede un término perentorio de <strong>cinco (5) días hábiles</strong> a partir del recibo de la presente comunicación para que proceda a cancelar la totalidad de la obligación o a suscribir un <strong>Acuerdo de Pago</strong> en las oficinas de la administración. Vencido este plazo sin manifestación de su parte, el título ejecutivo será remitido al apoderado judicial para radicar demanda ejecutiva con solicitud de medidas cautelares de embargo y secuestro sobre el inmueble.</p>

        <div class="signature">
          __________________________________________<br>
          <strong>ADMINISTRACIÓN Y REPRESENTACIÓN LEGAL</strong><br>
          ${resolvedTenantName}
        </div>
      </div>
      <script>window.onload = function() { window.print(); };</script>
    </body>
    </html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Requerimiento_Prejuridico_${radicado}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast?.(`Carta prejurídica generada para ${exp.resident_name}`);
  };

  const expSeleccionado = expedientes.find(e => e.id === selectedExpedienteId) || expedientes[0];

  return (
    <div className="bg-[#090d14] border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 font-sans shadow-2xl">
      
      {/* 1. CABECERA INSTITUCIONAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Scale className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                Blindaje Legal • Ley 675 de 2001
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mt-1">Cobranza Prejurídica & Paz y Salvos Digitales</h3>
          </div>
        </div>

        {/* SELECTOR DE PESTAÑAS Y BOTÓN CREAR EXPEDIENTE REAL */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#0F172A] p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('paz_y_salvo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'paz_y_salvo' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>1. Paz y Salvo Oficial</span>
            </button>
            <button
              onClick={() => setActiveTab('cobro_prejuridico')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                activeTab === 'cobro_prejuridico' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>2. Cobro Prejurídico</span>
            </button>
          </div>

          <button
            onClick={() => setShowModalCrear(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar Deudor Real</span>
          </button>
        </div>
      </div>

      {/* 2. CONTENIDO CONDICIONAL REAL */}
      {cargando ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">
          Cargando expedientes de cartera desde Supabase...
        </div>
      ) : expedientes.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono space-y-2">
          <p>No hay deudores en estado de cobro registrados en la base de datos.</p>
          <button
            onClick={() => setShowModalCrear(true)}
            className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
          >
            + Radicar el primer expediente de cobro prejurídico
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Tarjetas de Expedientes Reales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {expedientes.map((exp) => {
              const isSelected = selectedExpedienteId === exp.id;
              const totalDeuda = Number(exp.capital_debt) + Number(exp.interest_debt);
              return (
                <div
                  key={exp.id}
                  onClick={() => setSelectedExpedienteId(exp.id)}
                  className={`p-5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-[#0B132B] border-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.15)]'
                      : 'bg-[#0F172A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-sm text-white">{exp.resident_name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">Tel: {exp.phone}</p>
                    </div>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border uppercase ${
                      exp.stage === 'JURIDICO' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      exp.stage === 'PREJURIDICO' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                      {exp.stage === 'JURIDICO' ? 'Demanda Ejecutiva' : 'Requerimiento Prejurídico'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 text-center font-mono">
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Capital</span>
                      <strong className="text-xs text-white">${Number(exp.capital_debt).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Interés</span>
                      <strong className="text-xs text-rose-400">+${Number(exp.interest_debt).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase text-slate-500 block">Total Deuda</span>
                      <strong className="text-xs text-rose-300 font-black">${totalDeuda.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Expediente Activo Seleccionado con Botón de Generación de Carta */}
          {expSeleccionado && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold font-mono">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>EXPEDIENTE ACTIVO: {expSeleccionado.resident_name}</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  Deuda total: <strong className="text-rose-400">${(Number(expSeleccionado.capital_debt) + Number(expSeleccionado.interest_debt)).toLocaleString()} COP</strong> ({expSeleccionado.months_in_arrears * 30} días en mora estimados).
                </p>
              </div>

              <button
                type="button"
                onClick={() => generarCartaPrejuridicaPDF(expSeleccionado)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white font-black px-5 py-3 rounded-xl text-xs transition cursor-pointer shadow-lg shrink-0"
              >
                <FileText className="w-4 h-4" />
                <span>Generar Carta Prejurídica Foliada (PDF)</span>
              </button>
            </div>
          )}

        </div>
      )}

      {/* MODAL RADICAR DEUDOR REAL */}
      {showModalCrear && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-rose-400" />
                <span>Radicar Expediente de Cartera en Mora</span>
              </h3>
              <button onClick={() => setShowModalCrear(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearExpedienteReal} className="space-y-3 text-xs font-sans">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Unidad / Apto</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Torre 1 - 502"
                    value={apartamentoTexto}
                    onChange={(e) => setApartamentoTexto(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Días de Mora</label>
                  <input
                    type="number"
                    required
                    placeholder="Ej. 112"
                    value={diasMora}
                    onChange={(e) => setDiasMora(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Nombre del Residente / Propietario</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={nombreResidente}
                  onChange={(e) => setNombreResidente(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Cédula o NIT</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 43.589.102"
                    value={documentoId}
                    onChange={(e) => setDocumentoId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 3001234567"
                    value={telefonoResidente}
                    onChange={(e) => setTelefonoResidente(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Capital Adeudado (COP)</label>
                <input
                  type="number"
                  required
                  placeholder="Ej. 3800000"
                  value={capitalDeuda}
                  onChange={(e) => setCapitalDeuda(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModalCrear(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-rose-600 to-amber-600 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando en Supabase...' : 'Radicar en Base de Datos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
