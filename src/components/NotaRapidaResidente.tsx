import React, { useState } from 'react';
import { supabase, DEFAULT_TENANT_UUID, normalizeTenantUuid } from '../supabaseClient';
import { Send, CheckCircle2 } from 'lucide-react';

export function NotaRapidaResidente({
  unitNumber = 'Torre 2 - 301',
  residentName = 'Esteban Ochoa Mesa',
  tenantId: rawTenantId = DEFAULT_TENANT_UUID,
  onShowToast
}: {
  unitNumber?: string;
  residentName?: string;
  tenantId?: string;
  onShowToast?: (msg: string) => void;
}) {
  const tenantId = normalizeTenantUuid(rawTenantId);
  const [notaTexto, setNotaTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  const handleEnviarNota = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!notaTexto.trim()) return;

    setEnviando(true);
    try {
      const { error } = await supabase.from('citofonia_notes').insert([
        {
          tenant_id: tenantId,
          unit_number: unitNumber,
          sender_name: residentName,
          sender_role: 'residente',
          content: notaTexto.trim(),
          status: 'pendiente'
        }
      ]);

      if (error) throw error;

      setNotaTexto('');
      onShowToast?.('Nota prioritaria enviada a la Garita con éxito.');
    } catch (err: any) {
      console.error('Error al enviar nota:', err);
      alert('No se pudo enviar la nota: ' + (err.message || 'Error de conexión'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
          📷 NOTA RÁPIDA A GARITA
        </span>
      </div>
      <p className="text-xs text-slate-400">
        ¿Prefieres no esperar en la cola? Deja un mensaje directo para que el guarda lo lea de inmediato.
      </p>

      <textarea
        rows={3}
        value={notaTexto}
        onChange={(e) => setNotaTexto(e.target.value)}
        placeholder="Escribe tu requerimiento (ej: Guarda, favor autorizar ingreso de domiciliario)..."
        className="w-full bg-[#090d14] border border-slate-700 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono resize-none transition"
      />

      <button
        type="button"
        disabled={enviando || !notaTexto.trim()}
        onClick={handleEnviarNota}
        className="w-full bg-[#00f2fe] hover:bg-cyan-300 disabled:opacity-50 text-slate-950 font-black py-3 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,242,254,0.3)] flex items-center justify-center gap-2 cursor-pointer"
      >
        <Send className="w-4 h-4" />
        {enviando ? 'Transmitiendo a Garita...' : 'Enviar Nota Rápida'}
      </button>
    </div>
  );
}

export default NotaRapidaResidente;
