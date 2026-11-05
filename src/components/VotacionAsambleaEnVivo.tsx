import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { castImmutableVote, getMotionResults, VotingResultsSummary } from '../services/assemblyVotingService';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Lock, Hash } from 'lucide-react';

export default function VotacionAsambleaEnVivo({
  motionId,
  motionTitle,
  tenantId,
  userProfile,
  onShowToast
}: {
  motionId: string;
  motionTitle: string;
  tenantId: string;
  userProfile: { full_name: string; unit_number?: string; coefficient?: number };
  onShowToast?: (msg: string) => void;
}) {
  const [results, setResults] = useState<VotingResultsSummary | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [voteHash, setVoteHash] = useState<string | null>(null);

  const loadResults = async () => {
    try {
      const summary = await getMotionResults(motionId);
      setResults(summary);
    } catch (err: any) {
      console.warn(err?.message);
    }
  };

  useEffect(() => {
    loadResults();

    const handleLocalVote = () => loadResults();
    window.addEventListener('urbix_assembly_votes_updated', handleLocalVote);

    // Sincronización en vivo con WebSockets de Supabase
    const channel = supabase
      .channel(`votes_motion_${motionId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assembly_votes', filter: `motion_id=eq.${motionId}` }, () => {
        loadResults();
      })
      .subscribe();

    return () => {
      window.removeEventListener('urbix_assembly_votes_updated', handleLocalVote);
      supabase.removeChannel(channel);
    };
  }, [motionId]);

  const handleVote = async (choice: 'A_FAVOR' | 'EN_CONTRA' | 'ABSTENCION') => {
    setSubmitting(true);
    try {
      const voteData = await castImmutableVote({
        motion_id: motionId,
        tenant_id: tenantId,
        apartment_unit: userProfile.unit_number || 'Apto 101',
        voter_name: userProfile.full_name,
        coefficient: userProfile.coefficient || 0.0125, // Coeficiente asignado en censo
        choice
      });

      setHasVoted(true);
      setVoteHash(voteData.digital_hash);
      onShowToast?.(`Voto sellado digitalmente con éxito.`);
      loadResults();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-5 text-slate-100 font-sans shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Votación Nominal Inmutable (Ley 675)</h3>
            <p className="text-[11px] text-slate-400 font-mono">Ponderado por Coeficiente de Copropiedad</p>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
          Sellado SHA-256
        </span>
      </div>

      <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
        <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">Proposición a Votar:</span>
        <p className="text-sm font-black text-white">{motionTitle}</p>
      </div>

      {/* Botones de Voto para el Residente */}
      {!hasVoted ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-400 font-mono">
            Votando como: <strong className="text-white">{userProfile.full_name}</strong> (Unidad {userProfile.unit_number || 'Apto 101'} - Coef: {userProfile.coefficient || 0.0125})
          </p>
          <div className="grid grid-cols-3 gap-3 pt-1">
            <button
              onClick={() => handleVote('A_FAVOR')}
              disabled={submitting}
              className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" /> A Favor
            </button>
            <button
              onClick={() => handleVote('EN_CONTRA')}
              disabled={submitting}
              className="py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" /> En Contra
            </button>
            <button
              onClick={() => handleVote('ABSTENCION')}
              disabled={submitting}
              className="py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" /> Abstención
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <ShieldCheck className="w-4 h-4" /> Voto Registrado e Inalterable
          </div>
          <div className="text-[10px] text-slate-400 break-all flex items-start gap-1">
            <Hash className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <span>Firma Digital: {voteHash}</span>
          </div>
        </div>
      )}

      {/* Escrutinio en Tiempo Real (Ley 675) */}
      {results && (
        <div className="pt-2 border-t border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Quórum Participante: <strong>{(results.total_quorum_participated * 100).toFixed(2)}%</strong></span>
            <span>Total Votos: <strong>{results.total_votes}</strong></span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold block">A Favor</span>
              <span>{(results.favor_coefficient * 100).toFixed(2)}%</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-rose-400 font-bold block">En Contra</span>
              <span>{(results.contra_coefficient * 100).toFixed(2)}%</span>
            </div>
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-bold block">Abstención</span>
              <span>{(results.abstencion_coefficient * 100).toFixed(2)}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
