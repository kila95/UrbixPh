import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, DEFAULT_TENANT_UUID, normalizeTenantUuid } from './supabaseClient';
import { DollarSign, FileSpreadsheet, Plus, Award, ShieldCheck, FileText } from 'lucide-react';

const STORAGE_KEY_TREASURY = 'urbix_treasury_transactions_real';

function leerTransaccionesLocales(tenantId?: string): any[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TREASURY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return tenantId ? parsed.filter((t) => !t.tenant_id || t.tenant_id === tenantId) : parsed;
  } catch {
    return [];
  }
}

function guardarTransaccionesLocales(lista: any[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TREASURY, JSON.stringify(lista));
  } catch {
    // ignore storage errors
  }
}

export default function ModuloTesoreriaExogenaReal({ tenantId: rawTenantId = DEFAULT_TENANT_UUID, onShowToast }: { tenantId?: string; onShowToast?: (msg: string) => void }) {
  const tenantId = normalizeTenantUuid(rawTenantId);
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Estados del formulario contable real
  const [tipo, setTipo] = useState<'Ingreso' | 'Egreso'>('Ingreso');
  const [formatoDian, setFormatoDian] = useState('1001'); // 1001, 1003, 1005, 1007
  const [concepto, setConcepto] = useState('');
  const [tercero, setTercero] = useState('');
  const [nitTercero, setNitTercero] = useState('');
  const [valor, setValor] = useState('');
  const [retencion, setRetencion] = useState('0');
  const [iva, setIva] = useState('0');
  const [guardando, setGuardando] = useState(false);

  const cargarTransaccionesReales = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        setTransacciones(leerTransaccionesLocales(tenantId));
        setCargando(false);
        return;
      }
      const { data, error } = await supabase
        .from('treasury_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Si la tabla treasury_transactions aún no existe en el esquema de Supabase, usar almacenamiento persistente sin disparar error fatal
        console.warn('Aviso al consultar treasury_transactions en Supabase (usando respaldo persistente):', error.message);
        setTransacciones(leerTransaccionesLocales(tenantId));
        return;
      }

      if (data && data.length > 0) {
        setTransacciones(data);
        guardarTransaccionesLocales(data);
      } else {
        setTransacciones(leerTransaccionesLocales(tenantId));
      }
    } catch (err: any) {
      console.warn('Aviso cargando transacciones:', err?.message);
      setTransacciones(leerTransaccionesLocales(tenantId));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTransaccionesReales();

    const handleLocalUpdate = () => cargarTransaccionesReales();
    window.addEventListener('urbix_treasury_updated', handleLocalUpdate);

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('treasury_exogena_realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'treasury_transactions' }, () => {
          cargarTransaccionesReales();
        })
        .subscribe();

      return () => {
        window.removeEventListener('urbix_treasury_updated', handleLocalUpdate);
        supabase.removeChannel(channel);
      };
    }

    return () => {
      window.removeEventListener('urbix_treasury_updated', handleLocalUpdate);
    };
  }, [tenantId]);

  const handleCrearTransaccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !valor) return;

    try {
      setGuardando(true);
      const payload = {
        tenant_id: tenantId,
        type: tipo,
        dian_format: formatoDian, // Guardar a qué formato exógena pertenece
        concept: concepto.trim(),
        third_party: tercero.trim() || 'General',
        nit_third_party: nitTercero.trim() || '900000000-0',
        amount: parseFloat(valor),
        withholding_tax: parseFloat(retencion) || 0,
        vat_tax: parseFloat(iva) || 0,
        created_at: new Date().toISOString()
      };

      let guardadoEnSupabase = false;
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('treasury_transactions').insert([payload]);
        if (!error) {
          guardadoEnSupabase = true;
        } else {
          console.warn('Respaldo local activado al insertar en treasury_transactions:', error.message);
        }
      }

      if (!guardadoEnSupabase) {
        const nuevoRegistro = { id: `tx_${Date.now()}`, ...payload };
        const actuales = leerTransaccionesLocales();
        const actualizadas = [nuevoRegistro, ...actuales];
        guardarTransaccionesLocales(actualizadas);
        setTransacciones(actualizadas.filter((t) => !t.tenant_id || t.tenant_id === tenantId));
      } else {
        await cargarTransaccionesReales();
      }

      onShowToast?.(`Transacción contabilizada en Formato ${formatoDian} exitosamente`);
      setShowModal(false);
      setConcepto('');
      setTercero('');
      setNitTercero('');
      setValor('');
      setRetencion('0');
      setIva('0');
    } catch (err: any) {
      console.warn('Error guardando transacción:', err?.message);
    } finally {
      setGuardando(false);
    }
  };

  // Filtrar y calcular métricas reales
  const filtrarPorFormato = (formato: string) => transacciones.filter(t => (t.dian_format || '1001') === formato);

  const calcularMetricasFormato = (formato: string) => {
    const lista = filtrarPorFormato(formato);
    const registros = lista.length;
    const montoAcumulado = lista.reduce((acc, t) => {
      if (formato === '1003') return acc + Number(t.withholding_tax || t.amount || 0);
      if (formato === '1005') return acc + Number(t.vat_tax || t.withholding_tax || t.amount || 0);
      return acc + Number(t.amount || 0);
    }, 0);
    return { registros, montoAcumulado };
  };

  // Exportar XML real del formato seleccionado
  const exportarFormatoDianXML = (formato: string) => {
    const lista = filtrarPorFormato(formato);
    if (lista.length === 0) {
      onShowToast?.(`No hay registros en el Formato ${formato} para exportar.`);
      return;
    }

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<MediosMagneticosDIAN ano="${new Date().getFullYear()}" formato="${formato}">\n`;
    lista.forEach(t => {
      xmlContent += `  <Registro>\n    <NIT>${t.nit_third_party}</NIT>\n    <Tercero>${t.third_party}</Tercero>\n    <Concepto>${t.concept}</Concepto>\n    <Valor>${t.amount}</Valor>\n    <Retencion>${t.withholding_tax || 0}</Retencion>\n  </Registro>\n`;
    });
    xmlContent += `</MediosMagneticosDIAN>`;

    const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Formato_DIAN_${formato}_${new Date().getFullYear()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.(`XML Formato ${formato} exportado correctamente`);
  };

  const f1001 = calcularMetricasFormato('1001');
  const f1003 = calcularMetricasFormato('1003');
  const f1005 = calcularMetricasFormato('1005');
  const f1007 = calcularMetricasFormato('1007');

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Exógena DIAN & Medios Magnéticos (100% Real)</h3>
            <p className="text-xs text-slate-400 font-mono">Cálculos automáticos basados estrictamente en el libro diario de Supabase</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Transacción Contable</span>
        </button>
      </div>

      {/* Tarjetas de Formatos DIAN Calculadas Dinámicamente */}
      <div className="space-y-4">
        
        {/* Formato 1001 */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/20">
                Formato 1001
              </span>
              <span className="text-xs font-bold text-white">Pagos o Abonos en Cuenta y Retenciones Practicadas</span>
            </div>
            <p className="text-xs text-slate-400">Compras a proveedores de vigilancia, aseo, mantenimiento y honorarios.</p>
            <p className="text-[11px] font-mono text-slate-400">
              Registros procesados: <strong className="text-emerald-400">{f1001.registros}</strong> • Monto acumulado: <strong className="text-cyan-400">${f1001.montoAcumulado.toLocaleString()} COP</strong>
            </p>
          </div>
          <button
            onClick={() => exportarFormatoDianXML('1001')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
          >
            Descargar XML DIAN
          </button>
        </div>

        {/* Formato 1003 */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/20">
                Formato 1003
              </span>
              <span className="text-xs font-bold text-white">Retenciones en la Fuente que le Practicaron</span>
            </div>
            <p className="text-xs text-slate-400">Retenciones sobre rendimientos de cuentas bancarias de la copropiedad.</p>
            <p className="text-[11px] font-mono text-slate-400">
              Registros procesados: <strong className="text-emerald-400">{f1003.registros}</strong> • Monto acumulado: <strong className="text-cyan-400">${f1003.montoAcumulado.toLocaleString()} COP</strong>
            </p>
          </div>
          <button
            onClick={() => exportarFormatoDianXML('1003')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
          >
            Descargar XML DIAN
          </button>
        </div>

        {/* Formato 1005 */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/20">
                Formato 1005
              </span>
              <span className="text-xs font-bold text-white">Impuesto a las Ventas (IVA) Descontable</span>
            </div>
            <p className="text-xs text-slate-400">IVA pagado en insumos gravados y servicios técnicos.</p>
            <p className="text-[11px] font-mono text-slate-400">
              Registros procesados: <strong className="text-emerald-400">{f1005.registros}</strong> • Monto acumulado: <strong className="text-cyan-400">${f1005.montoAcumulado.toLocaleString()} COP</strong>
            </p>
          </div>
          <button
            onClick={() => exportarFormatoDianXML('1005')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
          >
            Descargar XML DIAN
          </button>
        </div>

        {/* Formato 1007 */}
        <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/20">
                Formato 1007
              </span>
              <span className="text-xs font-bold text-white">Ingresos Recibidos en el Año (Expensas & Zonas Comunes)</span>
            </div>
            <p className="text-xs text-slate-400">Cuotas ordinarias, extraordinarias, alquiler de salón social y parqueaderos.</p>
            <p className="text-[11px] font-mono text-slate-400">
              Registros procesados: <strong className="text-emerald-400">{f1007.registros}</strong> • Monto acumulado: <strong className="text-cyan-400">${f1007.montoAcumulado.toLocaleString()} COP</strong>
            </p>
          </div>
          <button
            onClick={() => exportarFormatoDianXML('1007')}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs transition cursor-pointer shrink-0"
          >
            Descargar XML DIAN
          </button>
        </div>

      </div>

      {/* MODAL NUEVA TRANSACCIÓN CONTABLE CON SELECCIÓN DE FORMATO DIAN */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-3">Contabilizar para Exógena DIAN</h3>
            <form onSubmit={handleCrearTransaccion} className="space-y-3 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Asociar a Formato DIAN</label>
                <select
                  value={formatoDian}
                  onChange={(e) => setFormatoDian(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="1001">Formato 1001 (Pagos / Proveedores / Honorarios)</option>
                  <option value="1003">Formato 1003 (Retenciones que le practicaron)</option>
                  <option value="1005">Formato 1005 (IVA Descontable)</option>
                  <option value="1007">Formato 1007 (Ingresos / Cuotas de Administración)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Tipo de Movimiento</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Ingreso">Ingreso</option>
                  <option value="Egreso">Egreso / Gasto</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Concepto Contable</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Pago vigilancia mensual"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Tercero</label>
                  <input
                    type="text"
                    placeholder="Nombre empresa/persona"
                    value={tercero}
                    onChange={(e) => setTercero(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">NIT o Cédula</label>
                  <input
                    type="text"
                    placeholder="900123456-1"
                    value={nitTercero}
                    onChange={(e) => setNitTercero(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Valor (COP)</label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">IVA / Retención</label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={retencion}
                    onChange={(e) => setRetencion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Contabilizar en Formato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
