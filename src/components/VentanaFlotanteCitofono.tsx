import React from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Building2,
  User,
  Clock,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { RetornoUseCitofonoEngine } from '../useCitofonoEngine';

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
  submoduloActualLabel,
  onIrAlModuloCitofono,
  onShowToast
}: VentanaFlotanteCitofonoProps) {
  const {
    estado,
    tiempoFormateado,
    tiempoTimbrandoFormateado,
    llamadaActiva,
    estaSilenciado,
    timbreSilenciado,
    diagnosticoIce,
    alternarSilencio,
    silenciarTimbreYPonerEnEspera,
    reactivarTimbre,
    contestarLlamada,
    colgarLlamada,
    forzarReinicioIce
  } = engine;

  if (estado !== 'entrante' && estado !== 'conectado' && estado !== 'reconectando') {
    return null;
  }

  const unidadOrigen = llamadaActiva?.unidad || 'Torre 2 - 301';
  const nombreOrigen = llamadaActiva?.nombre || (rolVista === 'vigilante' ? 'Residente Copropietario' : 'Portería Principal');
  const cargoOrigen = llamadaActiva?.cargo || (rolVista === 'vigilante' ? 'Unidad Residencial' : 'Seguridad & Garita');
  const motivoLlamada = llamadaActiva?.motivo || 'Llamada directa de Citófono Virtual';

  return (
    <>
      <style>{`
        @keyframes slideDownFromTopSoftware {
          0% {
            opacity: 0;
            transform: translateY(-120%) scale(0.96);
          }
          70% {
            opacity: 1;
            transform: translateY(6px) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-citofono-top-down {
          animation: slideDownFromTopSoftware 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex justify-center pt-2.5 sm:pt-4 px-2.5 sm:px-6">
        {estado === 'entrante' ? (
          /* =====================================================================
             VENTANA FLOTANTE SUPERIOR DE LLAMADA ENTRANTE (DESLIZA DESDE ARRIBA)
             ===================================================================== */
          <div className="pointer-events-auto w-full max-w-3xl animate-citofono-top-down bg-[#060b16]/95 backdrop-blur-2xl border-2 border-cyan-400 rounded-3xl p-4 sm:p-5 shadow-[0_20px_70px_rgba(0,242,254,0.4)] text-slate-100 ring-4 ring-cyan-500/20">
            {/* Franja Superior: Estado del Timbre Sonoro y Reloj de Timbrado */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800/90">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
                </span>
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300 bg-cyan-500/15 border border-cyan-400/40 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                  📲 Llamada Entrante de Citófono ({tiempoTimbrandoFormateado})
                </span>
                {!timbreSilenciado ? (
                  <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Timbre Celular Sonando
                  </span>
                ) : (
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                    <VolumeX className="w-3.5 h-3.5 text-amber-400" />
                    Timbre Silenciado • En Espera para Atender
                  </span>
                )}
              </div>

              {submoduloActualLabel && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-800">
                  Módulo actual: <strong className="text-cyan-300">{submoduloActualLabel}</strong>
                </span>
              )}
            </div>

            {/* Cuerpo Central: Información Completa de Dónde Llaman */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-cyan-500/30 to-emerald-500/20 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.45)] shrink-0">
                  <PhoneCall className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-300 animate-bounce" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-xs sm:text-sm font-black tracking-wide flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      {unidadOrigen}
                    </span>
                    <span className="text-xs font-mono text-cyan-300 bg-cyan-950/70 border border-cyan-500/30 px-2 py-0.5 rounded-md font-bold">
                      {cargoOrigen}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>{nombreOrigen}</span>
                  </h3>

                  <p className="text-xs text-slate-300 font-mono">
                    Motivo: <strong className="text-white">&ldquo;{motivoLlamada}&rdquo;</strong>
                  </p>
                  {rolVista === 'vigilante' && (
                    <p className="text-[11px] text-emerald-300/90 font-mono">
                      💡 Puedes terminar tu gestión actual y contestar aquí mismo sin perder los datos en pantalla.
                    </p>
                  )}
                </div>
              </div>

              {/* Botonera de Acción Rápida para el Vigilante / Residente */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto justify-end shrink-0">
                {/* 1. Contestar en manos libres sin cambiar de pantalla */}
                <button
                  type="button"
                  onClick={() => {
                    contestarLlamada();
                    onShowToast?.(`🟢 Llamada conectada en manos libres con ${unidadOrigen} (${nombreOrigen}).`);
                  }}
                  className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-3 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_25px_rgba(16,185,129,0.5)] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  <span>Contestar Aquí</span>
                </button>

                {/* 2. Ir al submódulo de Citófono y contestar */}
                {onIrAlModuloCitofono && (
                  <button
                    type="button"
                    onClick={() => {
                      contestarLlamada();
                      onIrAlModuloCitofono();
                      onShowToast?.(`📞 Abriendo Citófono Virtual con ${unidadOrigen}...`);
                    }}
                    className="flex-1 sm:flex-initial bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/60 text-cyan-200 font-bold px-3.5 py-3 rounded-2xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Cambiar a la pantalla del Citófono y contestar"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-300" />
                    <span>Ir al Citófono</span>
                  </button>
                )}

                {/* 3. Silenciar timbre para terminar gestión actual antes de contestar */}
                {!timbreSilenciado ? (
                  <button
                    type="button"
                    onClick={() => {
                      silenciarTimbreYPonerEnEspera();
                      onShowToast?.(
                        `🔕 Timbre silenciado. La llamada de ${unidadOrigen} sigue en espera arriba para que contestes al terminar tu gestión.`
                      );
                    }}
                    className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold px-3.5 py-3 rounded-2xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Silenciar timbre sonoro mientras terminas la gestión actual"
                  >
                    <VolumeX className="w-4 h-4 text-amber-400" />
                    <span className="hidden sm:inline">En Espera</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={reactivarTimbre}
                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold px-3 py-3 rounded-2xl text-xs font-mono transition flex items-center justify-center gap-1 cursor-pointer"
                    title="Reactivar sonido del timbre"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                  </button>
                )}

                {/* 4. Rechazar / Colgar */}
                <button
                  type="button"
                  onClick={() => {
                    colgarLlamada();
                    onShowToast?.(`📴 Llamada de ${unidadOrigen} rechazada/finalizada.`);
                  }}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-3.5 py-3 rounded-2xl text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-rose-600/30"
                  title="Rechazar llamada"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span className="hidden sm:inline">Rechazar</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =====================================================================
             BARRA FLOTANTE SUPERIOR DE LLAMADA EN CURSO (MANOS LIBRES EN CUALQUIER PANTALLA)
             ===================================================================== */
          <div className="pointer-events-auto w-full max-w-2xl animate-citofono-top-down bg-[#061217]/95 backdrop-blur-2xl border-2 border-emerald-400/80 rounded-2xl px-4 py-3 shadow-[0_15px_50px_rgba(16,185,129,0.3)] text-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <Phone className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {estado === 'reconectando' ? 'Reconectando ICE...' : `En Llamada (${tiempoFormateado})`}
                  </span>
                  <span className="text-xs font-mono font-black text-amber-300">{unidadOrigen}</span>
                  <span className="text-xs font-bold text-white">• {nombreOrigen}</span>
                </div>
                <p className="text-[10px] font-mono text-cyan-300 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Audio WebRTC Manos Libres Activo ({diagnosticoIce.iceConnectionState.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={alternarSilencio}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  !estaSilenciado
                    ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                    : 'bg-amber-500 text-slate-950 font-black'
                }`}
              >
                {!estaSilenciado ? <Mic className="w-3.5 h-3.5 text-emerald-400" /> : <MicOff className="w-3.5 h-3.5" />}
                <span>{!estaSilenciado ? 'Mic Activo' : 'Silenciado'}</span>
              </button>

              <button
                type="button"
                onClick={forzarReinicioIce}
                className="p-2 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono transition cursor-pointer"
                title="Reconectar enlace de voz ICE"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>

              {onIrAlModuloCitofono && (
                <button
                  type="button"
                  onClick={onIrAlModuloCitofono}
                  className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 rounded-xl text-xs font-mono transition cursor-pointer"
                  title="Ver módulo completo de Citófono"
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
                className="bg-rose-600 hover:bg-rose-500 text-white font-black px-3.5 py-2 rounded-xl text-xs font-mono transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Colgar</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
