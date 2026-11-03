import React from 'react';
import { PhoneCall, PhoneOff, Phone, ExternalLink, Volume2 } from 'lucide-react';

export interface NotificacionCitofonoFlotanteProps {
  llamada: {
    unidad: string;
    nombre: string;
    rol?: string;
    motivo?: string;
    segundos?: number;
  };
  onContestarAqui: () => void;
  onIrAlCitofono?: () => void;
  onRechazar: () => void;
}

export const NotificacionCitofonoFlotante: React.FC<NotificacionCitofonoFlotanteProps> = ({
  llamada,
  onContestarAqui,
  onIrAlCitofono,
  onRechazar,
}) => {
  return (
    <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 ease-out max-w-sm sm:max-w-md w-full px-3">
      <div className="relative bg-[#070b12]/90 backdrop-blur-xl border border-cyan-500/40 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/20 overflow-hidden">
        
        {/* Barra superior de acento con pulso */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse" />

        {/* Fila principal: Avatar + Info + Botones */}
        <div className="flex items-center gap-3">
          
          {/* Ícono de llamada repicando con doble halo animado */}
          <div className="relative shrink-0">
            <span className="absolute -inset-1 rounded-full bg-cyan-500/30 animate-ping" />
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-[1.5px] shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <div className="w-full h-full bg-[#0a101d] rounded-[10px] flex items-center justify-center text-cyan-300">
                <PhoneCall className="w-5 h-5 animate-bounce" />
              </div>
            </div>
          </div>

          {/* Información del Residente (organizada en jerarquía clara) */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                {llamada.unidad || 'Torre 1 - 201'}
              </span>
              {llamada.rol && (
                <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-[9px] font-mono px-1.5 py-0.5 rounded">
                  {llamada.rol}
                </span>
              )}
              <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 ml-auto">
                <Volume2 className="w-3 h-3 text-emerald-400 animate-pulse" /> Repicando...
              </span>
            </div>

            <h4 className="text-sm font-black text-white truncate mt-0.5 tracking-tight">
              {llamada.nombre || 'Residente'}
            </h4>

            {llamada.motivo && (
              <p className="text-[11px] text-slate-400 truncate font-mono">
                {llamada.motivo}
              </p>
            )}
          </div>
        </div>

        {/* Fila inferior de acciones: compactas y directas */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onContestarAqui}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs py-2 px-3 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Phone className="w-3.5 h-3.5 fill-current" />
            <span>Contestar</span>
          </button>

          {onIrAlCitofono && (
            <button
              type="button"
              onClick={onIrAlCitofono}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs py-2 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              title="Abrir pantalla completa del citófono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onRechazar}
            className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Rechazar</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default NotificacionCitofonoFlotante;
