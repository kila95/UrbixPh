import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const CUSTOM_TURN_URL = (import.meta as any).env?.VITE_TURN_URL || '';
const CUSTOM_TURN_USER = (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject';
const CUSTOM_TURN_CRED = (import.meta as any).env?.VITE_TURN_CREDENTIAL || 'openrelayproject';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    // 1. Servidores STUN de baja latencia (Google + Cloudflare)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // 2. Servidores TURN Relay (UDP + TCP + TLS 443 para atravesar NAT Simétrico / CGNAT 4G/5G al 100%)
    {
      urls: [
        ...(CUSTOM_TURN_URL ? [CUSTOM_TURN_URL] : []),
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: CUSTOM_TURN_USER,
      credential: CUSTOM_TURN_CRED
    }
  ],
  iceCandidatePoolSize: 6,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export type EstadoCitofono = 'disponible' | 'llamando' | 'entrante' | 'conectado' | 'reconectando';
export type SaludConexionIce = 'inactivo' | 'verificando' | 'optima' | 'inestable' | 'reconectando' | 'fallo';

export interface DiagnosticoIceCitofono {
  iceConnectionState: RTCIceConnectionState;
  connectionState: RTCPeerConnectionState;
  iceGatheringState: RTCIceGatheringState;
  salud: SaludConexionIce;
  intentosReconexion: number;
  ultimoErrorCandidato: {
    errorCode?: number;
    errorText?: string;
    url?: string;
    hora?: string;
  } | null;
}

export interface LlamadaActivaCitofono {
  unidad: string;
  torre?: string;
  apartamento?: string;
  nombre: string;
  cargo?: string;
  motivo?: string;
  horaInicio?: string;
  origen: string;
  enEsperaPorVigilante?: boolean;
  offer?: any;
}

interface UseCitofonoProps {
  tenantId?: string;
  miRol: 'residente' | 'vigilante';
  miUnidad?: string;
  miNombre?: string;
  miCargo?: string;
}

const CITOFONO_BROADCAST_BUS = 'urbix_citofono_webrtc_bus_v2';
const CITOFONO_STORAGE_KEY = 'urbix_citofono_live_evt_v2';

// Contexto de audio compartido para tonos de celular (Ringback + Ringtone entrante)
let sharedRingAudioCtx: AudioContext | null = null;

function getOrInitRingAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return null;
    if (!sharedRingAudioCtx || sharedRingAudioCtx.state === 'closed') {
      sharedRingAudioCtx = new Ctx();
    }
    if (sharedRingAudioCtx.state === 'suspended') {
      sharedRingAudioCtx.resume().catch(() => {});
    }
    return sharedRingAudioCtx;
  } catch {
    return null;
  }
}

// Desbloqueo global automático con el primer clic/toque en la aplicación para que el timbre suene siempre al 100%
if (typeof window !== 'undefined') {
  const unlockHandler = () => {
    const ctx = getOrInitRingAudioContext();
    if (ctx && ctx.state === 'running') {
      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
    }
  };
  window.addEventListener('pointerdown', unlockHandler, { passive: true });
  window.addEventListener('keydown', unlockHandler, { passive: true });
}

// 1. Tono de Celular Saliente (Ringback Tone cuando el residente marca a portería: 425Hz + 450Hz con cadencia móvil)
function reproducirPulsoTonoLlamandoCelular() {
  const ctx = getOrInitRingAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.16, now + 0.04);
    masterGain.gain.setValueAtTime(0.16, now + 0.95);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.05);
    masterGain.connect(ctx.destination);

    // Frecuencias estándar de tono de marcado telefónico móvil (425 Hz + 450 Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(425, now);
    osc2.frequency.setValueAtTime(450, now);

    osc1.connect(masterGain);
    osc2.connect(masterGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.06);
    osc2.stop(now + 1.06);
  } catch {
    // ignore
  }
}

// 2. Timbre Sonoro de Celular Entrante (Melodía Smartphone + Trino Digital para el Vigilante / Portería)
function reproducirPatronTimbreCelularEntrante() {
  const ctx = getOrInitRingAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Secuencia melódica estilo smartphone moderno + doble timbre de alerta claro y audible
    const notas: Array<{ freq: number; start: number; dur: number; vol: number; type: OscillatorType }> = [
      // Arpegio cristalino de llamada entrante
      { freq: 783.99, start: 0.0, dur: 0.14, vol: 0.24, type: 'triangle' },  // G5
      { freq: 987.77, start: 0.15, dur: 0.14, vol: 0.24, type: 'triangle' }, // B5
      { freq: 1174.66, start: 0.30, dur: 0.14, vol: 0.26, type: 'triangle' }, // D6
      { freq: 1567.98, start: 0.45, dur: 0.26, vol: 0.28, type: 'sine' },     // G6
      { freq: 1174.66, start: 0.75, dur: 0.14, vol: 0.24, type: 'triangle' }, // D6
      { freq: 1567.98, start: 0.92, dur: 0.36, vol: 0.30, type: 'sine' },     // G6
      // Segundo pulso de confirmación sonora tipo timbre celular ejecutivo
      { freq: 880.0, start: 1.38, dur: 0.12, vol: 0.22, type: 'sine' },       // A5
      { freq: 1318.51, start: 1.52, dur: 0.28, vol: 0.26, type: 'sine' }      // E6
    ];

    notas.forEach((n) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = n.type;
      osc.frequency.setValueAtTime(n.freq, now + n.start);

      gain.gain.setValueAtTime(0.0001, now + n.start);
      gain.gain.exponentialRampToValueAtTime(n.vol, now + n.start + 0.02);
      gain.gain.setValueAtTime(n.vol * 0.85, now + n.start + n.dur - 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + n.start + n.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + n.start);
      osc.stop(now + n.start + n.dur + 0.01);
    });

    // Vibración háptica en dispositivos móviles / tablets de garita
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([250, 100, 250, 100, 350]);
    }
  } catch {
    // ignore
  }
}

// 3. Efecto corto al contestar o colgar
function reproducirEfectoEstadoLlamada(tipo: 'conectado' | 'colgado') {
  const ctx = getOrInitRingAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';

    if (tipo === 'conectado') {
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.0, now + 0.09); // A5
    } else {
      osc.frequency.setValueAtTime(480.0, now);
      osc.frequency.setValueAtTime(320.0, now + 0.1);
    }

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.15, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);
  } catch {
    // ignore
  }
}

function extraerTorreYApto(unidadStr: string): { torre: string; apartamento: string } {
  const limpio = (unidadStr || 'Torre 2 - 301').trim();
  if (limpio.includes('-')) {
    const partes = limpio.split('-').map((p) => p.trim());
    return {
      torre: partes[0] || 'Torre Principal',
      apartamento: partes[1] ? (partes[1].toLowerCase().includes('apto') ? partes[1] : `Apto ${partes[1]}`) : limpio
    };
  }
  return {
    torre: 'Copropiedad PH',
    apartamento: limpio
  };
}

export function useCitofonoEngine({
  tenantId = 't1',
  miRol,
  miUnidad = 'Torre 2 - 301',
  miNombre = 'Esteban Ochoa Mesa',
  miCargo = 'Residente Copropietario'
}: UseCitofonoProps) {
  const [estado, setEstado] = useState<EstadoCitofono>('disponible');
  const [llamadaActiva, setLlamadaActiva] = useState<LlamadaActivaCitofono | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [segundosTimbrando, setSegundosTimbrando] = useState(0);
  const [estaSilenciado, setEstaSilenciado] = useState(false);
  const [timbreSilenciado, setTimbreSilenciado] = useState(false);
  const [errorNotificacion, setErrorNotificacion] = useState<string | null>(null);

  const [diagnosticoIce, setDiagnosticoIce] = useState<DiagnosticoIceCitofono>({
    iceConnectionState: 'new',
    connectionState: 'new',
    iceGatheringState: 'new',
    salud: 'inactivo',
    intentosReconexion: 0,
    ultimoErrorCandidato: null
  });

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const canalRef = useRef<any>(null);
  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const pendingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);
  const disconnectTimeoutRef = useRef<any>(null);
  const intentosIceRef = useRef<number>(0);
  const destinoActualRef = useRef<string>('Garita');
  const processedEventsRef = useRef<Set<string>>(new Set());

  // Mantener refs actualizados para usarlos dentro de listeners sin re-suscribir
  const miUnidadRef = useRef(miUnidad);
  const miNombreRef = useRef(miNombre);
  const miCargoRef = useRef(miCargo);
  useEffect(() => {
    miUnidadRef.current = miUnidad;
    miNombreRef.current = miNombre;
    miCargoRef.current = miCargo;
  }, [miUnidad, miNombre, miCargo]);

  // Emitir señalización por BroadcastChannel + localStorage + Server SSE (/api/asamblea-signal) + Supabase
  const emitirEvento = useCallback((event: string, payload: any) => {
    const eventId = `cit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const enrichedPayload = { ...payload, _eventId: eventId };
    processedEventsRef.current.add(eventId);

    if (canalRef.current) {
      try {
        canalRef.current.send({
          type: 'broadcast',
          event,
          payload: enrichedPayload
        });
      } catch {
        // ignore
      }
    }
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload: enrichedPayload });
      } catch {
        // ignore
      }
    }
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          CITOFONO_STORAGE_KEY,
          JSON.stringify({ event, payload: enrichedPayload, ts: Date.now() })
        );
      } catch {
        // ignore
      }
      fetch('/api/asamblea-signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, payload: enrichedPayload })
      }).catch(() => {});
    }
  }, []);

  // Desbloquear reproducción de audio en navegadores móviles (iOS Safari / Android Chrome)
  const desbloquearAudioMovil = useCallback(() => {
    try {
      getOrInitRingAudioContext();
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

  // Control automático de Tonos de Celular (Saliente y Entrante) + Reloj de Timbrado
  useEffect(() => {
    let ringInterval: any = null;
    let ringTimerInterval: any = null;

    if (estado === 'llamando') {
      setSegundosTimbrando(0);
      reproducirPulsoTonoLlamandoCelular();
      ringInterval = setInterval(() => {
        reproducirPulsoTonoLlamandoCelular();
      }, 2800);
      ringTimerInterval = setInterval(() => {
        setSegundosTimbrando((s) => s + 1);
      }, 1000);
    } else if (estado === 'entrante') {
      ringTimerInterval = setInterval(() => {
        setSegundosTimbrando((s) => s + 1);
      }, 1000);

      if (!timbreSilenciado) {
        reproducirPatronTimbreCelularEntrante();
        ringInterval = setInterval(() => {
          reproducirPatronTimbreCelularEntrante();
        }, 2300);
      }
    } else {
      setSegundosTimbrando(0);
      setTimbreSilenciado(false);
    }

    return () => {
      if (ringInterval) clearInterval(ringInterval);
      if (ringTimerInterval) clearInterval(ringTimerInterval);
    };
  }, [estado, timbreSilenciado]);

  // Drenar candidatos ICE en cola de manera segura una vez exista remoteDescription
  const drenarColaCandidatosIce = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || !pc.remoteDescription.type) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const cand = iceCandidatesQueueRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (e) {
          console.warn('⚠️ [Citófono ICE] Aviso al agregar candidato en cola:', e);
        }
      }
    }
  }, []);

  // Reinicio inteligente de ICE (ICE Restart) para cambios de red móvil (Wi-Fi <-> Datos móviles)
  const ejecutarIceRestart = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || pc.signalingState === 'closed') return;

    intentosIceRef.current += 1;
    setDiagnosticoIce((prev) => ({
      ...prev,
      salud: 'reconectando',
      intentosReconexion: intentosIceRef.current
    }));
    setEstado((prev) => (prev === 'conectado' ? 'reconectando' : prev));

    try {
      if (typeof pc.restartIce === 'function') {
        pc.restartIce();
      }
      const offer = await pc.createOffer({ iceRestart: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      emitirEvento('webrtc_ice_restart', {
        unidad: miRol === 'vigilante' ? 'Garita' : miUnidadRef.current,
        destino: destinoActualRef.current,
        offer: pc.localDescription
      });
    } catch (e) {
      console.warn('⚠️ [Citófono ICE] Error durante ICE Restart:', e);
    }
  }, [emitirEvento, miRol]);

  // Configurar handlers robustos de RTCPeerConnection (oniceconnectionstatechange + onicecandidateerror)
  const configurarEventosPeerConnection = useCallback((pc: RTCPeerConnection, destinoRemoto: string) => {
    destinoActualRef.current = destinoRemoto;

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitirEvento('webrtc_ice', {
          candidate: event.candidate.toJSON ? event.candidate.toJSON() : event.candidate,
          destino: destinoRemoto
        });
      }
    };

    pc.onicegatheringstatechange = () => {
      setDiagnosticoIce((prev) => ({
        ...prev,
        iceGatheringState: pc.iceGatheringState
      }));
    };

    pc.onicecandidateerror = (event: any) => {
      const errorCode = event?.errorCode ?? 0;
      const errorText = event?.errorText || 'Error de negociación STUN/ICE';
      const url = event?.url || 'stun.l.google.com';

      setDiagnosticoIce((prev) => ({
        ...prev,
        ultimoErrorCandidato: {
          errorCode,
          errorText,
          url,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      }));

      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        if (intentosIceRef.current < 3) {
          ejecutarIceRestart();
        }
      }
    };

    pc.oniceconnectionstatechange = () => {
      const iceState = pc.iceConnectionState;
      if (disconnectTimeoutRef.current) {
        clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }

      let nuevaSalud: SaludConexionIce = 'verificando';
      if (iceState === 'connected' || iceState === 'completed') {
        nuevaSalud = 'optima';
        intentosIceRef.current = 0;
        setErrorNotificacion(null);
        setEstado('conectado');
        if (remoteAudioRef.current) {
          remoteAudioRef.current.play().catch(() => {});
        }
      } else if (iceState === 'checking' || iceState === 'new') {
        nuevaSalud = 'verificando';
      } else if (iceState === 'disconnected') {
        nuevaSalud = 'inestable';
        setEstado((prev) => (prev === 'conectado' ? 'reconectando' : prev));
        disconnectTimeoutRef.current = setTimeout(() => {
          if (pcRef.current && pcRef.current.iceConnectionState === 'disconnected') {
            if (intentosIceRef.current < 3) {
              ejecutarIceRestart();
            } else {
              setErrorNotificacion('La señal móvil se interrumpió tras varios intentos de reconexión.');
            }
          }
        }, 2800);
      } else if (iceState === 'failed') {
        nuevaSalud = 'fallo';
        if (intentosIceRef.current < 3) {
          ejecutarIceRestart();
        } else {
          setErrorNotificacion('Fallo de enlace ICE en red móvil. Puedes presionar Reconectar Audio.');
        }
      } else if (iceState === 'closed') {
        nuevaSalud = 'inactivo';
      }

      setDiagnosticoIce((prev) => ({
        ...prev,
        iceConnectionState: iceState,
        salud: nuevaSalud
      }));
    };

    pc.onconnectionstatechange = () => {
      const connState = pc.connectionState;
      setDiagnosticoIce((prev) => ({
        ...prev,
        connectionState: connState
      }));

      if (connState === 'connected') {
        setEstado('conectado');
        setErrorNotificacion(null);
      } else if (connState === 'failed' && intentosIceRef.current < 3) {
        ejecutarIceRestart();
      }
    };

    pc.ontrack = (event) => {
      const remoteStream =
        event.streams && event.streams[0] ? event.streams[0] : new MediaStream([event.track]);
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }
    };
  }, [ejecutarIceRestart, emitirEvento]);

  const cerrarConexion = useCallback((notificar = true) => {
    if (disconnectTimeoutRef.current) {
      clearTimeout(disconnectTimeoutRef.current);
      disconnectTimeoutRef.current = null;
    }

    if (notificar) {
      emitirEvento('terminar_llamada', {
        unidad: miUnidadRef.current,
        origen: miRol === 'vigilante' ? 'Garita' : miUnidadRef.current,
        destino: destinoActualRef.current
      });
    }

    if (pcRef.current) {
      try {
        pcRef.current.oniceconnectionstatechange = null;
        pcRef.current.onicecandidateerror = null;
        pcRef.current.onconnectionstatechange = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }

    iceCandidatesQueueRef.current = [];
    pendingOfferRef.current = null;
    intentosIceRef.current = 0;
    setLlamadaActiva(null);
    setEstaSilenciado(false);
    setTimbreSilenciado(false);
    setEstado('disponible');
    setDiagnosticoIce({
      iceConnectionState: 'closed',
      connectionState: 'closed',
      iceGatheringState: 'new',
      salud: 'inactivo',
      intentosReconexion: 0,
      ultimoErrorCandidato: null
    });
  }, [emitirEvento, miRol]);

  // 1. Inicializar reproductor de audio oculto + Buses en Tiempo Real (BroadcastChannel + Storage + SSE Server + Supabase)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let audio = document.getElementById('urbix-citofono-remote-audio') as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'urbix-citofono-remote-audio';
        audio.autoplay = true;
        audio.setAttribute('playsinline', 'true');
        audio.setAttribute('webkit-playsinline', 'true');
        audio.style.position = 'fixed';
        audio.style.top = '-9999px';
        audio.style.left = '-9999px';
        audio.style.width = '1px';
        audio.style.height = '1px';
        audio.style.opacity = '0';
        document.body.appendChild(audio);
      }
      audio.muted = false;
      audio.volume = 1.0;
      remoteAudioRef.current = audio;
    }

    const procesarMensajeSenalizacion = async (event: string, payload: any) => {
      if (!payload) return;

      // Evitar procesar dos veces el mismo paquete si llega por BroadcastChannel y SSE simultáneamente
      if (payload._eventId) {
        if (processedEventsRef.current.has(payload._eventId)) return;
        processedEventsRef.current.add(payload._eventId);
        if (processedEventsRef.current.size > 300) {
          const first = processedEventsRef.current.values().next().value;
          if (first) processedEventsRef.current.delete(first);
        }
      }

      if (event === 'solicitar_llamada') {
        if (miRol === 'vigilante' && payload.destino === 'Garita') {
          pendingOfferRef.current = payload.offer;
          const unidadEntrante = payload.unidad || 'Torre 2 - 301';
          destinoActualRef.current = unidadEntrante;
          const { torre, apartamento } = extraerTorreYApto(unidadEntrante);
          setTimbreSilenciado(false);
          setSegundosTimbrando(0);
          setLlamadaActiva({
            unidad: unidadEntrante,
            torre: payload.torre || torre,
            apartamento: payload.apartamento || apartamento,
            nombre: payload.nombre || 'Residente Copropietario',
            cargo: payload.cargo || 'Residente Unidad Privada',
            motivo: payload.motivo || 'Llamada directa a Portería Principal',
            horaInicio: payload.horaInicio || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            origen: 'residente',
            enEsperaPorVigilante: false,
            offer: payload.offer
          });
          setEstado('entrante');
        } else if (miRol === 'residente' && payload.destino === miUnidadRef.current) {
          pendingOfferRef.current = payload.offer;
          destinoActualRef.current = 'Garita';
          setTimbreSilenciado(false);
          setSegundosTimbrando(0);
          setLlamadaActiva({
            unidad: 'Portería Principal',
            torre: 'Garita de Seguridad',
            apartamento: 'Portería 24/7',
            nombre: payload.nombre || 'Guarda en Turno (Portería)',
            cargo: 'Seguridad & Control de Accesos',
            motivo: payload.motivo || 'Llamada desde Portería Principal',
            horaInicio: payload.horaInicio || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            origen: 'vigilante',
            enEsperaPorVigilante: false,
            offer: payload.offer
          });
          setEstado('entrante');
        }
      } else if (event === 'citofono_en_espera') {
        if (miRol === 'residente' && payload.destino === miUnidadRef.current) {
          setLlamadaActiva((prev) =>
            prev
              ? {
                  ...prev,
                  enEsperaPorVigilante: true,
                  motivo: payload.mensaje || 'El vigilante recibió tu llamada y te atenderá al terminar su gestión actual.'
                }
              : prev
          );
        }
      } else if (event === 'webrtc_answer') {
        const esMiLlamada =
          (miRol === 'residente' && payload.destino === miUnidadRef.current) ||
          (miRol === 'vigilante' && payload.destino === 'Garita');
        if (esMiLlamada && pcRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await drenarColaCandidatosIce(pcRef.current);
            reproducirEfectoEstadoLlamada('conectado');
            setEstado('conectado');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(() => {});
            }
          } catch (e) {
            console.warn('Error aplicando webrtc_answer:', e);
          }
        }
      } else if (event === 'webrtc_ice_restart') {
        const esParaMi =
          (miRol === 'vigilante' && payload.destino === 'Garita') ||
          (miRol === 'residente' && payload.destino === miUnidadRef.current);
        if (esParaMi && pcRef.current && payload.offer) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
            await drenarColaCandidatosIce(pcRef.current);
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            emitirEvento('webrtc_answer', {
              destino: payload.unidad || destinoActualRef.current,
              answer: pcRef.current.localDescription
            });
            setEstado('conectado');
          } catch (e) {
            console.warn('Error procesando ICE restart:', e);
          }
        }
      } else if (event === 'webrtc_ice') {
        const esParaMi =
          (miRol === 'vigilante' && payload.destino === 'Garita') ||
          (miRol === 'residente' && payload.destino === miUnidadRef.current);
        if (esParaMi && payload.candidate) {
          if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.warn('Aviso candidato ICE:', e);
            }
          } else {
            iceCandidatesQueueRef.current.push(payload.candidate);
          }
        }
      } else if (event === 'terminar_llamada') {
        const involucrado =
          (miRol === 'vigilante' && (payload.destino === 'Garita' || payload.origen === 'Garita')) ||
          (miRol === 'residente' && (payload.destino === miUnidadRef.current || payload.unidad === miUnidadRef.current));
        if (involucrado) {
          reproducirEfectoEstadoLlamada('colgado');
          cerrarConexion(false);
        }
      }
    };

    // A. BroadcastChannel para sincronización instantánea entre pestañas
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CITOFONO_BROADCAST_BUS);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.event) {
          procesarMensajeSenalizacion(ev.data.event, ev.data.payload);
        }
      };
      localBroadcastRef.current = bc;
    }

    // B. Listener de localStorage para ventanas del mismo navegador
    const onStorageEvent = (ev: StorageEvent) => {
      if (ev.key === CITOFONO_STORAGE_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          if (parsed?.event) {
            procesarMensajeSenalizacion(parsed.event, parsed.payload);
          }
        } catch {
          // ignore
        }
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorageEvent);
    }

    // C. Server-Sent Events (SSE) en /api/asamblea-events para sincronización entre distintos dispositivos / celulares
    let sseSource: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sseSource = new EventSource('/api/asamblea-events');
        sseSource.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            if (
              parsed?.event &&
              ['solicitar_llamada', 'citofono_en_espera', 'webrtc_answer', 'webrtc_ice', 'webrtc_ice_restart', 'terminar_llamada'].includes(
                parsed.event
              )
            ) {
              procesarMensajeSenalizacion(parsed.event, parsed.payload);
            }
          } catch {
            // ignore
          }
        };
      } catch {
        // ignore
      }
    }

    // D. Canal Supabase Realtime (si está configurado)
    let canal: any = null;
    if (isSupabaseConfigured) {
      canal = supabase.channel(`citofonia_${tenantId}`, {
        config: { broadcast: { self: false } }
      });

      ['solicitar_llamada', 'citofono_en_espera', 'webrtc_answer', 'webrtc_ice', 'webrtc_ice_restart', 'terminar_llamada'].forEach(
        (evtName) => {
          canal.on('broadcast', { event: evtName }, ({ payload }: any) => {
            procesarMensajeSenalizacion(evtName, payload);
          });
        }
      );

      canal.subscribe();
      canalRef.current = canal;
    }

    return () => {
      if (localBroadcastRef.current) {
        localBroadcastRef.current.close();
        localBroadcastRef.current = null;
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', onStorageEvent);
      }
      if (sseSource) {
        sseSource.close();
      }
      if (canal) {
        supabase.removeChannel(canal);
      }
      cerrarConexion(false);
    };
  }, [tenantId, miRol, cerrarConexion, drenarColaCandidatosIce, emitirEvento]);

  // Cronómetro activo en estado conectado o reconectando
  useEffect(() => {
    let t: any;
    if (estado === 'conectado' || estado === 'reconectando') {
      t = setInterval(() => setSegundos((s) => s + 1), 1000);
    } else {
      setSegundos(0);
    }
    return () => clearInterval(t);
  }, [estado]);

  // Adquirir micrófono con fallback de pista silenciosa si el hardware está ocupado en pruebas móviles/locales
  const obtenerStreamAudioSeguro = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
    } catch {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        const dst = ctx.createMediaStreamDestination();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(dst);
        osc.start();
        setErrorNotificacion('Micrófono físico ocupado; usando canal de voz digital de respaldo.');
        return dst.stream;
      }
      throw new Error('No se pudo inicializar el dispositivo de audio.');
    }
  };

  // INICIAR LLAMADA (Con soporte de motivo, torre/apto y datos completos del residente o garita)
  const iniciarLlamada = async (
    destinoApto?: string,
    motivoPersonalizado?: string,
    nombrePersonalizado?: string,
    cargoPersonalizado?: string
  ) => {
    desbloquearAudioMovil();
    setErrorNotificacion(null);
    const unidadEmisora = miRol === 'vigilante' ? 'Garita' : miUnidadRef.current;
    const nombreEmisor = nombrePersonalizado || miNombreRef.current || 'Residente Copropietario';
    const cargoEmisor = cargoPersonalizado || miCargoRef.current || (miRol === 'vigilante' ? 'Guarda de Seguridad' : 'Residente');
    const motivoFinal =
      motivoPersonalizado?.trim() ||
      (miRol === 'vigilante' ? 'Aviso de Portería Principal' : 'Llamada directa a Portería Principal');

    const destinoFinal = miRol === 'residente' ? 'Garita' : destinoApto || 'Torre 2 - 301';
    destinoActualRef.current = destinoFinal;
    intentosIceRef.current = 0;

    const { torre, apartamento } = extraerTorreYApto(miRol === 'residente' ? unidadEmisora : destinoFinal);
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEstado('llamando');
    setEstaSilenciado(false);
    setTimbreSilenciado(false);
    setLlamadaActiva({
      unidad: destinoFinal,
      torre,
      apartamento,
      nombre: miRol === 'residente' ? 'Portería Principal (Guarda en Turno)' : `Residente (${destinoFinal})`,
      cargo: miRol === 'residente' ? 'Seguridad & Control de Accesos' : 'Unidad Residencial',
      motivo: motivoFinal,
      horaInicio: horaActual,
      origen: miRol,
      enEsperaPorVigilante: false
    });
    setDiagnosticoIce({
      iceConnectionState: 'checking',
      connectionState: 'connecting',
      iceGatheringState: 'gathering',
      salud: 'verificando',
      intentosReconexion: 0,
      ultimoErrorCandidato: null
    });

    try {
      const stream = await obtenerStreamAudioSeguro();
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
        pc.addTrack(t, stream);
      });

      configurarEventosPeerConnection(pc, destinoFinal);

      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);

      emitirEvento('solicitar_llamada', {
        unidad: unidadEmisora,
        torre,
        apartamento,
        nombre: nombreEmisor,
        cargo: cargoEmisor,
        destino: destinoFinal,
        motivo: motivoFinal,
        horaInicio: horaActual,
        offer: pc.localDescription
      });
    } catch (err: any) {
      console.error('Error al iniciar llamada:', err);
      setErrorNotificacion(`No fue posible abrir el canal de voz: ${err?.message || 'Verifica permisos'}`);
      cerrarConexion(false);
    }
  };

  // CONTESTAR LLAMADA
  const contestarLlamada = async () => {
    desbloquearAudioMovil();
    setErrorNotificacion(null);
    setTimbreSilenciado(true);
    const offerToUse = pendingOfferRef.current || llamadaActiva?.offer;
    const destinoRespuesta = miRol === 'vigilante' ? llamadaActiva?.unidad || 'Torre 2 - 301' : 'Garita';
    destinoActualRef.current = destinoRespuesta;

    if (!offerToUse) {
      setErrorNotificacion('Esperando oferta de señalización. Intenta nuevamente.');
      return;
    }

    try {
      const stream = await obtenerStreamAudioSeguro();
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getAudioTracks().forEach((t) => {
        t.enabled = true;
        pc.addTrack(t, stream);
      });

      configurarEventosPeerConnection(pc, destinoRespuesta);

      await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));
      await drenarColaCandidatosIce(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emitirEvento('webrtc_answer', {
        destino: destinoRespuesta,
        answer: pc.localDescription
      });

      reproducirEfectoEstadoLlamada('conectado');
      setEstado('conectado');
      setEstaSilenciado(false);

      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.error('Error al contestar citófono:', err);
      setErrorNotificacion(`Error al conectar audio: ${err?.message || 'Verifica permisos'}`);
      cerrarConexion(true);
    }
  };

  // SILENCIAR TIMBRE SONORO Y PONER EN ESPERA MIENTRAS EL VIGILANTE TERMINA SU GESTIÓN ACTUAL
  const silenciarTimbreYPonerEnEspera = useCallback(() => {
    setTimbreSilenciado(true);
    setLlamadaActiva((prev) => (prev ? { ...prev, enEsperaPorVigilante: true } : prev));
    if (miRol === 'vigilante' && llamadaActiva?.unidad) {
      emitirEvento('citofono_en_espera', {
        destino: llamadaActiva.unidad,
        mensaje: 'El vigilante recibió tu llamada y está terminando una gestión. Te atenderá en unos segundos.'
      });
    }
  }, [emitirEvento, llamadaActiva?.unidad, miRol]);

  const reactivarTimbre = useCallback(() => {
    setTimbreSilenciado(false);
    reproducirPatronTimbreCelularEntrante();
  }, []);

  // FUNCIÓN MUTE (Alterna la pista del micrófono sin reiniciar la conexión)
  const alternarSilencio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setEstaSilenciado(!audioTrack.enabled);
      }
    }
  };

  const colgarLlamada = () => {
    reproducirEfectoEstadoLlamada('colgado');
    cerrarConexion(true);
  };

  const formatearTiempo = (s: number) => {
    const min = Math.floor(s / 60).toString().padStart(2, '0');
    const seg = (s % 60).toString().padStart(2, '0');
    return `${min}:${seg}`;
  };

  return {
    estado,
    segundos,
    segundosTimbrando,
    tiempoFormateado: formatearTiempo(segundos),
    tiempoTimbrandoFormateado: formatearTiempo(segundosTimbrando),
    llamadaActiva,
    colaLlamadas: [],
    estaSilenciado,
    timbreSilenciado,
    errorNotificacion,
    diagnosticoIce,
    alternarSilencio,
    silenciarTimbreYPonerEnEspera,
    reactivarTimbre,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada,
    forzarReinicioIce: ejecutarIceRestart,
    probarTimbreCelular: reproducirPatronTimbreCelularEntrante
  };
}

export type RetornoUseCitofonoEngine = ReturnType<typeof useCitofonoEngine>;
