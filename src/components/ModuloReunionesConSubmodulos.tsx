import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  Radio,
  Award,
  MessageSquare,
  ShieldCheck,
  Mic,
  MicOff,
  VideoOff,
  Hand,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  Download,
  AlertTriangle,
  Building2,
  Sparkles,
  ChevronRight,
  MonitorUp,
  PhoneOff,
  Play
} from 'lucide-react';
import SubmoduloConvocatoriasLey675 from './SubmoduloConvocatoriasLey675';
import { supabase, isSupabaseConfigured } from '../supabaseClient';

export interface ModuloReunionesConSubmodulosProps {
  unidadResidenteActual?: string;
  esConsejero?: boolean;
  rolUsuario?: 'admin' | 'supervisor' | 'residente';
  onShowToast?: (msg: string) => void;
}

export default function ModuloReunionesConSubmodulos({
  unidadResidenteActual = 'Torre 2 - 301',
  esConsejero = true,
  rolUsuario = 'admin',
  onShowToast
}: ModuloReunionesConSubmodulosProps) {
  const [submoduloActivo, setSubmoduloActivo] = useState<'video' | 'convocatorias' | 'quorum' | 'votaciones' | 'acta'>('video');

  // Estados WebRTC multimedia en vivo
  const [enVivo, setEnVivo] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [compartiendoPantalla, setCompartiendoPantalla] = useState(false);
  const [manoLevantada, setManoLevantada] = useState(false);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);

  // Referencias DOM y WebRTC P2P
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);
  const videoRemotoRef = useRef<HTMLVideoElement | null>(null);
  const streamLocalRef = useRef<MediaStream | null>(null);
  const streamPantallaRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const canalRtcRef = useRef<any>(null);

  const [mensajeChat, setMensajeChat] = useState('');
  const [chatLog, setChatLog] = useState([
    { id: 1, autor: 'Dr. Mauricio Restrepo (Presidente Consejo)', texto: 'Bienvenidos a la Asamblea General Virtual 2026. Quórum inicial confirmado bajo Ley 675.', hora: '06:00 PM' },
    { id: 2, autor: 'Carlos Mario Pineda (Administrador)', texto: 'Contamos con el 92.4% de los coeficientes acreditados en sala.', hora: '06:02 PM' }
  ]);

  // Estados de Convocatorias
  const [convocatorias, setConvocatorias] = useState([
    {
      id: 'conv-1',
      tipo: 'Asamblea General Ordinaria (Ley 675)',
      titulo: 'Asamblea Anual de Copropietarios 2026',
      fecha: '2026-03-15 09:00 AM',
      estado: 'En Curso',
      anticipacion: '15 días hábiles cumplidos',
      quorum: '92.4%'
    },
    {
      id: 'conv-2',
      tipo: 'Consejo de Administración',
      titulo: 'Reunión Ordinaria de Consejo - Revisión Presupuesto',
      fecha: '2026-02-20 06:30 PM',
      estado: 'Finalizada',
      anticipacion: 'Citación formal',
      quorum: '100%'
    }
  ]);

  // Quórum y mociones
  const [quorumRegistrado, setQuorumRegistrado] = useState(92.4);
  const [unidadesPresentes, setUnidadesPresentes] = useState([
    { id: 'u-1', unidad: 'Torre 1 - 101', titular: 'Mateo Zuluaga', coeficiente: 0.82, poder: false, hora: '05:45 PM' },
    { id: 'u-2', unidad: 'Torre 1 - 102', titular: 'Carolina Herrera', coeficiente: 0.82, poder: false, hora: '05:50 PM' },
    { id: 'u-3', unidad: 'Torre 1 - 201', titular: 'Andrés Gómez (Apoderado)', coeficiente: 0.95, poder: true, hora: '05:52 PM' },
    { id: 'u-4', unidad: 'Torre 1 - 302', titular: 'Esteban Ochoa', coeficiente: 1.05, poder: false, hora: '05:55 PM' },
    { id: 'u-5', unidad: 'Torre 2 - 301', titular: 'Dr. Mauricio Restrepo (Consejo)', coeficiente: 1.15, poder: false, hora: '05:40 PM' },
  ]);

  const [mociónActual, setMocionActual] = useState({
    id: 'moc-1',
    titulo: 'Aprobación del Presupuesto Ordinario Vigencia 2026 e Incremento de Cuota 8.5%',
    tipoMayoria: 'Mayoría Calificada (Art. 46 Ley 675 - Requiere > 70%)',
    coefFavor: 74.8,
    coefContra: 12.2,
    coefBlanco: 5.4,
    haVotado: false,
    miVoto: null as 'favor' | 'contra' | 'blanco' | null
  });

  // Estados de Acta IA
  const [generandoActa, setGenerandoActa] = useState(false);
  const [actaGenerada, setActaGenerada] = useState(false);
  const [comisionVerificadora, setComisionVerificadora] = useState({
    persona1: 'Dr. Mauricio Restrepo (Apto 301)',
    persona2: 'Mateo Zuluaga (Apto 101)'
  });

  // Servidores STUN públicos de Google para atravesar routers residenciales (NAT)
  const iceServersConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // 1. Conexión de señalización WebRTC en vivo con Supabase Broadcast
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const canal = supabase.channel('sala_asamblea_general_webrtc', {
      config: { broadcast: { self: false } }
    });

    canal
      .on('broadcast', { event: 'asamblea_oferta' }, async ({ payload }) => {
        if (rolUsuario === 'admin') return; // El admin envía la oferta, el residente responde
        try {
          const pc = new RTCPeerConnection(iceServersConfig);
          peerRef.current = pc;

          // Si el residente ya tenía el micrófono activo, lo vincula
          if (streamLocalRef.current) {
            streamLocalRef.current.getTracks().forEach(t => pc.addTrack(t, streamLocalRef.current!));
          }

          pc.ontrack = (evt) => {
            if (videoRemotoRef.current && evt.streams[0]) {
              videoRemotoRef.current.srcObject = evt.streams[0];
              videoRemotoRef.current.play().catch(() => {});
            }
          };

          pc.onicecandidate = (evt) => {
            if (evt.candidate) {
              canal.send({ type: 'broadcast', event: 'asamblea_candidato_ice', payload: { candidate: evt.candidate } });
            }
          };

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          const respuesta = await pc.createAnswer();
          await pc.setLocalDescription(respuesta);

          canal.send({ type: 'broadcast', event: 'asamblea_respuesta', payload: { sdp: respuesta } });
          setEnVivo(true);
        } catch (err) {
          console.warn('Error atendiendo oferta de asamblea:', err);
        }
      })
      .on('broadcast', { event: 'asamblea_respuesta' }, async ({ payload }) => {
        if (peerRef.current && rolUsuario === 'admin') {
          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          } catch (e) {
            console.warn('Error fijando respuesta remota:', e);
          }
        }
      })
      .on('broadcast', { event: 'asamblea_candidato_ice' }, async ({ payload }) => {
        if (peerRef.current && payload.candidate) {
          try {
            await peerRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('Error con candidato ICE:', e);
          }
        }
      })
      .on('broadcast', { event: 'asamblea_chat' }, ({ payload }) => {
        setChatLog(prev => [...prev, payload]);
      })
      .subscribe();

    canalRtcRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
      detenerTransmision();
    };
  }, [rolUsuario]);

  // 2. Iniciar transmisión real con cámara y micrófono
  const iniciarVideollamada = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: { echoCancellation: true, noiseSuppression: true }
      });

      streamLocalRef.current = stream;
      if (videoLocalRef.current) {
        videoLocalRef.current.srcObject = stream;
        videoLocalRef.current.play().catch(() => {});
      }

      const pc = new RTCPeerConnection(iceServersConfig);
      peerRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (evt) => {
        if (videoRemotoRef.current && evt.streams[0]) {
          videoRemotoRef.current.srcObject = evt.streams[0];
          videoRemotoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate && canalRtcRef.current) {
          canalRtcRef.current.send({
            type: 'broadcast',
            event: 'asamblea_candidato_ice',
            payload: { candidate: evt.candidate }
          });
        }
      };

      // Si es admin, lanza la oferta a todos los residentes
      if (rolUsuario === 'admin') {
        const oferta = await pc.createOffer();
        await pc.setLocalDescription(oferta);

        if (canalRtcRef.current) {
          canalRtcRef.current.send({
            type: 'broadcast',
            event: 'asamblea_oferta',
            payload: { sdp: oferta }
          });
        }
      }

      setEnVivo(true);
      setCamOn(true);
      setMicOn(true);
      onShowToast?.('🎥 Sala conectada en vivo por WebRTC.');
    } catch (err: any) {
      console.error('Error al abrir dispositivos multimedia:', err);
      onShowToast?.('⚠️ Permiso denegado para cámara o micrófono en el navegador.');
    }
  };

  const detenerTransmision = () => {
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (streamLocalRef.current) {
      streamLocalRef.current.getTracks().forEach(t => t.stop());
      streamLocalRef.current = null;
    }
    if (streamPantallaRef.current) {
      streamPantallaRef.current.getTracks().forEach(t => t.stop());
      streamPantallaRef.current = null;
    }
    if (videoLocalRef.current) videoLocalRef.current.srcObject = null;
    if (videoRemotoRef.current) videoRemotoRef.current.srcObject = null;
    setEnVivo(false);
    setCompartiendoPantalla(false);
  };

  const toggleMic = () => {
    if (streamLocalRef.current) {
      const audio = streamLocalRef.current.getAudioTracks()[0];
      if (audio) {
        audio.enabled = !micOn;
        setMicOn(!micOn);
        onShowToast?.(!micOn ? '🎙️ Micrófono activado.' : '🔇 Micrófono silenciado.');
      }
    }
  };

  const toggleCam = () => {
    if (streamLocalRef.current) {
      const video = streamLocalRef.current.getVideoTracks()[0];
      if (video) {
        video.enabled = !camOn;
        setCamOn(!camOn);
        onShowToast?.(!camOn ? '📹 Cámara encendida.' : '📷 Cámara apagada.');
      }
    }
  };

  const toggleCompartirPantalla = async () => {
    if (!compartiendoPantalla) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        streamPantallaRef.current = screenStream;

        if (videoLocalRef.current) videoLocalRef.current.srcObject = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
        if (sender) sender.replaceTrack(screenTrack);

        screenTrack.onended = () => {
          if (videoLocalRef.current && streamLocalRef.current) {
            videoLocalRef.current.srcObject = streamLocalRef.current;
            const originalTrack = streamLocalRef.current.getVideoTracks()[0];
            sender?.replaceTrack(originalTrack);
          }
          setCompartiendoPantalla(false);
        };

        setCompartiendoPantalla(true);
        onShowToast?.('🖥️ Proyectando pantalla a los copropietarios.');
      } catch (e) {
        console.warn('Pantalla cancelada:', e);
      }
    } else {
      if (streamPantallaRef.current) {
        streamPantallaRef.current.getTracks().forEach(t => t.stop());
        streamPantallaRef.current = null;
      }
      if (videoLocalRef.current && streamLocalRef.current) {
        videoLocalRef.current.srcObject = streamLocalRef.current;
        const originalTrack = streamLocalRef.current.getVideoTracks()[0];
        const sender = peerRef.current?.getSenders().find(s => s.track?.kind === 'video');
        sender?.replaceTrack(originalTrack);
      }
      setCompartiendoPantalla(false);
      onShowToast?.('📹 Retornando a la cámara.');
    }
  };

  const handleEnviarChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeChat.trim()) return;

    const nuevoMensaje = {
      id: Date.now(),
      autor: `${unidadResidenteActual} (${rolUsuario.toUpperCase()})`,
      texto: mensajeChat.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatLog(prev => [...prev, nuevoMensaje]);
    if (canalRtcRef.current) {
      canalRtcRef.current.send({
        type: 'broadcast',
        event: 'asamblea_chat',
        payload: nuevoMensaje
      });
    }
    setMensajeChat('');
  };

  const handleVotar = (opcion: 'favor' | 'contra' | 'blanco') => {
    if (mociónActual.haVotado) {
      onShowToast?.('⚠️ Ya has ejercido tu derecho de voto para esta moción.');
      return;
    }
    const miCoef = 1.05;
    setMocionActual((prev) => ({
      ...prev,
      haVotado: true,
      miVoto: opcion,
      coefFavor: opcion === 'favor' ? +(prev.coefFavor + miCoef).toFixed(2) : prev.coefFavor,
      coefContra: opcion === 'contra' ? +(prev.coefContra + miCoef).toFixed(2) : prev.coefContra,
      coefBlanco: opcion === 'blanco' ? +(prev.coefBlanco + miCoef).toFixed(2) : prev.coefBlanco
    }));
    onShowToast?.(`🗳️ Voto registrado con éxito: ${opcion.toUpperCase()} (Ponderado: 1.05%).`);
  };

  const handleGenerarActaIA = () => {
    setGenerandoActa(true);
    setTimeout(() => {
      setGenerandoActa(false);
      setActaGenerada(true);
      onShowToast?.('✨ Acta legal generada automáticamente por IA bajo Ley 675.');
    }, 1200);
  };

  // Cronómetro
  useEffect(() => {
    let t: any;
    if (enVivo) {
      t = setInterval(() => setSegundosTranscurridos(s => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [enVivo]);

  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#05080e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl font-sans text-slate-100">
      
      {/* CABECERA PRINCIPAL DEL MÓDULO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-[0_0_25px_rgba(34,211,238,0.4)] shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Módulo Integral de Reuniones &amp; Asambleas
              </h2>
              <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.2)]">
                LEY 675 DE 2001
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Conexión activa: <span className="text-cyan-400 font-bold">{unidadResidenteActual}</span> • Coeficiente legal: <span className="text-emerald-400 font-bold font-mono">1.05%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0b0f17] border border-slate-800 px-3 py-1.5 rounded-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-mono font-bold text-emerald-400">Quórum en Sala: {quorumRegistrado}%</span>
        </div>
      </div>

      {/* BARRA DE SUBMÓDULOS */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {[
          { id: 'video', label: '1. Videoconferencia', icon: Video, color: 'text-rose-400' },
          { id: 'convocatorias', label: '2. Convocatorias', icon: Calendar, color: 'text-cyan-400' },
          { id: 'quorum', label: '3. Quórum Coeficientes', icon: Users, color: 'text-emerald-400' },
          { id: 'votaciones', label: '4. Votación de Mociones', icon: CheckSquare, color: 'text-amber-400' },
          { id: 'acta', label: '5. Acta Oficial & IA', icon: FileText, color: 'text-blue-400' },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = submoduloActivo === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSubmoduloActivo(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer min-h-[42px] shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.25)]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 1. SUBMÓDULO: VIDEOCONFERENCIA EN VIVO */}
      {submoduloActivo === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LIENZO DE VIDEO PRINCIPAL */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative aspect-video bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
              
              {/* Badge superior */}
              <div className="flex items-center justify-between z-10">
                <span className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                  <span className={`w-2 h-2 rounded-full ${enVivo ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                  {enVivo ? 'TRANSMISIÓN EN VIVO' : 'SALA EN ESPERA'}
                </span>
                <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-xs px-3 py-1 rounded-xl border border-slate-700 font-mono">
                  🔴 {enVivo ? `${formatearTiempo(segundosTranscurridos)} • 142 Conectados` : '0 Conectados'}
                </span>
              </div>

              {/* Contenido Central: Video HTML5 WebRTC */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden my-2 rounded-2xl bg-[#07090e]/80 border border-slate-800/80">
                {enVivo ? (
                  <>
                    <video
                      ref={videoLocalRef}
                      autoPlay
                      playsInline
                      muted={rolUsuario === 'admin'}
                      className={`w-full h-full object-cover rounded-2xl ${!camOn ? 'hidden' : ''}`}
                    />
                    <video ref={videoRemotoRef} autoPlay playsInline className="hidden" />
                    
                    {!camOn && (
                      <div className="text-center py-10 space-y-2">
                        <VideoOff className="w-10 h-10 text-slate-600 mx-auto" />
                        <p className="text-xs text-slate-400 font-mono">Cámara desactivada</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center space-y-3 py-8">
                    <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-cyan-600 to-teal-400 p-0.5 shadow-[0_0_30px_rgba(34,211,238,0.3)]">
                      <div className="w-full h-full bg-[#07090e] rounded-[22px] flex items-center justify-center font-black text-2xl text-cyan-400">
                        MR
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">
                        Dr. Mauricio Restrepo <Award className="w-4 h-4 text-amber-400" />
                      </h3>
                      <p className="text-xs text-cyan-300 font-medium">Presidente del Consejo de Administración • Orador Activo</p>
                    </div>

                    <button
                      type="button"
                      onClick={iniciarVideollamada}
                      className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center gap-2 mx-auto cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" /> Conectar a la Asamblea WebRTC
                    </button>
                  </div>
                )}
              </div>

              {/* Barra de Controles de Participante */}
              <div className="bg-[#0b0f17]/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 z-10 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    disabled={!enVivo}
                    type="button"
                    onClick={toggleMic}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                      micOn ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-rose-400" />}
                    <span>{micOn ? 'Mic Activo' : 'Mic Mute'}</span>
                  </button>

                  <button
                    disabled={!enVivo}
                    type="button"
                    onClick={toggleCam}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                      camOn ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4 text-rose-400" />}
                    <span>{camOn ? 'Cámara On' : 'Cámara Off'}</span>
                  </button>

                  <button
                    disabled={!enVivo}
                    type="button"
                    onClick={toggleCompartirPantalla}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                      compartiendoPantalla ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <MonitorUp className="w-4 h-4" />
                    <span>{compartiendoPantalla ? 'Proyectando' : 'Proyectar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setManoLevantada(!manoLevantada);
                      onShowToast?.(!manoLevantada ? '✋ Has pedido la palabra al presidente.' : '✋ Mano bajada.');
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] ${
                      manoLevantada ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    <span>{manoLevantada ? 'Mano Levantada' : 'Pedir Palabra'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Unidad: <strong className="text-white">{unidadResidenteActual}</strong>
                  </span>

                  {enVivo && (
                    <button
                      type="button"
                      onClick={detenerTransmision}
                      className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl transition cursor-pointer"
                      title="Desconectar llamada"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Accesos rápidos de votación simultánea */}
            <div className="bg-[#0b0f17] border border-slate-800/80 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-amber-400" /> Moción legal en votación simultánea
                </p>
                <p className="text-[11px] text-slate-400">{mociónActual.titulo}</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmoduloActivo('votaciones')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer whitespace-nowrap"
              >
                Abrir Tarjetón de Voto
              </button>
            </div>
          </div>

          {/* CHAT OFICIAL DE ASAMBLEA */}
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 h-[440px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Chat Oficial Foliado
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
                {chatLog.length} mensajes
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {chatLog.map(m => (
                <div key={m.id} className="bg-[#07090e] p-3 rounded-xl border border-slate-800/80 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                    <span className="font-bold text-cyan-400">{m.autor}</span>
                    <span className="text-slate-500">{m.hora}</span>
                  </div>
                  <p className="text-xs text-slate-200">{m.texto}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleEnviarChat} className="flex gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={mensajeChat}
                onChange={(e) => setMensajeChat(e.target.value)}
                placeholder="Escribe tu intervención..."
                className="flex-1 bg-[#07090e] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-cyan-400 outline-none font-mono"
              />
              <button
                type="submit"
                className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 p-2 rounded-xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

        </div>
      )}

      {/* 2. SUBMÓDULO: PROGRAMAR CONVOCATORIA (ÓRGANOS LEY 675) */}
      {submoduloActivo === 'convocatorias' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-6">
              <SubmoduloConvocatoriasLey675
                onShowToast={onShowToast}
                onConvocatoriaCreada={(nueva) => {
                  setConvocatorias((prev: any) => [
                    {
                      id: nueva.id,
                      tipo: nueva.tipo,
                      titulo: nueva.titulo,
                      fecha: nueva.fecha,
                      modalidad: nueva.modalidad,
                      lugarOSala: nueva.lugarOSala,
                      estado: nueva.estado,
                      anticipacion: nueva.anticipacion,
                      quorum: '0%'
                    },
                    ...prev
                  ]);
                }}
              />
            </div>

            <div className="xl:col-span-6 space-y-4">
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> Historial y Convocatorias Vigentes
                </h3>
                <span className="text-xs text-cyan-400 font-mono bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                  {convocatorias.length} registradas
                </span>
              </div>

              <div className="space-y-3">
                {convocatorias.map((conv: any) => (
                  <div key={conv.id} className="p-4 sm:p-5 bg-[#0b0f17] border border-slate-800 rounded-3xl space-y-3 shadow-md hover:border-cyan-500/30 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                            {conv.tipo}
                          </span>
                          {conv.modalidad && (
                            <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              {conv.modalidad === 'virtual' ? '🎥 100% Virtual' : conv.modalidad === 'presencial' ? '📍 Presencial' : '🌐 Mixta'}
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white">{conv.titulo}</h4>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                        conv.estado === 'En Curso'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                          : conv.estado === 'Convocada'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {conv.estado === 'En Curso' ? '🔴 En Curso' : conv.estado}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs bg-[#07090e] p-3 rounded-2xl border border-slate-800/80">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-mono">Fecha &amp; Hora</span>
                        <span className="text-slate-200 font-medium">{conv.fecha}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-mono">Términos Ley 675</span>
                        <span className="text-emerald-400 font-medium">{conv.anticipacion}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase font-mono">Lugar / Conexión</span>
                        <span className="text-cyan-300 font-medium truncate block" title={conv.lugarOSala || 'Sala Virtual Urbix PH'}>
                          {conv.lugarOSala || 'Sala Virtual Urbix PH'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
                      <span className="text-[11px] text-slate-400">
                        Quórum Proyectado: <strong className="text-cyan-400 font-mono">{conv.quorum || '0%'}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSubmoduloActivo('video');
                          onShowToast?.(`Ingresando a la sala de ${conv.titulo}`);
                        }}
                        className="px-3.5 py-1.5 bg-[#07090e] hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-cyan-400" /> Ingresar a Sala Virtual &rarr;
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SUBMÓDULO: QUÓRUM POR COEFICIENTES (LEY 675) */}
      {submoduloActivo === 'quorum' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  Quórum Deliberatorio &amp; Decisorio (Art. 45 Ley 675)
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  Quórum Acreditado en Sala: <span className="text-cyan-400 font-mono">{quorumRegistrado}%</span>
                </h3>
              </div>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0">
                <CheckCircle2 className="w-4 h-4" /> Asamblea Instalada Legalmente
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="w-full bg-[#07090e] h-4 rounded-full overflow-hidden border border-slate-800 p-0.5">
                <div
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${quorumRegistrado}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>0%</span>
                <span className="text-amber-400 font-bold">| Mínimo Deliberatorio: 50.1%</span>
                <span className="text-purple-400 font-bold">| Mayoría Calificada: 70.0%</span>
                <span>100%</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl text-xs">
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Decisiones Ordinarias</span>
                <span className="text-emerald-400 font-bold">Habilitado &checkmark;</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Mitad más uno de votos presentes</p>
              </div>
              <div className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl text-xs">
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Mayoría Calificada (Art. 46)</span>
                <span className="text-cyan-400 font-bold">Habilitado (92.4% &gt; 70%) &checkmark;</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Reformas reglamentos, desafectaciones</p>
              </div>
              <div className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl text-xs">
                <span className="text-slate-400 block text-[10px] font-mono uppercase">Control de Poderes</span>
                <span className="text-purple-400 font-bold">1 Poder validado</span>
                <p className="text-[11px] text-slate-500 mt-0.5">Máximo permitido por reglamento: 2</p>
              </div>
            </div>
          </div>

          <div className="bg-[#0b0f17] border border-slate-800/80 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Registro de Asistencia por Coeficientes
              </h4>
              <button
                type="button"
                onClick={() => onShowToast?.('📥 Descargando planilla oficial de firmas digitales y coeficientes (Ley 675)...')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Exportar Planilla Acreditada
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[10px] uppercase">
                    <th className="py-2.5 px-3">Unidad Privada</th>
                    <th className="py-2.5 px-3">Titular / Representante</th>
                    <th className="py-2.5 px-3">Coeficiente</th>
                    <th className="py-2.5 px-3">Tipo Presencia</th>
                    <th className="py-2.5 px-3">Hora Ingreso</th>
                    <th className="py-2.5 px-3 text-right">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {unidadesPresentes.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3 px-3 font-bold text-white">{u.unidad}</td>
                      <td className="py-3 px-3 text-slate-300">{u.titular}</td>
                      <td className="py-3 px-3 font-mono font-bold text-cyan-400">{u.coeficiente.toFixed(2)}%</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.poder ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {u.poder ? '📜 Con Poder' : '👤 Propietario Directo'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">{u.hora}</td>
                      <td className="py-3 px-3 text-right">
                        <span className="text-emerald-400 font-bold text-[11px] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Acreditado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. SUBMÓDULO: VOTACIÓN DE MOCIONES */}
      {submoduloActivo === 'votaciones' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-amber-500/30 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  MOCIÓN EN CURSO • LEY 675
                </span>
                <h3 className="text-base sm:text-lg font-black text-white mt-1.5">
                  {mociónActual.titulo}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{mociónActual.tipoMayoria}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-mono block">Tu peso de voto:</span>
                <span className="text-sm font-black text-cyan-400 font-mono">1.05% Coeficiente</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                {mociónActual.haVotado ? '✅ Tu voto ya fue computado en el escrutinio oficial:' : 'Emite tu voto vinculante:'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  disabled={mociónActual.haVotado}
                  onClick={() => handleVotar('favor')}
                  className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                    mociónActual.miVoto === 'favor'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'bg-[#07090e] border-slate-800 hover:border-emerald-500/50 text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold text-sm">A Favor</span>
                  <span className="text-[10px] font-mono text-emerald-400">Aprueba la moción</span>
                </button>

                <button
                  type="button"
                  disabled={mociónActual.haVotado}
                  onClick={() => handleVotar('contra')}
                  className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                    mociónActual.miVoto === 'contra'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
                      : 'bg-[#07090e] border-slate-800 hover:border-rose-500/50 text-slate-200'
                  }`}
                >
                  <XCircle className="w-6 h-6 text-rose-400" />
                  <span className="font-bold text-sm">En Contra</span>
                  <span className="text-[10px] font-mono text-rose-400">Rechaza la moción</span>
                </button>

                <button
                  type="button"
                  disabled={mociónActual.haVotado}
                  onClick={() => handleVotar('blanco')}
                  className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-2 cursor-pointer ${
                    mociónActual.miVoto === 'blanco'
                      ? 'bg-slate-700/40 border-slate-400 text-slate-200'
                      : 'bg-[#07090e] border-slate-800 hover:border-slate-600 text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 text-slate-400" />
                  <span className="font-bold text-sm">En Blanco</span>
                  <span className="text-[10px] font-mono text-slate-400">Abstención voluntaria</span>
                </button>
              </div>
            </div>

            <div className="bg-[#07090e] p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white uppercase font-mono tracking-wider">Escrutinio por Coeficientes Ponderados</span>
                <span className="text-emerald-400 font-bold font-mono">Estado: Aprobándose ({(mociónActual.coefFavor / 92.4 * 100).toFixed(1)}% de los presentes)</span>
              </div>

              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-emerald-400 font-bold">A Favor</span>
                    <span className="font-mono text-white font-bold">{mociónActual.coefFavor}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full rounded-full transition-all" style={{ width: `${mociónActual.coefFavor}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-rose-400 font-bold">En Contra</span>
                    <span className="font-mono text-white font-bold">{mociónActual.coefContra}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-rose-400 h-full rounded-full transition-all" style={{ width: `${mociónActual.coefContra}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400 font-bold">En Blanco / Abstención</span>
                    <span className="font-mono text-white font-bold">{mociónActual.coefBlanco}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                    <div className="bg-slate-500 h-full rounded-full transition-all" style={{ width: `${mociónActual.coefBlanco}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUBMÓDULO: ACTA OFICIAL & IA (LEY 675) */}
      {submoduloActivo === 'acta' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-blue-500/30 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Documento Jurídico Vinculante (Art. 47 Ley 675)
                </span>
                <h3 className="text-lg font-black text-white mt-0.5">
                  Acta Oficial de Asamblea &amp; Resumen con IA
                </h3>
              </div>
              <button
                type="button"
                onClick={handleGenerarActaIA}
                disabled={generandoActa}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {generandoActa ? 'Generando Acta con IA...' : 'Redactar Acta con IA Urbix'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07090e] p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Comisión Verificadora del Acta 1</span>
                <input
                  type="text"
                  value={comisionVerificadora.persona1}
                  onChange={(e) => setComisionVerificadora({ ...comisionVerificadora, persona1: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 text-white text-xs p-2 rounded-xl mt-1 focus:border-blue-400 outline-none"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Comisión Verificadora del Acta 2</span>
                <input
                  type="text"
                  value={comisionVerificadora.persona2}
                  onChange={(e) => setComisionVerificadora({ ...comisionVerificadora, persona2: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 text-white text-xs p-2 rounded-xl mt-1 focus:border-blue-400 outline-none"
                />
              </div>
            </div>

            <div className="bg-[#07090e] p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="text-center pb-3 border-b border-slate-800 text-slate-300">
                <p className="font-bold text-white text-sm">ACTA N° 024 - ASAMBLEA GENERAL ORDINARIA</p>
                <p className="text-[11px] text-slate-400">P.H. RESERVA DEL TESORO • NIT 900.412.889-1</p>
                <p className="text-[10px] text-slate-500">Convocatoria: 15 de marzo de 2026 • Modalidad Mixta/Virtual</p>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed text-[11px]">
                <p>
                  <strong className="text-cyan-300">1. VERIFICACIÓN DEL QUÓRUM:</strong> Siendo las 06:00 PM, el Administrador constató la presencia de propietarios y apoderados que representan el <strong className="text-white">92.4%</strong> del coeficiente total de la copropiedad, existiendo quórum deliberatorio y decisorio en los términos del Artículo 45 de la Ley 675 de 2001.
                </p>
                <p>
                  <strong className="text-cyan-300">2. ELECCIÓN DE PRESIDENTE Y SECRETARIO:</strong> Se designó por unanimidad como Presidente de la reunión al Dr. Mauricio Restrepo y como Secretario al Administrador Carlos Mario Pineda.
                </p>
                <p>
                  <strong className="text-cyan-300">3. APROBACIÓN DEL PRESUPUESTO 2026:</strong> Sometida a consideración la moción de aprobación del presupuesto ordinario con incremento del 8.5%, se obtuvo el <strong className="text-emerald-400">{mociónActual.coefFavor}% a favor</strong>, {mociónActual.coefContra}% en contra y {mociónActual.coefBlanco}% en blanco. APROBADO por mayoría estatutaria.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800 text-[11px]">
                <div className="text-slate-400">
                  <span className="block font-bold text-slate-300">Plazo Legal de Publicación:</span>
                  <span>20 días hábiles siguientes a la reunión (Art. 47)</span>
                </div>
                <button
                  type="button"
                  onClick={() => onShowToast?.('📄 Descargando Acta N° 024 foliada y firmada digitalmente en PDF...')}
                  className="px-4 py-2 bg-[#0b0f17] hover:bg-slate-800 border border-blue-500/40 text-blue-300 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Acta Foliada (PDF)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
