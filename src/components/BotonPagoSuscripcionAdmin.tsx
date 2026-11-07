import React, { useState } from 'react';
import { CreditCard, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface BotonPagoSuscripcionAdminProps {
  tenantId: string;
  tenantNombre?: string;
  montoCOP?: number;
  estadoSuscripcion?: string;
  onPagoCompletado?: () => void;
}

export default function BotonPagoSuscripcionAdmin({
  tenantId,
  tenantNombre = 'Copropiedad',
  montoCOP = 0,
  estadoSuscripcion = 'active',
  onPagoCompletado
}: BotonPagoSuscripcionAdminProps) {
  const [procesando, setProcesando] = useState(false);

  const iniciarCheckoutWompi = async () => {
    try {
      setProcesando(true);

      // Wompi procesa el valor en centavos (ej: $204.000 COP -> 20400000 centavos)
      const amountInCents = Math.round(montoCOP * 100);

      // 1. Solicitar firma y referencia de seguridad al backend
      const res = await fetch('/api/wompi-checkout-init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, amountInCents })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No fue posible iniciar el cobro con la pasarela.');
      }

      // 2. Verificar que el script de Wompi esté cargado en window
      if (!(window as any).WidgetCheckout) {
        throw new Error('El script de Wompi no se encuentra disponible. Revisa index.html.');
      }

      // 3. Inicializar el Widget de Wompi
      const checkout = new (window as any).WidgetCheckout({
        currency: 'COP',
        amountInCents: data.amountInCents,
        reference: data.reference,
        publicKey: data.publicKey,
        signature: { integrity: data.signature },
        redirectUrl: `${window.location.origin}`
      });

      // 4. Abrir la ventana modal de pago
      checkout.open((result: any) => {
        const transaction = result?.transaction;
        if (transaction?.status === 'APPROVED') {
          alert(`¡Pago exitoso! La suscripción de ${tenantNombre} ha sido renovada.`);
          if (onPagoCompletado) {
            onPagoCompletado();
          } else {
            window.location.reload();
          }
        } else if (transaction?.status === 'DECLINED') {
          alert('El pago fue declinado por la entidad bancaria. Por favor intenta con otro medio.');
        }
      });
    } catch (err: any) {
      console.error('Error al abrir pasarela Wompi:', err);
      alert(`Error al procesar pago: ${err.message}`);
    } finally {
      setProcesando(false);
    }
  };

  const alDia = estadoSuscripcion === 'active' || estadoSuscripcion === 'Al día';

  return (
    <div className="bg-[#0b0f17] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
            Suscripción Urbix PH · {tenantNombre}
          </h4>
          {alDia ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
              <CheckCircle2 className="w-3 h-3" /> Al Día
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
              Renovación Pendiente
            </span>
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          Costo mensual de licenciamiento: <strong className="text-white font-mono">${montoCOP.toLocaleString('es-CO')} COP</strong>. Métodos aceptados: PSE, Nequi, Botón Bancolombia y Tarjeta de Crédito.
        </p>
      </div>

      <button
        type="button"
        onClick={iniciarCheckoutWompi}
        disabled={procesando}
        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer transition-all shrink-0 font-mono"
      >
        <CreditCard className="w-4 h-4" />
        {procesando ? 'Conectando...' : `Pagar Licencia ($${montoCOP.toLocaleString('es-CO')} COP)`}
      </button>
    </div>
  );
}
