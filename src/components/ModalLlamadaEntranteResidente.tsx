import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, Pause, Video } from 'lucide-react';

interface Props {
  isOpen: boolean;
  convocatoria: {
    tipo: string;
    copropiedadNombre?: string;
    organizador?: string;
  } | null;
  onContestar: () => void;
  onDeclinar: () => void;
  onPonerEnEspera: () => void;
}

export const ModalLlamadaEntranteResidente: React.FC<Props> = ({
  isOpen,
  convocatoria,
  onContestar,
  onDeclinar,
  onPonerEnEspera
}) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<any>(null);

  // Generador de tono telefónico en bucle usando Web Audio API
  useEffect(() => {
    if (!isOpen) {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
      return;
    }

    const reproducirTimbre = () => {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const playTone = (freq1: number, freq2: number, start: number, duration: number) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.frequency.value = freq1;
          osc2.frequency.value = freq2;

          gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);

          osc1.start(ctx.currentTime + start);
          osc2.start(ctx.currentTime + start);
          osc1.stop(ctx.currentTime + start + duration);
          osc2.stop(ctx.currentTime + start + duration);
        };

        // Tono doble de llamada estándar (440Hz + 480Hz)
        playTone(440, 480, 0, 1.2);
        playTone(440, 480, 1.5, 1.2);
      } catch (e) {
        console.warn('AudioContext no iniciado por permisos de interacción', e);
      }
    };

    reproducirTimbre();
    ringIntervalRef.current = setInterval(reproducirTimbre, 4500);

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, [isOpen]);

  if (!isOpen || !convocatoria) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300 font-sans text-slate-100">
      <div className="bg-[#0b0f17] border-2 border-cyan-500/50 w-full max-w-md rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(0,242,254,0.3)]">
        
        {/* Ícono de videollamada entrante con halo palpitante */}
        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 animate-ping" />
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-slate-950 shadow-2xl">
            <Video className="w-10 h-10 animate-bounce" />
          </div>
        </div>

        {/* Datos de la sesión */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 font-bold">
            Videollamada Oficial Entrante
          </span>
          <h3 className="text-xl font-black text-white pt-2 font-mono">
            {convocatoria.tipo || 'Asamblea General'}
          </h3>
          <p className="text-xs text-slate-300">
            {convocatoria.copropiedadNombre || 'Copropiedad PH'}
          </p>
          <p className="text-[11px] font-mono text-cyan-400">
            Convoca: {convocatoria.organizador || 'Administración Central'}
          </p>
        </div>

        {/* Botonera de 3 Acciones: Contestar, En Espera, Declinar */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          
          {/* 1. Declinar */}
          <button
            type="button"
            onClick={onDeclinar}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-600/30">
              <PhoneOff className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold font-mono">Declinar</span>
          </button>

          {/* 2. En Espera */}
          <button
            type="button"
            onClick={onPonerEnEspera}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-600/30">
              <Pause className="w-5 h-5 font-bold" />
            </div>
            <span className="text-[10px] font-bold font-mono">En Espera</span>
          </button>

          {/* 3. Contestar */}
          <button
            type="button"
            onClick={onContestar}
            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 transition cursor-pointer"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-pulse">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black font-mono">Contestar</span>
          </button>

        </div>

      </div>
    </div>
  );
};

export default ModalLlamadaEntranteResidente;
