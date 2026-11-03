import React from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { RetornoUseCitofonoEngine } from '../useCitofonoEngine';
import { NotificacionCitofonoFlotante } from './NotificacionCitofonoFlotante';

interface VentanaFlotanteCitofonoProps {
  engine: RetornoUseCitofonoEngine;
  rolVista: 'vigilante' | 'residente';
  submoduloActualLabel?: string;
  onIrAlModuloCitofono?: () => void;
  onShowToast?: (msg: string) => void;
}

export default function VentanaFlotanteCitofono({
  engine,
  rolVista,
  onIrAlModuloCitofono,
  onShowToast
}: VentanaFlotanteCitofonoProps) {
  const {
    estado,
    tiempoFormateado,
    segundosTimbrando,
    llamadaActiva,
    estaSilenciado,
    diagnosticoIce,
    alternarSilencio,
    contestarLlamada,
    colgarLlamada,
    forzarReinicioIce
  } = engine;

  if (estado !== 'entrante' && estado !== 'conectado' && estado !== 'reconectando') {
    return null;
  }

  const unidadOrigen = llamadaActiva?.unidad || 'Torre 1 - 201';
  const nombreOrigen =
    llamadaActiva?.nombre ||
    (rolVista === 'vigilante' ? 'Residente' : 'Portería Principal');
  const cargoOrigen =
    llamadaActiva?.cargo ||
    (rolVista === 'vigilante' ? 'Residente' : 'Vigilante');
  const motivoLlamada =
    llamadaActiva?.motivo || 'Llamada directa de Citófono Virtual';

  if (estado === 'entrante') {
    return (
      <NotificacionCitofonoFlotante
        llamada={{
          unidad: unidadOrigen,
          nombre: nombreOrigen,
          rol: cargoOrigen,
          motivo: motivoLlamada,
          segundos: segundosTimbrando
        }}
        onContestarAqui={() => {
          contestarLlamada();
          onShowToast?.(
            `🟢 Llamada conectada en manos libres con ${unidadOrigen} (${nombreOrigen}).`
          );
        }}
        onIrAlCitofono={
          onIrAlModuloCitofono
            ? () => {
                contestarLlamada();
                onIrAlModuloCitofono();
                onShowToast?.(
                  `📞 Abriendo pantalla del Citófono con ${unidadOrigen}...`
                );
              }
            : undefined
        }
        onRechazar={() => {
          colgarLlamada();
          onShowToast?.(`📴 Llamada de ${unidadOrigen} rechazada.`);
        }}
      />
    );
  }

  return (
    <div className="fixed top-5 right-5 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 ease-out max-w-sm sm:max-w-md w-full px-3">
      <div className="relative bg-[#070b12]/90 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-3.5 shadow-[0_10px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/20 overflow-hidden">
        {/* Barra superior de acento en llamada activa */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />

        {/* Fila principal: Ícono de llamada activa + Info */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-[1.5px] shadow-[0_0_15px_rgba(16,185,129,0.35)]">
              <div className="w-full h-full bg-[#0a101d] rounded-[10px] flex items-center justify-center text-emerald-300">
                <Phone className="w-5 h-5 animate-pulse" />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                {unidadOrigen}
              </span>
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ml-auto">
                <Clock className="w-3 h-3" />
                {estado === 'reconectando' ? 'Reconectando...' : tiempoFormateado}
              </span>
            </div>

            <h4 className="text-sm font-black text-white truncate mt-0.5 tracking-tight">
              {nombreOrigen}
            </h4>

            <p className="text-[10px] text-emerald-300/90 truncate font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
              Manos libres activo ({diagnosticoIce.iceConnectionState.toUpperCase()})
            </p>
          </div>
        </div>

        {/* Fila inferior de controles en llamada */}
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-800/80">
          <button
            type="button"
            onClick={alternarSilencio}
            className={`flex-1 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
              !estaSilenciado
                ? 'bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200'
                : 'bg-amber-500 text-slate-950 font-black'
            }`}
          >
            {!estaSilenciado ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5" />
            )}
            <span>{!estaSilenciado ? 'Mic Activo' : 'Silenciado'}</span>
          </button>

          <button
            type="button"
            onClick={forzarReinicioIce}
            className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-cyan-300 text-xs py-2 px-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            title="Reconectar audio ICE"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {onIrAlModuloCitofono && (
            <button
              type="button"
              onClick={onIrAlModuloCitofono}
              className="bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs py-2 px-2.5 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              title="Abrir pantalla completa del citófono"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              colgarLlamada();
              onShowToast?.('📴 Llamada de citófono finalizada.');
            }}
            className="bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-400 text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>Colgar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
