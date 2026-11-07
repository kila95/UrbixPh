import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, Mic, MicOff, VideoOff, Disc, Square, Users, 
  Vote, MessageSquare, Hand, ShieldCheck, Percent, 
  Send, AlertCircle, RefreshCw, Download, PhoneOff, Radio,
  PhoneCall, Building2, UserCheck, Shield
} from 'lucide-react';
import { supabase, DEFAULT_TENANT_UUID, normalizeTenantUuid } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { inicializarCanalRealtime, despacharSignal, UserPresenceInfo, SignalingPacket } from '../services/realtimeSignalingService';
import { calcularQuorumAsamblea, ResumenQuorum, emitirVotoPonderado, obtenerEscrutinioVotacion } from '../services/quorumService';
import MultiDayMeetingRecorder from '../MultiDayMeetingRecorder';
import ResilientMeetingRecorder from '../ResilientMeetingRecorder';

interface Props {
  tenantId?: string;
  assemblyId?: string;
  userProfile?: {
    id?: string;
    full_name?: string;
    role?: string;
    tenant_id?: string;
    apartment_id?: string;
    unit_id?: string;
    unit_number?: string;
    coefficient?: number;
    [key: string]: any;
  };
  onShowToast?: (msg: string) => void;
  copropiedadNombre?: string;
}

// Configuración de Servidores ICE con TURN
const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    {
      urls: (import.meta as any).env?.VITE_TURN_URL || 'turn:openrelay.metered.ca:443?transport=tcp',
      username: (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject',
      credential: (import.meta as any).env?.VITE_TURN_CREDENTIAL || 'openrelayproject'
    }
  ]
};

export function SalaAsambleaVirtualReal({
  tenantId: rawTenantId = DEFAULT_TENANT_UUID,
  assemblyId = 'asamblea_ordinaria_actual',
  userProfile = { full_name: 'Administrador PH', role: 'admin', unit_number: 'Administración', coefficient: 0 },
  onShowToast,
  copropiedadNombre = 'Copropiedad PH'
}: Props) {
  // 1. Asegurar que lea el tenant y el apartamento del usuario logueado
  const tenantId = userProfile?.tenant_id || normalizeTenantUuid(rawTenantId);
  const apartmentId = userProfile?.apartment_id || userProfile?.unit_id;
  // Modo de Capacidad según el Tipo de Sesión
  const [modoCapacidad, setModoCapacidad] = useState<'masiva_asamblea' | 'consejo_multipunto' | 'directa_residente'>('masiva_asamblea');

  // Unidad objetivo para llamada directa a residente
  const [unidadDestinoLlamada, setUnidadDestinoLlamada] = useState('Torre 2 - 301');
  const [llamandoResidente, setLlamandoResidente] = useState(false);

  const [panelLateral, setPanelLateral] = useState<'votaciones' | 'chat' | 'cuorum' | 'grabadora'>('votaciones');

  // Identificador único de este participante
  const peerIdRef = useRef<string>(userProfile.id || `peer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`);

  // WebRTC & Streams
  const [micActivo, setMicActivo] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [streamLocal, setStreamLocal] = useState<MediaStream | null>(null);
  const videoLocalRef = useRef<HTMLVideoElement>(null);
  const videoRemotoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

  // Participantes sincronizados por Supabase Realtime Presence
  const [participantes, setParticipantes] = useState<any[]>([]);
  const [cuorumTotal, setCuorumTotal] = useState<number>(0);
  const [resumenQuorum, setResumenQuorum] = useState<ResumenQuorum>({
    quorumActual: 0,
    unidadesPresentes: 0,
    totalUnidades: 0,
    tieneQuorumOrdinario: false,
    tieneQuorumCalificado: false
  });

  // Votaciones y Chat
  const [votaciones, setVotaciones] = useState<any[]>([]);
  const [nuevaPregunta, setNuevaPregunta] = useState('');
  const [opcionesInput, setOpcionesInput] = useState('A favor, En contra, En blanco');
  const [mensajesChat, setMensajesChat] = useState<any[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [manoLevantada, setManoLevantada] = useState(false);

  const userPresence: UserPresenceInfo = {
    id: peerIdRef.current,
    name: userProfile.full_name || 'Participante',
    role: userProfile.role || 'residente',
    unit: userProfile.unit_number || userProfile.unit || 'Apto',
    micActivo,
    camActiva: camaraActiva
  };

  const handleRecibirOferta = async (payload: any) => {
    if (!payload.targetPeerId || payload.targetPeerId === peerIdRef.current) {
      await manejarOfertaEntrante(payload);
    }
  };

  const handleRecibirRespuesta = async (payload: any) => {
    if ((!payload.targetPeerId || payload.targetPeerId === peerIdRef.current) && peerConnectionRef.current && payload.answer) {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
    }
  };

  const handleRecibirCandidato = async (payload: any) => {
    if ((!payload.targetPeerId || payload.targetPeerId === peerIdRef.current) && peerConnectionRef.current && payload.candidate) {
      await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  const setParticipantesConectados = (conectados: UserPresenceInfo[]) => {
    const peerId = peerIdRef.current;
    setParticipantes((prev) => {
      const mapa = new Map<string, any>();
      prev.forEach(p => mapa.set(p.peerId, p));
      conectados.forEach(u => {
        const existente = mapa.get(u.id);
        mapa.set(u.id, {
          peerId: u.id,
          nombre: u.name,
          unidad: u.unit || 'Apto',
          role: u.role,
          coefficient: existente?.coefficient ?? (u.id === peerId ? (userProfile.coefficient || 0) : 0),
          micActivo: u.micActivo ?? false,
          camActiva: u.camActiva ?? false
        });
      });
      return Array.from(mapa.values());
    });
  };

  // Conexión distribuida Supabase Realtime (Broadcast + Presence)
  useEffect(() => {
    const usuarioInfo: UserPresenceInfo = {
      id: userProfile.id || peerIdRef.current,
      name: userProfile.full_name || 'Participante',
      role: userProfile.role || 'residente',
      unit: userProfile.unit_number || userProfile.unit || 'Apto',
      micActivo,
      camActiva: camaraActiva
    };

    const canal = inicializarCanalRealtime(
      `asamblea_sala_${tenantId}`,
      usuarioInfo,
      (signal) => {
        // Manejador de eventos WebRTC y mociones
        if (signal.event === 'webrtc_offer') handleRecibirOferta(signal.payload);
        if (signal.event === 'webrtc_answer') handleRecibirRespuesta(signal.payload);
        if (signal.event === 'ice_candidate') handleRecibirCandidato(signal.payload);
        if (signal.event === 'asamblea_estado_media' && signal.payload?.peerId) {
          setParticipantes((prev) => {
            const index = prev.findIndex(p => p.peerId === signal.payload.peerId);
            if (index >= 0) {
              const copia = [...prev];
              copia[index] = signal.payload;
              return copia;
            }
            return [...prev, signal.payload];
          });
        }
      },
      (conectados) => {
        // Lista de asistentes actualizada en vivo por Presence
        setParticipantesConectados(conectados);
      }
    );
    realtimeChannelRef.current = canal;

    cargarCuorumBase();

    return () => {
      canal.unsubscribe();
      realtimeChannelRef.current = null;
      streamLocal?.getTracks().forEach(t => t.stop());
      peerConnectionRef.current?.close();
    };
  }, [tenantId]);

  // Calcular cuórum real ponderado
  useEffect(() => {
    const suma = participantes.reduce((acc, p) => acc + Number(p.coefficient || 0), 0);
    const redondeado = Number(suma.toFixed(3));
    if (redondeado > 0 || resumenQuorum.quorumActual === 0) {
      setCuorumTotal(redondeado || resumenQuorum.quorumActual);
    }
  }, [participantes, resumenQuorum.quorumActual]);

  const cargarCuorumBase = async () => {
    try {
      const { data: units } = await supabase.from('units').select('id, coefficient').eq('tenant_id', tenantId);
      if (units && units.length > 0 && (!userProfile.coefficient || userProfile.coefficient === 0)) {
        const myUnit = units.find(u => u.id === apartmentId);
        if (myUnit) {
          userProfile.coefficient = Number(myUnit.coefficient);
        }
      }

      try {
        const resumen = await calcularQuorumAsamblea(assemblyId, tenantId);
        setResumenQuorum({
          ...resumen,
          totalUnidades: resumen.totalUnidades || units?.length || 0
        });
        if (resumen.quorumActual > 0) {
          setCuorumTotal(resumen.quorumActual);
        }
      } catch {
        setResumenQuorum((prev) => ({
          ...prev,
          totalUnidades: units?.length || prev.totalUnidades
        }));
      }
    } catch (e) {
      console.warn('Error cargando quórum base:', e);
    }
  };

  const calcularQuorumReal = async () => {
    await cargarCuorumBase();
  };

  const calcularEscrutinioReal = async () => {
    try {
      const actualizadas = await Promise.all(
        votaciones.map(async (v) => {
          try {
            const escrutinio = await obtenerEscrutinioVotacion(v.id);
            if (escrutinio.votosContabilizados > 0) {
              return { ...v, escrutinio };
            }
          } catch {
            // Conservar estado previo si aún no hay registros en Supabase
          }
          return v;
        })
      );
      if (actualizadas.length > 0) {
        setVotaciones(actualizadas);
      }
    } catch (e) {
      console.warn('Error actualizando escrutinio en pantalla:', e);
    }
  };

  // 2. El listener de Realtime que actualiza la presencia y los votos:
  useEffect(() => {
    if (!tenantId) return;

    const canalAsamblea = supabase
      .channel('canal_asamblea_vivo')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assembly_attendance' },
        () => {
          // Ejecuta tu función de quórum que ya calcula los coeficientes
          calcularQuorumReal();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assembly_votes' },
        () => {
          // Ejecuta tu función de escrutinio que ya suma los pesos
          calcularEscrutinioReal();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalAsamblea);
    };
  }, [tenantId]);

  const enviarSenal = async (event: string, payload: any, targetId?: string, targetUnit?: string) => {
    try {
      if (realtimeChannelRef.current) {
        await despacharSignal(
          realtimeChannelRef.current,
          event as SignalingPacket['event'],
          userPresence,
          payload,
          targetId,
          targetUnit
        );
      }
    } catch (e) {
      console.error('Error enviando señal WebRTC:', e);
    }
  };

  const obtenerOIniciarPeerConnection = () => {
    if (peerConnectionRef.current) return peerConnectionRef.current;

    const pc = new RTCPeerConnection(ICE_CONFIG);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        enviarSenal('ice_candidate', {
          candidate: event.candidate,
          senderPeerId: peerIdRef.current,
          targetPeerId: participantes.find(p => p.peerId !== peerIdRef.current)?.peerId
        });
      }
    };

    pc.ontrack = (event) => {
      if (videoRemotoRef.current && event.streams[0]) {
        videoRemotoRef.current.srcObject = event.streams[0];
      }
    };

    if (streamLocal) {
      streamLocal.getTracks().forEach(t => pc.addTrack(t, streamLocal));
    }

    peerConnectionRef.current = pc;
    return pc;
  };

  const emitirOfertaWebRTC = async () => {
    const pc = obtenerOIniciarPeerConnection();
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    enviarSenal('webrtc_offer', {
      offer,
      senderPeerId: peerIdRef.current,
      targetPeerId: participantes.find(p => p.peerId !== peerIdRef.current)?.peerId
    });
  };

  const manejarOfertaEntrante = async (payload: any) => {
    const pc = obtenerOIniciarPeerConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    enviarSenal('webrtc_answer', {
      answer,
      senderPeerId: peerIdRef.current,
      targetPeerId: payload.senderPeerId
    });
  };

  useEffect(() => {
    if (videoLocalRef.current) {
      if (streamLocal) {
        videoLocalRef.current.srcObject = streamLocal;
        videoLocalRef.current.play().catch(err => {
          console.warn('Auto-play local video:', err);
        });
      } else {
        videoLocalRef.current.srcObject = null;
      }
    }
  }, [streamLocal, camaraActiva]);

  // Generador de Stream de Video Simulado HD
  const crearStreamSimulado = (): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    const intervalId = setInterval(() => {
      if (!ctx) return;
      const gradient = ctx.createLinearGradient(0, 0, 1280, 720);
      gradient.addColorStop(0, '#0F172A');
      gradient.addColorStop(0.5, '#1E293B');
      gradient.addColorStop(1, '#090D16');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1280, 720);

      ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 1280; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 720);
        ctx.stroke();
      }
      for (let y = 0; y < 720; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(1280, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(640, 320, 70, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#090D16';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const initials = (userProfile.full_name || 'Participante')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      ctx.fillText(initials, 640, 320);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(userProfile.full_name || 'Orador Principal', 640, 430);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '16px monospace';
      ctx.fillText(`${copropiedadNombre} • TRANSMISIÓN OFICIAL LEY 675`, 640, 465);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(60, 50, 10, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`TRANSMISIÓN EN VIVO • ${new Date().toLocaleTimeString()}`, 80, 54);
    }, 100);

    const stream = canvas.captureStream(30);
    (stream as any)._cleanupInterval = intervalId;
    return stream;
  };

  const toggleCamara = async () => {
    if (camaraActiva) {
      if (streamLocal) {
        if ((streamLocal as any)._cleanupInterval) {
          clearInterval((streamLocal as any)._cleanupInterval);
        }
        streamLocal.getVideoTracks().forEach(t => t.stop());
      }
      setCamaraActiva(false);
      enviarSenal('asamblea_estado_media', { peerId: peerIdRef.current, camActiva: false });
    } else {
      try {
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: micActivo
          });
        } catch (mediaErr) {
          stream = crearStreamSimulado();
          onShowToast?.('🎥 Cámara simulada HD activada para la asamblea.');
        }

        setStreamLocal(stream);
        setCamaraActiva(true);

        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = stream;
          videoLocalRef.current.play().catch(() => {});
        }

        const pc = obtenerOIniciarPeerConnection();
        const vTrack = stream.getVideoTracks()[0];
        if (vTrack) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(vTrack);
          } else {
            pc.addTrack(vTrack, stream);
          }
          await emitirOfertaWebRTC();
        }

        enviarSenal('asamblea_estado_media', { peerId: peerIdRef.current, camActiva: true });
      } catch (err) {
        console.error('Error al iniciar transmisión de cámara:', err);
      }
    }
  };

  const toggleMic = async () => {
    if (micActivo) {
      streamLocal?.getAudioTracks().forEach(t => t.stop());
      setMicActivo(false);
      enviarSenal('asamblea_estado_media', { peerId: peerIdRef.current, micActivo: false });
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: camaraActiva
        });
        setStreamLocal(stream);
        setMicActivo(true);

        const pc = obtenerOIniciarPeerConnection();
        const aTrack = stream.getAudioTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === 'audio');
        if (sender) {
          sender.replaceTrack(aTrack);
        } else {
          pc.addTrack(aTrack, stream);
        }
        await emitirOfertaWebRTC();
        enviarSenal('asamblea_estado_media', { peerId: peerIdRef.current, micActivo: true });
      } catch (err) {
        alert('No se pudo acceder al micrófono. Verifica los permisos.');
      }
    }
  };

  // Función para realizar llamada directa a un residente específico
  const handleLlamarResidenteDirecto = async (unidad: string) => {
    try {
      setLlamandoResidente(true);
      enviarSenal('asamblea_convocatoria_abierta', {
        tipo: 'Videollamada Directa de Administración',
        titulo: `Llamada Virtual de Administración para ${unidad}`,
        apartamentosConvocados: [unidad],
        organizador: userProfile.full_name || 'Administración Central'
      });
      onShowToast?.(`📞 Timbrando videollamada a residente de ${unidad}...`);
      setTimeout(() => setLlamandoResidente(false), 5000);
    } catch (err) {
      setLlamandoResidente(false);
    }
  };

  const handleEnviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    const msj = {
      id: Date.now().toString(),
      autor: userProfile.full_name,
      unidad: userProfile.unit_number || userProfile.unit || 'Apto',
      texto: nuevoMensaje.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    enviarSenal('asamblea_chat_mensaje', msj);
    setMensajesChat(prev => [...prev, msj]);
    setNuevoMensaje('');
  };

  const handleCrearVotacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaPregunta.trim()) return;

    const opciones = opcionesInput.split(',').map(o => o.trim()).filter(Boolean);
    const nueva = {
      id: Date.now().toString(),
      titulo: nuevaPregunta.trim(),
      opciones: opciones.map(opt => ({ texto: opt, votosCoeficiente: 0, conteo: 0 })),
      activa: true
    };

    setVotaciones(prev => [nueva, ...prev]);
    setNuevaPregunta('');
    onShowToast?.('Moción de votación sometida al plenario');
  };

  const handleVotar = async (votacionId: string, opcionIdx: number, codigoOpcion?: 'SI' | 'NO' | 'BLANCO') => {
    const opcionCode = codigoOpcion || (opcionIdx === 0 ? 'SI' : opcionIdx === 1 ? 'NO' : 'BLANCO');
    let peso = userProfile.coefficient || 1.0;

    if (apartmentId) {
      try {
        const res = await emitirVotoPonderado({
          votingId: votacionId,
          apartmentId,
          tenantId,
          opcion: opcionCode
        });
        if (res?.vote_weight) {
          peso = Number(res.vote_weight);
        }
      } catch (err: any) {
        onShowToast?.(err?.message || 'Error al registrar voto ponderado');
      }
    }

    try {
      const escrutinio = await obtenerEscrutinioVotacion(votacionId);
      if (escrutinio.votosContabilizados > 0) {
        setVotaciones(prev => prev.map(v => {
          if (v.id !== votacionId) return v;
          return { ...v, escrutinio };
        }));
      }
    } catch {
      // Fallback local
    }

    setVotaciones(prev => prev.map(v => {
      if (v.id !== votacionId || !v.activa) return v;
      const opts = v.opciones.map((o: any, idx: number) => {
        if (idx === opcionIdx) {
          return { ...o, votosCoeficiente: Number((o.votosCoeficiente + peso).toFixed(3)), conteo: o.conteo + 1 };
        }
        return o;
      });
      return { ...v, opciones: opts };
    }));
    onShowToast?.('Tu voto por coeficiente ha sido asentado');
  };

  const hayQuorumLegal = cuorumTotal >= 51.0;

  // Integrantes del Consejo (8 a 10 personas)
  const miembrosConsejoDemo = [
    { id: 'cons_1', nombre: 'Carlos Mario Pineda', rol: 'Administrador P.H.', unidad: 'Administración', cam: true, mic: true },
    { id: 'cons_2', nombre: 'Dr. Mauricio Restrepo', rol: 'Presidente Consejo', unidad: 'Torre 1 - 302', cam: true, mic: true },
    { id: 'cons_3', nombre: 'Martha Lucía Gómez', rol: 'Secretaria Consejo', unidad: 'Torre 2 - 301', cam: true, mic: false },
    { id: 'cons_4', nombre: 'Andrés Gómez', rol: 'Vocal Principal', unidad: 'Torre 1 - 201', cam: false, mic: true },
    { id: 'cons_5', nombre: 'Laura Henao', rol: 'Tesorera Consejo', unidad: 'Torre 2 - 402', cam: true, mic: true },
    { id: 'cons_6', nombre: 'Ing. Fernando Pérez', rol: 'Comité de Obras', unidad: 'Torre 1 - 501', cam: false, mic: false },
    { id: 'cons_7', nombre: 'Dra. Claudia Ortiz', rol: 'Vocal 2', unidad: 'Torre 2 - 102', cam: true, mic: true },
    { id: 'cons_8', nombre: 'Santiago Henao', rol: 'Revisor Fiscal', unidad: 'Auditoría Ext.', cam: false, mic: true }
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. BARRA SUPERIOR DE SELECTOR DE MODO DE LLAMADA POR CAPACIDAD */}
      <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div>
          <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
            MODO DE CAPACIDAD DE TRANSMISIÓN SELECCIONABLE
          </span>
          <h2 className="text-base sm:text-lg font-black text-white mt-1 flex items-center gap-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            Configuración de Videoconferencia Según Capacidad de Aforo
          </h2>
        </div>

        {/* Botones Selector de Modo de Capacidad */}
        <div className="flex flex-wrap items-center gap-2 bg-[#07090e] p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setModoCapacidad('masiva_asamblea')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              modoCapacidad === 'masiva_asamblea'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Asamblea General (100-200+ Audio Masivo)</span>
          </button>

          <button
            onClick={() => setModoCapacidad('consejo_multipunto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              modoCapacidad === 'consejo_multipunto'
                ? 'bg-purple-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Consejo (8-10 Videos Multipunto)</span>
          </button>

          <button
            onClick={() => setModoCapacidad('directa_residente')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
              modoCapacidad === 'directa_residente'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Llamar a Residente</span>
          </button>
        </div>
      </div>

      {/* 2. MODO 1: ASAMBLEA GENERAL MASIVA (100 - 200+ PERSONAS EN AUDIO + VIDEO UNIFICADO DEL ADMINISTRADOR) */}
      {modoCapacidad === 'masiva_asamblea' && (
        <div className="space-y-6">
          <div className="bg-[#0F172A] border border-slate-800 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30 font-bold font-mono text-xs">
                📡 Modo 100-200+ Personas
              </span>
              <div>
                <p className="text-xs font-bold text-white">Transmisión de Video del Orador Principal + Audio Colectivo</p>
                <p className="text-[11px] text-slate-400 font-mono">
                  Optimizado para no saturar ancho de banda: Transmite el video del Administrador o Presidente, mientras los 100-200+ asistentes participan por audio y votaciones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#1E293B] border border-slate-700/80 px-3.5 py-2 rounded-xl text-xs font-mono">
              <Percent className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-slate-400">Cuórum Asistente:</span>
                <span className={`font-bold ml-1.5 ${hayQuorumLegal ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {cuorumTotal}% (Ley 675)
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between h-[480px] relative overflow-hidden">
                <div className="flex-1 rounded-xl bg-[#090D16] border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
                  <video 
                    ref={videoLocalRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className={`w-full h-full object-cover rounded-xl ${camaraActiva ? 'block' : 'hidden'}`}
                  />

                  <video 
                    ref={videoRemotoRef} 
                    autoPlay 
                    playsInline 
                    className="absolute bottom-3 right-3 w-44 h-32 object-cover rounded-xl border border-slate-700 shadow-2xl bg-slate-900"
                  />

                  {!camaraActiva && (
                    <div className="text-center space-y-2">
                      <div className="w-16 h-16 rounded-full bg-[#1E293B] border border-slate-700 flex items-center justify-center text-slate-400 mx-auto">
                        <Video className="w-7 h-7" />
                      </div>
                      <h4 className="text-xs font-semibold text-slate-300">Cámara del Administrador / Orador inactiva</h4>
                      <p className="text-[11px] font-mono text-slate-500">Activa la cámara para emitir el video principal a las 100-200+ personas conectadas</p>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 bg-[#0F172A]/90 backdrop-blur-sm border border-slate-700 px-3 py-1 rounded-lg text-xs font-mono text-slate-200 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Orador Principal: {userProfile.full_name}</span>
                    <span className="text-[10px] text-cyan-400 font-bold">(Administración)</span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-center gap-3">
                  <button
                    onClick={toggleMic}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      micActivo ? 'bg-slate-800 text-white border-slate-700' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {micActivo ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                  </button>

                  <button
                    onClick={toggleCamara}
                    className={`p-3 rounded-xl border transition cursor-pointer ${
                      camaraActiva ? 'bg-slate-800 text-white border-slate-700' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {camaraActiva ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>

                  <div className="h-6 w-px bg-slate-800 mx-2" />

                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    {resumenQuorum.unidadesPresentes || participantes.length} Residentes Conectados por Audio &amp; Votación Nominal
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-4">
              <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[480px]">
                <div className="flex items-center gap-1 bg-[#1E293B] p-1 rounded-xl mb-4 border border-slate-700/80">
                  <button onClick={() => setPanelLateral('votaciones')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${panelLateral === 'votaciones' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
                    Votación
                  </button>
                  <button onClick={() => setPanelLateral('chat')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${panelLateral === 'chat' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
                    Chat
                  </button>
                  <button onClick={() => setPanelLateral('cuorum')} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold ${panelLateral === 'cuorum' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'}`}>
                    Padrón
                  </button>
                </div>

                {panelLateral === 'votaciones' && (
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                    {userProfile.role === 'admin' && (
                      <form onSubmit={handleCrearVotacion} className="p-3 bg-[#1E293B] border border-slate-700 rounded-xl space-y-2">
                        <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase block">Abrir Votación Nominal</span>
                        <input type="text" required placeholder="Pregunta..." value={nuevaPregunta} onChange={(e) => setNuevaPregunta(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-xs" />
                        <button type="submit" className="w-full py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-lg cursor-pointer">Lanzar Votación</button>
                      </form>
                    )}

                    {votaciones.map((v) => (
                      <div key={v.id} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <p className="font-bold text-white">{v.titulo}</p>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleVotar(v.id, 0, 'SI')}
                            className="py-1.5 px-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono font-bold cursor-pointer"
                          >
                            SÍ ({v.escrutinio?.porcentajes?.SI ?? 0}%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVotar(v.id, 1, 'NO')}
                            className="py-1.5 px-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 font-mono font-bold cursor-pointer"
                          >
                            NO ({v.escrutinio?.porcentajes?.NO ?? 0}%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVotar(v.id, 2, 'BLANCO')}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold cursor-pointer"
                          >
                            BLANCO ({v.escrutinio?.porcentajes?.BLANCO ?? 0}%)
                          </button>
                        </div>
                        {v.escrutinio && (
                          <div className="text-[10px] font-mono text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                            <span>Peso emitido: {v.escrutinio.pesoTotalEmitido}%</span>
                            <span>Votos: {v.escrutinio.votosContabilizados}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {panelLateral === 'chat' && (
                  <div className="flex-1 flex flex-col justify-between overflow-hidden">
                    <div className="flex-1 overflow-y-auto space-y-2 text-xs">
                      {mensajesChat.map((m, idx) => (
                        <div key={idx} className="p-2 bg-slate-900 rounded-lg">
                          <span className="text-cyan-400 font-bold text-[10px]">{m.autor} ({m.unidad})</span>
                          <p className="text-slate-200">{m.texto}</p>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={handleEnviarMensaje} className="pt-2 flex gap-1">
                      <input type="text" placeholder="Escribir..." value={nuevoMensaje} onChange={(e) => setNuevoMensaje(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" />
                      <button type="submit" className="p-2 bg-cyan-500 text-slate-950 rounded-lg"><Send className="w-3.5 h-3.5" /></button>
                    </form>
                  </div>
                )}

                {panelLateral === 'cuorum' && (
                  <div className="flex-1 overflow-y-auto space-y-2 text-xs font-mono">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                      <p>
                        Unidades Presentes:{' '}
                        <strong className="text-white">
                          {resumenQuorum.unidadesPresentes || participantes.length} / {resumenQuorum.totalUnidades || 100} Unidades
                        </strong>
                      </p>
                      <p>
                        Cuórum Representado:{' '}
                        <strong className="text-emerald-400">{cuorumTotal.toFixed(3)}%</strong>
                      </p>
                      <div className="pt-1 flex flex-wrap gap-1.5 text-[10px]">
                        <span className={`px-2 py-0.5 rounded border ${cuorumTotal > 50 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/15 text-amber-300 border-amber-500/30'}`}>
                          Art. 45 Ordinario (&gt;50%): {cuorumTotal > 50 ? 'CUMPLE' : 'PENDIENTE'}
                        </span>
                        <span className={`px-2 py-0.5 rounded border ${cuorumTotal >= 70 ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                          Art. 46 Calificado (≥70%): {cuorumTotal >= 70 ? 'CUMPLE' : 'NO ALCANZADO'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. MODO 2: CONSEJO DE ADMINISTRACIÓN (CUADRÍCULA MULTIPUNTO 8 A 10 CONSEJEROS EN VIDEO CONEXIÓN COMPLETA) */}
      {modoCapacidad === 'consejo_multipunto' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-purple-500/30 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-[10px] font-mono uppercase bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-0.5 rounded-full font-bold">
                👥 Modo Consejo de Administración (Máximo 8 a 10 Consejeros)
              </span>
              <h3 className="text-base font-bold text-white mt-1">Videollamada Multipunto en Cuadrícula Interactiva</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Todos los 8 a 10 miembros principales del Consejo tienen transmisión de video y micrófono simultáneos habilitados.
              </p>
            </div>

            <button
              onClick={toggleCamara}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 ${
                camaraActiva ? 'bg-purple-600 text-white' : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{camaraActiva ? 'Transmitiendo Mi Cámara' : 'Encender Mi Video'}</span>
            </button>
          </div>

          {/* Cuadrícula de 8 a 10 Consejeros estilo Teams */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {miembrosConsejoDemo.map((miembro) => (
              <div
                key={miembro.id}
                className="bg-[#0F172A] border border-slate-800 hover:border-purple-500/50 rounded-2xl p-4 flex flex-col justify-between aspect-video relative overflow-hidden shadow-lg transition-all"
              >
                {/* Cabecera del Cuadro de Video */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold bg-slate-900/80 text-purple-300 px-2 py-0.5 rounded border border-slate-700">
                    {miembro.unidad}
                  </span>
                  <div className="flex items-center gap-1">
                    {miembro.mic ? (
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-400"><Mic className="w-3 h-3" /></span>
                    ) : (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-400"><MicOff className="w-3 h-3" /></span>
                    )}
                  </div>
                </div>

                {/* Avatar / Feed de Video */}
                <div className="flex flex-col items-center justify-center my-2">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md border-2 border-purple-400/40">
                    {miembro.nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                </div>

                {/* Pie del Cuadro */}
                <div className="z-10 bg-slate-900/90 backdrop-blur-sm p-1.5 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs font-bold text-white truncate">{miembro.nombre}</p>
                  <p className="text-[10px] text-purple-400 font-mono truncate">{miembro.rol}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. MODO 3: VIDEOLLAMADA DIRECTA A RESIDENTE DESDE LA CONSOLA */}
      {modoCapacidad === 'directa_residente' && (
        <div className="bg-[#0b0f17] border border-emerald-500/30 p-6 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                📞 MODO VIDEOLLAMADA DIRECTA 1 A 1 A RESIDENTE
              </span>
              <h3 className="text-base font-bold text-white mt-1">Conexión Inmediata con Inmueble y Notificación Sonora</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Haz timbrar el dispositivo del residente con notificación emergente de citófono/asamblea.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-mono text-emerald-300">
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Conexión Instantánea SSE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-400" /> Seleccionar Inmueble para Videollamada Directa
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { unidad: 'Torre 2 - 301', residente: 'Martha Lucía Gómez', estado: 'En línea' },
                  { unidad: 'Torre 1 - 302', residente: 'Dr. Mauricio Restrepo', estado: 'En línea' },
                  { unidad: 'Torre 1 - 201', residente: 'Andrés Gómez', estado: 'En línea' },
                  { unidad: 'Torre 2 - 102', residente: 'Dra. Claudia Ortiz', estado: 'En línea' }
                ].map((item) => (
                  <div
                    key={item.unidad}
                    onClick={() => setUnidadDestinoLlamada(item.unidad)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      unidadDestinoLlamada === item.unidad
                        ? 'bg-emerald-950/40 border-emerald-400 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <strong className="block text-xs font-bold">{item.unidad}</strong>
                      <span className="text-[11px] text-slate-400">{item.residente}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {item.estado}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-xs font-mono text-slate-300">
                  Unidad Seleccionada: <strong className="text-emerald-400 font-bold">{unidadDestinoLlamada}</strong>
                </span>

                <button
                  type="button"
                  disabled={llamandoResidente}
                  onClick={() => handleLlamarResidenteDirecto(unidadDestinoLlamada)}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:opacity-90 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{llamandoResidente ? 'Timbrando...' : `Hacer Videollamada a ${unidadDestinoLlamada}`}</span>
                </button>
              </div>
            </div>

            <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase font-mono tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Estado en Dispositivo del Residente
                </h4>
                <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800 text-center space-y-2 mt-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                    <Radio className="w-6 h-6 animate-pulse" />
                  </div>
                  <h5 className="text-xs font-bold text-white">Canal de Recepción Listo</h5>
                  <p className="text-[11px] font-mono text-slate-400">
                    Al presionar el botón de llamada, la pantalla del residente desplegará la notificación con timbre de llamada entrante.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default SalaAsambleaVirtualReal;
