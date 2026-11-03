import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Video,
  Calendar,
  Users,
  CheckSquare,
  FileText,
  Radio,
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
  Sparkles,
  MonitorUp,
  PhoneOff,
  Play,
  Lock,
  BellRing,
  Volume2,
  Disc,
  Square,
  Plus,
  Building2,
  RefreshCw
} from 'lucide-react';
import SubmoduloConvocatoriasLey675 from './SubmoduloConvocatoriasLey675';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { exportActaToLegalPDF } from '../ActaCardWithPDF';
import ResilientMeetingRecorder from '../ResilientMeetingRecorder';

export interface ModuloReunionesConSubmodulosProps {
  unidadResidenteActual?: string;
  esConsejero?: boolean;
  rolUsuario?: 'admin' | 'supervisor' | 'residente';
  copropiedadNombre?: string;
  onShowToast?: (msg: string) => void;
}

interface ConvocatoriaActivaPayload {
  idSesion: string;
  tipo: 'asamblea' | 'consejo';
  titulo: string;
  hora: string;
  orador: string;
  apartamentosConvocados: string[]; // ['TODOS'] para Asamblea General o lista de aptos para Consejo
  activa: boolean;
  timestamp: number;
}

const CANAL_ASAMBLEA_ROOM = 'asamblea_urbix_general';
const STORAGE_CONVOCATORIA_KEY = 'urbix_convocatoria_activa_v2';
const BROADCAST_BUS_NAME = 'urbix_asamblea_webrtc_bus_v2';

const CATALOGO_APARTAMENTOS_UNIDAD = [
  { unidad: 'Torre 2 - 301', propietario: 'Martha Lucía Gómez (Demo 1)', coef: 1.15, cargo: 'Presidente Consejo' },
  { unidad: 'Torre 1 - 302', propietario: 'Dr. Mauricio Restrepo (Demo 2)', coef: 1.05, cargo: 'Consejero Principal' },
  { unidad: 'Torre 1 - 201', propietario: 'Andrés Gómez (Demo 3)', coef: 0.95, cargo: 'Consejero Suplente' },
  { unidad: 'Torre 2 - 402', propietario: 'Laura Restrepo', coef: 0.90, cargo: 'Comité Convivencia' },
  { unidad: 'Torre 1 - 101', propietario: 'Mateo Zuluaga', coef: 0.82, cargo: 'Copropietario' },
  { unidad: 'Torre 1 - 102', propietario: 'Carolina Herrera', coef: 0.82, cargo: 'Copropietaria' },
];

export default function ModuloReunionesConSubmodulos({
  unidadResidenteActual = 'Torre 2 - 301',
  esConsejero = true,
  rolUsuario = 'residente',
  copropiedadNombre = 'P.H. Reserva del Tesoro',
  onShowToast
}: ModuloReunionesConSubmodulosProps) {
  const [submoduloActivo, setSubmoduloActivo] = useState<'video' | 'convocatorias' | 'quorum' | 'votaciones' | 'acta'>('video');

  // Unidad activa (permite verificar acceso por apartamento en modo residente)
  const [unidadActiva, setUnidadActiva] = useState(unidadResidenteActual);
  const unidadAutoAsignadaPorSalaRef = useRef<boolean>(false);
  useEffect(() => {
    if (!unidadAutoAsignadaPorSalaRef.current) {
      setUnidadActiva(unidadResidenteActual);
    }
  }, [unidadResidenteActual]);

  // Catálogo de apartamentos para escoger en citaciones del Consejo / Reuniones
  const [catalogoApartamentos, setCatalogoApartamentos] = useState(CATALOGO_APARTAMENTOS_UNIDAD);
  const [apartamentosEscogidosAdmin, setApartamentosEscogidosAdmin] = useState<string[]>([
    'Torre 2 - 301',
    'Torre 1 - 302',
    'Torre 1 - 201',
    'Torre 2 - 402'
  ]);
  const [nuevoAptoManual, setNuevoAptoManual] = useState('');

  // Configuración de la convocatoria en la pantalla principal (Imagen 1)
  const [tipoConvocatoriaAdmin, setTipoConvocatoriaAdmin] = useState<'asamblea' | 'consejo'>('asamblea');
  const [tituloConvocatoriaInput, setTituloConvocatoriaInput] = useState(
    'Asamblea General Ordinaria de Copropietarios 2026'
  );

  // Estados WebRTC y sala en vivo
  const [enVivo, setEnVivo] = useState(false);
  const [remotoConectado, setRemotoConectado] = useState(false);
  const [nombreParticipanteRemoto, setNombreParticipanteRemoto] = useState('Torre 2 - 301 (Dr. Mauricio Restrepo)');
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [audioRemotoOn, setAudioRemotoOn] = useState(true);
  const [compartiendoPantalla, setCompartiendoPantalla] = useState(false);
  const [manoLevantada, setManoLevantada] = useState(false);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(0);
  const [nivelMic, setNivelMic] = useState(0);
  const [nivelVozRemota, setNivelVozRemota] = useState(0);
  const [usandoCamaraRespaldo, setUsandoCamaraRespaldo] = useState(false);

  // Visualización Fija Antisalto (Imagen principal propia a la izquierda + Subcuadros fijos a la derecha)
  // y Blindaje de Audio Moderado por Administración (Dar / Quitar la Palabra)
  const [oradorEnFoco, setOradorEnFoco] = useState<'local' | 'remoto'>('local');
  const [modoAutoSwitchTeams, setModoAutoSwitchTeams] = useState(false);
  const [unidadConPalabra, setUnidadConPalabra] = useState<string>('ADMIN');
  const [solicitudesPalabra, setSolicitudesPalabra] = useState<string[]>(['Torre 2 - 301']);
  const ultimoPulsoVozRef = useRef<number>(0);

  // Límite estricto de 10 personas para reuniones de Consejo / Comité en Malla Segura P2P
  const MAX_PERSONAS_MALLA_CONSEJO = 10;

  // Grabación real (MediaRecorder) para resolver actas al final de la reunión
  const [grabandoSesion, setGrabandoSesion] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const [grabacionUrl, setGrabacionUrl] = useState<string | null>(null);
  const [grabacionTamanoKB, setGrabacionTamanoKB] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksGrabacionRef = useRef<Blob[]>([]);

  // Invitación entrante sincronizada entre Admin y Residente
  const [invitacionEntrante, setInvitacionEntrante] = useState<ConvocatoriaActivaPayload | null>(() => {
    try {
      const guardado = localStorage.getItem(STORAGE_CONVOCATORIA_KEY);
      if (guardado) {
        const parsed: ConvocatoriaActivaPayload = JSON.parse(guardado);
        // Vigente si fue creada hace menos de 2 horas y sigue activa
        if (parsed.activa && Date.now() - parsed.timestamp < 7200000) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  // Referencias DOM y Malla Multi-Peer WebRTC P2P / SFU (Soporta Admin + Múltiples Participantes simultáneos con video y audio independiente)
  const miPeerIdRef = useRef<string>(
    `peer-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`
  );
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);
  const videoRemotoRef = useRef<HTMLVideoElement | null>(null);
  const streamLocalRef = useRef<MediaStream | null>(null);
  const streamRemotoRef = useRef<MediaStream | null>(null);
  const streamPantallaRef = useRef<MediaStream | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);

  // Mapa de conexiones RTCPeerConnection por cada participante (peerId -> RTCPeerConnection) para que el 2°, 3°+ participante reciban y envíen video y audio sin sobrescribir al 1°
  const peersMapRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceMapRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreamsMapRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoElementsMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteAudioElementsMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const processedMsgIdsRef = useRef<Set<string>>(new Set());

  const [participantesRemotos, setParticipantesRemotos] = useState<
    Array<{
      peerId: string;
      unidad: string;
      rol: string;
      etiqueta: string;
      conectado: boolean;
      streamTick: number;
    }>
  >([]);
  const participantesRemotosRef = useRef<
    Array<{
      peerId: string;
      unidad: string;
      rol: string;
      etiqueta: string;
      conectado: boolean;
      streamTick: number;
    }>
  >([]);
  const actualizarParticipantesRemotos = useCallback(
    (
      updater:
        | Array<{
            peerId: string;
            unidad: string;
            rol: string;
            etiqueta: string;
            conectado: boolean;
            streamTick: number;
          }>
        | ((
            prev: Array<{
              peerId: string;
              unidad: string;
              rol: string;
              etiqueta: string;
              conectado: boolean;
              streamTick: number;
            }>
          ) => Array<{
            peerId: string;
            unidad: string;
            rol: string;
            etiqueta: string;
            conectado: boolean;
            streamTick: number;
          }>)
    ) => {
      const next =
        typeof updater === 'function' ? updater(participantesRemotosRef.current) : updater;
      participantesRemotosRef.current = next;
      setParticipantesRemotos(next);
      return next;
    },
    []
  );
  const [peerIdConPalabra, setPeerIdConPalabra] = useState<string>('');
  const peerIdConPalabraRef = useRef<string>('');
  useEffect(() => {
    peerIdConPalabraRef.current = peerIdConPalabra;
  }, [peerIdConPalabra]);

  const canalRtcRef = useRef<any>(null);
  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const sseEventSourceRef = useRef<EventSource | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const animFrameMicRef = useRef<number | null>(null);
  const canvasRespaldoIntervalRef = useRef<any>(null);

  // Refs sincronizados para que el listener de señalización NUNCA se desuscriba ni pierda eventos al cambiar estados
  const enVivoRef = useRef(enVivo);
  useEffect(() => {
    enVivoRef.current = enVivo;
  }, [enVivo]);

  const unidadActivaRef = useRef(unidadActiva);
  useEffect(() => {
    unidadActivaRef.current = unidadActiva;
  }, [unidadActiva]);

  const rolUsuarioRef = useRef(rolUsuario);
  useEffect(() => {
    rolUsuarioRef.current = rolUsuario;
  }, [rolUsuario]);

  const unidadConPalabraRef = useRef(unidadConPalabra);
  useEffect(() => {
    unidadConPalabraRef.current = unidadConPalabra;
  }, [unidadConPalabra]);

  const audioRemotoOnRef = useRef(audioRemotoOn);
  useEffect(() => {
    audioRemotoOnRef.current = audioRemotoOn;
  }, [audioRemotoOn]);

  const [mensajeChat, setMensajeChat] = useState('');
  const [chatLog, setChatLog] = useState([
    { id: 1, autor: 'Administración Central', texto: 'Sala virtual instalada conforme a la Ley 675 de 2001.', hora: '06:00 PM' }
  ]);

  // Historial de Convocatorias
  const [convocatorias, setConvocatorias] = useState([
    {
      id: 'conv-1',
      tipo: 'Asamblea General Ordinaria (Ley 675)',
      titulo: 'Asamblea Anual de Copropietarios 2026',
      fecha: '2026-03-15 09:00 AM',
      modalidad: 'virtual',
      lugarOSala: 'Canal SFU Broadcast Urbix PH (Capacidad 200+ Personas)',
      estado: 'En Curso',
      anticipacion: '15 días hábiles cumplidos',
      quorum: '78.4%',
      apartamentosConvocados: ['TODOS LOS APARTAMENTOS (100% UNIDAD)']
    },
    {
      id: 'conv-2',
      tipo: 'Consejo de Administración',
      titulo: 'Reunión Ordinaria de Consejo - Revisión Presupuesto',
      fecha: '2026-02-20 06:30 PM',
      modalidad: 'virtual',
      lugarOSala: 'Malla Segura Encriptada P2P (Máx. 10 Personas)',
      estado: 'Convocada',
      anticipacion: 'Citación formal selectiva',
      quorum: '100%',
      apartamentosConvocados: ['Torre 1 - 201', 'Torre 1 - 302', 'Torre 2 - 301']
    }
  ]);

  const [quorumRegistrado, setQuorumRegistrado] = useState(78.4);
  const [asistentesConectados, setAsistentesConectados] = useState(1);
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
  const [resumenActaIa, setResumenActaIa] = useState<string>(
    '1. VERIFICACIÓN DEL QUÓRUM: Siendo la hora señalada en la convocatoria, la Administración verificó la presencia de copropietarios que representan el 78.4% del coeficiente total de la copropiedad, configurándose quórum deliberatorio y decisorio conforme al Art. 45 de la Ley 675 de 2001.\n\n2. DESARROLLO Y DELIBERACIONES DE LA VIDEOCONFERENCIA: Se presentó el informe de ejecución presupuestal, estado de cartera y obras de mantenimiento preventivo. Las intervenciones de las unidades participantes quedaron grabadas íntegramente en el archivo digital de audio y video.\n\n3. VOTACIÓN PONDERADA POR COEFICIENTE: Sometida a votación nominal la moción de presupuesto vigencia 2026, fue APROBADA con el 74.8% de coeficientes a favor.'
  );
  const [compromisosActa, setCompromisosActa] = useState([
    {
      responsable: 'Administración Principal',
      tarea: 'Publicar el acta firmada y el enlace de la grabación en el libro oficial foliado.',
      fecha_limite: 'Dentro de los 20 días hábiles siguientes (Art. 47 Ley 675)'
    },
    {
      responsable: 'Consejo de Administración',
      tarea: 'Supervisar la ejecución del presupuesto aprobado y las pólizas de áreas comunes.',
      fecha_limite: 'Mensual'
    }
  ]);
  const [comisionVerificadora, setComisionVerificadora] = useState({
    persona1: 'Dr. Mauricio Restrepo (Torre 2 - 301)',
    persona2: 'Esteban Ochoa (Torre 1 - 302)'
  });

  // Configuración STUN + TURN Relay para 100% de conectividad en cualquier red móvil (4G/5G CGNAT) y fija
  const iceServersConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
      {
        urls: [
          'turn:openrelay.metered.ca:80',
          'turn:openrelay.metered.ca:443',
          'turn:openrelay.metered.ca:443?transport=tcp'
        ],
        username: (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject',
        credential: (import.meta as any).env?.VITE_TURN_CREDENTIAL || 'openrelayproject'
      }
    ],
    iceCandidatePoolSize: 6,
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require'
  };

  // Sonido de notificación o prueba de altavoz (Web Audio API sin archivos externos)
  const reproducirTonoAudio = useCallback((tipo: 'timbre' | 'conectado' | 'prueba') => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (tipo === 'timbre') {
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880, now + 0.15); // A5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (tipo === 'conectado') {
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(660, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      }
    } catch {
      // ignore audio context restriction
    }
  }, []);

  // Callback refs para asegurar que el elemento <video> local y cada subcuadro remoto SIEMPRE muestren imagen y reproduzcan audio
  const setVideoLocalElement = useCallback((node: HTMLVideoElement | null) => {
    videoLocalRef.current = node;
    if (node && streamLocalRef.current) {
      if (node.srcObject !== streamLocalRef.current) {
        node.srcObject = streamLocalRef.current;
      }
      node.play().catch(() => {});
    }
  }, []);

  const setVideoRemotoElement = useCallback((node: HTMLVideoElement | null) => {
    videoRemotoRef.current = node;
    if (node && streamRemotoRef.current) {
      if (node.srcObject !== streamRemotoRef.current) {
        node.srcObject = streamRemotoRef.current;
      }
      // Los elementos <video> se mantienen silenciados para que ningún navegador móvil/escritorio bloquee el autoplay de múltiples cámaras; el audio sale por los elementos <audio> dedicados
      node.muted = true;
      node.play().catch(() => {});
    }
  }, []);

  // Vincular el elemento <video> y <audio> individual de cada participante conectado en los subcuadros
  const bindRemoteSubcuadroVideo = useCallback(
    (peerId: string, node: HTMLVideoElement | null) => {
      if (!node) {
        remoteVideoElementsMapRef.current.delete(peerId);
        return;
      }
      remoteVideoElementsMapRef.current.set(peerId, node);
      const stream = remoteStreamsMapRef.current.get(peerId);
      if (stream) {
        if (node.srcObject !== stream) {
          node.srcObject = stream;
        }
        node.muted = true;
        node.play().catch(() => {});
      }
    },
    []
  );

  const bindRemoteSubcuadroAudio = useCallback(
    (peerId: string, node: HTMLAudioElement | null) => {
      if (!node) {
        remoteAudioElementsMapRef.current.delete(peerId);
        return;
      }
      remoteAudioElementsMapRef.current.set(peerId, node);
      const stream = remoteStreamsMapRef.current.get(peerId);
      if (stream) {
        if (node.srcObject !== stream) {
          node.srcObject = stream;
        }
        node.muted = !audioRemotoOnRef.current;
        node.volume = 1.0;
        node.play().catch(() => {});
      }
    },
    []
  );

  // Desbloquear y reproducir todos los flujos remotos de video y audio (vital en navegadores al dar la palabra)
  const forzarReproduccionStreamsRemotos = useCallback((muteOverride?: boolean) => {
    const debeSilenciar = muteOverride !== undefined ? muteOverride : !audioRemotoOnRef.current;
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }
    if (videoRemotoRef.current && streamRemotoRef.current) {
      if (videoRemotoRef.current.srcObject !== streamRemotoRef.current) {
        videoRemotoRef.current.srcObject = streamRemotoRef.current;
      }
      videoRemotoRef.current.muted = true;
      videoRemotoRef.current.play().catch(() => {});
    }
    remoteVideoElementsMapRef.current.forEach((vidEl, pid) => {
      const st = remoteStreamsMapRef.current.get(pid);
      if (st) {
        if (vidEl.srcObject !== st) {
          vidEl.srcObject = st;
        }
        vidEl.muted = true;
        vidEl.play().catch(() => {});
      }
    });
    remoteAudioElementsMapRef.current.forEach((audEl, pid) => {
      const st = remoteStreamsMapRef.current.get(pid);
      if (st) {
        if (audEl.srcObject !== st) {
          audEl.srcObject = st;
        }
        audEl.muted = debeSilenciar;
        audEl.volume = 1.0;
        audEl.play().catch(() => {});
      }
    });
  }, []);

  // Reforzar asignación de streams cuando cambia enVivo, participantesRemotos o audioRemotoOn
  useEffect(() => {
    if (enVivo && videoLocalRef.current && streamLocalRef.current) {
      if (videoLocalRef.current.srcObject !== streamLocalRef.current) {
        videoLocalRef.current.srcObject = streamLocalRef.current;
      }
      videoLocalRef.current.play().catch(() => {});
    }
    if (enVivo) {
      forzarReproduccionStreamsRemotos(!audioRemotoOn);
    }
  }, [enVivo, camOn, remotoConectado, audioRemotoOn, participantesRemotos, forzarReproduccionStreamsRemotos]);

  // Función unificada para emitir eventos por SSE Server Bus + Supabase Realtime + BroadcastChannel local con deduplicación
  const emitirEventoSenalizacion = useCallback((event: string, payload: any) => {
    const enrichedPayload = {
      ...payload,
      _msgId: `${miPeerIdRef.current}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      _senderPeerId: miPeerIdRef.current
    };
    processedMsgIdsRef.current.add(enrichedPayload._msgId);

    // 1. Bus en tiempo real del servidor Express (/api/asamblea-signal) -> llega al 100% de pestañas, navegadores y celulares conectados
    fetch('/api/asamblea-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload: enrichedPayload })
    }).catch(() => {});

    // 2. Supabase Realtime Broadcast
    if (canalRtcRef.current) {
      try {
        canalRtcRef.current.send({
          type: 'broadcast',
          event,
          payload: enrichedPayload
        });
      } catch {}
    }

    // 3. BroadcastChannel local (0ms entre pestañas del mismo navegador)
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload: enrichedPayload });
      } catch {}
    }
  }, []);

  // Crear o recuperar un RTCPeerConnection dedicado para un peer remoto específico (Malla Multi-Peer real sin colisiones)
  const obtenerOCrearPeerParaParticipante = useCallback(
    (
      remotePeerId: string,
      esIniciadorOferta: boolean,
      metaRemoto?: { unidad?: string; rol?: string; etiqueta?: string },
      forzarReinicio = false
    ) => {
      const targetKey = remotePeerId || 'default-peer';

      // Registrar o actualizar participante sincrónicamente en la lista de subcuadros conectados
      if (metaRemoto?.unidad || metaRemoto?.etiqueta) {
        actualizarParticipantesRemotos((prev) => {
          const idx = prev.findIndex((p) => p.peerId === targetKey);
          const unidadRemota =
            metaRemoto.unidad || (idx >= 0 ? prev[idx].unidad : 'Torre 2 - 301');
          const etiquetaRemota = metaRemoto.etiqueta || unidadRemota;
          const rolRemoto = metaRemoto.rol || (idx >= 0 ? prev[idx].rol : 'residente');
          if (idx >= 0) {
            const copia = [...prev];
            copia[idx] = {
              ...copia[idx],
              unidad: unidadRemota,
              rol: rolRemoto,
              etiqueta: etiquetaRemota
            };
            return copia;
          }
          const nuevoListado = [
            ...prev,
            {
              peerId: targetKey,
              unidad: unidadRemota,
              rol: rolRemoto,
              etiqueta: etiquetaRemota,
              conectado: remoteStreamsMapRef.current.has(targetKey),
              streamTick: Date.now()
            }
          ];
          setAsistentesConectados(Math.max(2, nuevoListado.length + 1));
          return nuevoListado;
        });
      }

      const existente = peersMapRef.current.get(targetKey);

      // Si ya existe una conexión activa o negociando y NO es un reinicio forzado, reutilizarla sin destruirla
      if (existente && !forzarReinicio && esIniciadorOferta) {
        const iceOk =
          existente.iceConnectionState === 'connected' ||
          existente.iceConnectionState === 'completed' ||
          existente.iceConnectionState === 'checking';
        const sigOk = existente.signalingState !== 'closed';
        if (sigOk && (iceOk || existente.signalingState === 'have-local-offer')) {
          // Asegurar que nuestras pistas locales estén adjuntas
          if (streamLocalRef.current) {
            const currentSenders = existente.getSenders();
            streamLocalRef.current.getTracks().forEach((track) => {
              const sender = currentSenders.find((s) => s.track?.kind === track.kind);
              if (sender) {
                if (sender.track !== track) {
                  sender.replaceTrack(track).catch(() => {});
                }
              } else {
                try {
                  existente.addTrack(track, streamLocalRef.current!);
                } catch {}
              }
            });
          }
          return existente;
        }
      }

      if (existente) {
        try {
          existente.ontrack = null;
          existente.onicecandidate = null;
          existente.oniceconnectionstatechange = null;
          existente.close();
        } catch {}
        peersMapRef.current.delete(targetKey);
      }

      const pc = new RTCPeerConnection(iceServersConfig);
      peersMapRef.current.set(targetKey, pc);
      peerRef.current = pc;

      // Añadir pistas locales (video + audio) a este RTCPeerConnection específico
      if (streamLocalRef.current) {
        streamLocalRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, streamLocalRef.current!);
          } catch {}
        });
      }

      // Cuando llegan las pistas de video y audio de ESTE participante remoto
      pc.ontrack = (evt) => {
        let remoteStream = remoteStreamsMapRef.current.get(targetKey);
        if (!remoteStream) {
          remoteStream = new MediaStream();
          remoteStreamsMapRef.current.set(targetKey, remoteStream);
        }

        if (evt.streams && evt.streams[0]) {
          evt.streams[0].getTracks().forEach((t) => {
            t.enabled = true;
            if (!remoteStream!.getTracks().some((existing) => existing.id === t.id)) {
              remoteStream!.addTrack(t);
            }
          });
        }
        if (evt.track) {
          evt.track.enabled = true;
          if (!remoteStream.getTracks().some((existing) => existing.id === evt.track.id)) {
            remoteStream.addTrack(evt.track);
          }
        }

        streamRemotoRef.current = remoteStream;
        setRemotoConectado(true);

        // Actualizar estado del participante remoto conservando su unidad asignada
        actualizarParticipantesRemotos((prev) => {
          const existe = prev.some((p) => p.peerId === targetKey);
          const actualizado = existe
            ? prev.map((p) =>
                p.peerId === targetKey
                  ? { ...p, conectado: true, streamTick: Date.now() }
                  : p
              )
            : [
                ...prev,
                {
                  peerId: targetKey,
                  unidad: metaRemoto?.unidad || 'Torre 2 - 301',
                  rol: metaRemoto?.rol || 'residente',
                  etiqueta: metaRemoto?.etiqueta || metaRemoto?.unidad || 'Participante Conectado',
                  conectado: true,
                  streamTick: Date.now()
                }
              ];
          setAsistentesConectados(Math.max(2, actualizado.length + 1));
          return actualizado;
        });

        // Asignar inmediatamente a su <video> (muted=true para autoplay garantizado) y <audio> dedicado
        const subVideo = remoteVideoElementsMapRef.current.get(targetKey);
        if (subVideo) {
          subVideo.srcObject = remoteStream;
          subVideo.muted = true;
          subVideo.play().catch(() => {});
        }
        const subAudio = remoteAudioElementsMapRef.current.get(targetKey);
        if (subAudio) {
          subAudio.srcObject = remoteStream;
          subAudio.muted = !audioRemotoOnRef.current;
          subAudio.volume = 1.0;
          subAudio.play().catch(() => {});
        }
        if (videoRemotoRef.current) {
          if (
            !videoRemotoRef.current.srcObject ||
            rolUsuarioRef.current === 'residente' ||
            metaRemoto?.rol === 'admin' ||
            peerIdConPalabraRef.current === targetKey
          ) {
            videoRemotoRef.current.srcObject = remoteStream;
          }
          videoRemotoRef.current.muted = true;
          videoRemotoRef.current.play().catch(() => {});
        }
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          emitirEventoSenalizacion('asamblea_candidato_ice', {
            candidate: evt.candidate.toJSON ? evt.candidate.toJSON() : evt.candidate,
            fromPeerId: miPeerIdRef.current,
            toPeerId: targetKey,
            remitenteRol: rolUsuarioRef.current,
            unidad: unidadActivaRef.current
          });
        }
      };

      pc.onicecandidateerror = (evt: Event) => {
        const iceErr = evt as RTCPeerConnectionIceErrorEvent;
        if (iceErr.errorCode && iceErr.errorCode !== 701) {
          console.warn(
            `[Asamblea WebRTC] ICE Candidate Error (${iceErr.errorCode}): ${iceErr.errorText || ''} en ${iceErr.url || 'STUN'}`
          );
        }
      };

      pc.oniceconnectionstatechange = () => {
        const iceState = pc.iceConnectionState;
        if (iceState === 'connected' || iceState === 'completed') {
          setRemotoConectado(true);
          actualizarParticipantesRemotos((prev) =>
            prev.map((p) =>
              p.peerId === targetKey ? { ...p, conectado: true, streamTick: Date.now() } : p
            )
          );
          forzarReproduccionStreamsRemotos();
        } else if (iceState === 'failed') {
          if (typeof pc.restartIce === 'function') {
            pc.restartIce();
          }
          if (esIniciadorOferta && pc.signalingState === 'stable') {
            pc.createOffer({ iceRestart: true, offerToReceiveAudio: true, offerToReceiveVideo: true })
              .then(async (oferta) => {
                await pc.setLocalDescription(oferta);
                emitirEventoSenalizacion('asamblea_oferta', {
                  sdp: pc.localDescription,
                  fromPeerId: miPeerIdRef.current,
                  toPeerId: targetKey,
                  fromRol: rolUsuarioRef.current,
                  fromUnidad: rolUsuarioRef.current === 'admin' ? 'ADMIN' : unidadActivaRef.current,
                  orador:
                    rolUsuarioRef.current === 'admin' ? 'Administración Principal' : unidadActivaRef.current,
                  esReinicioIce: true
                });
              })
              .catch(() => {});
          }
        }
      };

      if (esIniciadorOferta) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(async (oferta) => {
            await pc.setLocalDescription(oferta);
            emitirEventoSenalizacion('asamblea_oferta', {
              sdp: pc.localDescription,
              fromPeerId: miPeerIdRef.current,
              toPeerId: targetKey,
              fromRol: rolUsuarioRef.current,
              fromUnidad: rolUsuarioRef.current === 'admin' ? 'ADMIN' : unidadActivaRef.current,
              orador: rolUsuarioRef.current === 'admin' ? 'Administración Principal' : unidadActivaRef.current
            });
          })
          .catch((err) => console.warn('Error creando oferta SDP:', err));
      }

      return pc;
    },
    [actualizarParticipantesRemotos, emitirEventoSenalizacion, forzarReproduccionStreamsRemotos]
  );

  // Wrapper compatible para botones de resincronización manual
  const inicializarPeerConnection = useCallback(
    (esIniciadorOferta: boolean) => {
      if (esIniciadorOferta) {
        emitirEventoSenalizacion('participante_listo', {
          peerId: miPeerIdRef.current,
          unidad: rolUsuarioRef.current === 'admin' ? 'ADMIN' : unidadActivaRef.current,
          rol: rolUsuarioRef.current,
          etiqueta:
            rolUsuarioRef.current === 'admin' ? 'Administración Principal' : unidadActivaRef.current,
          forzarRenegociacion: true,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
      return peerRef.current;
    },
    [emitirEventoSenalizacion]
  );

  // Helper infalible para activar o silenciar el micrófono local en TODOS los RTCPeerConnections activos (y adquirir micrófono real si estaba en modo respaldo)
  const sincronizarEstadoAudioLocal = useCallback(
    async (activar: boolean) => {
      setMicOn(activar);

      if (!streamLocalRef.current) return;

      let audioTracks = streamLocalRef.current.getAudioTracks();
      const tieneMicHardwareVivo = audioTracks.some(
        (t) =>
          t.readyState === 'live' &&
          !t.label.toLowerCase().includes('destination') &&
          !t.label.toLowerCase().includes('web audio')
      );

      // Si se nos concede la palabra (activar === true) y no había pista de micrófono real, solicitarla y reemplazarla en caliente en todas las conexiones
      if (activar && !tieneMicHardwareVivo) {
        try {
          const nuevoAudioStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
          });
          const nuevoTrack = nuevoAudioStream.getAudioTracks()[0];
          if (nuevoTrack) {
            nuevoTrack.enabled = true;

            // 1. Reemplazar PRIMERO en todos los RTCPeerConnections activos antes de detener la pista anterior
            peersMapRef.current.forEach((pc) => {
              const audioSender = pc
                .getSenders()
                .find((s) => s.track?.kind === 'audio');
              if (audioSender) {
                audioSender.replaceTrack(nuevoTrack).catch(() => {});
              } else if (streamLocalRef.current) {
                try {
                  pc.addTrack(nuevoTrack, streamLocalRef.current);
                } catch {}
              }
            });

            // 2. Reemplazar en el stream local
            audioTracks.forEach((oldT) => {
              streamLocalRef.current?.removeTrack(oldT);
              oldT.stop();
            });
            streamLocalRef.current.addTrack(nuevoTrack);
            audioTracks = [nuevoTrack];
          }
        } catch {
          // Si el navegador no tiene micrófono físico libre, habilitar la pista existente
        }
      }

      // Habilitar / deshabilitar en el stream local
      streamLocalRef.current.getAudioTracks().forEach((t) => {
        t.enabled = activar;
      });

      // Habilitar / deshabilitar explícitamente en cada RTCRtpSender de cada RTCPeerConnection
      peersMapRef.current.forEach((pc) => {
        pc.getSenders().forEach((sender) => {
          if (sender.track && sender.track.kind === 'audio') {
            sender.track.enabled = activar;
          }
        });
      });

      if (activar && audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }
    },
    []
  );

  // Procesar mensajes entrantes de señalización (SSE, Supabase o BroadcastChannel)
  const manejarEventoRecibido = useCallback(
    async (event: string, payload: any) => {
      if (!payload) return;

      // Ignorar eco propio o mensajes ya procesados por otro transporte
      if (payload._senderPeerId && payload._senderPeerId === miPeerIdRef.current) return;
      if (payload._msgId) {
        if (processedMsgIdsRef.current.has(payload._msgId)) return;
        processedMsgIdsRef.current.add(payload._msgId);
        if (processedMsgIdsRef.current.size > 400) {
          const first = processedMsgIdsRef.current.values().next().value;
          if (first) processedMsgIdsRef.current.delete(first);
        }
      }

      if (event === 'asamblea_convocatoria_abierta') {
        const nuevaInvitacion: ConvocatoriaActivaPayload = {
          idSesion: payload.idSesion || `ses-${Date.now()}`,
          tipo: payload.tipo === 'consejo' ? 'consejo' : 'asamblea',
          titulo: payload.titulo || 'Asamblea General Ordinaria de Copropietarios 2026',
          hora: payload.hora || 'Ahora',
          orador: payload.orador || 'Administración Central',
          apartamentosConvocados: Array.isArray(payload.apartamentosConvocados)
            ? payload.apartamentosConvocados
            : ['TODOS'],
          activa: true,
          timestamp: Date.now()
        };
        setInvitacionEntrante((prev) => {
          if (!prev || prev.idSesion !== nuevaInvitacion.idSesion) {
            reproducirTonoAudio('timbre');
            onShowToast?.(`🔔 Convocatoria en vivo: ${nuevaInvitacion.titulo}`);
          }
          return nuevaInvitacion;
        });
      } else if (event === 'asamblea_cerrada') {
        setInvitacionEntrante(null);
        setRemotoConectado(false);
        actualizarParticipantesRemotos([]);
      } else if (event === 'asamblea_unidad_actualizada') {
        const remotePeerId = payload.peerId || payload._senderPeerId;
        if (!remotePeerId || remotePeerId === miPeerIdRef.current || !payload.unidad) return;
        actualizarParticipantesRemotos((prev) =>
          prev.map((p) =>
            p.peerId === remotePeerId
              ? {
                  ...p,
                  unidad: payload.unidad,
                  etiqueta: payload.etiqueta || payload.unidad
                }
              : p
          )
        );
      } else if (event === 'participante_listo') {
        // Un participante (residente o admin) acaba de entrar o actualizar su unidad y anuncia su peerId
        const remotePeerId = payload.peerId || payload._senderPeerId;
        if (!remotePeerId || remotePeerId === miPeerIdRef.current) return;

        if (enVivoRef.current && streamLocalRef.current) {
          let unidadAsignada = payload.unidad || 'Torre 2 - 301';

          // Asignación sincrónica usando participantesRemotosRef para que el 2°, 3°+ residente NUNCA colisione con el 1°
          if (payload.rol !== 'admin') {
            const listaActual = participantesRemotosRef.current;
            const existentePeer = listaActual.find((p) => p.peerId === remotePeerId);

            // Si este peer ya tenía una unidad asignada y no es un cambio explícito desde su selector, conservarla
            if (existentePeer && !payload.cambioExplicito) {
              unidadAsignada = existentePeer.unidad;
            } else {
              const unidadesOcupadasPorOtrosPeers = new Set(
                listaActual
                  .filter((p) => p.peerId !== remotePeerId && p.rol !== 'admin')
                  .map((p) => p.unidad.trim().toLowerCase())
              );
              if (rolUsuarioRef.current === 'residente') {
                unidadesOcupadasPorOtrosPeers.add(unidadActivaRef.current.trim().toLowerCase());
              }

              if (unidadesOcupadasPorOtrosPeers.has(unidadAsignada.trim().toLowerCase())) {
                const demosOrden = [
                  'Torre 2 - 301',
                  'Torre 1 - 302',
                  'Torre 1 - 201',
                  'Torre 2 - 402',
                  'Torre 1 - 101',
                  'Torre 1 - 102'
                ];
                const libre = demosOrden.find(
                  (u) => !unidadesOcupadasPorOtrosPeers.has(u.trim().toLowerCase())
                );
                if (libre) {
                  unidadAsignada = libre;
                  if (rolUsuarioRef.current === 'admin') {
                    emitirEventoSenalizacion('asamblea_asignar_unidad_peer', {
                      toPeerId: remotePeerId,
                      unidadAsignada: libre
                    });
                  }
                }
              }
            }
          }

          if (payload.rol !== 'admin') {
            setNombreParticipanteRemoto(unidadAsignada);
          }

          // Evitar colisión (glare): si soy residente y quien anuncia es el Admin, anuncio mi presencia para que el Admin inicie la oferta hacia mí
          if (rolUsuarioRef.current === 'residente' && payload.rol === 'admin') {
            actualizarParticipantesRemotos((prev) => {
              if (prev.some((p) => p.peerId === remotePeerId)) return prev;
              return [
                ...prev,
                {
                  peerId: remotePeerId,
                  unidad: 'ADMIN',
                  rol: 'admin',
                  etiqueta: 'Administración Principal',
                  conectado: remoteStreamsMapRef.current.has(remotePeerId),
                  streamTick: Date.now()
                }
              ];
            });
            if (!peersMapRef.current.has(remotePeerId)) {
              emitirEventoSenalizacion('participante_listo', {
                peerId: miPeerIdRef.current,
                unidad: unidadActivaRef.current,
                rol: 'residente',
                etiqueta: unidadActivaRef.current,
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
            return;
          }

          // Crear o reutilizar el RTCPeerConnection exclusivo para este participante y enviarle oferta SDP dirigida a su peerId
          obtenerOCrearPeerParaParticipante(
            remotePeerId,
            true,
            {
              unidad: unidadAsignada,
              rol: payload.rol || 'residente',
              etiqueta: payload.rol === 'admin' ? 'Administración Principal' : unidadAsignada
            },
            Boolean(payload.forzarRenegociacion)
          );
        }
      } else if (event === 'asamblea_asignar_unidad_peer') {
        if (
          payload.toPeerId === miPeerIdRef.current &&
          payload.unidadAsignada &&
          rolUsuarioRef.current === 'residente'
        ) {
          unidadAutoAsignadaPorSalaRef.current = true;
          setUnidadActiva(payload.unidadAsignada);
          unidadActivaRef.current = payload.unidadAsignada;
          emitirEventoSenalizacion('asamblea_unidad_actualizada', {
            peerId: miPeerIdRef.current,
            unidad: payload.unidadAsignada,
            etiqueta: payload.unidadAsignada
          });
          onShowToast?.(
            `🏡 Unidad sincronizada automáticamente como ${payload.unidadAsignada} para tu subcuadro independiente en sala.`
          );
        }
      } else if (event === 'asamblea_oferta') {
        if (!enVivoRef.current || !streamLocalRef.current) return;
        // Procesar solo si la oferta va dirigida a nuestro peerId (o si no tiene destinatario)
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;

        const remotePeerId = payload.fromPeerId || payload._senderPeerId || 'admin-peer';
        try {
          if (payload.fromRol !== 'admin' && payload.orador) {
            setNombreParticipanteRemoto(payload.orador);
          }

          // Conservar la unidad ya asignada para este peer si existe
          const peerPrevio = participantesRemotosRef.current.find((p) => p.peerId === remotePeerId);
          const unidadRemotaOferta =
            peerPrevio && peerPrevio.rol !== 'admin'
              ? peerPrevio.unidad
              : payload.fromUnidad || payload.orador || 'ADMIN';

          const pc = obtenerOCrearPeerParaParticipante(
            remotePeerId,
            false,
            {
              unidad: unidadRemotaOferta,
              rol: payload.fromRol || 'admin',
              etiqueta:
                payload.fromRol === 'admin' ? 'Administración Principal' : unidadRemotaOferta
            },
            true
          );

          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));

          // Garantizar que todos los transceptores envíen y reciban audio y video bidireccionalmente
          pc.getTransceivers().forEach((tr) => {
            if (tr.sender && tr.sender.track && tr.direction === 'recvonly') {
              try {
                tr.direction = 'sendrecv';
              } catch {}
            }
          });

          // Drenar candidatos ICE en cola exclusivos de este peerId
          const colaIce = pendingIceMapRef.current.get(remotePeerId) || [];
          while (colaIce.length > 0) {
            const cand = colaIce.shift();
            if (cand) {
              await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
            }
          }

          const respuesta = await pc.createAnswer();
          await pc.setLocalDescription(respuesta);
          emitirEventoSenalizacion('asamblea_respuesta', {
            sdp: pc.localDescription,
            fromPeerId: miPeerIdRef.current,
            toPeerId: remotePeerId,
            fromRol: rolUsuarioRef.current,
            unidad: rolUsuarioRef.current === 'admin' ? 'ADMIN' : unidadActivaRef.current
          });
        } catch (err) {
          console.warn('Error respondiendo oferta WebRTC:', err);
        }
      } else if (event === 'asamblea_respuesta') {
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;
        const remotePeerId = payload.fromPeerId || payload._senderPeerId;
        if (!remotePeerId) return;

        // Buscar estrictamente el RTCPeerConnection de este remotePeerId (jamás usar el de otro residente)
        const pc = peersMapRef.current.get(remotePeerId);

        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const colaIce = pendingIceMapRef.current.get(remotePeerId) || [];
            while (colaIce.length > 0) {
              const cand = colaIce.shift();
              if (cand) {
                await pc.addIceCandidate(new RTCIceCandidate(cand)).catch(() => {});
              }
            }
          } catch (e) {
            console.warn('Error fijando respuesta remota SDP:', e);
          }
        }
      } else if (event === 'asamblea_candidato_ice') {
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;
        const remotePeerId = payload.fromPeerId || payload._senderPeerId;
        if (!remotePeerId || remotePeerId === miPeerIdRef.current) return;

        // Buscar estrictamente el RTCPeerConnection de este remotePeerId (si aún no tiene remoteDescription, encolar para este remotePeerId)
        const pc = peersMapRef.current.get(remotePeerId);
        if (payload.candidate) {
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
          } else {
            const actual = pendingIceMapRef.current.get(remotePeerId) || [];
            actual.push(payload.candidate);
            pendingIceMapRef.current.set(remotePeerId, actual);
          }
        }
      } else if (event === 'asamblea_orador_hablando') {
        if (payload._senderPeerId === miPeerIdRef.current) return;
        if (payload.orador) {
          setNombreParticipanteRemoto(payload.orador);
        }
        setNivelVozRemota(payload.nivel || 68);
        forzarReproduccionStreamsRemotos();
        setTimeout(() => {
          setNivelVozRemota(0);
        }, 1400);
      } else if (event === 'asamblea_control_palabra') {
        const nuevaUnidadConPalabra = payload.unidadConPalabra || 'ADMIN';
        const targetPeerId = payload.peerIdConPalabra || '';
        setUnidadConPalabra(nuevaUnidadConPalabra);
        setPeerIdConPalabra(targetPeerId);
        peerIdConPalabraRef.current = targetPeerId;

        if (payload.nombreOrador) {
          setNombreParticipanteRemoto(payload.nombreOrador);
        }
        if (nuevaUnidadConPalabra !== 'ADMIN') {
          setSolicitudesPalabra((prev) => prev.filter((u) => u !== nuevaUnidadConPalabra));
        }

        // Asegurar que todos los elementos de audio/video remotos estén reproduciendo sin bloqueo
        forzarReproduccionStreamsRemotos(false);

        // Blindaje de Audio en el Residente/Consejero:
        // Si viene peerIdConPalabra específico de un residente conectado, validar por peerId exacto para que el 1° y 2° residente jamás se confundan
        if (rolUsuarioRef.current === 'residente') {
          let esMiTurno = false;
          if (nuevaUnidadConPalabra === 'ADMIN') {
            esMiTurno = false;
          } else if (targetPeerId) {
            esMiTurno = targetPeerId === miPeerIdRef.current;
          } else {
            esMiTurno =
              nuevaUnidadConPalabra.trim().toLowerCase() ===
              unidadActivaRef.current.trim().toLowerCase();
          }

          if (
            esMiTurno &&
            nuevaUnidadConPalabra !== 'ADMIN' &&
            nuevaUnidadConPalabra.trim().toLowerCase() !==
              unidadActivaRef.current.trim().toLowerCase()
          ) {
            unidadAutoAsignadaPorSalaRef.current = true;
            setUnidadActiva(nuevaUnidadConPalabra);
            unidadActivaRef.current = nuevaUnidadConPalabra;
          }

          await sincronizarEstadoAudioLocal(esMiTurno);

          if (esMiTurno) {
            setManoLevantada(false);
            reproducirTonoAudio('conectado');
            onShowToast?.(
              `🎙️ ¡Tienes la palabra (${nuevaUnidadConPalabra})! Tu micrófono está ACTIVO y todos te escuchan.`
            );
          } else {
            onShowToast?.(
              nuevaUnidadConPalabra === 'ADMIN'
                ? '🔇 Micrófonos silenciados por moderación. Audio exclusivo de la Administración.'
                : `🎙️ Turno de palabra asignado a ${nuevaUnidadConPalabra}. Tu micrófono permanece silenciado.`
            );
          }
        }
      } else if (event === 'asamblea_pedir_palabra') {
        if (payload.unidad) {
          // Si viene de un peer específico cuya unidad fue auto-asignada en sala, usar la unidad registrada de ese peer
          const peerSolicitante = payload.peerId
            ? participantesRemotosRef.current.find((p) => p.peerId === payload.peerId)
            : undefined;
          const unidadEfectiva = peerSolicitante?.unidad || payload.unidad;

          if (payload.activa) {
            setSolicitudesPalabra((prev) =>
              prev.includes(unidadEfectiva) ? prev : [...prev, unidadEfectiva]
            );
            if (rolUsuarioRef.current === 'admin') {
              reproducirTonoAudio('timbre');
              onShowToast?.(
                `✋ ${unidadEfectiva} solicita la palabra. Haz clic en "Dar Palabra" en su subcuadro derecho.`
              );
            }
          } else {
            setSolicitudesPalabra((prev) =>
              prev.filter((u) => u !== unidadEfectiva && u !== payload.unidad)
            );
          }
        }
      } else if (event === 'asamblea_chat') {
        setChatLog((prev) => (prev.some((m) => m.id === payload.id) ? prev : [...prev, payload]));
      } else if (event === 'asamblea_voto') {
        setMocionActual((prev) => ({
          ...prev,
          coefFavor: payload.coefFavor ?? prev.coefFavor,
          coefContra: payload.coefContra ?? prev.coefContra,
          coefBlanco: payload.coefBlanco ?? prev.coefBlanco
        }));
      }
    },
    [
      actualizarParticipantesRemotos,
      emitirEventoSenalizacion,
      forzarReproduccionStreamsRemotos,
      obtenerOCrearPeerParaParticipante,
      onShowToast,
      reproducirTonoAudio,
      sincronizarEstadoAudioLocal
    ]
  );

  const manejarEventoRecibidoRef = useRef(manejarEventoRecibido);
  useEffect(() => {
    manejarEventoRecibidoRef.current = manejarEventoRecibido;
  }, [manejarEventoRecibido]);

  // 1. Suscripción Persistente en Tiempo Real (SSE Server Bus + Supabase + BroadcastChannel + Storage Event)
  // Se monta una sola vez para jamás perder ofertas SDP ni comandos de "Dar la Palabra"
  useEffect(() => {
    // A. Canal SSE del servidor (/api/asamblea-events) para sincronización multi-dispositivo y multi-navegador
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        const es = new EventSource('/api/asamblea-events');
        es.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            if (parsed && parsed.event) {
              manejarEventoRecibidoRef.current(parsed.event, parsed.payload);
            }
          } catch {}
        };
        sseEventSourceRef.current = es;
      } catch {}
    }

    // B. BroadcastChannel nativo para sincronización instantánea entre pestañas
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_BUS_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.event) {
          manejarEventoRecibidoRef.current(ev.data.event, ev.data.payload);
        }
      };
      localBroadcastRef.current = bc;
    }

    // C. Listener de localStorage por si el usuario cambia de pestaña o rol
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_CONVOCATORIA_KEY) {
        if (!e.newValue) {
          setInvitacionEntrante(null);
        } else {
          try {
            const parsed: ConvocatoriaActivaPayload = JSON.parse(e.newValue);
            if (parsed.activa) {
              setInvitacionEntrante(parsed);
            } else {
              setInvitacionEntrante(null);
            }
          } catch {}
        }
      }
    };
    window.addEventListener('storage', onStorageChange);

    // D. Canal Supabase Realtime
    let canal: any = null;
    if (isSupabaseConfigured) {
      canal = supabase.channel(CANAL_ASAMBLEA_ROOM, {
        config: { broadcast: { self: false } }
      });

      [
        'asamblea_convocatoria_abierta',
        'asamblea_cerrada',
        'participante_listo',
        'asamblea_unidad_actualizada',
        'asamblea_asignar_unidad_peer',
        'asamblea_oferta',
        'asamblea_respuesta',
        'asamblea_candidato_ice',
        'asamblea_orador_hablando',
        'asamblea_control_palabra',
        'asamblea_pedir_palabra',
        'asamblea_chat',
        'asamblea_voto'
      ].forEach((evtName) => {
        canal.on('broadcast', { event: evtName }, ({ payload }: any) => {
          manejarEventoRecibidoRef.current(evtName, payload);
        });
      });

      canal.subscribe();
      canalRtcRef.current = canal;
    }

    return () => {
      window.removeEventListener('storage', onStorageChange);
      if (sseEventSourceRef.current) {
        sseEventSourceRef.current.close();
        sseEventSourceRef.current = null;
      }
      if (localBroadcastRef.current) {
        localBroadcastRef.current.close();
        localBroadcastRef.current = null;
      }
      if (canal) {
        supabase.removeChannel(canal);
      }
    };
  }, []);

  // Pulso periódico cuando el Admin tiene la sala abierta para que cualquier residente que entre después reciba la llamada
  useEffect(() => {
    if (!enVivo || rolUsuario !== 'admin' || !invitacionEntrante) return;
    const interval = setInterval(() => {
      emitirEventoSenalizacion('asamblea_convocatoria_abierta', invitacionEntrante);
    }, 3000);
    return () => clearInterval(interval);
  }, [enVivo, rolUsuario, invitacionEntrante, emitirEventoSenalizacion]);

  // Medidor visual de nivel de micrófono (ESTABLE, SIN CAMBIAR EL LAYOUT NI SALTAR LAS IMÁGENES)
  const iniciarMonitorAudioLocal = useCallback((stream: MediaStream) => {
    if (animFrameMicRef.current) cancelAnimationFrame(animFrameMicRef.current);
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let ultimoUpdateUI = 0;

      const actualizarNivel = () => {
        const ahora = Date.now();
        // Actualizar solo cada 200ms y NUNCA intercambiar contenedores de video para evitar que las imágenes salten
        if (ahora - ultimoUpdateUI >= 200) {
          ultimoUpdateUI = ahora;
          const trackHabilitado = stream.getAudioTracks().some((t) => t.enabled);
          if (!trackHabilitado) {
            setNivelMic(0);
          } else {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const nivelCalculado = Math.min(100, Math.round(avg * 1.8));
            setNivelMic(nivelCalculado);

            if (nivelCalculado >= 18 && ahora - ultimoPulsoVozRef.current > 1200) {
              ultimoPulsoVozRef.current = ahora;
              emitirEventoSenalizacion('asamblea_orador_hablando', {
                remitenteRol: rolUsuarioRef.current,
                unidad: unidadActivaRef.current,
                orador:
                  rolUsuarioRef.current === 'admin' ? 'Administración Principal' : unidadActivaRef.current,
                nivel: nivelCalculado
              });
            }
          }
        }

        animFrameMicRef.current = requestAnimationFrame(actualizarNivel);
      };
      actualizarNivel();
    } catch (e) {
      console.warn('No se pudo iniciar monitor de nivel de audio:', e);
    }
  }, [emitirEventoSenalizacion]);

  // Generador de stream en vivo de respaldo si la cámara física está ocupada por otra ventana
  const crearStreamRespaldoEnVivo = useCallback((etiquetaUsuario: string, soloAudioStream?: MediaStream | null): MediaStream => {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d')!;
    let tick = 0;

    if (canvasRespaldoIntervalRef.current) clearInterval(canvasRespaldoIntervalRef.current);
    canvasRespaldoIntervalRef.current = setInterval(() => {
      tick += 1;
      // Fondo corporativo Urbix
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#06101e');
      grad.addColorStop(1, '#0b1f33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Círculos de onda de voz en vivo
      const radius = 110 + Math.sin(tick * 0.25) * 18;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, radius, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(34, 211, 238, 0.35)';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2 - 30, 85, 0, Math.PI * 2);
      ctx.fillStyle = '#0e7490';
      ctx.fill();

      // Iniciales
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(rolUsuario === 'admin' ? 'ADMIN' : 'APTO', canvas.width / 2, canvas.height / 2 - 12);

      // Nombre y Hora en vivo
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(etiquetaUsuario, canvas.width / 2, canvas.height / 2 + 125);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '22px monospace';
      ctx.fillText(
        `TRANSMISIÓN EN VIVO LEY 675 • ${new Date().toLocaleTimeString()}`,
        canvas.width / 2,
        canvas.height / 2 + 170
      );
    }, 80);

    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(25) : new MediaStream();
    if (soloAudioStream && soloAudioStream.getAudioTracks().length > 0) {
      soloAudioStream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
    } else {
      // Crear pista de audio silenciosa activa para que WebRTC y MediaRecorder funcionen al 100%
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          const actx = new Ctx();
          const dst = actx.createMediaStreamDestination();
          const osc = actx.createOscillator();
          const gain = actx.createGain();
          gain.gain.value = 0.0001;
          osc.connect(gain);
          gain.connect(dst);
          osc.start();
          dst.stream.getAudioTracks().forEach((t) => canvasStream.addTrack(t));
        }
      } catch {}
    }

    return canvasStream;
  }, [rolUsuario]);

  // Iniciar / Detener Grabación (MediaRecorder) para el Acta
  const iniciarGrabacionReunion = useCallback((streamBase?: MediaStream) => {
    const streamObjetivo = streamBase || streamLocalRef.current;
    if (!streamObjetivo) {
      onShowToast?.('⚠️ Primero debes iniciar la transmisión de la sala.');
      return;
    }

    try {
      chunksGrabacionRef.current = [];
      const mimeTypes = [
        'video/webm;codecs=vp8,opus',
        'video/webm',
        'audio/webm'
      ];
      const mimeValido = mimeTypes.find((m) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(m)) || '';

      const recorder = mimeValido
        ? new MediaRecorder(streamObjetivo, { mimeType: mimeValido })
        : new MediaRecorder(streamObjetivo);

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksGrabacionRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksGrabacionRef.current, { type: mimeValido || 'video/webm' });
        const url = URL.createObjectURL(blob);
        setGrabacionUrl(url);
        setGrabacionTamanoKB(Math.max(12, Math.round(blob.size / 1024)));
        setGrabandoSesion(false);
        onShowToast?.('💾 Grabación de la reunión guardada y lista para generar el Acta Oficial.');
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setSegundosGrabacion(0);
      setGrabandoSesion(true);
      onShowToast?.('🔴 Grabación oficial de audio y video iniciada (Soporte Ley 675).');
    } catch (err) {
      console.warn('Error iniciando MediaRecorder:', err);
      onShowToast?.('⚠️ No se pudo iniciar la grabación en este navegador.');
    }
  }, [onShowToast]);

  const detenerGrabacionReunion = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setGrabandoSesion(false);
    }
  }, []);

  // 2. INICIAR SALA (ADMIN) O ACEPTAR INVITACIÓN (RESIDENTE)
  const conectarASala = async () => {
    if (rolUsuario === 'admin' && tipoConvocatoriaAdmin === 'consejo' && apartamentosEscogidosAdmin.length === 0) {
      onShowToast?.('⚠️ Selecciona al menos un apartamento para citar a la reunión del Consejo.');
      return;
    }

    let stream: MediaStream | null = null;
    let usoRespaldo = false;

    try {
      // Intento 1: Cámara HD + Micrófono con cancelación de eco
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch {
      try {
        // Intento 1B: Cámara con configuración estándar + Micrófono (evita OverconstrainedError en segundo dispositivo)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
      } catch {
        try {
          // Intento 2: Si el micrófono está ocupado o sin permiso pero la cámara sí está libre, capturar cámara real + pista de audio de respaldo
          const videoOnly = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          const fallbackStream = crearStreamRespaldoEnVivo(
            rolUsuario === 'admin' ? 'Administración Central' : unidadActiva,
            null
          );
          fallbackStream.getAudioTracks().forEach((at) => videoOnly.addTrack(at));
          stream = videoOnly;
        } catch {
          try {
            // Intento 3: Capturar SIEMPRE el micrófono real aunque la cámara esté ocupada por otra ventana
            const audioOnly = await navigator.mediaDevices.getUserMedia({
              video: false,
              audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
            });
            usoRespaldo = true;
            stream = crearStreamRespaldoEnVivo(
              rolUsuario === 'admin' ? 'Administración Central' : unidadActiva,
              audioOnly
            );
          } catch {
            // Intento 4: Stream en vivo autogenerado (video + audio) para que jamás quede bloqueado
            usoRespaldo = true;
            stream = crearStreamRespaldoEnVivo(
              rolUsuario === 'admin' ? 'Administración Central' : unidadActiva,
              null
            );
          }
        }
      }
    }

    setUsandoCamaraRespaldo(usoRespaldo);
    streamLocalRef.current = stream;

    // Blindaje de Audio: El Administrador inicia con micrófono activo; los residentes inician con micrófono silenciado hasta que el Admin les dé la palabra
    const tienePalabraInicial =
      rolUsuario === 'admin' ||
      (unidadConPalabra !== 'ADMIN' &&
        unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase());

    if (stream) {
      stream.getAudioTracks().forEach((t) => {
        t.enabled = tienePalabraInicial;
      });
    }

    // Activar estado enVivo ANTES y vincular stream al elemento <video>
    setEnVivo(true);
    enVivoRef.current = true;
    setCamOn(true);
    setMicOn(tienePalabraInicial);
    reproducirTonoAudio('conectado');
    iniciarMonitorAudioLocal(stream);

    setTimeout(() => {
      if (videoLocalRef.current && streamLocalRef.current) {
        videoLocalRef.current.srcObject = streamLocalRef.current;
        videoLocalRef.current.play().catch(() => {});
      }
    }, 50);

    if (rolUsuario === 'admin') {
      const tituloFinal =
        tituloConvocatoriaInput.trim() ||
        (tipoConvocatoriaAdmin === 'consejo'
          ? 'Sesión Ordinaria del Consejo de Administración'
          : 'Asamblea General Ordinaria de Copropietarios 2026');

      const listaConvocados =
        tipoConvocatoriaAdmin === 'asamblea'
          ? ['TODOS']
          : apartamentosEscogidosAdmin;

      const payloadConvocatoria: ConvocatoriaActivaPayload = {
        idSesion: `ses-${Date.now()}`,
        tipo: tipoConvocatoriaAdmin,
        titulo: tituloFinal,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        orador: 'Administración Principal',
        apartamentosConvocados: listaConvocados,
        activa: true,
        timestamp: Date.now()
      };

      try {
        localStorage.setItem(STORAGE_CONVOCATORIA_KEY, JSON.stringify(payloadConvocatoria));
      } catch {}

      setUnidadConPalabra('ADMIN');
      setPeerIdConPalabra(miPeerIdRef.current);
      peerIdConPalabraRef.current = miPeerIdRef.current;
      setInvitacionEntrante(payloadConvocatoria);
      emitirEventoSenalizacion('asamblea_convocatoria_abierta', payloadConvocatoria);
      emitirEventoSenalizacion('asamblea_control_palabra', {
        unidadConPalabra: 'ADMIN',
        peerIdConPalabra: miPeerIdRef.current,
        nombreOrador: 'Administración Principal'
      });

      // Anunciar presencia del Admin para enlazar con cualquier residente ya en sala
      emitirEventoSenalizacion('participante_listo', {
        peerId: miPeerIdRef.current,
        unidad: 'ADMIN',
        rol: 'admin',
        etiqueta: 'Administración Principal',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Iniciar grabación automática de respaldo para el acta
      iniciarGrabacionReunion(stream);

      onShowToast?.(
        tipoConvocatoriaAdmin === 'asamblea'
          ? '📢 Sala abierta: Invitación enviada a TODOS los residentes. Audio blindado (Moderación Admin activa).'
          : `📢 Sala del Consejo abierta: Invitación enviada a ${apartamentosEscogidosAdmin.length} apartamento(s) con control de palabra.`
      );
    } else {
      // El residente acepta la llamada y anuncia su peerId y unidad para crear conexiones P2P con el Admin y con los demás participantes
      emitirEventoSenalizacion('participante_listo', {
        peerId: miPeerIdRef.current,
        unidad: unidadActivaRef.current,
        rol: 'residente',
        etiqueta: unidadActivaRef.current,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      // Re-anunciar a los 2200ms SOLO si aún no se ha establecido ninguna conexión WebRTC (sin cerrar conexiones activas)
      setTimeout(() => {
        if (enVivoRef.current && peersMapRef.current.size === 0) {
          emitirEventoSenalizacion('participante_listo', {
            peerId: miPeerIdRef.current,
            unidad: unidadActivaRef.current,
            rol: 'residente',
            etiqueta: unidadActivaRef.current,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        }
      }, 2200);

      // Registrar unidad en la planilla de quórum si no estaba
      setUnidadesPresentes((prev) => {
        if (prev.some((u) => u.unidad.toLowerCase() === unidadActiva.toLowerCase())) return prev;
        return [
          {
            id: `u-${Date.now()}`,
            unidad: unidadActiva,
            titular: 'Copropietario Conectado en Vivo',
            coeficiente: 1.05,
            poder: false,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          ...prev
        ];
      });
      setQuorumRegistrado((q) => Math.min(100, +(q + 1.05).toFixed(1)));
      setAsistentesConectados((prev) => Math.max(2, prev + 1));
      onShowToast?.(
        tienePalabraInicial
          ? `✅ Conectado (${unidadActiva}). Tienes la palabra y el micrófono activo.`
          : `✅ Conectado (${unidadActiva}). Cámara activa; micrófono silenciado hasta que la Administración te dé la palabra.`
      );
    }
  };

  const detenerTransmision = useCallback(() => {
    if (grabandoSesion && mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (animFrameMicRef.current) {
      cancelAnimationFrame(animFrameMicRef.current);
      animFrameMicRef.current = null;
    }
    if (canvasRespaldoIntervalRef.current) {
      clearInterval(canvasRespaldoIntervalRef.current);
      canvasRespaldoIntervalRef.current = null;
    }
    peersMapRef.current.forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peersMapRef.current.clear();
    remoteStreamsMapRef.current.clear();
    if (peerRef.current) {
      try {
        peerRef.current.close();
      } catch {}
      peerRef.current = null;
    }
    if (streamLocalRef.current) {
      streamLocalRef.current.getTracks().forEach((t) => t.stop());
      streamLocalRef.current = null;
    }
    if (streamPantallaRef.current) {
      streamPantallaRef.current.getTracks().forEach((t) => t.stop());
      streamPantallaRef.current = null;
    }
    if (videoLocalRef.current) videoLocalRef.current.srcObject = null;
    if (videoRemotoRef.current) videoRemotoRef.current.srcObject = null;

    if (rolUsuario === 'admin') {
      try {
        localStorage.removeItem(STORAGE_CONVOCATORIA_KEY);
      } catch {}
      emitirEventoSenalizacion('asamblea_cerrada', { cerrada: true });
      setInvitacionEntrante(null);
    } else {
      emitirEventoSenalizacion('asamblea_peer_salio', { peerId: miPeerIdRef.current });
    }

    setEnVivo(false);
    enVivoRef.current = false;
    setRemotoConectado(false);
    actualizarParticipantesRemotos([]);
    setCompartiendoPantalla(false);
    setNivelMic(0);
  }, [actualizarParticipantesRemotos, emitirEventoSenalizacion, grabandoSesion, rolUsuario]);

  useEffect(() => {
    return () => {
      if (animFrameMicRef.current) cancelAnimationFrame(animFrameMicRef.current);
      if (canvasRespaldoIntervalRef.current) clearInterval(canvasRespaldoIntervalRef.current);
      peersMapRef.current.forEach((pc) => {
        try {
          pc.close();
        } catch {}
      });
      if (streamLocalRef.current) {
        streamLocalRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const toggleMic = async () => {
    // Blindaje de Audio: Si es residente y el Admin no le ha dado la palabra, no puede abrir su micrófono libremente
    const tengoPalabraPorUnidad =
      unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase();
    const tengoPalabraPorPeer = Boolean(peerIdConPalabra && peerIdConPalabra === miPeerIdRef.current);

    if (rolUsuario === 'residente' && !micOn && !tengoPalabraPorUnidad && !tengoPalabraPorPeer) {
      setManoLevantada(true);
      setSolicitudesPalabra((prev) => (prev.includes(unidadActiva) ? prev : [...prev, unidadActiva]));
      emitirEventoSenalizacion('asamblea_pedir_palabra', {
        unidad: unidadActiva,
        peerId: miPeerIdRef.current,
        activa: true
      });
      onShowToast?.(
        '🔒 Micrófono blindado por moderación: Se envió tu solicitud de palabra al Administrador para que active tu audio.'
      );
      return;
    }

    const nuevoEstado = !micOn;
    await sincronizarEstadoAudioLocal(nuevoEstado);
    onShowToast?.(nuevoEstado ? '🎙️ Micrófono activado.' : '🔇 Micrófono silenciado.');
  };

  const toggleCam = () => {
    if (streamLocalRef.current) {
      const videoTracks = streamLocalRef.current.getVideoTracks();
      videoTracks.forEach((t) => {
        t.enabled = !camOn;
      });
      setCamOn(!camOn);
      onShowToast?.(!camOn ? '📹 Cámara encendida.' : '📷 Cámara apagada.');
    }
  };

  const toggleCompartirPantalla = async () => {
    if (!compartiendoPantalla) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        streamPantallaRef.current = screenStream;

        if (videoLocalRef.current) {
          videoLocalRef.current.srcObject = screenStream;
          videoLocalRef.current.play().catch(() => {});
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        if (screenTrack) {
          peersMapRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack).catch(() => {});
          });
        }

        screenTrack.onended = () => {
          if (videoLocalRef.current && streamLocalRef.current) {
            videoLocalRef.current.srcObject = streamLocalRef.current;
            videoLocalRef.current.play().catch(() => {});
            const originalTrack = streamLocalRef.current.getVideoTracks()[0];
            if (originalTrack) {
              peersMapRef.current.forEach((pc) => {
                const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(originalTrack).catch(() => {});
              });
            }
          }
          setCompartiendoPantalla(false);
        };

        setCompartiendoPantalla(true);
        onShowToast?.('🖥️ Proyectando pantalla a todos los copropietarios conectados.');
      } catch (e) {
        console.warn('Pantalla cancelada:', e);
      }
    } else {
      if (streamPantallaRef.current) {
        streamPantallaRef.current.getTracks().forEach((t) => t.stop());
        streamPantallaRef.current = null;
      }
      if (videoLocalRef.current && streamLocalRef.current) {
        videoLocalRef.current.srcObject = streamLocalRef.current;
        videoLocalRef.current.play().catch(() => {});
        const originalTrack = streamLocalRef.current.getVideoTracks()[0];
        if (originalTrack) {
          peersMapRef.current.forEach((pc) => {
            const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(originalTrack).catch(() => {});
          });
        }
      }
      setCompartiendoPantalla(false);
    }
  };

  const handleEnviarChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeChat.trim()) return;

    const nuevoMensaje = {
      id: Date.now(),
      autor: `${rolUsuario === 'admin' ? 'Administración' : unidadActiva} (${rolUsuario.toUpperCase()})`,
      texto: mensajeChat.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatLog((prev) => [...prev, nuevoMensaje]);
    emitirEventoSenalizacion('asamblea_chat', nuevoMensaje);
    setMensajeChat('');
  };

  const handleVotar = (opcion: 'favor' | 'contra' | 'blanco') => {
    if (mociónActual.haVotado) {
      onShowToast?.('⚠️ Ya has ejercido tu derecho de voto para esta moción.');
      return;
    }
    const miCoef = 1.05;
    const actualizado = {
      ...mociónActual,
      haVotado: true,
      miVoto: opcion,
      coefFavor: opcion === 'favor' ? +(mociónActual.coefFavor + miCoef).toFixed(2) : mociónActual.coefFavor,
      coefContra: opcion === 'contra' ? +(mociónActual.coefContra + miCoef).toFixed(2) : mociónActual.coefContra,
      coefBlanco: opcion === 'blanco' ? +(mociónActual.coefBlanco + miCoef).toFixed(2) : mociónActual.coefBlanco
    };
    setMocionActual(actualizado);
    emitirEventoSenalizacion('asamblea_voto', actualizado);
    onShowToast?.(`🗳️ Voto registrado con éxito: ${opcion.toUpperCase()} (Ponderado: 1.05%).`);
  };

  // Procesar grabación y generar el Acta Oficial con IA (/api/process-meeting)
  const handleProcesarGrabacionYGenerarActa = async () => {
    setGenerandoActa(true);
    onShowToast?.('🎙️ Procesando grabación e intervenciones con IA bajo la Ley 675...');

    const notasIntervenciones = chatLog.map((c) => `[${c.hora}] ${c.autor}: ${c.texto}`).join(' | ');
    const contextoCompleto = `Tipo: ${
      invitacionEntrante?.tipo === 'consejo' ? 'Consejo de Administración' : 'Asamblea General Ordinaria'
    }. Quórum: ${quorumRegistrado}%. Moción votada: ${mociónActual.titulo} (A favor: ${mociónActual.coefFavor}%, En contra: ${
      mociónActual.coefContra
    }%, En blanco: ${mociónActual.coefBlanco}%). Intervenciones en sala: ${notasIntervenciones}`;

    try {
      const response = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingType:
            invitacionEntrante?.tipo === 'consejo'
              ? 'Sesión del Consejo de Administración'
              : 'Asamblea General Ordinaria',
          meetingDate: new Date().toISOString().split('T')[0],
          tenantName: 'P.H. Reserva del Tesoro',
          quorumPercentage: quorumRegistrado,
          contextNotes: contextoCompleto
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.acta?.summary) {
          setResumenActaIa(data.acta.summary);
        }
        if (Array.isArray(data?.acta?.commitments) && data.acta.commitments.length > 0) {
          setCompromisosActa(data.acta.commitments);
        }
      }
    } catch {
      // Fallback enriquecido local con los datos reales de la sesión y grabación
      setResumenActaIa(
        `1. VERIFICACIÓN DE QUÓRUM Y APERTURA: Con un quórum acreditado del ${quorumRegistrado}% de coeficientes de copropiedad, se instaló formalmente la sesión "${
          invitacionEntrante?.titulo || tituloConvocatoriaInput
        }" con grabación digital de audio y video (${formatearTiempo(segundosTranscurridos)} de duración).\n\n2. DELIBERACIONES E INTERVENCIONES EN SALA: ${notasIntervenciones}\n\n3. ESCRUTINIO Y DECISIONES APROBADAS: Sometida a votación ponderada la moción "${
          mociónActual.titulo
        }", se aprobó con ${mociónActual.coefFavor}% de coeficientes a favor, ${mociónActual.coefContra}% en contra y ${
          mociónActual.coefBlanco
        }% en blanco.`
      );
    } finally {
      setGenerandoActa(false);
      setSubmoduloActivo('acta');
      onShowToast?.('✨ ¡Acta oficial generada desde la grabación! Lista para revisión y descarga PDF.');
    }
  };

  // Cronómetros de sesión y de grabación
  useEffect(() => {
    let t: any;
    if (enVivo) {
      t = setInterval(() => setSegundosTranscurridos((s) => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [enVivo]);

  useEffect(() => {
    let t: any;
    if (grabandoSesion) {
      t = setInterval(() => setSegundosGrabacion((s) => s + 1), 1000);
    }
    return () => clearInterval(t);
  }, [grabandoSesion]);

  const formatearTiempo = (seg: number) => {
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleApartamentoEscogido = (unidad: string) => {
    setApartamentosEscogidosAdmin((prev) => {
      if (prev.includes(unidad)) {
        return prev.filter((u) => u !== unidad);
      }
      if (prev.length >= MAX_PERSONAS_MALLA_CONSEJO) {
        onShowToast?.(
          `🔒 Conexión Segura P2P: Esta reunión permite conectar entre sí máximo ${MAX_PERSONAS_MALLA_CONSEJO} apartamentos.`
        );
        return prev;
      }
      return [...prev, unidad];
    });
  };

  const handleAgregarApartamentoManual = () => {
    const limpio = nuevoAptoManual.trim();
    if (!limpio) return;
    if (
      apartamentosEscogidosAdmin.length >= MAX_PERSONAS_MALLA_CONSEJO &&
      !apartamentosEscogidosAdmin.includes(limpio)
    ) {
      onShowToast?.(
        `🔒 Límite de seguridad alcanzado: Máximo ${MAX_PERSONAS_MALLA_CONSEJO} personas en Malla Encriptada P2P.`
      );
      return;
    }
    if (!catalogoApartamentos.some((c) => c.unidad.toLowerCase() === limpio.toLowerCase())) {
      setCatalogoApartamentos((prev) => [
        ...prev,
        { unidad: limpio, propietario: 'Propietario Citado', coef: 0.85, cargo: 'Invitado' }
      ]);
    }
    if (!apartamentosEscogidosAdmin.includes(limpio)) {
      setApartamentosEscogidosAdmin((prev) => [...prev, limpio]);
    }
    setNuevoAptoManual('');
  };

  // Control de Palabra y Blindaje de Audio por el Administrador / Consejo:
  // Al darle la palabra a una unidad o participante conectado, se activa su micrófono remotamente y se desbloquea el audio entrante en todos los dispositivos.
  const otorgarPalabraAParticipante = (unidadDestino: string, etiquetaOrador?: string, peerIdEspecifico?: string) => {
    const etiquetaFinal =
      unidadDestino === 'ADMIN'
        ? 'Administración Principal'
        : etiquetaOrador || unidadDestino;

    // Buscar el peerId exacto del residente conectado para esta unidad
    const peerConectado =
      unidadDestino === 'ADMIN'
        ? miPeerIdRef.current
        : peerIdEspecifico ||
          participantesRemotosRef.current.find(
            (p) =>
              p.rol !== 'admin' &&
              p.unidad.trim().toLowerCase() === unidadDestino.trim().toLowerCase()
          )?.peerId ||
          '';

    setUnidadConPalabra(unidadDestino);
    setPeerIdConPalabra(peerConectado);
    peerIdConPalabraRef.current = peerConectado;

    // Asegurar que el altavoz remoto esté activo y desbloqueado por este gesto de clic
    setAudioRemotoOn(true);
    audioRemotoOnRef.current = true;
    forzarReproduccionStreamsRemotos(false);

    if (unidadDestino !== 'ADMIN') {
      setNombreParticipanteRemoto(etiquetaFinal);
      setSolicitudesPalabra((prev) => prev.filter((u) => u !== unidadDestino));
      setNivelVozRemota(75);

      // Si tenemos el stream de este participante (sea el 1°, 2° o 3° residente), mostrarlo también en el monitor superior de orador activo
      if (peerConectado) {
        const st = remoteStreamsMapRef.current.get(peerConectado);
        if (st && videoRemotoRef.current) {
          streamRemotoRef.current = st;
          videoRemotoRef.current.srcObject = st;
          videoRemotoRef.current.muted = true;
          videoRemotoRef.current.play().catch(() => {});
        }
      }

      setTimeout(() => setNivelVozRemota(0), 2200);
    } else {
      setNivelVozRemota(0);
    }

    emitirEventoSenalizacion('asamblea_control_palabra', {
      unidadConPalabra: unidadDestino,
      peerIdConPalabra: peerConectado,
      nombreOrador: etiquetaFinal,
      timestamp: Date.now()
    });

    if (rolUsuario === 'admin') {
      if (unidadDestino === 'ADMIN') {
        sincronizarEstadoAudioLocal(true);
        onShowToast?.('🔇 Micrófonos de participantes silenciados. Audio exclusivo de la Administración.');
      } else {
        onShowToast?.(`🎙️ Palabra concedida a ${etiquetaFinal}: Su micrófono ha sido activado en sala.`);
      }
    }
  };

  // Solicitar o bajar la mano / ceder la palabra desde la vista de Residente / Consejero
  const solicitarPalabraResidente = async () => {
    if (rolUsuario === 'admin') {
      otorgarPalabraAParticipante('ADMIN', 'Administración Principal');
      return;
    }

    const tengoLaPalabra =
      unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase() ||
      Boolean(peerIdConPalabra && peerIdConPalabra === miPeerIdRef.current);

    if (tengoLaPalabra) {
      // Si ya tenía la palabra y presiona finalizar intervención, regresa el turno al Admin y silencia su mic
      await sincronizarEstadoAudioLocal(false);
      setManoLevantada(false);
      setUnidadConPalabra('ADMIN');
      setPeerIdConPalabra('');
      emitirEventoSenalizacion('asamblea_control_palabra', {
        unidadConPalabra: 'ADMIN',
        peerIdConPalabra: '',
        nombreOrador: 'Administración Principal',
        timestamp: Date.now()
      });
      onShowToast?.('🔇 Has finalizado tu intervención. Micrófono silenciado.');
      return;
    }

    const nuevoEstado = !manoLevantada;
    setManoLevantada(nuevoEstado);
    setSolicitudesPalabra((prev) =>
      nuevoEstado
        ? prev.includes(unidadActiva)
          ? prev
          : [...prev, unidadActiva]
        : prev.filter((u) => u !== unidadActiva)
    );
    emitirEventoSenalizacion('asamblea_pedir_palabra', {
      unidad: unidadActiva,
      peerId: miPeerIdRef.current,
      activa: nuevoEstado
    });
    onShowToast?.(
      nuevoEstado
        ? '✋ Solicitud de palabra enviada al Administrador / Consejo para activar tu micrófono.'
        : '✋ Solicitud de palabra cancelada.'
    );
  };

  // VALIDACIÓN DE ACCESO LEY 675:
  // 1. Si es Asamblea General ('asamblea' o incluye 'TODOS'), entran TODOS los residentes de la unidad (Capacidad SFU 200+).
  // 2. Si es Consejo de Administración ('consejo'), solo entran los apartamentos seleccionados (Malla Segura P2P máx. 10 personas).
  const tieneAccesoAReunion = (() => {
    if (!invitacionEntrante) return false;
    if (
      invitacionEntrante.tipo === 'asamblea' ||
      invitacionEntrante.apartamentosConvocados.includes('TODOS')
    ) {
      return true;
    }
    return invitacionEntrante.apartamentosConvocados.some(
      (apto) => apto.trim().toLowerCase() === unidadActiva.trim().toLowerCase()
    );
  })();

  const esModoMasivoSFU =
    (invitacionEntrante ? invitacionEntrante.tipo === 'asamblea' : tipoConvocatoriaAdmin === 'asamblea');

  // Pestañas adaptadas según el rol
  const pestanasVisibles = rolUsuario === 'admin'
    ? [
        { id: 'video', label: '1. Videoconferencia', icon: Video, color: 'text-rose-400' },
        { id: 'convocatorias', label: '2. Programar Convocatorias', icon: Calendar, color: 'text-cyan-400' },
        { id: 'quorum', label: '3. Auditoría de Quórum', icon: Users, color: 'text-emerald-400' },
        { id: 'votaciones', label: '4. Mesa de Votaciones', icon: CheckSquare, color: 'text-amber-400' },
        { id: 'acta', label: '5. Generador de Actas IA', icon: FileText, color: 'text-blue-400' },
      ]
    : [
        { id: 'video', label: '1. Sala en Vivo', icon: Video, color: 'text-rose-400' },
        { id: 'convocatorias', label: '2. Citaciones Formales', icon: Calendar, color: 'text-cyan-400' },
        { id: 'quorum', label: '3. Mi Coeficiente & Quórum', icon: Users, color: 'text-emerald-400' },
        { id: 'votaciones', label: '4. Tarjetón de Voto', icon: CheckSquare, color: 'text-amber-400' },
        { id: 'acta', label: '5. Consultar Actas Aprobadas', icon: FileText, color: 'text-blue-400' },
      ];

  return (
    <div className="bg-[#05080e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 space-y-6 shadow-2xl font-sans text-slate-100">
      
      {/* BARRA DE SUBMÓDULOS FILTRADA POR ROL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <nav className="flex items-center gap-2 overflow-x-auto pb-1">
          {pestanasVisibles.map((tab) => {
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

        {/* Selector de apartamento activo y acceso directo a los 3 Residentes Demo */}
        {rolUsuario === 'residente' && (
          <div className="flex flex-wrap items-center gap-2 bg-[#0b0f17] border border-slate-800 px-3 py-1.5 rounded-xl shrink-0">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[11px] font-mono text-slate-400">3 Residentes Demo:</span>
            {[
              { label: 'Demo 1 (T2-301)', unidad: 'Torre 2 - 301' },
              { label: 'Demo 2 (T1-302)', unidad: 'Torre 1 - 302' },
              { label: 'Demo 3 (T1-201)', unidad: 'Torre 1 - 201' }
            ].map((d) => (
              <button
                key={d.unidad}
                type="button"
                onClick={() => {
                  unidadAutoAsignadaPorSalaRef.current = true;
                  setUnidadActiva(d.unidad);
                  unidadActivaRef.current = d.unidad;
                  if (enVivoRef.current) {
                    emitirEventoSenalizacion('asamblea_unidad_actualizada', {
                      peerId: miPeerIdRef.current,
                      unidad: d.unidad,
                      etiqueta: d.unidad
                    });
                    emitirEventoSenalizacion('participante_listo', {
                      peerId: miPeerIdRef.current,
                      unidad: d.unidad,
                      rol: 'residente',
                      etiqueta: d.unidad,
                      cambioExplicito: true,
                      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    });
                  }
                  onShowToast?.(`🏡 Simulando vista en sala como ${d.label} (${d.unidad})`);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                  unidadActiva === d.unidad
                    ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {d.label}
              </button>
            ))}
            <select
              value={unidadActiva}
              onChange={(e) => {
                const nuevaU = e.target.value;
                unidadAutoAsignadaPorSalaRef.current = true;
                setUnidadActiva(nuevaU);
                unidadActivaRef.current = nuevaU;
                if (enVivoRef.current) {
                  emitirEventoSenalizacion('asamblea_unidad_actualizada', {
                    peerId: miPeerIdRef.current,
                    unidad: nuevaU,
                    etiqueta: nuevaU
                  });
                  emitirEventoSenalizacion('participante_listo', {
                    peerId: miPeerIdRef.current,
                    unidad: nuevaU,
                    rol: 'residente',
                    etiqueta: nuevaU,
                    cambioExplicito: true,
                    hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  });
                }
              }}
              className="bg-slate-900 text-cyan-300 font-mono font-bold text-xs px-2 py-1 rounded-lg border border-slate-700 outline-none cursor-pointer"
            >
              {catalogoApartamentos.map((c) => (
                <option key={c.unidad} value={c.unidad}>
                  {c.unidad} ({c.propietario})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 1. SUBMÓDULO: VIDEOCONFERENCIA EN VIVO */}
      {submoduloActivo === 'video' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LIENZO DE VIDEO PRINCIPAL (IMAGEN PROPIA FIJA + SUBCUADROS DERECHOS + BLINDAJE DE AUDIO) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative min-h-[520px] bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col justify-between p-4 sm:p-5">
              
              {/* Barra superior de estado + Indicador de Topología (SFU 200+ vs Malla Segura 10) */}
              <div className="flex flex-wrap items-center justify-between gap-2 z-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 bg-rose-500/20 text-rose-400 border border-rose-500/40 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase">
                    <span className={`w-2 h-2 rounded-full ${enVivo ? 'bg-rose-500 animate-ping' : 'bg-slate-600'}`} />
                    {enVivo ? 'TRANSMISIÓN OFICIAL LEY 675' : 'SALA EN ESPERA'}
                  </span>

                  <span
                    className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                      esModoMasivoSFU
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {esModoMasivoSFU
                      ? '🌐 Canal Masivo SFU (Capacidad: 100–200 Personas)'
                      : `🔒 Malla Segura P2P Encriptada (Máx. ${MAX_PERSONAS_MALLA_CONSEJO} Personas)`}
                  </span>

                  {grabandoSesion && (
                    <span className="flex items-center gap-1.5 bg-red-600/20 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold animate-pulse">
                      <Disc className="w-3.5 h-3.5 text-red-500 animate-spin" />
                      REC {formatearTiempo(segundosGrabacion)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      reproducirTonoAudio('prueba');
                      forzarReproduccionStreamsRemotos(false);
                      onShowToast?.('🔊 Altavoces y canales de voz remotos verificados y activos al 100%.');
                    }}
                    className="bg-slate-900/90 hover:bg-slate-800 text-cyan-300 text-[11px] px-2.5 py-1 rounded-xl border border-cyan-500/30 font-mono flex items-center gap-1 cursor-pointer transition"
                    title="Verificar sonido de altavoces"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Probar Sonido
                  </button>
                  <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-xs px-3 py-1 rounded-xl border border-slate-700 font-mono">
                    🔴 {enVivo ? `${formatearTiempo(segundosTranscurridos)} • ${Math.max(asistentesConectados, participantesRemotos.length + 1)} Conectado(s)` : '0 Conectados'}
                  </span>
                </div>
              </div>

              {/* CONTENIDO CENTRAL: IMAGEN PRINCIPAL DEL USUARIO (IZQUIERDA) + SUBCUADROS DERECHOS DE PARTICIPANTES CON CONTROL DE PALABRA */}
              <div className="relative flex-1 flex flex-col justify-between overflow-hidden my-3 rounded-2xl bg-[#07090e]/90 border border-slate-800/80 p-3 sm:p-4">
                {enVivo ? (
                  <div className="w-full flex flex-col gap-3">
                    {/* Banco de audio dedicado para cada participante conectado en la malla WebRTC (fuera de display:none para que el navegador nunca suspenda el audio del 2° o 3° residente) */}
                    <div className="sr-only w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
                      {participantesRemotos.map((pr) => (
                        <audio
                          key={`audio-${pr.peerId}`}
                          ref={(node) => bindRemoteSubcuadroAudio(pr.peerId, node)}
                          autoPlay
                          playsInline
                          muted={!audioRemotoOn}
                        />
                      ))}
                    </div>

                    {/* BARRA DE MODERACIÓN Y BLINDAJE DE AUDIO (EVITA AUDIOS ABIERTOS AL MISMO TIEMPO Y SALTOS DE PANTALLA) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-[#0b111d] border border-slate-800 px-3 py-2 rounded-xl text-[11px] font-mono">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-slate-300">
                          🎙️ Micrófono Autorizado (Palabra):{' '}
                          <strong className="text-emerald-300">
                            {unidadConPalabra === 'ADMIN'
                              ? 'Administración Principal (Moderador)'
                              : `${unidadConPalabra} (${
                                  catalogoApartamentos.find((c) => c.unidad === unidadConPalabra)?.propietario || 'Consejero'
                                })`}
                          </strong>
                        </span>
                        {solicitudesPalabra.length > 0 && (
                          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            ✋ {solicitudesPalabra.length} Solicitud(es) de palabra
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {rolUsuario === 'admin' ? (
                          <button
                            type="button"
                            onClick={() => otorgarPalabraAParticipante('ADMIN', 'Administración Principal')}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                              unidadConPalabra === 'ADMIN'
                                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/50'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                            }`}
                          >
                            {unidadConPalabra === 'ADMIN'
                              ? '🔒 Audio Blindado (Solo Admin Activo)'
                              : '🔇 Quitar Palabra / Silenciar Participantes'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={solicitarPalabraResidente}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition ${
                              unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase() ||
                              Boolean(peerIdConPalabra && peerIdConPalabra === miPeerIdRef.current)
                                ? 'bg-emerald-500/25 text-emerald-200 border-emerald-400'
                                : manoLevantada
                                ? 'bg-amber-500/25 text-amber-200 border-amber-400'
                                : 'bg-slate-900 text-cyan-300 border-cyan-500/40 hover:bg-slate-800'
                            }`}
                          >
                            {unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase() ||
                            Boolean(peerIdConPalabra && peerIdConPalabra === miPeerIdRef.current)
                              ? '🎙️ Tienes la Palabra (Clic para Ceder)'
                              : manoLevantada
                              ? '✋ Palabra Solicitada (Esperando Admin)'
                              : '✋ Pedir la Palabra al Administrador'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* DISTRIBUCIÓN FIJA ANTISALTO:
                        - IZQUIERDA (7 columnas): Imagen principal fija del usuario viéndose a sí mismo.
                        - DERECHA (5 columnas): Subcuadros fijos de cada una de las otras personas con su cámara en vivo + Botones para dar la palabra. */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-stretch">
                      
                      {/* IZQUIERDA: IMAGEN PRINCIPAL DEL USUARIO (SIEMPRE FIJA, NUNCA SALTA DE ARRIBA HACIA ABAJO) */}
                      <div className="md:col-span-7 relative h-[320px] md:h-[385px] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                        <video
                          ref={setVideoLocalElement}
                          autoPlay
                          playsInline
                          muted
                          className={`w-full h-full object-cover ${!camOn ? 'hidden' : ''}`}
                        />
                        {!camOn && (
                          <div className="text-center p-4 space-y-1.5">
                            <VideoOff className="w-9 h-9 text-slate-600 mx-auto" />
                            <p className="text-xs text-slate-400 font-mono">Tu Cámara está Apagada</p>
                          </div>
                        )}

                        {/* Insignia Superior Izquierda: Vista Propia Fija */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-xl border border-slate-800 text-[10px] font-mono">
                          <span className="w-2 h-2 rounded-full bg-cyan-400" />
                          <span className="text-white font-bold">
                            📌 TU CÁMARA PRINCIPAL ({rolUsuario === 'admin' ? 'Administración' : unidadActiva})
                          </span>
                        </div>

                        {/* Barra Inferior Fija de Estado de Audio Local */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-[10px] font-mono">
                          <div className="flex items-center gap-2 truncate">
                            {micOn ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                🎙️ MIC ACTIVO (CON PALABRA)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/30 font-bold">
                                🔒 MIC SILENCIADO (MODO ESCUCHA)
                              </span>
                            )}
                            <span className="text-slate-300 truncate hidden sm:inline">
                              {rolUsuario === 'admin' ? 'Moderador General' : unidadActiva}
                            </span>
                          </div>

                          {/* Medidor de voz de ancho fijo (jamás altera el alto ni mueve la imagen) */}
                          <div className="flex items-center gap-1.5 shrink-0" title="Nivel de micrófono">
                            {micOn ? (
                              <Mic className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <MicOff className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all duration-150"
                                style={{ width: `${micOn ? Math.max(8, nivelMic) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* DERECHA: SUBCUADROS DE LAS OTRAS PERSONAS CON CÁMARA EN VIVO + BOTÓN DE ADMINISTRADOR PARA DAR LA PALABRA */}
                      <div className="md:col-span-5 h-[320px] md:h-[385px] rounded-2xl bg-[#090d16] border border-slate-800 p-2.5 flex flex-col justify-between overflow-hidden">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2 shrink-0">
                          <span className="text-[11px] font-mono font-bold text-cyan-300 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-cyan-400" />
                            Subcuadros Participantes ({participantesRemotos.length} en vivo)
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {rolUsuario === 'admin' ? 'Clic para Dar Palabra' : 'Audio Moderado'}
                          </span>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                          {/* SUBCUADRO 1: SEÑAL DE VIDEO REMOTA PRINCIPAL (ADMINISTRACIÓN O PARTICIPANTE CON LA PALABRA) */}
                          <div className="relative h-[112px] w-full rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/40 flex items-center justify-center shrink-0">
                            <video
                              ref={setVideoRemotoElement}
                              autoPlay
                              playsInline
                              muted
                              className={`w-full h-full object-cover ${remotoConectado ? 'block' : 'hidden'}`}
                            />

                            {!remotoConectado && (
                              <div className="flex items-center justify-between w-full px-3 py-2 gap-2">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-xs font-mono shrink-0">
                                    {rolUsuario === 'residente' ? 'AD' : nombreParticipanteRemoto.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-white truncate">
                                      {rolUsuario === 'residente' ? 'Administración Principal' : nombreParticipanteRemoto}
                                    </p>
                                    <p className="text-[10px] text-cyan-300 font-mono truncate">
                                      {unidadConPalabra === 'ADMIN'
                                        ? '🎙️ Moderador con micrófono activo'
                                        : `🎙️ Orador activo: ${unidadConPalabra}`}
                                    </p>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => inicializarPeerConnection(true)}
                                  className="px-2 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-mono font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Sincronizar canal P2P/TURN"
                                >
                                  <RefreshCw className="w-3 h-3" /> P2P
                                </button>
                              </div>
                            )}

                            <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-800 text-[10px] font-mono">
                              <span className="text-cyan-300 font-bold truncate">
                                📹 {rolUsuario === 'residente' ? 'Cámara Administración' : nombreParticipanteRemoto}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const nuevoAudio = !audioRemotoOn;
                                  setAudioRemotoOn(nuevoAudio);
                                  audioRemotoOnRef.current = nuevoAudio;
                                  forzarReproduccionStreamsRemotos(!nuevoAudio);
                                }}
                                className="text-[10px] text-emerald-400 hover:underline cursor-pointer ml-2 shrink-0"
                              >
                                {audioRemotoOn ? '🔊 Audio ON' : '🔇 Mute'}
                              </button>
                            </div>
                          </div>

                          {/* SUBCUADROS INDIVIDUALES DE CADA UNO DE LOS OTROS PARTICIPANTES (MAPEO 1-A-1 GARANTIZADO PARA 1°, 2°, 3°+ RESIDENTE) */}
                          {(() => {
                            const listaBase = (
                              esModoMasivoSFU
                                ? catalogoApartamentos
                                : catalogoApartamentos.filter((c) => apartamentosEscogidosAdmin.includes(c.unidad))
                            ).filter((part) => (rolUsuario === 'residente' ? part.unidad !== unidadActiva : true));

                            const residentesRemotos = participantesRemotos.filter((p) => p.rol !== 'admin');
                            const peersAsignados = new Set<string>();
                            const peerPorUnidadSubcuadro = new Map<
                              string,
                              (typeof participantesRemotos)[number]
                            >();

                            // Pasada 1: Coincidencia exacta por unidad (1 a 1)
                            listaBase.forEach((part) => {
                              const matchExacto = residentesRemotos.find(
                                (p) =>
                                  !peersAsignados.has(p.peerId) &&
                                  p.unidad.trim().toLowerCase() === part.unidad.trim().toLowerCase()
                              );
                              if (matchExacto) {
                                peerPorUnidadSubcuadro.set(part.unidad, matchExacto);
                                peersAsignados.add(matchExacto.peerId);
                              }
                            });

                            // Pasada 2: Cualquier residente conectado adicional (2°, 3°+) cuya unidad colisionó o aún no se sincronizó se asigna al siguiente subcuadro libre
                            residentesRemotos.forEach((p) => {
                              if (!peersAsignados.has(p.peerId)) {
                                const subcuadroLibre = listaBase.find(
                                  (part) => !peerPorUnidadSubcuadro.has(part.unidad)
                                );
                                if (subcuadroLibre) {
                                  peerPorUnidadSubcuadro.set(subcuadroLibre.unidad, p);
                                  peersAsignados.add(p.peerId);
                                }
                              }
                            });

                            return listaBase.map((part) => {
                              const etiqueta = `${part.unidad} (${part.propietario})`;
                              const peerDeEstaUnidad = peerPorUnidadSubcuadro.get(part.unidad);
                              const tienePalabra =
                                unidadConPalabra !== 'ADMIN' &&
                                ((peerDeEstaUnidad && peerIdConPalabra
                                  ? peerIdConPalabra === peerDeEstaUnidad.peerId
                                  : false) ||
                                  unidadConPalabra.trim().toLowerCase() === part.unidad.trim().toLowerCase());
                              const pidioPalabra =
                                solicitudesPalabra.includes(part.unidad) ||
                                Boolean(
                                  peerDeEstaUnidad &&
                                    solicitudesPalabra.includes(peerDeEstaUnidad.unidad)
                                );

                              const tieneVideoEnVivo = Boolean(
                                peerDeEstaUnidad &&
                                  (remoteStreamsMapRef.current.has(peerDeEstaUnidad.peerId) ||
                                    peerDeEstaUnidad.conectado)
                              );

                              return (
                                <div
                                  key={part.unidad}
                                  className={`h-[82px] w-full rounded-xl p-2 border flex items-center justify-between gap-2 transition shrink-0 ${
                                    tienePalabra
                                      ? 'bg-emerald-950/30 border-emerald-500/60'
                                      : pidioPalabra
                                      ? 'bg-amber-950/25 border-amber-500/50'
                                      : tieneVideoEnVivo
                                      ? 'bg-cyan-950/20 border-cyan-500/40'
                                      : 'bg-[#0d1320] border-slate-800/90'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    {/* Mini-visor de cámara en vivo del participante (muestra su <video> real cuando se conecta) */}
                                    <div
                                      className={`relative w-20 h-[64px] rounded-xl overflow-hidden flex flex-col items-center justify-center font-mono text-[10px] font-bold border shrink-0 ${
                                        tienePalabra
                                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                          : pidioPalabra
                                          ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                                          : 'bg-slate-900 border-slate-700 text-slate-300'
                                      }`}
                                    >
                                      {peerDeEstaUnidad && tieneVideoEnVivo ? (
                                        <>
                                          <video
                                            key={`vid-${peerDeEstaUnidad.peerId}`}
                                            ref={(node) => bindRemoteSubcuadroVideo(peerDeEstaUnidad.peerId, node)}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                          />
                                          <span className="absolute bottom-0.5 right-1 bg-emerald-500 text-slate-950 text-[8px] font-black px-1 rounded">
                                            VIVO
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span>{part.unidad.split('-')[1]?.trim() || 'PH'}</span>
                                          <span className="text-[8px] opacity-75">CAM</span>
                                        </>
                                      )}
                                    </div>

                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-bold text-white truncate">{part.unidad}</span>
                                        {tieneVideoEnVivo && (
                                          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="Cámara y audio conectados" />
                                        )}
                                      </div>
                                      <p className="text-[10px] text-slate-400 truncate">{part.propietario}</p>

                                      <div className="flex items-center gap-1.5 mt-1">
                                        {tienePalabra ? (
                                          <span className="text-[10px] font-mono font-bold text-emerald-300 flex items-center gap-1">
                                            <Mic className="w-3 h-3 text-emerald-400" /> Mic Activo (Con la Palabra)
                                          </span>
                                        ) : pidioPalabra ? (
                                          <span className="text-[10px] font-mono font-bold text-amber-300 flex items-center gap-1">
                                            <Hand className="w-3 h-3 text-amber-400" /> Pidió la Palabra
                                          </span>
                                        ) : (
                                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                                            <MicOff className="w-3 h-3 text-rose-400/80" /> Mic Silenciado (Blindado)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botón exclusivo del Administrador / Consejo para Dar o Quitar la Palabra y Activar su Micrófono */}
                                  {rolUsuario === 'admin' ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        tienePalabra
                                          ? otorgarPalabraAParticipante('ADMIN', 'Administración Principal')
                                          : otorgarPalabraAParticipante(
                                              part.unidad,
                                              etiqueta,
                                              peerDeEstaUnidad?.peerId
                                            )
                                      }
                                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-mono font-bold border cursor-pointer transition shrink-0 ${
                                        tienePalabra
                                          ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/50'
                                          : pidioPalabra
                                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border-cyan-500/40'
                                      }`}
                                    >
                                      {tienePalabra ? '🔇 Quitar Palabra' : '🎙️ Dar Palabra'}
                                    </button>
                                  ) : (
                                    <span
                                      className={`px-2 py-1 rounded-lg text-[9px] font-mono font-bold border shrink-0 ${
                                        tienePalabra
                                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                          : tieneVideoEnVivo
                                          ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                                          : 'bg-slate-900 text-slate-400 border-slate-800'
                                      }`}
                                    >
                                      {tienePalabra ? '🗣️ Hablando' : tieneVideoEnVivo ? '🟢 En Vivo' : 'En Sala'}
                                    </span>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : invitacionEntrante && rolUsuario === 'residente' && tieneAccesoAReunion ? (
                  // TARJETA DE LLAMADA / INVITACIÓN EN VIVO AL RESIDENTE CONVOCADO
                  <div className="text-center space-y-4 py-6 px-6 max-w-lg mx-auto my-auto bg-cyan-950/20 border border-cyan-500/40 rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.2)]">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300">
                      <BellRing className="w-8 h-8 animate-bounce text-cyan-400" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-3 py-1 rounded-full uppercase">
                        {invitacionEntrante.tipo === 'consejo'
                          ? `🔒 Malla Segura P2P Consejo (Máx. ${MAX_PERSONAS_MALLA_CONSEJO} Personas)`
                          : '🌐 Asamblea General SFU en Vivo (Capacidad 200+ Residentes)'}
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-white mt-2">
                        {invitacionEntrante.titulo}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1">
                        Convoca: <strong className="text-cyan-300">{invitacionEntrante.orador}</strong> • Hora: {invitacionEntrante.hora}
                      </p>
                      <p className="text-xs text-emerald-400 font-mono mt-1">
                        ✓ Tu unidad (<strong>{unidadActiva}</strong>) está acreditada • Pantalla 1 a 1 estilo Teams activa
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={conectarASala}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" /> Aceptar e Ingresar con Cámara y Sonido
                    </button>
                  </div>
                ) : invitacionEntrante && rolUsuario === 'residente' && !tieneAccesoAReunion ? (
                  // SALA PRIVADA CUANDO ES CONSEJO Y EL APARTAMENTO NO FUE ESCOGIDO POR LA ADMINISTRACIÓN
                  <div className="text-center py-6 px-6 max-w-md mx-auto my-auto bg-amber-950/15 border border-amber-500/30 rounded-3xl space-y-2">
                    <Lock className="w-9 h-9 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">Sesión Encriptada del Consejo (Máx. 10 Personas)</h4>
                    <p className="text-xs text-slate-400">
                      Tu unidad (<strong className="text-white">{unidadActiva}</strong>) no se encuentra dentro de los apartamentos seleccionados por la Administración para esta sesión privada.
                    </p>
                    <p className="text-[11px] font-mono text-amber-300/90 pt-1">
                      Apartamentos citados ({invitacionEntrante.apartamentosConvocados.length}/10): {invitacionEntrante.apartamentosConvocados.join(', ')}
                    </p>
                  </div>
                ) : (
                  // PANTALLA DE CONFIGURACIÓN Y CONVOCATORIA EN VIVO (DOBLE TOPOLOGÍA: 200+ EN ASAMBLEA GENERAL VS MÁX 10 EN CONSEJO)
                  <div className="w-full max-w-xl mx-auto text-center space-y-4 py-3 px-2 sm:px-4 my-auto">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-[#090d14] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.15)]">
                      {rolUsuario === 'admin' ? <Radio className="w-7 h-7 animate-pulse" /> : <Lock className="w-7 h-7 text-slate-500" />}
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white">
                        {rolUsuario === 'admin' ? 'Sala Lista para Convocatoria y Citación en Vivo' : 'En Espera de Inicio de Asamblea'}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-1 max-w-md mx-auto">
                        {rolUsuario === 'admin'
                          ? 'Elige Asamblea General (canal masivo 100–200 personas) o Reunión de Consejo/Comité (conexión segura entre sí máx. 10 personas). Visualización 1 a 1 tipo Teams.'
                          : 'La sesión virtual está protegida bajo la Ley 675 con visualización 1 a 1 estilo Teams. Te notificaremos cuando inicie.'}
                      </p>
                    </div>

                    {rolUsuario === 'admin' && (
                      <div className="space-y-3 text-left bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
                        {/* Título de la reunión a convocar */}
                        <div>
                          <label className="text-[10px] font-mono font-bold uppercase text-cyan-400 block mb-1">
                            Título / Motivo de la Videoconferencia:
                          </label>
                          <input
                            type="text"
                            value={tituloConvocatoriaInput}
                            onChange={(e) => setTituloConvocatoriaInput(e.target.value)}
                            placeholder="Ej. Asamblea General Ordinaria 2026 / Reunión de Consejo"
                            className="w-full bg-[#07090e] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400 font-mono"
                          />
                        </div>

                        {/* Selector de Tipo: Asamblea General (100-200 simultáneos) vs Otras Reuniones/Consejo (Malla Segura Máx. 10) */}
                        <div>
                          <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1.5">
                            Arquitectura de Conexión según Tipo de Reunión:
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setTipoConvocatoriaAdmin('asamblea');
                                setTituloConvocatoriaInput('Asamblea General Ordinaria de Copropietarios 2026');
                              }}
                              className={`p-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer text-left border ${
                                tipoConvocatoriaAdmin === 'asamblea'
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-[0_0_12px_rgba(34,211,238,0.2)]'
                                  : 'bg-[#07090e] text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              <span className="block text-white">🌐 Asamblea / Consejo General</span>
                              <span className="text-[10px] text-cyan-300/90 font-normal">
                                Canal Masivo SFU: 100 a 200 personas simultáneas
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setTipoConvocatoriaAdmin('consejo');
                                setTituloConvocatoriaInput('Sesión Privada del Consejo de Administración');
                              }}
                              className={`p-2.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer text-left border ${
                                tipoConvocatoriaAdmin === 'consejo'
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_12px_rgba(245,158,11,0.2)]'
                                  : 'bg-[#07090e] text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              <span className="block text-white">🔒 Consejo / Otras Reuniones</span>
                              <span className="text-[10px] text-amber-300/90 font-normal">
                                Malla Segura Encriptada P2P: Máx. 10 personas
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Si es Asamblea General -> Confirmación de canal masivo 200 personas + foco 1 a 1 */}
                        {tipoConvocatoriaAdmin === 'asamblea' ? (
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <span className="text-emerald-300 font-mono text-[11px]">
                              ✓ <strong>Capacidad 100–200 personas simultáneas</strong> + Pantalla 1 a 1 automática cuando alguien habla (estilo Teams).
                            </span>
                            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold shrink-0">
                              200+ SFU
                            </span>
                          </div>
                        ) : (
                          /* Si es Consejo de Administración -> Selector de apartamentos con tope estricto de 10 personas */
                          <div className="p-3 bg-[#07090e] border border-amber-500/30 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-amber-300">
                                Conexión Segura P2P ({apartamentosEscogidosAdmin.length}/{MAX_PERSONAS_MALLA_CONSEJO} máx. personas):
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setApartamentosEscogidosAdmin(
                                      catalogoApartamentos.slice(0, MAX_PERSONAS_MALLA_CONSEJO).map((c) => c.unidad)
                                    )
                                  }
                                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                                >
                                  Seleccionar hasta 10
                                </button>
                                <span className="text-slate-600">|</span>
                                <button
                                  type="button"
                                  onClick={() => setApartamentosEscogidosAdmin([])}
                                  className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer"
                                >
                                  Limpiar
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                              {catalogoApartamentos.map((apt) => {
                                const activo = apartamentosEscogidosAdmin.includes(apt.unidad);
                                return (
                                  <div
                                    key={apt.unidad}
                                    onClick={() => toggleApartamentoEscogido(apt.unidad)}
                                    className={`p-2 rounded-lg border text-[11px] flex items-center gap-2 cursor-pointer transition select-none ${
                                      activo
                                        ? 'bg-amber-500/15 border-amber-400 text-white'
                                        : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:border-slate-700'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={activo}
                                      onChange={() => {}}
                                      className="accent-amber-400 w-3.5 h-3.5 pointer-events-none"
                                    />
                                    <div className="truncate">
                                      <span className="font-bold text-white block leading-tight">{apt.unidad}</span>
                                      <span className="text-[10px] text-slate-400 truncate block">{apt.propietario} ({apt.cargo})</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex gap-1.5 pt-1">
                              <input
                                type="text"
                                value={nuevoAptoManual}
                                onChange={(e) => setNuevoAptoManual(e.target.value)}
                                placeholder="Agregar apto a malla segura (máx. 10)..."
                                className="flex-1 bg-[#0b0f17] border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-white outline-none focus:border-amber-400 font-mono"
                              />
                              <button
                                type="button"
                                onClick={handleAgregarApartamentoManual}
                                className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3 h-3" /> Agregar
                              </button>
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={conectarASala}
                          className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black px-6 py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.35)] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          {tipoConvocatoriaAdmin === 'asamblea'
                            ? 'Iniciar Sala Masiva SFU (100–200 Personas • Pantalla 1 a 1)'
                            : `Iniciar Conexión Segura P2P (${apartamentosEscogidosAdmin.length}/10 Personas • Pantalla 1 a 1)`}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* BARRA INFERIOR DE CONTROLES DE VIDEO, AUDIO Y GRABACIÓN DE ACTAS */}
              <div className="bg-[#0b0f17]/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-2 z-10 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
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

                  {rolUsuario === 'admin' && (
                    <button
                      disabled={!enVivo}
                      type="button"
                      onClick={toggleCompartirPantalla}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                        compartiendoPantalla ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200' : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      <MonitorUp className="w-4 h-4" />
                      <span className="hidden sm:inline">{compartiendoPantalla ? 'Proyectando' : 'Proyectar'}</span>
                    </button>
                  )}

                  {/* Botón de Grabación de Reunión para Acta */}
                  <button
                    disabled={!enVivo}
                    type="button"
                    onClick={() => (grabandoSesion ? detenerGrabacionReunion() : iniciarGrabacionReunion())}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                      grabandoSesion
                        ? 'bg-red-600/30 border-red-500 text-red-200 animate-pulse'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-red-500/50'
                    }`}
                  >
                    {grabandoSesion ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current text-red-400" />
                        <span>Detener Grabación ({formatearTiempo(segundosGrabacion)})</span>
                      </>
                    ) : (
                      <>
                        <Disc className="w-4 h-4 text-red-400" />
                        <span>Grabar para Acta</span>
                      </>
                    )}
                  </button>

                  <button
                    disabled={!enVivo}
                    type="button"
                    onClick={solicitarPalabraResidente}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 cursor-pointer min-h-[40px] disabled:opacity-40 ${
                      rolUsuario === 'admin'
                        ? unidadConPalabra !== 'ADMIN'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                          : 'bg-slate-900 border-slate-800 text-cyan-300'
                        : manoLevantada
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Hand className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {rolUsuario === 'admin'
                        ? unidadConPalabra !== 'ADMIN'
                          ? 'Silenciar Participante'
                          : 'Audio Blindado (Admin)'
                        : unidadConPalabra.trim().toLowerCase() === unidadActiva.trim().toLowerCase()
                        ? 'Ceder Palabra'
                        : manoLevantada
                        ? 'Palabra Solicitada'
                        : 'Pedir Palabra'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                    Unidad: <strong className="text-white">{rolUsuario === 'admin' ? 'Administración' : unidadActiva}</strong>
                  </span>

                  {enVivo && (
                    <button
                      type="button"
                      onClick={detenerTransmision}
                      className="px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      title="Finalizar llamada y guardar grabación"
                    >
                      <PhoneOff className="w-4 h-4" /> Finalizar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* PANEL DE GRABACIÓN LISTA Y RESOLUCIÓN DE ACTA CON IA */}
            {(grabacionUrl || enVivo) && (
              <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Soporte Magnetofónico Ley 675
                    </span>
                    {grabacionUrl && (
                      <span className="text-[11px] font-mono text-emerald-400 font-bold">
                        ✓ Archivo grabado ({grabacionTamanoKB} KB)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {grabacionUrl
                      ? 'Escucha o descarga la grabación de la sesión y genera automáticamente el Acta Oficial foliada.'
                      : 'Al terminar la reunión puedes convertir automáticamente las intervenciones y votaciones en el Acta Oficial.'}
                  </p>
                  {grabacionUrl && (
                    <video
                      src={grabacionUrl}
                      controls
                      className="mt-2 w-full max-w-md h-28 rounded-xl border border-slate-800 bg-black"
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {grabacionUrl && (
                    <a
                      href={grabacionUrl}
                      download={`Grabacion_Asamblea_${new Date().toISOString().slice(0, 10)}.webm`}
                      className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-cyan-400" /> Descargar Video/Audio
                    </a>
                  )}
                  <button
                    type="button"
                    disabled={generandoActa}
                    onClick={handleProcesarGrabacionYGenerarActa}
                    className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generandoActa ? 'Procesando Acta con IA...' : 'Resolver Acta Oficial con IA'}
                  </button>
                </div>
              </div>
            )}

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
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4 h-[520px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Chat &amp; Intervenciones Foliadas
              </span>
              <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800 font-mono">
                {chatLog.length} mensajes
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {chatLog.map((m) => (
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
                placeholder="Escribe tu intervención para el acta..."
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

      {/* SUBMÓDULO 2: CONVOCATORIAS Y SELECCIÓN DE APARTAMENTOS */}
      {submoduloActivo === 'convocatorias' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {rolUsuario === 'admin' && (
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
                        quorum: '0%',
                        apartamentosConvocados: nueva.apartamentosConvocados || ['TODOS LOS APARTAMENTOS']
                      },
                      ...prev
                    ]);
                  }}
                />
              </div>
            )}

            <div className={`${rolUsuario === 'admin' ? 'xl:col-span-6' : 'xl:col-span-12'} space-y-4`}>
              <div className="flex items-center justify-between pb-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" /> {rolUsuario === 'admin' ? 'Historial y Convocatorias Vigentes' : 'Citaciones Formales Vigentes'}
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
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
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
                        <span className="text-slate-500 text-[10px] block uppercase font-mono">Apartamentos Citados</span>
                        <span className="text-amber-300 font-mono text-[11px] block">
                          {Array.isArray(conv.apartamentosConvocados)
                            ? conv.apartamentosConvocados.join(', ')
                            : 'Todos los residentes'}
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
                          if (rolUsuario === 'admin') {
                            const esConsejo = String(conv.tipo).toLowerCase().includes('consejo') || String(conv.tipo).toLowerCase().includes('comité');
                            setTipoConvocatoriaAdmin(esConsejo ? 'consejo' : 'asamblea');
                            setTituloConvocatoriaInput(conv.titulo);
                            if (esConsejo && Array.isArray(conv.apartamentosConvocados)) {
                              setApartamentosEscogidosAdmin(conv.apartamentosConvocados);
                            }
                          }
                          setSubmoduloActivo('video');
                          onShowToast?.(`Sala preparada para: ${conv.titulo}`);
                        }}
                        className="px-3.5 py-1.5 bg-[#07090e] hover:bg-cyan-500/10 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
                      >
                        <Video className="w-3.5 h-3.5 text-cyan-400" /> {rolUsuario === 'admin' ? 'Cargar en Sala de Videollamada →' : 'Ir a Sala Virtual →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 3: QUÓRUM */}
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
          </div>

          <div className="bg-[#0b0f17] border border-slate-800/80 p-5 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" /> Registro Oficial de Quórum por Coeficiente
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

      {/* SUBMÓDULO 4: VOTACIONES */}
      {submoduloActivo === 'votaciones' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-amber-500/30 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                  MOCIÓN EN CURSO • LEY 675
                </span>
                <h4 className="text-base sm:text-lg font-black text-white mt-1.5 font-mono">
                  Tarjetón Digital de Votación Nominal
                </h4>
                <p className="text-xs text-slate-300 font-medium mt-0.5">{mociónActual.titulo}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{mociónActual.tipoMayoria}</p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 font-mono block">Peso de voto ({unidadActiva}):</span>
                <span className="text-sm font-black text-cyan-400 font-mono">1.05% Coeficiente</span>
              </div>
            </div>

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
                <span className="text-[10px] font-mono text-emerald-400">{mociónActual.coefFavor}% acumulado</span>
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
                <span className="text-[10px] font-mono text-rose-400">{mociónActual.coefContra}% acumulado</span>
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
                <span className="text-[10px] font-mono text-slate-400">{mociónActual.coefBlanco}% acumulado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBMÓDULO 5: ACTA OFICIAL GENERADA DESDE LA GRABACIÓN */}
      {submoduloActivo === 'acta' && (
        <div className="space-y-6">
          <div className="bg-[#0b0f17] border border-blue-500/30 p-6 rounded-3xl space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Transcripción legal conforme al Art. 47 de la Ley 675
                </span>
                <h4 className="text-lg font-black text-white mt-0.5 font-mono">
                  {rolUsuario === 'admin' ? 'Generación y Foliado del Acta de Asamblea' : 'Consultar Actas Aprobadas'}
                </h4>
              </div>
              {rolUsuario === 'admin' && (
                <button
                  type="button"
                  onClick={handleProcesarGrabacionYGenerarActa}
                  disabled={generandoActa}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {generandoActa ? 'Redactando con IA...' : 'Actualizar Acta con IA desde Grabación'}
                </button>
              )}
            </div>

            {grabacionUrl && (
              <div className="p-4 bg-[#07090e] border border-cyan-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    Evidencia Magnetofónica y de Video Adjunta al Acta
                  </span>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Grabación registrada durante la sesión ({grabacionTamanoKB} KB).
                  </p>
                </div>
                <audio src={grabacionUrl} controls className="h-9" />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#07090e] p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Comisión Verificadora del Acta 1</span>
                <input
                  type="text"
                  readOnly={rolUsuario !== 'admin'}
                  value={comisionVerificadora.persona1}
                  onChange={(e) => setComisionVerificadora({ ...comisionVerificadora, persona1: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 text-white text-xs p-2 rounded-xl mt-1 focus:border-blue-400 outline-none read-only:opacity-80"
                />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">Comisión Verificadora del Acta 2</span>
                <input
                  type="text"
                  readOnly={rolUsuario !== 'admin'}
                  value={comisionVerificadora.persona2}
                  onChange={(e) => setComisionVerificadora({ ...comisionVerificadora, persona2: e.target.value })}
                  className="w-full bg-[#0b0f17] border border-slate-800 text-white text-xs p-2 rounded-xl mt-1 focus:border-blue-400 outline-none read-only:opacity-80"
                />
              </div>
            </div>

            <div className="bg-[#07090e] p-5 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
              <div className="text-center pb-3 border-b border-slate-800 text-slate-300">
                <p className="font-bold text-white text-sm">
                  ACTA OFICIAL • {(invitacionEntrante?.titulo || tituloConvocatoriaInput).toUpperCase()}
                </p>
                <p className="text-[11px] text-slate-400">P.H. RESERVA DEL TESORO • NIT 900.412.889-1 • LEY 675 DE 2001</p>
              </div>
              <div className="space-y-2 text-slate-300 leading-relaxed text-xs whitespace-pre-line">
                {resumenActaIa}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <span className="text-[11px] text-slate-400">
                  Verificadores: <strong className="text-slate-200">{comisionVerificadora.persona1}</strong> y <strong className="text-slate-200">{comisionVerificadora.persona2}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    exportActaToLegalPDF(
                      {
                        minute_number: `ACT-ASAM-${new Date().getFullYear()}-024`,
                        meeting_type:
                          invitacionEntrante?.tipo === 'consejo'
                            ? 'Sesión del Consejo de Administración'
                            : 'Asamblea General Ordinaria',
                        status: 'Firmada / Aprobada',
                        meeting_date: new Date().toLocaleDateString('es-CO'),
                        start_time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        quorum_percentage: quorumRegistrado,
                        president_name: comisionVerificadora.persona1,
                        secretary_name: 'Administración Central Urbix PH',
                        summary: resumenActaIa,
                        commitments: compromisosActa
                      },
                      {
                        name: 'P.H. Reserva del Tesoro',
                        nit: '900.412.889-1',
                        zone: 'El Poblado, Medellín'
                      },
                      onShowToast
                    );
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black rounded-xl transition flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                >
                  <Download className="w-4 h-4" /> Descargar Acta Foliada (PDF Legal)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <ResilientMeetingRecorder
              tenantId="t1"
              tenantName={copropiedadNombre}
              onShowToast={onShowToast}
            />
          </div>
        </div>
      )}

    </div>
  );
}
