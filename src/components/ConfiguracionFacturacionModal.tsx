import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  Percent, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Calculator, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface ConfiguracionFacturacionModalProps {
  tenantId: string;
  nombreCopropiedad?: string;
  onGuardado?: () => void;
  onClose?: () => void;
  onShowToast?: (msg: string) => void;
  withoutBackdrop?: boolean;
}

export const ConfiguracionFacturacionModal: React.FC<ConfiguracionFacturacionModalProps> = ({ 
  tenantId, 
  nombreCopropiedad,
  onGuardado, 
  onClose,
  onShowToast,
  withoutBackdrop = false
}) => {
  const [modo, setModo] = useState<'coefficient' | 'fixed'>('coefficient');
  const [presupuestoTotal, setPresupuestoTotal] = useState<number>(25000000); // 25 millones COP
  const [cuotaFija, setCuotaFija] = useState<number>(250000);
  const [diaLimite, setDiaLimite] = useState<number>(10);
  const [diaProntoPago, setDiaProntoPago] = useState<number>(5);
  const [descuentoProntoPago, setDescuentoProntoPago] = useState<number>(10);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ tipo: 'exito' | 'error'; texto: string } | null>(null);

  useEffect(() => {
    // Cargar la configuración actual desde la base de datos
    const cargarParametros = async () => {
      if (!tenantId || !isSupabaseConfigured) {
        setCargando(false);
        return;
      }

      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('tenants')
          .select('billing_mode, total_monthly_budget, fixed_fee_amount, payment_due_day, early_discount_day, early_discount_percent')
          .eq('id', tenantId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.warn('Nota al consultar configuración de facturación del tenant:', error.message);
        }

        if (data) {
          if (data.billing_mode === 'fixed' || data.billing_mode === 'coefficient') {
            setModo(data.billing_mode);
          }
          if (data.total_monthly_budget != null) {
            setPresupuestoTotal(Number(data.total_monthly_budget));
          }
          if (data.fixed_fee_amount != null) {
            setCuotaFija(Number(data.fixed_fee_amount));
          }
          if (data.payment_due_day != null) {
            setDiaLimite(Number(data.payment_due_day));
          }
          if (data.early_discount_day != null) {
            setDiaProntoPago(Number(data.early_discount_day));
          }
          if (data.early_discount_percent != null) {
            setDescuentoProntoPago(Number(data.early_discount_percent));
          }
        }
      } catch (err: any) {
        console.error('Error cargando parámetros de facturación:', err?.message);
      } finally {
        setCargando(false);
      }
    };

    cargarParametros();
  }, [tenantId]);

  const handleGuardar = async () => {
    setGuardando(true);
    setFeedback(null);

    // Validaciones básicas de consistencia
    if (diaProntoPago >= diaLimite) {
      setFeedback({
        tipo: 'error',
        texto: 'El día de pronto pago debe ser menor al día límite de pago ordinario.'
      });
      setGuardando(false);
      return;
    }

    try {
      if (isSupabaseConfigured && tenantId) {
        const payload = {
          billing_mode: modo,
          total_monthly_budget: modo === 'coefficient' ? presupuestoTotal : null,
          fixed_fee_amount: modo === 'fixed' ? cuotaFija : null,
          payment_due_day: diaLimite,
          early_discount_day: diaProntoPago,
          early_discount_percent: descuentoProntoPago,
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase
          .from('tenants')
          .update(payload)
          .eq('id', tenantId);

        if (error) throw error;
      }

      const mensajeExito = '¡Configuración de cobro y políticas Ley 675 actualizadas con éxito!';
      setFeedback({ tipo: 'exito', texto: mensajeExito });
      onShowToast?.(mensajeExito);

      if (onGuardado) {
        onGuardado();
      }

      // Cerrar tras breve confirmación visual si se suministró onClose
      if (onClose) {
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('Error guardando configuración:', err?.message || err);
      const mensajeError = `Error al guardar: ${err?.message || 'No se pudo actualizar la configuración'}`;
      setFeedback({ tipo: 'error', texto: mensajeError });
      onShowToast?.(mensajeError);
    } finally {
      setGuardando(false);
    }
  };

  // Cálculos simulados para la vista previa
  const ejemploCoeficiente = 0.010000; // 1.00%
  const cuotaEjemploOrdinaria = modo === 'coefficient'
    ? Math.round(presupuestoTotal * ejemploCoeficiente)
    : cuotaFija;
  const ahorroProntoPago = Math.round(cuotaEjemploOrdinaria * (descuentoProntoPago / 100));
  const cuotaConDescuento = cuotaEjemploOrdinaria - ahorroProntoPago;

  const modalContent = (
    <div className="relative w-full max-w-2xl bg-[#0b0f17] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden my-auto animate-fade-in text-slate-100">
      
      {/* ENCABEZADO */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-[#07090e] border-b border-slate-800 p-5 sm:p-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.2)] shrink-0">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Configuración de Cobro y Facturación
                </h2>
                <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
                  LEY 675 / ART. 25
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {nombreCopropiedad ? `Copropiedad: ${nombreCopropiedad}` : 'Parámetros de liquidación mensual, presupuesto y descuentos de pronto pago.'}
              </p>
            </div>
          </div>
          {onClose && !withoutBackdrop && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 transition cursor-pointer shrink-0"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`px-6 py-3 flex items-center gap-2.5 text-xs font-medium border-b ${
            feedback.tipo === 'exito'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}>
            {feedback.tipo === 'exito' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.texto}</span>
          </div>
        )}

        {/* CUERPO DEL MODAL */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">

          {/* 1. SELECCIÓN DE MODALIDAD */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-cyan-400" />
              1. Esquema de Liquidación de Expensas Comunes
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModo('coefficient')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  modo === 'coefficient'
                    ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'bg-[#07090e] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-cyan-300">Por Coeficiente</span>
                    {modo === 'coefficient' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Distribución legal según el porcentaje de copropiedad (RPH / Art. 25). Cada unidad aporta en proporción a su área.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[10px] font-mono text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40 w-fit">
                  Obligatorio Ley 675
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModo('fixed')}
                className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  modo === 'fixed'
                    ? 'bg-cyan-500/10 border-cyan-500 text-white shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                    : 'bg-[#07090e] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-cyan-300">Cuota Fija Igualitaria</span>
                    {modo === 'fixed' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Monto único e idéntico para todos los apartamentos o casas, aplicable cuando todos los predios son homogéneos.
                  </p>
                </div>
                <span className="mt-3 inline-block text-[10px] font-mono text-amber-400 font-semibold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/40 w-fit">
                  Tarifa Plana Universal
                </span>
              </button>
            </div>
          </div>

          {/* 2. VALOR BASE SEGÚN MODALIDAD */}
          <div className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl space-y-3">
            {modo === 'coefficient' ? (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Presupuesto Total Mensual de la Copropiedad ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-mono">$</span>
                  <input
                    type="number"
                    min={0}
                    step={100000}
                    value={presupuestoTotal}
                    onChange={(e) => setPresupuestoTotal(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:border-cyan-400 outline-none transition"
                    placeholder="25000000"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Aprobado por Asamblea General ordinaria.</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    ${presupuestoTotal.toLocaleString('es-CO')} COP / mes
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Valor Cuota Fija Mensual por Inmueble ($ COP)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-500 text-sm font-mono">$</span>
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    value={cuotaFija}
                    onChange={(e) => setCuotaFija(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl pl-8 pr-4 py-2 text-sm text-white font-mono focus:border-cyan-400 outline-none transition"
                    placeholder="250000"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Cuota estándar para cada apartamento registrado.</span>
                  <span className="font-mono text-cyan-400 font-bold">
                    ${cuotaFija.toLocaleString('es-CO')} COP / unidad
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 3. POLÍTICAS DE VENCIMIENTO Y PRONTO PAGO */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              2. Fechas de Corte y Descuento por Pronto Pago
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Día Pronto Pago */}
              <div className="p-3.5 bg-[#07090e] border border-slate-800 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  Día Pronto Pago
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={28}
                    value={diaProntoPago}
                    onChange={(e) => setDiaProntoPago(Math.min(28, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:border-cyan-400 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">del mes</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Hasta este día aplica descuento.</span>
              </div>

              {/* % Descuento */}
              <div className="p-3.5 bg-[#07090e] border border-slate-800 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  % Descuento
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={descuentoProntoPago}
                    onChange={(e) => setDescuentoProntoPago(Math.min(50, Math.max(0, Number(e.target.value))))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:border-cyan-400 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">%</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">Incentivo de recaudo temprano.</span>
              </div>

              {/* Día Límite Ordinario */}
              <div className="p-3.5 bg-[#07090e] border border-slate-800 rounded-2xl">
                <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  Día Límite Pago
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaLimite}
                    onChange={(e) => setDiaLimite(Math.min(31, Math.max(1, Number(e.target.value))))}
                    className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-1.5 text-sm font-mono text-white focus:border-cyan-400 outline-none"
                  />
                  <span className="text-xs text-slate-400 font-mono">del mes</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 block">A partir del día siguiente causa mora.</span>
              </div>
            </div>
          </div>

          {/* 4. SIMULADOR EN VIVO / REGLA DE COBRO */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-slate-900/60 to-[#07090e] border border-cyan-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Simulación de Cuenta de Cobro (Ejemplo Apto 1.00% Coef.)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Ley 675 / Superfinanciera</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">1 al {diaProntoPago} de cada mes</span>
                <p className="text-base font-black text-emerald-400 mt-0.5 font-mono">
                  ${cuotaConDescuento.toLocaleString('es-CO')}
                </p>
                <p className="text-[10px] text-emerald-300 mt-0.5">
                  Con {descuentoProntoPago}% dto. (-${ahorroProntoPago.toLocaleString('es-CO')})
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">{diaProntoPago + 1} al {diaLimite} de cada mes</span>
                <p className="text-base font-black text-white mt-0.5 font-mono">
                  ${cuotaEjemploOrdinaria.toLocaleString('es-CO')}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tarifa ordinaria plena
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-mono">Día {diaLimite + 1} en adelante</span>
                <p className="text-base font-black text-rose-400 mt-0.5 font-mono">
                  ${cuotaEjemploOrdinaria.toLocaleString('es-CO')} + Mora
                </p>
                <p className="text-[10px] text-rose-300 mt-0.5">
                  Interés diario máx. Superfinanciera
                </p>
              </div>
            </div>
          </div>

        </div>

        {/* PIE DE ACCIONES */}
        <div className="bg-[#07090e] border-t border-slate-800 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Actualización en tiempo real sobre la tabla <code className="text-cyan-300">tenants</code>.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={guardando}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/60 transition cursor-pointer"
              >
                Cancelar
              </button>
            )}

            <button
              type="button"
              onClick={handleGuardar}
              disabled={guardando}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:brightness-110 transition shadow-[0_0_20px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>Guardar Políticas de Facturación</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
  );

  if (withoutBackdrop) {
    return modalContent;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {modalContent}
    </div>
  );
};

export default ConfiguracionFacturacionModal;
