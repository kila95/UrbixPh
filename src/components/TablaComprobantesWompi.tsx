import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export function TablaComprobantesWompi() {
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const cargarTransaccionesReales = async () => {
    try {
      const { data, error } = await supabase
        .from('saas_subscription_invoices')
        .select(`
          id,
          reference,
          amount_in_cents,
          currency,
          payment_method,
          wompi_transaction_id,
          status,
          created_at,
          tenants ( name, nit )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransacciones(data || []);
    } catch (err) {
      console.error('Error cargando transacciones reales:', err);
      setTransacciones([]);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTransaccionesReales();

    // Listener en tiempo real de Supabase: solo se llena cuando entra un Webhook real
    const canal = supabase
      .channel('transacciones-wompi-reales')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'saas_subscription_invoices' },
        () => {
          cargarTransaccionesReales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, []);

  return (
    <div className="mt-8 bg-[#070a10] border border-slate-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              Comprobantes Oficiales Recibidos · Wompi Bancolombia
            </h4>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-mono">
            Transacciones acreditadas en tu cuenta bancaria vinculada a Wompi.
          </p>
        </div>
        <button
          onClick={cargarTransaccionesReales}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono rounded-lg cursor-pointer"
        >
          Actualizar
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="text-slate-500 border-b border-slate-800 text-[10px] uppercase">
              <th className="py-2.5 px-3">Fecha</th>
              <th className="py-2.5 px-3">Copropiedad / Edificio</th>
              <th className="py-2.5 px-3">Referencia</th>
              <th className="py-2.5 px-3">Medio de Pago</th>
              <th className="py-2.5 px-3 text-right">Monto Recaudado</th>
              <th className="py-2.5 px-3 text-center">Estado Bancario</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {cargando ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500 font-mono">
                  Consultando registros en base de datos...
                </td>
              </tr>
            ) : transacciones.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500 font-mono">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-xl">📭</span>
                    <span>No hay transacciones registradas en la base de datos.</span>
                    <span className="text-[10px] text-slate-600">
                      Los pagos aparecerán aquí automáticamente cuando los administradores completen transacciones vía Wompi.
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              transacciones.map((tx) => {
                const montoCOP = ((tx.amount_in_cents || 0) / 100).toLocaleString('es-CO');
                const esAprobado = tx.status === 'APPROVED';

                return (
                  <tr key={tx.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(tx.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-3 px-3 text-white font-sans font-bold">
                      {tx.tenants?.name || 'Copropiedad no asignada'}
                    </td>
                    <td className="py-3 px-3 text-cyan-400 font-mono text-[11px]">
                      {tx.reference}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      {tx.payment_method || 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-emerald-400">
                      ${montoCOP} COP
                    </td>
                    <td className="py-3 px-3 text-center">
                      {esAprobado ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Aprobado
                        </span>
                      ) : tx.status === 'PENDING' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                          <Clock className="w-3 h-3" /> Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                          <AlertTriangle className="w-3 h-3" /> Fallido
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default TablaComprobantesWompi;
