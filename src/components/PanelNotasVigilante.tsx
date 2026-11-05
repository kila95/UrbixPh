import React, { useState, useEffect } from 'react';
import { supabase, DEFAULT_TENANT_UUID, normalizeTenantUuid } from '../supabaseClient';
import { CheckCircle2, Send, MessageSquare } from 'lucide-react';

export interface NotaPrioritaria {
  id: string;
  unit_number: string;
  sender_name: string;
  content: string;
  status: 'pendiente' | 'atendida';
  created_at: string;
}

export function PanelNotasVigilante({ tenantId: rawTenantId = DEFAULT_TENANT_UUID }: { tenantId?: string }) {
  const tenantId = normalizeTenantUuid(rawTenantId);
  const [notasList, setNotasList] = useState<NotaPrioritaria[]>([]);
  const [avisoTexto, setAvisoTexto] = useState('');
  const [aptoDestino, setAptoDestino] = useState('Torre 2 - 301');

  // 1. Cargar notas y escuchar en Tiempo Real
  useEffect(() => {
    fetchNotas();

    const channel = supabase
      .channel(`citofonia_notes_${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citofonia_notes' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const nueva = payload.new as NotaPrioritaria;
            setNotasList((prev) => [nueva, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const actualizada = payload.new as NotaPrioritaria;
            setNotasList((prev) =>
              prev.map((n) => (n.id === actualizada.id ? actualizada : n))
            );
          } else if (payload.eventType === 'DELETE') {
            setNotasList((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenantId]);

  async function fetchNotas() {
    const { data } = await supabase
      .from('citofonia_notes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setNotasList(data as NotaPrioritaria[]);
  }

  // 2. Marcar como Atendida
  const handleMarcarAtendida = async (id: string) => {
    await supabase
      .from('citofonia_notes')
      .update({ status: 'atendida' })
      .eq('id', id);

    // Actualización optimista local
    setNotasList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: 'atendida' } : n))
    );
  };

  // 3. Responder con aviso al residente
  const handleEnviarAviso = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!avisoTexto.trim()) return;

    await supabase.from('citofonia_notes').insert([
      {
        tenant_id: tenantId,
        unit_number: aptoDestino,
        sender_name: 'Guarda en Turno',
        sender_role: 'vigilante',
        content: avisoTexto.trim(),
        status: 'atendida'
      }
    ]);

    setAvisoTexto('');
  };

  const calcularHaceCuanto = (timestamp: string) => {
    const minutos = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (minutos < 1) return 'Justo ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    const horas = Math.floor(minutos / 60);
    return `Hace ${horas} h`;
  };

  return (
    <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-5 space-y-4">
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h4 className="text-xs font-mono font-bold uppercase text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-cyan-400" />
          NOTAS PRIORITARIAS DE RESIDENTES
        </h4>
        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          {notasList.filter((n) => n.status === 'pendiente').length} Pendientes
        </span>
      </div>

      {/* Lista dinámica de notas */}
      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {notasList.length === 0 ? (
          <p className="text-xs font-mono text-slate-500 py-4 text-center">
            No hay notas pendientes de residentes.
          </p>
        ) : (
          notasList.map((nota) => (
            <div
              key={nota.id}
              className={`p-3.5 rounded-2xl border text-xs font-mono space-y-2 transition ${
                nota.status === 'pendiente'
                  ? 'bg-[#090d14] border-cyan-500/40 shadow-[0_0_15px_rgba(0,242,254,0.1)]'
                  : 'bg-slate-900/40 border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{nota.unit_number}</span>
                <span className="text-[10px] text-slate-500">
                  {calcularHaceCuanto(nota.created_at)}
                </span>
              </div>

              <p className="text-slate-200 leading-relaxed text-[11px]">
                {nota.content}
              </p>

              <div className="pt-1 flex items-center justify-between">
                {nota.status === 'pendiente' ? (
                  <button
                    type="button"
                    onClick={() => handleMarcarAtendida(nota.id)}
                    className="px-3 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-300 rounded-xl text-[10px] font-bold transition cursor-pointer flex items-center gap-1 border border-slate-700"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Marcar Atendida
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Atendida ✓
                  </span>
                )}
                <span className="text-[10px] text-slate-500">{nota.sender_name}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Formulario para que el guarda responda o envíe aviso al apartamento */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <input
          type="text"
          value={avisoTexto}
          onChange={(e) => setAvisoTexto(e.target.value)}
          placeholder={`Enviar aviso rápido a ${aptoDestino}...`}
          className="w-full bg-[#090d14] border border-slate-700 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 font-mono transition"
        />

        <button
          type="button"
          disabled={!avisoTexto.trim()}
          onClick={handleEnviarAviso}
          className="w-full bg-[#00f2fe] hover:bg-cyan-300 disabled:opacity-40 text-slate-950 font-black py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_12px_rgba(0,242,254,0.25)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar Aviso al Apartamento
        </button>
      </div>
    </div>
  );
}

export default PanelNotasVigilante;
