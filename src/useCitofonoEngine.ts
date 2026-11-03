import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// 4. SANITIZACIÓN Y CARGA SEGURA DE VARIABLES DE ENTORNO (PRODUCCIÓN & FALLBACK)
const CUSTOM_TURN_URL = (import.meta as any).env?.VITE_TURN_URL || '';
const CUSTOM_TURN_USER = (import.meta as any).env?.VITE_TURN_USERNAME || 'openrelayproject';
const CUSTOM_TURN_CRED =
  (import.meta as any).env?.VITE_TURN_CREDENTIAL ||
  (import.meta as any).env?.VITE_TURN_CREDENTIA ||
  'openrelayproject';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
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

export interface RegistroLlamadaHistorial {
  id: string;
  tipo: 'Entrante' | 'Saliente' | 'Perdida';
  origen: string;
  destino: string;
  hora: string;
  duracionSegundos: number;
  motivo?: string;
}

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
const HISTORIAL_STORAGE_KEY = 'urbix_citofono_historial_v3';

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

// Tonos sintéticos Web Audio (Bip + Tono Entrante + Tono Saliente de Celular)
function reproducirBip(freq: number, dur: number) {
  try {
    const ctx = getOrInitRingAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  } catch {}
}

function reproducirTonoEntrante() {
  reproducirBip(880, 0.25);
  setTimeout(() => reproducirBip(1174, 0.35), 260);
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([220, 100, 260]);
  }
}

function reproducirPulsoTonoLlamandoCelular() {
  const ctx = getOrInitRingAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.exponentialRampToValueAtTime(0.15, now + 0.04);
    masterGain.gain.setValueAtTime(0.15, now + 0.85);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.95);
    masterGain.connect(ctx.destination);

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
    osc1.stop(now + 0.96);
    osc2.stop(now + 0.96);
  } catch {}
}

function extraerTorreYApto(unidadStr: string): { torre: string; apartamento: string } {
  const limpio = (unidadStr || 'Torre 2 - 301').trim();
  if (limpio.includes('-')) {
    const partes = limpio.split('-').map((p) => p.trim());
    return {
      torre: partes[0] || 'Torre Principal',
      apartamento: partes[1]
        ? partes[1].toLowerCase().includes('apto')
          ? partes[1]
          : `Apto ${partes[1]}`
        : limpio
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
  miNombre = 'Martha Lucía Gómez',
  miCargo = 'Residente'
}: UseCitofonoProps) {
  const [estado, setEstado] = useState<EstadoCitofono>('disponible');
  const [llamadaActiva, setLlamadaActiva] = useState<LlamadaActivaCitofono | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [segundosTimbrando, setSegundosTimbrando] = useState(0);
  const [estaSilenciado, setEstaSilenciado] = useState(false);
  const [timbreSilenciado, setTimbreSilenciado] = useState(false);
  const [errorNotificacion, setErrorNotificacion] = useState<string | null>(null);
  const [historialLlamadas, setHistorialLlamadas] = useState<RegistroLlamadaHistorial[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const guardado = localStorage.getItem(HISTORIAL_STORAGE_KEY);
      return guardado ? JSON.parse(guardado) : [];
    } catch {
      return [];
    }
  });

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
  const llamadaActivaRef = useRef<LlamadaActivaCitofono | null>(null);
  llamadaActivaRef.current = llamadaActiva;

  const miUnidadRef = useRef(miUnidad);
  const miNombreRef = useRef(miNombre);
  const miCargoRef = useRef(miCargo);
  useEffect(() => {
    miUnidadRef.current = miUnidad;
    miNombreRef.current = miNombre;
    miCargoRef.current = miCargo;
  }, [miUnidad, miNombre, miCargo]);

  const agregarAlHistorial = useCallback((registro: Omit<RegistroLlamadaHistorial, 'id'>) => {
    const nuevo: RegistroLlamadaHistorial = { ...registro, id: `call-${Date.now()}` };
    setHistorialLlamadas((prev) => {
      const act = [nuevo, ...prev.slice(0, 49)];
      try {
        localStorage.setItem(HISTORIAL_STORAGE_KEY, JSON.stringify(act));
      } catch {}
      return act;
    });
  }, []);

  // 1. DESBLOQUEO GLOBAL DE AUDIO POR INTERACCIÓN DEL USUARIO (PREVIENE RESTRICCIONES DE AUTOPLAY)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const desbloquear = () => {
      const ctx = getOrInitRingAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (remoteAudioRef.current && remoteAudioRef.current.paused && remoteAudioRef.current.srcObject) {
        remoteAudioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', desbloquear, { once: false, passive: true });
    window.addEventListener('touchstart', desbloquear, { once: false, passive: true });
    window.addEventListener('keydown', desbloquear, { once: false, passive: true });

    return () => {
      window.removeEventListener('click', desbloquear);
      window.removeEventListener('touchstart', desbloquear);
      window.removeEventListener('keydown', desbloquear);
    };
  }, []);

  // Mensajería en Tiempo Real (Supabase Broadcast + BroadcastChannel + localStorage + SSE Server)
  const emitirEvento = useCallback(
    (event: string, payload: any) => {
      const eventId = `cit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const enrichedPayload = {
        ...payload,
        emisorRol: miRol,
        emisorUnidad: miUnidadRef.current,
        timestamp: Date.now(),
        _eventId: eventId
      };
      processedEventsRef.current.add(eventId);

      if (canalRef.current) {
        try {
          canalRef.current.send({
            type: 'broadcast',
            event,
            payload: enrichedPayload
          });
        } catch {}
      }
      if (localBroadcastRef.current) {
        try {
          localBroadcastRef.current.postMessage({ event, payload: enrichedPayload });
        } catch {}
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            CITOFONO_STORAGE_KEY,
            JSON.stringify({ event, payload: enrichedPayload, ts: Date.now() })
          );
        } catch {}
        fetch('/api/asamblea-signal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event, payload: enrichedPayload })
        }).catch(() => {});
      }
    },
    [miRol]
  );

  const cerrarConexion = useCallback(
    (notificar = true) => {
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
      setEstado('disponible');
      setLlamadaActiva(null);
      setSegundosTimbrando(0);
      setEstaSilenciado(false);
      setTimbreSilenciado(false);
      setDiagnosticoIce({
        iceConnectionState: 'closed',
        connectionState: 'closed',
        iceGatheringState: 'new',
        salud: 'inactivo',
        intentosReconexion: 0,
        ultimoErrorCandidato: null
      });
    },
    [emitirEvento, miRol]
  );

  // 2. TEMPORIZADOR DE 45 SEGUNDOS (CORTE AUTOMÁTICO Y LLAMADA PERDIDA) + TONOS ENTRANTE / SALIENTE
  useEffect(() => {
    let interval: any = null;
    if (estado === 'llamando' || estado === 'entrante') {
      if (estado === 'entrante' && !timbreSilenciado) {
        reproducirTonoEntrante();
      } else if (estado === 'llamando') {
        reproducirPulsoTonoLlamandoCelular();
      }

      interval = setInterval(() => {
        setSegundosTimbrando((s) => {
          const prox = s + 1;
          if (estado === 'entrante' && !timbreSilenciado && prox % 2 === 0) {
            reproducirTonoEntrante();
          } else if (estado === 'llamando' && prox % 3 === 0) {
            reproducirPulsoTonoLlamandoCelular();
          }

          if (prox >= 45) {
            // Se excedieron los 45s sin respuesta
            if (estado === 'llamando') {
              emitirEvento('terminar_llamada', { motivo: 'timeout_45s' });
              agregarAlHistorial({
                tipo: 'Perdida',
                origen: miUnidadRef.current,
                destino: 'Garita Principal',
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duracionSegundos: 0,
                motivo: 'Sin respuesta en portería (Tiempo agotado 45s)'
              });
              setErrorNotificacion('Portería no disponible en el momento. Llamada finalizada.');
            } else if (estado === 'entrante') {
              agregarAlHistorial({
                tipo: 'Perdida',
                origen: llamadaActivaRef.current?.unidad || 'Residente',
                destino: 'Garita Principal',
                hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                duracionSegundos: 0,
                motivo: llamadaActivaRef.current?.motivo || 'Llamada no contestada por vigilancia'
              });
              setErrorNotificacion('Llamada entrante no contestada (registrada como pérdida).');
            }
            cerrarConexion(false);
          }
          return prox;
        });
      }, 1000);
    } else {
      setSegundosTimbrando(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [estado, timbreSilenciado, emitirEvento, agregarAlHistorial, cerrarConexion]);

  // Cronómetro de llamada activa
  useEffect(() => {
    let t: any = null;
    if (estado === 'conectado' || estado === 'reconectando') {
      t = setInterval(() => setSegundos((s) => s + 1), 1000);
    } else {
      setSegundos(0);
    }
    return () => {
      if (t) clearInterval(t);
    };
  }, [estado]);

  // Drenar candidatos ICE en cola una vez exista remoteDescription
  const drenarColaCandidatosIce = useCallback(async (pc: RTCPeerConnection) => {
    if (!pc.remoteDescription || !pc.remoteDescription.type) return;
    while (iceCandidatesQueueRef.current.length > 0) {
      const cand = iceCandidatesQueueRef.current.shift();
      if (cand) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch {}
      }
    }
  }, []);

  // Reinicio inteligente de ICE (ICE Restart)
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
    } catch {}
  }, [emitirEvento, miRol]);

  // Configurar eventos RTCPeerConnection
  const configurarEventosPeerConnection = useCallback(
    (pc: RTCPeerConnection, destinoRemoto: string) => {
      destinoActualRef.current = destinoRemoto;

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          emitirEvento('webrtc_ice', {
            candidate: e.candidate.toJSON ? e.candidate.toJSON() : e.candidate,
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
        setDiagnosticoIce((prev) => ({
          ...prev,
          ultimoErrorCandidato: {
            errorCode: event?.errorCode ?? 0,
            errorText: event?.errorText || 'Error de negociación STUN/ICE',
            url: event?.url || 'stun.l.google.com',
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          }
        }));
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
              }
            }
          }, 2800);
        } else if (iceState === 'failed') {
          nuevaSalud = 'fallo';
          if (intentosIceRef.current < 3) {
            ejecutarIceRestart();
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
    },
    [ejecutarIceRestart, emitirEvento]
  );

  // Suscripción al bus (Supabase CITOFONO_BROADCAST_BUS + BroadcastChannel + localStorage + SSE Server)
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

    const procesarMensaje = async (event: string, payload: any) => {
      if (!payload) return;

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
            nombre: payload.nombre || 'Residente',
            cargo: payload.cargo || 'Residente',
            motivo: payload.motivo || 'Consulta con portería',
            horaInicio: payload.horaInicio || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            origen: unidadEntrante,
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
            motivo: payload.motivo || 'Aviso desde Portería Principal',
            horaInicio: payload.horaInicio || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            origen: 'Garita',
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
                  motivo:
                    payload.mensaje ||
                    'El vigilante recibió tu llamada y te atenderá al terminar su gestión actual.'
                }
              : prev
          );
        }
      } else if (event === 'webrtc_answer') {
        if (pcRef.current && payload.answer) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await drenarColaCandidatosIce(pcRef.current);
            setEstado('conectado');
            if (remoteAudioRef.current) {
              remoteAudioRef.current.play().catch(() => {});
            }
          } catch {}
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
          } catch {}
        }
      } else if (event === 'webrtc_ice') {
        if (payload.candidate) {
          if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
            try {
              await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {}
          } else {
            iceCandidatesQueueRef.current.push(payload.candidate);
          }
        }
      } else if (event === 'terminar_llamada') {
        cerrarConexion(false);
      }
    };

    // 1. BroadcastChannel entre pestañas locales
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CITOFONO_BROADCAST_BUS);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.event) {
          procesarMensaje(ev.data.event, ev.data.payload);
        }
      };
      localBroadcastRef.current = bc;
    }

    // 2. Storage listener
    const onStorageEvent = (ev: StorageEvent) => {
      if (ev.key === CITOFONO_STORAGE_KEY && ev.newValue) {
        try {
          const parsed = JSON.parse(ev.newValue);
          if (parsed?.event) {
            procesarMensaje(parsed.event, parsed.payload);
          }
        } catch {}
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', onStorageEvent);
    }

    // 3. SSE Server-Sent Events (/api/asamblea-events)
    let sseSource: EventSource | null = null;
    if (typeof window !== 'undefined' && 'EventSource' in window) {
      try {
        sseSource = new EventSource('/api/asamblea-events');
        sseSource.onmessage = (ev) => {
          try {
            const parsed = JSON.parse(ev.data);
            if (
              parsed?.event &&
              [
                'solicitar_llamada',
                'citofono_en_espera',
                'webrtc_answer',
                'webrtc_ice',
                'webrtc_ice_restart',
                'terminar_llamada'
              ].includes(parsed.event)
            ) {
              procesarMensaje(parsed.event, parsed.payload);
            }
          } catch {}
        };
      } catch {}
    }

    // 4. Canal Supabase Broadcast (CITOFONO_BROADCAST_BUS)
    let canal: any = null;
    if (isSupabaseConfigured) {
      canal = supabase.channel(CITOFONO_BROADCAST_BUS, {
        config: { broadcast: { self: false } }
      });

      canal
        .on('broadcast', { event: 'solicitar_llamada' }, ({ payload }: any) => {
          procesarMensaje('solicitar_llamada', payload);
        })
        .on('broadcast', { event: 'citofono_en_espera' }, ({ payload }: any) => {
          procesarMensaje('citofono_en_espera', payload);
        })
        .on('broadcast', { event: 'webrtc_answer' }, ({ payload }: any) => {
          procesarMensaje('webrtc_answer', payload);
        })
        .on('broadcast', { event: 'webrtc_ice_restart' }, ({ payload }: any) => {
          procesarMensaje('webrtc_ice_restart', payload);
        })
        .on('broadcast', { event: 'webrtc_ice' }, ({ payload }: any) => {
          procesarMensaje('webrtc_ice', payload);
        })
        .on('broadcast', { event: 'terminar_llamada' }, ({ payload }: any) => {
          procesarMensaje('terminar_llamada', payload || {});
        })
        .subscribe();

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

  // Obtener stream de audio con respaldo sintético si el micrófono físico está ocupado en pruebas
  const obtenerStreamAudio = async (): Promise<MediaStream> => {
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
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
        return dst.stream;
      }
      throw new Error('Permiso de micrófono no concedido o no disponible.');
    }
  };

  const iniciarLlamada = async (
    destino = 'Garita',
    motivo = 'Consulta con portería',
    nombrePersonalizado?: string,
    cargoPersonalizado?: string
  ) => {
    try {
      setErrorNotificacion(null);
      const stream = await obtenerStreamAudio();
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));

      const destinoFinal = miRol === 'residente' ? 'Garita' : destino || 'Torre 2 - 301';
      configurarEventosPeerConnection(pc, destinoFinal);

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const unidadEmisora = miRol === 'vigilante' ? 'Garita' : miUnidadRef.current;
      const nombreEmisor = nombrePersonalizado || miNombreRef.current || 'Residente';
      const cargoEmisor = cargoPersonalizado || miCargoRef.current || 'Residente';
      const { torre, apartamento } = extraerTorreYApto(
        miRol === 'residente' ? unidadEmisora : destinoFinal
      );
      const horaInicio = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setLlamadaActiva({
        unidad: destinoFinal,
        torre,
        apartamento,
        nombre: miRol === 'residente' ? 'Portería Principal' : nombreEmisor,
        cargo: miRol === 'residente' ? 'Seguridad & Garita' : cargoEmisor,
        motivo,
        horaInicio,
        origen: unidadEmisora,
        offer: pc.localDescription
      });

      emitirEvento('solicitar_llamada', {
        unidad: unidadEmisora,
        torre,
        apartamento,
        nombre: nombreEmisor,
        cargo: cargoEmisor,
        destino: destinoFinal,
        motivo,
        horaInicio,
        offer: pc.localDescription
      });

      setEstado('llamando');
    } catch {
      setErrorNotificacion('Permiso de micrófono no concedido o no disponible.');
      cerrarConexion(false);
    }
  };

  const contestarLlamada = async () => {
    const offerToUse = pendingOfferRef.current || llamadaActiva?.offer;
    if (!offerToUse) return;
    try {
      setErrorNotificacion(null);
      setTimbreSilenciado(true);
      const stream = await obtenerStreamAudio();
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getAudioTracks().forEach((t) => pc.addTrack(t, stream));

      const destinoRespuesta = miRol === 'vigilante' ? llamadaActiva?.unidad || 'Torre 2 - 301' : 'Garita';
      configurarEventosPeerConnection(pc, destinoRespuesta);

      await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));
      await drenarColaCandidatosIce(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      emitirEvento('webrtc_answer', {
        destino: destinoRespuesta,
        answer: pc.localDescription
      });
      setEstado('conectado');
      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(() => {});
      }
    } catch {
      setErrorNotificacion('Error al conectar audio.');
      cerrarConexion(true);
    }
  };

  const alternarSilencio = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setEstaSilenciado(!track.enabled);
      }
    }
  };

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
    reproducirTonoEntrante();
  }, []);

  const colgarLlamada = useCallback(() => {
    if (estado === 'conectado' && llamadaActivaRef.current) {
      agregarAlHistorial({
        tipo: miRol === 'residente' ? 'Saliente' : 'Entrante',
        origen: llamadaActivaRef.current.origen || miUnidadRef.current,
        destino: miRol === 'residente' ? 'Garita Principal' : llamadaActivaRef.current.unidad,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duracionSegundos: segundos,
        motivo: llamadaActivaRef.current.motivo || 'Llamada finalizada'
      });
    }
    cerrarConexion(true);
  }, [estado, miRol, segundos, agregarAlHistorial, cerrarConexion]);

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
    historialLlamadas,
    diagnosticoIce,
    alternarSilencio,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada,
    silenciarTimbreYPonerEnEspera,
    reactivarTimbre,
    forzarReinicioIce: ejecutarIceRestart,
    probarTimbreCelular: reproducirTonoEntrante
  };
}

export type RetornoUseCitofonoEngine = ReturnType<typeof useCitofonoEngine>;
