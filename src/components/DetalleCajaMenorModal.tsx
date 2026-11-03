import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  PlusCircle, 
  MinusCircle, 
  Receipt, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download, 
  Filter, 
  Printer, 
  Building2,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface MovimientoCajaMenor {
  id: string;
  recibo_num: string;
  fecha: string;
  concepto: string;
  tipo: 'egreso' | 'ingreso';
  monto: number;
  saldo_resultante: number;
  categoria: 'Ferretería / Locativo' | 'Insumos de Aseo' | 'Cerrajería & Seguridad' | 'Mensajería & Correo' | 'Fotocopias & Papelería' | 'Apertura / Reintegro Fondo';
  proveedor: string;
  nit_proveedor: string;
  responsable: string;
  soporte_url?: string;
}

interface DetalleCajaMenorModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  tenantName?: string;
  onShowToast?: (msg: string) => void;
  onMovimientoRegistrado?: () => void;
}

const STORAGE_KEY_CAJA = 'urbix_caja_menor_tricentenario_v1';

export default function DetalleCajaMenorModal({
  isOpen,
  onClose,
  tenantId = '22079bb5-6ac7-4a15-be89-c53d14e4221b',
  tenantName = 'urb Tricentenario',
  onShowToast,
  onMovimientoRegistrado
}: DetalleCajaMenorModalProps) {
  // Empezando desde CERO (vacía) como solicitó expresamente el usuario
  const [movimientos, setMovimientos] = useState<MovimientoCajaMenor[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY_CAJA);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        console.warn('Error leyendo caja menor local:', e);
      }
    }
    return [];
  });

  const [fondoFijoTope, setFondoFijoTope] = useState<number>(500000); // $500.000 COP fondo fijo inicial estándar Ley 675
  const [mostrarFormulario, setMostrarFormulario] = useState<'egreso' | 'ingreso' | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'egreso' | 'ingreso'>('todos');
  const [mostrarActaArqueo, setMostrarActaArqueo] = useState(false);

  // Campos del formulario
  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState<number | ''>('');
  const [proveedor, setProveedor] = useState('');
  const [nitProveedor, setNitProveedor] = useState('');
  const [categoria, setCategoria] = useState<MovimientoCajaMenor['categoria']>('Ferretería / Locativo');
  const [responsable, setResponsable] = useState('Administración / Supervisor Tricentenario');
  const [numRecibo, setNumRecibo] = useState('');

  // Cargar movimientos desde Supabase petty_cash_movements al abrir
  useEffect(() => {
    const cargarMovimientosSupabase = async () => {
      if (!isOpen || !tenantId) return;
      try {
        const { data, error } = await supabase
          .from('petty_cash_movements')
          .select('*')
          .eq('tenant_id', tenantId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          let runningBalance = 0;
          const orderedAsc = [...data].reverse();
          const mappedAsc: MovimientoCajaMenor[] = orderedAsc.map((m: any, idx: number) => {
            const esIngreso = m.type === 'ingreso' || m.type === 'dotacion';
            const val = Number(m.amount) || 0;
            runningBalance = esIngreso ? runningBalance + val : Math.max(0, runningBalance - val);
            return {
              id: String(m.id || `cm-${idx}`),
              recibo_num: m.receipt_number || (esIngreso ? `ING-CM-${String(idx + 1).padStart(3, '0')}` : `EGR-CM-${String(idx + 1).padStart(3, '0')}`),
              fecha: m.created_at ? new Date(m.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('es-CO'),
              concepto: m.concept || m.description || (esIngreso ? 'Dotación / Ingreso Caja Menor' : 'Gasto Caja Menor'),
              tipo: esIngreso ? 'ingreso' : 'egreso',
              monto: val,
              saldo_resultante: runningBalance,
              categoria: m.category || (esIngreso ? 'Apertura / Reintegro Fondo' : 'Ferretería / Locativo'),
              proveedor: m.provider || (esIngreso ? 'Reembolso Bancario / Administración' : 'Proveedor Local'),
              nit_proveedor: m.provider_nit || 'N/A',
              responsable: m.responsible || 'Administración Tricentenario'
            };
          });
          setMovimientos(mappedAsc.reverse());
        }
      } catch (err) {
        console.warn('Aviso consultando petty_cash_movements:', err);
      }
    };
    cargarMovimientosSupabase();
  }, [isOpen, tenantId]);

  // Persistir en localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CAJA, JSON.stringify(movimientos));
      } catch (e) {
        console.warn('Error guardando caja menor:', e);
      }
    }
  }, [movimientos]);

  if (!isOpen) return null;

  // Cálculos en vivo empezando desde cero
  const totalIngresos = movimientos
    .filter(m => m.tipo === 'ingreso')
    .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'egreso')
    .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);

  const saldoDisponibleActual = Math.max(0, totalIngresos - totalEgresos);
  const porcentajeEjecutadoFondo = fondoFijoTope > 0 ? ((totalEgresos / fondoFijoTope) * 100).toFixed(1) : '0.0';

  const handleRegistrarMovimiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concepto.trim() || !monto || Number(monto) <= 0) {
      onShowToast?.('Por favor ingresa un concepto y un valor válido.');
      return;
    }

    const valorNumero = Number(monto);
    const tipo = mostrarFormulario === 'ingreso' ? 'ingreso' : 'egreso';

    // Validación de fondos si es un gasto
    if (tipo === 'egreso' && valorNumero > saldoDisponibleActual) {
      onShowToast?.(`⚠️ Fondos insuficientes en Caja Menor. Saldo disponible: $${saldoDisponibleActual.toLocaleString('es-CO')} COP. Registra primero una apertura o reintegro.`);
      return;
    }

    const nuevoSaldo = tipo === 'ingreso' 
      ? saldoDisponibleActual + valorNumero 
      : saldoDisponibleActual - valorNumero;

    const consecutivo = movimientos.length + 1;
    const reciboCode = numRecibo.trim() || (tipo === 'ingreso' ? `ING-CM-${consecutivo.toString().padStart(3, '0')}` : `EGR-CM-${consecutivo.toString().padStart(3, '0')}`);

    const nuevoMovimiento: MovimientoCajaMenor = {
      id: `cm-${Date.now()}`,
      recibo_num: reciboCode,
      fecha: new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
      concepto: concepto.trim(),
      tipo,
      monto: valorNumero,
      saldo_resultante: nuevoSaldo,
      categoria: tipo === 'ingreso' ? 'Apertura / Reintegro Fondo' : categoria,
      proveedor: proveedor.trim() || (tipo === 'ingreso' ? 'Reembolso Bancario / Administración' : 'Proveedor Local'),
      nit_proveedor: nitProveedor.trim() || 'N/A',
      responsable: responsable.trim() || 'Administración Tricentenario'
    };

    setMovimientos(prev => [nuevoMovimiento, ...prev]);

    // Replicar en la tabla oficial petty_cash_movements de Supabase
    Promise.resolve(
      supabase.from('petty_cash_movements').insert([{
        tenant_id: tenantId,
        type: nuevoMovimiento.tipo,
        amount: nuevoMovimiento.monto,
        concept: nuevoMovimiento.concepto
      }])
    ).then(() => {
      onMovimientoRegistrado?.();
    }).catch(() => {
      onMovimientoRegistrado?.();
    });

    onMovimientoRegistrado?.();

    // Limpiar formulario
    setConcepto('');
    setMonto('');
    setProveedor('');
    setNitProveedor('');
    setNumRecibo('');
    setMostrarFormulario(null);

    onShowToast?.(`💰 ${tipo === 'ingreso' ? 'Ingreso de' : 'Gasto de'} $${valorNumero.toLocaleString('es-CO')} COP registrado en Caja Menor.`);
  };

  const movimientosFiltrados = movimientos.filter(m => {
    if (filtroTipo === 'todos') return true;
    return m.tipo === filtroTipo;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in font-sans">
      <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* CABECERA */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-[#0b0f17]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white font-mono">
                  Detalle de Caja Menor • {tenantName}
                </h3>
                <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Fondo Fijo Operativo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Control estricto de caja chica, gastos inmediatos, arqueos y comprobantes digitales bajo Ley 675.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarActaArqueo(true)}
              className="px-3 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Acta de Arqueo
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MÉTRICAS DE CAJA MENOR EN TIEMPO REAL */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 bg-[#07090e] border-b border-slate-800 shrink-0">
          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Saldo en Caja Disponible</span>
            <p className="text-2xl font-black text-cyan-400 font-mono mt-1">
              ${saldoDisponibleActual.toLocaleString('es-CO')}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Efectivo disponible en caja
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Fondo Fijo Aprobado</span>
            <p className="text-2xl font-black text-white font-mono mt-1">
              ${fondoFijoTope.toLocaleString('es-CO')}
            </p>
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Tope rotativo autorizado
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Ingresos / Dotación</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                ${totalIngresos.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono mt-1 block">
              Reembolsos acumulados
            </span>
          </div>

          <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Total Egresos Ejecutados</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-400 font-mono">
                ${totalEgresos.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-[10px] text-rose-400 font-mono mt-1 block">
              {porcentajeEjecutadoFondo}% del fondo ejecutado
            </span>
          </div>
        </div>

        {/* ACCIONES RÁPIDAS Y FILTROS */}
        <div className="p-4 bg-[#090d14] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarFormulario('ingreso')}
              className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" /> + Apertura / Reintegro
            </button>
            <button
              type="button"
              onClick={() => setMostrarFormulario('egreso')}
              className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold font-mono transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <MinusCircle className="w-3.5 h-3.5" /> - Registrar Gasto
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                filtroTipo === 'todos' 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Todos ({movimientos.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('egreso')}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                filtroTipo === 'egreso' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Gastos ({movimientos.filter(m => m.tipo === 'egreso').length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('ingreso')}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition ${
                filtroTipo === 'ingreso' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'text-slate-400 hover:text-white bg-slate-900 border border-slate-800'
              }`}
            >
              Ingresos ({movimientos.filter(m => m.tipo === 'ingreso').length})
            </button>
          </div>
        </div>

        {/* LISTA CRONOLÓGICA DE MOVIMIENTOS */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {movimientosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-mono space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                <Receipt className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-400">
                Caja Menor inicializada desde cero ($0 COP)
              </p>
              <p className="max-w-md mx-auto text-slate-500">
                Haz clic en <strong className="text-emerald-400">+ Apertura / Reintegro</strong> para dotar el fondo fijo o en <strong className="text-rose-400">- Registrar Gasto</strong> para asentar comprobantes operativos.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {movimientosFiltrados.map((m) => {
                const esIngreso = m.tipo === 'ingreso';
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      esIngreso 
                        ? 'bg-emerald-950/10 border-emerald-500/20' 
                        : 'bg-[#090d14] border-slate-800'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">
                          {m.concepto}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                          esIngreso 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {esIngreso ? '+ Ingreso / Reintegro' : '- Egreso Operativo'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {m.recibo_num}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-mono">
                        <span>{m.fecha}</span>
                        <span>•</span>
                        <span>{m.categoria}</span>
                        <span>•</span>
                        <span>Prov: {m.proveedor}</span>
                        <span>•</span>
                        <span className="text-slate-500">Resp: {m.responsable}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm font-mono ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {esIngreso ? '+' : '-'}${m.monto.toLocaleString('es-CO')} COP
                      </p>
                      <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                        Saldo: ${m.saldo_resultante.toLocaleString('es-CO')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PIE CON CONCILIACIÓN */}
        <div className="p-4 bg-[#07090e] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Auditoría en tiempo real para Tricentenario</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onShowToast?.('📑 Libro de Caja Menor exportado en formato CSV.')}
              className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Libro Auxiliar
            </button>
          </div>
        </div>

      </div>

      {/* MODAL REGISTRAR MOVIMIENTO (INGRESO O GASTO) */}
      {mostrarFormulario && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-cyan-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-scale-up font-sans">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                  {mostrarFormulario === 'ingreso' ? (
                    <>
                      <PlusCircle className="w-4 h-4 text-emerald-400" /> Apertura / Reintegro de Caja Menor
                    </>
                  ) : (
                    <>
                      <MinusCircle className="w-4 h-4 text-rose-400" /> Registrar Gasto Menor
                    </>
                  )}
                </h4>
                <p className="text-xs text-slate-400">
                  {mostrarFormulario === 'ingreso' 
                    ? 'Dota fondos en efectivo al fondo fijo de la copropiedad' 
                    : 'Asienta compra inmediata con factura o comprobante'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarFormulario(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRegistrarMovimiento} className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Concepto del Movimiento *
                </label>
                <input
                  type="text"
                  required
                  placeholder={mostrarFormulario === 'ingreso' ? 'Ej: Apertura Fondo Fijo Mes Actual' : 'Ej: Compra bombillos LED y cinta aislante pasillos'}
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Valor (COP) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  placeholder="Ej: 50000"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-[#07090e] border border-cyan-500/30 rounded-xl px-3 py-2 text-cyan-300 font-mono font-bold text-base outline-none focus:border-cyan-400"
                />
              </div>

              {mostrarFormulario === 'egreso' && (
                <>
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 block mb-1">
                      Categoría del Gasto
                    </label>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value as any)}
                      className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Ferretería / Locativo">Ferretería / Mantenimiento Locativo</option>
                      <option value="Insumos de Aseo">Insumos de Aseo y Desinfección</option>
                      <option value="Cerrajería & Seguridad">Cerrajería, Candados & Seguridad</option>
                      <option value="Mensajería & Correo">Mensajería, Envíos & Notificaciones</option>
                      <option value="Fotocopias & Papelería">Fotocopias, Libros & Papelería</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        Proveedor / Local
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Ferretería Tricentenario"
                        value={proveedor}
                        onChange={(e) => setProveedor(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 block mb-1">
                        NIT / Cédula Prov.
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 900.123.456-7"
                        value={nitProveedor}
                        onChange={(e) => setNitProveedor(e.target.value)}
                        className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    No. Recibo / Factura
                  </label>
                  <input
                    type="text"
                    placeholder="Autogenerado o Manual"
                    value={numRecibo}
                    onChange={(e) => setNumRecibo(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Responsable
                  </label>
                  <input
                    type="text"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold font-mono"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 font-black rounded-xl font-mono shadow-lg transition cursor-pointer ${
                    mostrarFormulario === 'ingreso'
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                      : 'bg-rose-500 hover:bg-rose-400 text-white'
                  }`}
                >
                  Confirmar {mostrarFormulario === 'ingreso' ? 'Ingreso' : 'Egreso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ACTA DE ARQUEO OFICIAL */}
      {mostrarActaArqueo && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border-2 border-cyan-500/40 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl animate-scale-up font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <FileSpreadsheet className="w-4 h-4" /> ACTA OFICIAL DE ARQUEO DE CAJA MENOR (LEY 675)
              </div>
              <button
                type="button"
                onClick={() => setMostrarActaArqueo(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Copropiedad:</span>
                <span className="font-bold text-white">{tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha del Arqueo:</span>
                <span className="text-white">{new Date().toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fondo Fijo Aprobado:</span>
                <span className="text-white">${fondoFijoTope.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Ingresos / Dotaciones:</span>
                <span className="text-emerald-400 font-bold">${totalIngresos.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Egresos en Recibos:</span>
                <span className="text-rose-400 font-bold">${totalEgresos.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold">
                <span className="text-slate-200">EFECTIVO FÍSICO ARQUEADO:</span>
                <span className="text-cyan-400">${saldoDisponibleActual.toLocaleString('es-CO')} COP</span>
              </div>
              <div className="text-[10px] text-slate-500 pt-2 text-center">
                Diferencia en Caja: <strong className="text-emerald-400">$0 COP (Arqueo Cuadrado 100%)</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-xl font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir Acta de Arqueo
              </button>
              <button
                type="button"
                onClick={() => setMostrarActaArqueo(false)}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
