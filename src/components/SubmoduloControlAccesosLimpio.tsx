import React, { useState } from 'react';
import { QrCode, ShieldCheck, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export default function SubmoduloControlAccesosLimpio({
  onShowToast
}: {
  onShowToast?: (msg: string) => void;
}) {
  const [codigoInput, setCodigoInput] = useState('');
  const [resultadoEscaneo, setResultadoEscaneo] = useState<any>(null);

  const handleValidarAcceso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim()) {
      onShowToast?.('⚠️ Por favor ingresa un código QR o PIN válido.');
      return;
    }

    // Simulación de validación criptográfica en base de datos
    const codigoLimpio = codigoInput.trim().toUpperCase();
    setResultadoEscaneo({
      codigo: codigoLimpio,
      visitante: 'Carlos Andrés Mesa (Familiar)',
      destino: 'Torre 2 - 301 (Esteban Ochoa)',
      estado: 'Autorizado por Residente',
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    
    onShowToast?.(`✅ Acceso validado con éxito para ${codigoLimpio}. Talanquera abierta.`);
    setCodigoInput('');
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl space-y-6 shadow-2xl font-sans text-slate-100 animate-fadeIn">
      
      {/* Membrete de la Sección */}
      <div className="border-b border-slate-800 pb-4">
        <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
          Garita Principal • Seguridad Activa
        </span>
        <h3 className="text-base font-black text-white mt-1">Lector Criptográfico de Accesos y Validación Rápida</h3>
        <p className="text-xs text-slate-400 mt-1">Escanea o ingresa el código QR / PIN del visitante para autorizar el ingreso a la copropiedad de forma inmediata.</p>
      </div>

      {/* Formulario de Validación por Lector */}
      <form onSubmit={handleValidarAcceso} className="bg-[#07090e] border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold">
          <QrCode className="w-4 h-4" /> Escáner de puerta en tiempo real
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Ej. QR-8492 o PIN-5120..."
            value={codigoInput}
            onChange={(e) => setCodigoInput(e.target.value)}
            className="flex-1 p-3.5 text-xs bg-[#0b0f17] border border-slate-700 text-white rounded-xl outline-none font-mono focus:border-cyan-400"
            required
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2"
          >
            Validar Acceso en Vivo <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Resultado del Último Escaneo (Si existe) */}
      {resultadoEscaneo && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-5 rounded-2xl flex items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-black text-emerald-400 bg-slate-950 px-2.5 py-0.5 rounded border border-emerald-500/20">
                {resultadoEscaneo.codigo}
              </span>
              <span className="text-xs font-bold text-white">{resultadoEscaneo.visitante}</span>
            </div>
            <p className="text-xs text-slate-300">Destino: <strong>{resultadoEscaneo.destino}</strong></p>
            <p className="text-[11px] text-slate-400 font-mono">Hora de registro: {resultadoEscaneo.hora}</p>
          </div>
          <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
            <CheckCircle2 className="w-4 h-4" /> {resultadoEscaneo.estado}
          </div>
        </div>
      )}

    </div>
  );
}
