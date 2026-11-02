import React, { useState } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, Camera, Send, Clock, AlertCircle, Users } from 'lucide-react';
import { useCitofonoEngine } from '../useCitofonoEngine';

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
    colaLlamadas,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada
  } = useCitofonoEngine({
    miRol: rolEngine,
    miUnidad: unidadResidenteActual
  });

  const [audioActivo, setAudioActivo] = useState(true);
  const [mensajeTexto, setMensajeTexto] = useState('');
  
  // Estado de la garita: 'disponible' | 'ocupado'
  const [estadoGarita, setEstadoGarita] = useState<'disponible' | 'ocupado'>('disponible');

  const [historialLlamadas, setHistorialLlamadas] = useState([
    { id: 1, tipo: 'Llamada de Voz', destino: 'Portería Principal', hora: '08:30 AM', estado: 'Atendido (Guarda Carlos)' },
    { id: 2, tipo: 'Reporte con Foto', destino: 'Portería Principal', hora: 'Ayer 04:15 PM', estado: 'Resuelto' }
  ]);

  const intentarLlamada = () => {
    iniciarLlamada();
    onShowToast?.('📞 Conectando citófono virtual WebRTC con la Garita Principal...');
  };

  const terminarLlamada = () => {
    colgarLlamada();
    onShowToast?.('📴 Llamada de citófono finalizada.');
  };

  const enviarMensajeRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeTexto.trim()) return;
    setHistorialLlamadas(prev => [
      { id: Date.now(), tipo: 'Nota Prioritaria', destino: 'Portería Principal', hora: 'Hace un momento', estado: 'Enviado a Bandeja de Garita' },
      ...prev
    ]);
    setMensajeTexto('');
    onShowToast?.('📨 Nota prioritaria enviada a la garita correctamente.');
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
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

        {/* INDICADOR DE ESTADO DE LÍNEA */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-2 border ${
            estado === 'disponible' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
              : estado === 'conectado'
              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-400 animate-pulse'
              : 'bg-amber-500/10 text-amber-300 border-amber-400 animate-ping'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              estado === 'disponible' ? 'bg-emerald-400' : estado === 'conectado' ? 'bg-cyan-400' : 'bg-amber-400'
            }`} />
            {estado === 'disponible' && 'Línea Disponible'}
            {estado === 'llamando' && 'Timbrando en Garita...'}
            {estado === 'conectado' && `Conectado con Garita (${tiempoFormateado})`}
          </span>
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Intercomunicación y Cola */}
        <div className="lg:col-span-2 bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative min-h-[320px]">
          
          <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">
            Unidad Activa: <strong className="text-cyan-400">{unidadResidenteActual}</strong>
          </div>

          {/* ESTADO 1: ENTRANTE (ALGUIEN LLAMA) */}
          {estado === 'entrante' ? (
            <div className="space-y-5 animate-bounce">
              <div className="w-24 h-24 bg-cyan-500/20 border border-cyan-500/40 rounded-full mx-auto flex items-center justify-center text-cyan-400 shadow-[0_0_40px_rgba(34,211,238,0.4)]">
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
                  onClick={contestarLlamada}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center gap-2"
                >
                  <Phone className="w-4 h-4" /> Contestar
                </button>
                <button
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-3 rounded-2xl text-xs transition cursor-pointer"
                >
                  Rechazar
                </button>
              </div>
            </div>
          ) : estado === 'llamando' ? (
            /* ESTADO 2: LLAMANDO / MARCANDO */
            <div className="space-y-5 animate-pulse">
              <div className="w-24 h-24 bg-amber-500/20 border border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <PhoneCall className="w-10 h-10 animate-spin" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Marcando y Estableciendo Enlace WebRTC...</h4>
                <p className="text-xs text-amber-300 font-mono mt-1">Llamando a {llamadaActiva?.unidad || 'Garita'}...</p>
              </div>
              <button
                onClick={colgarLlamada}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Cancelar Llamada
              </button>
            </div>
          ) : estado === 'conectado' ? (
            /* ESTADO 3: CONECTADO Y EN CURSO */
            <div className="space-y-6">
              <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/40 rounded-full mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.4)]">
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Comunicación en Curso • WebRTC Activo</h4>
                <p className="text-xs text-emerald-400 font-mono mt-1">Tiempo de llamada: <strong className="text-white text-sm">{tiempoFormateado}</strong></p>
                <p className="text-[11px] text-slate-400 mt-0.5">Hablando con: {llamadaActiva?.nombre || 'Interlocutor'} ({llamadaActiva?.unidad || ''})</p>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setAudioActivo(!audioActivo)}
                  className={`p-3 rounded-2xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${audioActivo ? 'bg-slate-800 text-white' : 'bg-amber-500 text-slate-950'}`}
                >
                  <Mic className="w-4 h-4" /> {audioActivo ? 'Micrófono Abierto' : 'Silenciado'}
                </button>
                <button
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <PhoneOff className="w-4 h-4" /> Colgar / Finalizar
                </button>
              </div>
            </div>
          ) : (
            /* ESTADO 4: DISPONIBLE / LLAMANDO / CONECTADO (BOTONES DINÁMICOS) */
            <div className="space-y-4 max-w-sm mx-auto w-full">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition shadow-[0_0_30px_rgba(0,242,254,0.2)] ${
                estado === 'disponible'
                  ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-400'
                  : (estado as string) === 'conectado'
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 shadow-[0_0_35px_rgba(16,185,129,0.3)]'
                  : 'bg-amber-500/15 border border-amber-500/40 text-amber-400'
              }`}>
                {estado === 'disponible' && <Phone className="w-10 h-10 animate-bounce" />}
                {(estado as string) === 'llamando' && <PhoneCall className="w-10 h-10 animate-spin" />}
                {(estado as string) === 'conectado' && <PhoneCall className="w-10 h-10 animate-pulse" />}
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {estado === 'disponible' && 'Citófono Disponible'}
                  {(estado as string) === 'llamando' && 'Llamando a Garita Principal...'}
                  {(estado as string) === 'conectado' && `En Conversación (${tiempoFormateado})`}
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  {estado === 'disponible' && 'Presiona para establecer comunicación bidireccional por voz con el guarda de turno.'}
                  {(estado as string) === 'llamando' && 'Esperando respuesta de la garita o portería...'}
                  {(estado as string) === 'conectado' && 'Canal WebRTC seguro activo. Audio bidireccional en curso.'}
                </p>
              </div>

              {estado === 'disponible' ? (
                <button
                  onClick={() => iniciarLlamada()}
                  className="w-full bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3.5 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,242,254,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4 h-4" />
                  Iniciar Llamada a Garita
                </button>
              ) : (
                <button
                  onClick={colgarLlamada}
                  className="w-full bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(244,63,94,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PhoneOff className="w-4 h-4" />
                  {(estado as string) === 'llamando' ? 'Cancelar Llamada' : `Colgar (${tiempoFormateado})`}
                </button>
              )}
            </div>
          )}

        </div>

        {/* Panel Lateral: Nota Prioritaria */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-cyan-400" /> Nota Rápida a Garita
            </h4>
            <p className="text-[11px] text-slate-400 mt-2">¿Prefieres no esperar en la cola? Deja un mensaje directo para que el guarda lo lea de inmediato.</p>
          </div>

          <form onSubmit={enviarMensajeRapido} className="space-y-3">
            <textarea
              rows={3}
              placeholder="Escribe tu requerimiento..."
              value={mensajeTexto}
              onChange={(e) => setMensajeTexto(e.target.value)}
              className="w-full p-3 text-xs bg-[#07090e] border border-slate-700 text-white rounded-2xl outline-none focus:border-cyan-400 resize-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-2xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <Send className="w-3.5 h-3.5" /> Enviar Nota Rápida
            </button>
          </form>

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
