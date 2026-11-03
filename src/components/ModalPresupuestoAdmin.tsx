import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onActualizado?: () => void;
  onShowToast?: (msg: string) => void;
}

export const ModalPresupuestoAdmin: React.FC<Props> = ({
  tenantId,
  isOpen,
  onClose,
  onActualizado,
  onShowToast
}) => {
  const [presupuestoAnual, setPresupuestoAnual] = useState<number>(300000000); // 300M anuales por defecto
  const [diaLimite, setDiaLimite] = useState<number>(10);
  const [diaProntoPago, setDiaProntoPago] = useState<number>(5);
  const [porcentajeDescuento, setPorcentajeDescuento] = useState<number>(10);
  const [interesMora, setInteresMora] = useState<number>(2.0);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Cálculo derivado: Mensual = Anual / 12
  const presupuestoMensual = Math.round(presupuestoAnual / 12);
  // Ejemplo de cuota para coeficiente del 1% (0.01)
  const ejemploCuota1Porciento = Math.round(presupuestoMensual * 0.01);
  const ejemploCuotaDescuento = Math.round(ejemploCuota1Porciento * (1 - porcentajeDescuento / 100));

  useEffect(() => {
    if (!isOpen || !tenantId) return;

    const cargarConfiguracion = async () => {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('total_annual_budget, total_monthly_budget, payment_due_day, early_discount_day, early_discount_percent, late_interest_rate')
          .eq('id', tenantId)
          .single();

        if (data && !error) {
          if (data.total_annual_budget && Number(data.total_annual_budget) > 0) {
            setPresupuestoAnual(Number(data.total_annual_budget));
          } else if (data.total_monthly_budget && Number(data.total_monthly_budget) > 0) {
            setPresupuestoAnual(Number(data.total_monthly_budget) * 12);
          }
          if (data.payment_due_day) setDiaLimite(Number(data.payment_due_day));
          if (data.early_discount_day) setDiaProntoPago(Number(data.early_discount_day));
          if (data.early_discount_percent !== null && data.early_discount_percent !== undefined) {
            setPorcentajeDescuento(Number(data.early_discount_percent));
          }
          if (data.late_interest_rate !== null && data.late_interest_rate !== undefined) {
            setInteresMora(Number(data.late_interest_rate));
          }
        }
      } catch (err) {
        console.warn('Nota: usando valores predeterminados de presupuesto Ley 675:', err);
      }
    };

    cargarConfiguracion();
  }, [isOpen, tenantId]);

  const handleGuardarYLiquidar = async () => {
    try {
      setGuardando(true);
      setMensajeExito(null);

      // 1. Guardar la configuración financiera en la copropiedad (tenant)
      const { error: errTenant } = await supabase
        .from('tenants')
        .update({
          total_annual_budget: presupuestoAnual,
          total_monthly_budget: presupuestoMensual,
          payment_due_day: diaLimite,
          early_discount_day: diaProntoPago,
          early_discount_percent: porcentajeDescuento,
          late_interest_rate: interesMora,
        })
        .eq('id', tenantId);

      if (errTenant) throw errTenant;

      // 2. Traer las unidades registradas para liquidarles su cuota exacta
      const { data: unidades, error: errUnits } = await supabase
        .from('units')
        .select('id, coefficient')
        .eq('tenant_id', tenantId);

      if (errUnits) throw errUnits;

      // 3. Actualizar la cuota ordinaria de cada apartamento según su coeficiente
      if (unidades && unidades.length > 0) {
        for (const u of unidades) {
          const coef = Number(u.coefficient) || 0; // ej: 0.010000 para 1%
          const cuotaOrdinaria = Math.round(presupuestoMensual * coef);
          const cuotaProntoPago = Math.round(cuotaOrdinaria * (1 - porcentajeDescuento / 100));

          await supabase
            .from('units')
            .update({
              monthly_fee: cuotaOrdinaria,
              discounted_fee: cuotaProntoPago
            })
            .eq('id', u.id);
        }
      }

      const mensaje = '¡Presupuesto guardado y cuotas de administración liquidadas para todas las unidades!';
      if (onShowToast) {
        onShowToast(`💰 ${mensaje}`);
      } else {
        try {
          alert(mensaje);
        } catch (_) {
          console.log(mensaje);
        }
      }

      onActualizado?.();
      onClose();

    } catch (err: any) {
      const errorMsg = `Error al guardar configuración: ${err?.message || 'Error desconocido'}`;
      if (onShowToast) {
        onShowToast(`⚠️ ${errorMsg}`);
      } else {
        try {
          alert(errorMsg);
        } catch (_) {
          console.error(errorMsg);
        }
      }
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl relative my-auto animate-in fade-in duration-200">
        <button 
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold cursor-pointer"
          aria-label="Cerrar modal"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-3 mb-5">
          <span className="text-2xl">🏛️</span>
          <div>
            <h2 className="text-base font-bold text-emerald-400 font-mono">
              Presupuesto Anual & Cuotas de Administración
            </h2>
            <p className="text-xs text-slate-400">Ley 675 de 2001 · Régimen de Propiedad Horizontal</p>
          </div>
        </div>

        {mensajeExito && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl">
            {mensajeExito}
          </div>
        )}

        <div className="space-y-4">
          {/* Presupuesto Anual */}
          <div>
            <label className="text-xs font-mono uppercase tracking-wider text-slate-300 block mb-1">
              Presupuesto Anual Aprobado por Asamblea (COP)
            </label>
            <input
              type="number"
              value={presupuestoAnual}
              onChange={(e) => setPresupuestoAnual(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-emerald-300 font-mono focus:outline-none focus:border-emerald-400"
            />
            <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
              <span>Presupuesto mensual a recaudar:</span>
              <strong className="text-emerald-400 font-mono">
                ${presupuestoMensual.toLocaleString('es-CO')} COP / mes
              </strong>
            </div>
          </div>

          {/* Días y Descuentos */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Día Límite Ordinario</label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaLimite}
                onChange={(e) => setDiaLimite(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500">Día {diaLimite} de cada mes</span>
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">Día Pronto Pago</label>
              <input
                type="number"
                min="1"
                max="31"
                value={diaProntoPago}
                onChange={(e) => setDiaProntoPago(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
              />
              <span className="text-[10px] text-slate-500">Hasta el día {diaProntoPago} del mes</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">% Descuento Pronto Pago</label>
              <input
                type="number"
                min="0"
                max="50"
                value={porcentajeDescuento}
                onChange={(e) => setPorcentajeDescuento(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-slate-300 block mb-1">% Interés de Mora Mensual</label>
              <input
                type="number"
                step="0.1"
                value={interesMora}
                onChange={(e) => setInteresMora(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          {/* Tarjeta de simulación en vivo */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 mt-3">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
              Simulación para apartamentos con Coeficiente 1.0000% (Tricentenario)
            </span>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300">Cuota ordinaria (hasta el día {diaLimite}):</span>
              <span className="font-bold text-slate-100 font-mono">
                ${ejemploCuota1Porciento.toLocaleString('es-CO')} COP
              </span>
            </div>
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-emerald-400">Con pronto pago (hasta el día {diaProntoPago}):</span>
              <span className="font-bold text-emerald-400 font-mono">
                ${ejemploCuotaDescuento.toLocaleString('es-CO')} COP
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardarYLiquidar}
            disabled={guardando}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/20"
          >
            {guardando ? 'Liquidando Unidades...' : 'Guardar y Liquidar Coeficientes'}
          </button>
        </div>
      </div>
    </div>
  );
};
