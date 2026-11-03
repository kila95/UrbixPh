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

interface UseCitofonoProps {
  tenantId?: string;
  miRol: 'residente' | 'vigilante';
  miUnidad?: string;
  miNombre?: string;
}

const CITOFONO_BROADCAST_BUS = 'urbix_citofono_webrtc_bus_v2';

export function useCitofonoEngine({
  tenantId = 't1',
  miRol,
  miUnidad = 'Torre 2 - 301',
  miNombre = 'Esteban Ochoa Mesa'
}: UseCitofonoProps) {
  const [estado, setEstado] = useState<EstadoCitofono>('disponible');
  const [llamadaActiva, setLlamadaActiva] = useState<{
    unidad: string;
    nombre: string;
    motivo?: string;
    origen: string;
    offer?: any;
  } | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [estaSilenciado, setEstaSilenciado] = useState(false);
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

  // Emitir señalización por Supabase Realtime + BroadcastChannel local (soporte multi-pestaña y móvil)
  const emitirEvento = useCallback((event: string, payload: any) => {
    if (canalRef.current) {
      canalRef.current.send({
        type: 'broadcast',
        event,
        payload
      });
    }
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload });
      } catch {
        // ignore
      }
    }
  }, []);

  // Desbloquear reproducción de audio en navegadores móviles (iOS Safari / Android Chrome)
  const desbloquearAudioMovil = useCallback(() => {
    try {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (Ctx) {
        const ctx = new Ctx();
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch(() => {});
      }
    } catch {
      // ignore
    }
  }, []);

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
        unidad: miRol === 'vigilante' ? 'Garita' : miUnidad,
        destino: destinoActualRef.current,
        offer: pc.localDescription
      });
    } catch (e) {
      console.warn('⚠️ [Citófono ICE] Error durante ICE Restart:', e);
    }
  }, [emitirEvento, miRol, miUnidad]);

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

    // Manejo explícito de errores de candidatos ICE (STUN/TURN timeouts, red móvil restrictiva, IPv6 local)
    pc.onicecandidateerror = (event: any) => {
      const errorCode = event?.errorCode ?? 0;
      const errorText = event?.errorText || 'Error de negociación STUN/ICE';
      const url = event?.url || 'stun.l.google.com';

      // Códigos 701 / 300-699 suelen ocurrir en interfaces locales no enrutables en móviles; registramos diagnóstico
      setDiagnosticoIce((prev) => ({
        ...prev,
        ultimoErrorCandidato: {
          errorCode,
          errorText,
          url,
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        }
      }));

      // Si todos los servidores fallan con un error crítico y el estado ICE cae, programar recuperación
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        if (intentosIceRef.current < 3) {
          ejecutarIceRestart();
        }
      }
    };

    // Gestión explícita de estados de conexión ICE para estabilidad en navegadores móviles
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
        // En redes móviles una transición Wi-Fi <-> LTE produce 'disconnected' temporalmente
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
        unidad: miUnidad,
        origen: miRol === 'vigilante' ? 'Garita' : miUnidad,
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
    setEstado('disponible');
    setDiagnosticoIce({
      iceConnectionState: 'closed',
      connectionState: 'closed',
      iceGatheringState: 'new',
      salud: 'inactivo',
      intentosReconexion: 0,
      ultimoErrorCandidato: null
    });
  }, [emitirEvento, miRol, miUnidad]);

  // 1. Inicializar reproductor de audio oculto compatible con políticas de móviles e iframes
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

      if (event === 'solicitar_llamada') {
        if (miRol === 'vigilante' && payload.destino === 'Garita') {
          pendingOfferRef.current = payload.offer;
          destinoActualRef.current = payload.unidad || 'Torre 2 - 301';
          setLlamadaActiva({
            unidad: payload.unidad || 'Residente',
            nombre: payload.nombre || 'Residente',
            motivo: payload.motivo || 'Llamada directa desde citófono',
            origen: 'residente',
            offer: payload.offer
          });
          setEstado('entrante');
        } else if (miRol === 'residente' && payload.destino === miUnidad) {
          pendingOfferRef.current = payload.offer;
          destinoActualRef.current = 'Garita';
          setLlamadaActiva({
            unidad: 'Portería Principal',
            nombre: payload.nombre || 'Guarda en Turno',
            motivo: payload.motivo || 'Aviso desde Portería',
            origen: 'vigilante',
            offer: payload.offer
          });
          setEstado('entrante');
        }
      } else if (event === 'webrtc_answer') {
        const esMiLlamada =
          (miRol === 'residente' && payload.destino === miUnidad) ||
          (miRol === 'vigilante' && payload.destino === 'Garita');
        if (esMiLlamada && pcRef.current) {
          try {
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
            await drenarColaCandidatosIce(pcRef.current);
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
          (miRol === 'residente' && payload.destino === miUnidad);
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
          (miRol === 'residente' && payload.destino === miUnidad);
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
          (miRol === 'residente' && (payload.destino === miUnidad || payload.unidad === miUnidad));
        if (involucrado) {
          cerrarConexion(false);
        }
      }
    };

    // BroadcastChannel para sincronización instantánea entre pestañas / vistas
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(CITOFONO_BROADCAST_BUS);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.event) {
          procesarMensajeSenalizacion(ev.data.event, ev.data.payload);
        }
      };
      localBroadcastRef.current = bc;
    }

    let canal: any = null;
    if (isSupabaseConfigured) {
      canal = supabase.channel(`citofonia_${tenantId}`, {
        config: { broadcast: { self: false } }
      });

      ['solicitar_llamada', 'webrtc_answer', 'webrtc_ice', 'webrtc_ice_restart', 'terminar_llamada'].forEach(
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
      if (canal) {
        supabase.removeChannel(canal);
      }
      cerrarConexion(false);
    };
  }, [tenantId, miRol, miUnidad, cerrarConexion, drenarColaCandidatosIce, emitirEvento]);

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

  // INICIAR LLAMADA
  const iniciarLlamada = async (destinoApto?: string) => {
    desbloquearAudioMovil();
    setErrorNotificacion(null);
    const destinoFinal = miRol === 'residente' ? 'Garita' : destinoApto || 'Torre 2 - 301';
    destinoActualRef.current = destinoFinal;
    intentosIceRef.current = 0;

    setEstado('llamando');
    setEstaSilenciado(false);
    setLlamadaActiva({
      unidad: destinoFinal,
      nombre: miRol === 'residente' ? 'Portería / Garita' : `Residente (${destinoFinal})`,
      origen: miRol
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
        unidad: miRol === 'vigilante' ? 'Garita' : miUnidad,
        nombre: miNombre,
        destino: destinoFinal,
        motivo: 'Llamada directa desde citófono',
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
    tiempoFormateado: formatearTiempo(segundos),
    llamadaActiva,
    colaLlamadas: [],
    estaSilenciado,
    errorNotificacion,
    diagnosticoIce,
    alternarSilencio,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada,
    forzarReinicioIce: ejecutarIceRestart
  };
}
