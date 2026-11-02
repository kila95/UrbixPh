import React, { useState } from 'react';
import { 
  Building2, DollarSign, Download, CreditCard, CheckCircle, AlertTriangle 
} from 'lucide-react';

export default function ResidenteModuloFinancieroApp({ onShowToast }: { onShowToast?: (msg: string) => void }) {
  // Estado financiero detallado de la unidad del residente
  const [estadoFinanciero] = useState({
    unidad: 'Torre 2 - 301',
    propietario: 'Esteban Ochoa',
    cuotaMensual: 450000,
    saldoActual: 0,
    estadoCartera: 'Al día',
    movimientos: [
      { id: '1', fecha: '2026-10-02', concepto: 'Cuota Ordinaria Octubre 2026', ref: 'CUS-98312', cargo: 450000, abono: 450000, estado: 'Pagado' },
      { id: '2', fecha: '2026-09-03', concepto: 'Cuota Ordinaria Septiembre 2026', ref: 'CUS-87120', cargo: 450000, abono: 450000, estado: 'Pagado' },
      { id: '3', fecha: '2026-08-04', concepto: 'Cuota Ordinaria Agosto 2026', ref: 'CUS-76211', cargo: 450000, abono: 450000, estado: 'Pagado' }
    ]
  });

  // Simulación de pasarela de pago o reporte de pago
  const simularPagoEnLinea = () => {
    alert("💳 Pasarela de Pagos PSE / Tarjeta:\n\nRedirigiendo de forma segura para realizar el pago de su cuota mensual de $450.000 COP. ¡Simulación de transacción exitosa!");
    if (onShowToast) onShowToast("✅ Pago simulado exitosamente.");
  };

  // Simulación de descarga de paz y salvo
  const descargarPazYSalvoOficial = () => {
    if (estadoFinanciero.saldoActual === 0) {
      alert("📥 CERTIFICADO DE PAZ Y SALVO:\n\nDocumento oficial generado en PDF con firma digital de la administración bajo Ley 675. ¡Descarga iniciada!");
      if (onShowToast) onShowToast("📥 Paz y Salvo descargado.");
    } else {
      alert("⚠️ No es posible emitir el Paz y Salvo porque registra un saldo pendiente en cartera.");
    }
  };

  return (
    <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-6">
      
      {/* CABECERA FINANCIERA */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-[#262629] pb-6">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" /> Módulo Financiero del Residente
          </h1>
          <p className="text-xs text-gray-400 mt-1">{estadoFinanciero.unidad} • Propietario: {estadoFinanciero.propietario}</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle className="w-4 h-4" /> Estado: {estadoFinanciero.estadoCartera}
        </span>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141416] p-5 rounded-2xl border border-[#262629]">
          <p className="text-xs text-gray-400 font-mono">Cuota Ordinaria Mensual</p>
          <p className="text-2xl font-bold font-mono text-cyan-400 mt-1">$ {estadoFinanciero.cuotaMensual.toLocaleString()} COP</p>
        </div>
        <div className="bg-[#141416] p-5 rounded-2xl border border-[#262629]">
          <p className="text-xs text-gray-400 font-mono">Saldo Actual en Cartera</p>
          <p className="text-2xl font-bold font-mono text-emerald-400 mt-1">$ {estadoFinanciero.saldoActual.toLocaleString()} COP</p>
        </div>
        <div className="bg-[#141416] p-5 rounded-2xl border border-[#262629] flex flex-col justify-between gap-3">
          <p className="text-xs text-gray-400 font-mono">Acciones Rápidas</p>
          <div className="flex gap-2">
            <button onClick={simularPagoEnLinea} className="flex-1 bg-cyan-500 text-black font-bold py-2 px-3 rounded-xl text-xs hover:bg-cyan-400 transition-all flex items-center justify-center gap-1">
              <CreditCard className="w-3.5 h-3.5" /> Pagar en Línea
            </button>
            <button onClick={descargarPazYSalvoOficial} className="flex-1 bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-bold py-2 px-3 rounded-xl text-xs hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-1">
              <Download className="w-3.5 h-3.5" /> Paz y Salvo
            </button>
          </div>
        </div>
      </div>

      {/* TABLA DE MOVIMIENTOS (KARDEX) */}
      <div className="bg-[#141416] p-6 rounded-2xl border border-[#262629]">
        <h3 className="text-md font-semibold text-white mb-4">Historial de Cargos y Pagos (Kardex Personal)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-[#262629] text-gray-400">
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Concepto</th>
                <th className="pb-3">Referencia</th>
                <th className="pb-3">Cargo</th>
                <th className="pb-3">Abono / Pago</th>
                <th className="pb-3">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262629]">
              {estadoFinanciero.movimientos.map(m => (
                <tr key={m.id} className="hover:bg-[#262629]/50">
                  <td className="py-3 text-gray-300">{m.fecha}</td>
                  <td className="py-3 font-bold text-white">{m.concepto}</td>
                  <td className="py-3 text-cyan-400">{m.ref}</td>
                  <td className="py-3 text-red-400">$ {m.cargo.toLocaleString()}</td>
                  <td className="py-3 text-emerald-400">$ {m.abono.toLocaleString()}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      {m.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
