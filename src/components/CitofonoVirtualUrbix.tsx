import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, Send, Clock, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useCitofonoEngine } from '../useCitofonoEngine';
import { NotaRapidaResidente } from './NotaRapidaResidente';

export default function CitofonoVirtualUrbix({
  unidadResidenteActual = 'Torre 2 - 301',
  rolUsuario = 'residente',
  onShowToast
}: {
  unidadResidenteActual?: string;
  rolUsuario?: 'residente' | 'vigilante' | string;
  onShowToast?: (msg: string) => void;
}) {
  const rolEngine = rolUsuario === 'vigilante' ? 'vigilante' : 'residente';
  const {
    estado,
    tiempoFormateado,
    llamadaActiva,
    estaSilenciado,
    errorNotificacion,
    diagnosticoIce,
    alternarSilencio,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada,
    forzarReinicioIce
  } = useCitofonoEngine({
    miRol: rolEngine,
    miUnidad: unidadResidenteActual
  });

  const [historialLlamadas] = useState([
    { id: 1, tipo: 'Llamada de Voz', destino: 'Portería Principal', hora: '08:30 AM', estado: 'Atendido (Guarda Carlos)' },
    { id: 2, tipo: 'Reporte con Foto', destino: 'Portería Principal', hora: 'Ayer 04:15 PM', estado: 'Resuelto' }
  ]);

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA DEL CITÓFONO */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Intercomunicador Digital • Urbix PH
            </span>
            <h3 className="text-base font-black text-white mt-1">Citófono Virtual Directo (Residente ⇄ Garita)</h3>
          </div>
        </div>

        {/* INDICADOR DE ESTADO DE LÍNEA E ICE MÓVIL */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 border ${
            estado === 'disponible'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : estado === 'conectado'
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400'
              : estado === 'reconectando'
              ? 'bg-amber-500/15 text-amber-300 border-amber-400 animate-pulse'
              : 'bg-amber-500/10 text-amber-300 border-amber-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              estado === 'disponible' ? 'bg-emerald-400' : estado === 'conectado' ? 'bg-cyan-400 animate-ping' : 'bg-amber-400 animate-ping'
            }`} />
            {estado === 'disponible' && 'Línea Disponible'}
            {estado === 'llamando' && 'Timbrando en Garita...'}
            {estado === 'entrante' && 'Llamada Entrante...'}
            {estado === 'conectado' && `Conectado (${tiempoFormateado})`}
            {estado === 'reconectando' && `Reconectando Señal Móvil (${diagnosticoIce.intentosReconexion}/3)`}
          </span>

          {estado !== 'disponible' && (
            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-mono border flex items-center gap-1 ${
              diagnosticoIce.salud === 'optima'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                : diagnosticoIce.salud === 'inestable' || diagnosticoIce.salud === 'reconectando'
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                : diagnosticoIce.salud === 'fallo'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              ICE: {diagnosticoIce.iceConnectionState.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {errorNotificacion && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-200 font-mono">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorNotificacion}</span>
          </div>
          {estado !== 'disponible' && (
            <button
              type="button"
              onClick={forzarReinicioIce}
              className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-xl text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" /> Reiniciar Enlace ICE
            </button>
          )}
        </div>
      )}

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Intercomunicación y Cola */}
        <div className="lg:col-span-2 bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative min-h-[320px]">
          
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>Unidad Activa: <strong className="text-cyan-400">{unidadResidenteActual}</strong></span>
            {diagnosticoIce.ultimoErrorCandidato && (
              <span className="text-[10px] text-amber-400/90" title={diagnosticoIce.ultimoErrorCandidato.errorText}>
                STUN Fallback Activo ({diagnosticoIce.ultimoErrorCandidato.errorCode})
              </span>
            )}
          </div>

          {/* ESTADO 1: ENTRANTE (ALGUIEN LLAMA) */}
          {estado === 'entrante' ? (
            <div className="space-y-5">
              <div className="w-24 h-24 bg-cyan-500/20 border border-cyan-500/40 rounded-full mx-auto flex items-center justify-center text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)] animate-bounce">
                <PhoneCall className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">¡Llamada Entrante de Citófono!</h4>
                <p className="text-xs text-cyan-300 font-mono mt-1">
                  De: <strong className="text-white">{llamadaActiva?.nombre || 'Interlocutor'}</strong> ({llamadaActiva?.unidad || ''})
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={contestarLlamada}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Contestar
                </button>
                <button
                  type="button"
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-2xl text-xs transition cursor-pointer"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : estado === 'llamando' ? (
            /* ESTADO 2: LLAMANDO / MARCANDO */
            <div className="space-y-5">
              <div className="w-24 h-24 bg-amber-500/20 border border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] animate-pulse">
                <PhoneCall className="w-10 h-10 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Marcando y Negociando Candidatos ICE...</h4>
                <p className="text-xs text-amber-300 font-mono mt-1">
                  Llamando a {llamadaActiva?.unidad || 'Garita'} • Estado ICE: {diagnosticoIce.iceConnectionState}
                </p>
              </div>
              <button
                type="button"
                onClick={colgarLlamada}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar Llamada
              </button>
            </div>
          ) : estado === 'conectado' || estado === 'reconectando' ? (
            /* ESTADO 3: CONECTADO O RECONECTANDO EN RED MÓVIL */
            <div className="space-y-6">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center ${
                estado === 'reconectando'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 animate-pulse'
                  : 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)]'
              }`}>
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {estado === 'reconectando'
                    ? 'Estabilizando Red Móvil (ICE Restart)...'
                    : 'Comunicación en Curso • WebRTC Activo'}
                </h4>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  Tiempo de llamada: <strong className="text-white text-sm">{tiempoFormateado}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Hablando con: {llamadaActiva?.nombre || 'Interlocutor'} ({llamadaActiva?.unidad || ''})
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={alternarSilencio}
                  className={`p-3 rounded-2xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                    !estaSilenciado ? 'bg-slate-800 text-white' : 'bg-amber-500 text-slate-950 font-black'
                  }`}
                >
                  <Mic className="w-4 h-4" /> {!estaSilenciado ? 'Micrófono Abierto' : 'Silenciado'}
                </button>
                <button
                  type="button"
                  onClick={forzarReinicioIce}
                  className="p-3 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-2xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5"
                  title="Re-sincronizar audio si cambiaste de Wi-Fi a Datos Móviles"
                >
                  <RefreshCw className="w-4 h-4" /> Reconectar Audio ICE
                </button>
                <button
                  type="button"
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <PhoneOff className="w-4 h-4" /> Colgar / Finalizar
                </button>
              </div>
            </div>
          ) : (
            /* ESTADO 4: DISPONIBLE */
            <div className="space-y-4 max-w-sm mx-auto w-full">
              <div className="w-24 h-24 rounded-full mx-auto flex items-center justify-center transition shadow-[0_0_30px_rgba(0,242,254,0.2)] bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
                <Phone className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Citófono Disponible</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Presiona para establecer comunicación bidireccional por voz con el guarda de turno (compatible con iOS/Android).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  iniciarLlamada();
                  onShowToast?.('📞 Conectando citófono virtual WebRTC con la Garita Principal...');
                }}
                className="w-full bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3.5 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,242,254,0.35)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                Iniciar Llamada a Garita
              </button>
            </div>
          )}

        </div>

        {/* Panel Lateral: Nota Prioritaria Directa */}
        <div className="flex flex-col justify-start">
          <NotaRapidaResidente
            unitNumber={unidadResidenteActual}
            onShowToast={onShowToast}
          />
        </div>

      </div>

      {/* HISTORIAL DE LLAMADAS Y REPORTES CON GARITA */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Registro de Intercomunicación Reciente
          </h4>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {historialLlamadas.length} Eventos Registrados
          </span>
        </div>

        <div className="space-y-2">
          {historialLlamadas.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[#07090e] border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  {item.tipo.includes('Voz') ? <Phone className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">{item.tipo}</span>
                    <span className="text-[10px] font-mono text-slate-400">→ {item.destino}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.hora}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
