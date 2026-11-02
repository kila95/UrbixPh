import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ]
};

export type EstadoCitofono = 'disponible' | 'llamando' | 'entrante' | 'conectado';

interface UseCitofonoProps {
  tenantId?: string;
  miRol: 'residente' | 'vigilante';
  miUnidad?: string;
  miNombre?: string;
}

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

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const canalRef = useRef<any>(null);
  const pendingOfferRef = useRef<any>(null);
  const iceCandidatesQueueRef = useRef<RTCIceCandidateInit[]>([]);

  // 1. Inicializar reproductor de audio insertado en el DOM para evitar bloqueos de autoplay en iframes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let audio = document.getElementById('urbix-citofono-remote-audio') as HTMLAudioElement;
      if (!audio) {
        audio = document.createElement('audio');
        audio.id = 'urbix-citofono-remote-audio';
        audio.autoplay = true;
        (audio as any).playsInline = true;
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

    const canal = supabase.channel(`citofonia_${tenantId}`, {
      config: { broadcast: { self: false } }
    });

    // 1. Solicitud entrante
    canal.on('broadcast', { event: 'solicitar_llamada' }, ({ payload }) => {
      console.log('📡 [Citófono] Solicitud entrante recibida:', payload);
      if (miRol === 'vigilante' && payload.destino === 'Garita') {
        pendingOfferRef.current = payload.offer;
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
        setLlamadaActiva({
          unidad: 'Portería Principal',
          nombre: payload.nombre || 'Guarda en Turno',
          origen: 'vigilante',
          offer: payload.offer
        });
        setEstado('entrante');
      }
    });

    // 2. Respuesta al contestar
    canal.on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
      console.log('📡 [Citófono] Respuesta webrtc_answer recibida:', payload);
      const esMiLlamada = (miRol === 'residente' && payload.destino === miUnidad) ||
                          (miRol === 'vigilante' && payload.destino === 'Garita');
      if (esMiLlamada && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setEstado('conectado');

          // Drenar candidatos ICE acumulados en cola
          if (iceCandidatesQueueRef.current.length > 0) {
            for (const cand of iceCandidatesQueueRef.current) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(cand));
              } catch (e) {
                console.warn('Aviso drenando candidato ICE en caller:', e);
              }
            }
            iceCandidatesQueueRef.current = [];
          }

          // Despertar reproducción de audio remoto
          if (remoteAudioRef.current) {
            remoteAudioRef.current.play().catch(e => console.warn('Audio play trigger:', e));
          }
        } catch (e) {
          console.error('Error setRemoteDescription en caller:', e);
        }
      }
    });

    // 3. Candidatos ICE con buffering para no perder candidatos si llegan antes de contestar
    canal.on('broadcast', { event: 'webrtc_ice' }, async ({ payload }) => {
      const esParaMi = (miRol === 'vigilante' && payload.destino === 'Garita') ||
                       (miRol === 'residente' && payload.destino === miUnidad);
      if (esParaMi && payload.candidate) {
        if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
          try {
            await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch (e) {
            console.warn('Aviso candidato ICE inmediato:', e);
          }
        } else {
          // Si la conexión aún no tiene remoteDescription (p. ej. timbrando antes de contestar), guardar en cola
          iceCandidatesQueueRef.current.push(payload.candidate);
        }
      }
    });

    // 4. Fin de llamada
    canal.on('broadcast', { event: 'terminar_llamada' }, ({ payload }) => {
      const involucrado = (miRol === 'vigilante' && (payload.destino === 'Garita' || payload.origen === 'Garita')) ||
                          (miRol === 'residente' && (payload.destino === miUnidad || payload.unidad === miUnidad));
      if (involucrado) {
        cerrarConexion(false);
      }
    });

    canal.subscribe();
    canalRef.current = canal;

    return () => {
      supabase.removeChannel(canal);
      cerrarConexion(false);
    };
  }, [tenantId, miRol, miUnidad]);

  // Cronómetro
  useEffect(() => {
    let t: any;
    if (estado === 'conectado') {
      t = setInterval(() => setSegundos(s => s + 1), 1000);
    } else {
      setSegundos(0);
    }
    return () => clearInterval(t);
  }, [estado]);

  // INICIAR LLAMADA
  const iniciarLlamada = async (destinoApto?: string) => {
    const destinoFinal = miRol === 'residente' ? 'Garita' : (destinoApto || 'Torre 2 - 301');
    setEstado('llamando');
    setEstaSilenciado(false);
    setLlamadaActiva({
      unidad: destinoFinal,
      nombre: miRol === 'residente' ? 'Portería / Garita' : `Residente (${destinoFinal})`,
      origen: miRol
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      // 1. Agregar pistas de audio y garantizar que arranquen con enabled = true
      stream.getAudioTracks().forEach(t => {
        t.enabled = true;
        pc.addTrack(t, stream);
      });

      // 2. Escuchar audio remoto y asociar al elemento de audio insertado en el DOM
      pc.ontrack = (event) => {
        console.log('🔊 [WebRTC] Audio remoto recibido (ontrack):', event.streams, event.track);
        const remoteStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(e => console.warn('Audio play caller deferred:', e));
        }
      };

      // 3. Negociar ICE
      pc.onicecandidate = (event) => {
        if (event.candidate && canalRef.current) {
          canalRef.current.send({
            type: 'broadcast',
            event: 'webrtc_ice',
            payload: { candidate: event.candidate, destino: destinoFinal }
          });
        }
      };

      // 4. Crear oferta y emitir
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      canalRef.current?.send({
        type: 'broadcast',
        event: 'solicitar_llamada',
        payload: {
          unidad: miRol === 'vigilante' ? 'Garita' : miUnidad,
          nombre: miNombre,
          destino: destinoFinal,
          motivo: 'Llamada directa desde citófono',
          offer: offer
        }
      });
    } catch (err: any) {
      console.error('Error al iniciar llamada:', err);
      alert(`Error al acceder al micrófono: ${err.message || 'Permiso denegado'}`);
      cerrarConexion(false);
    }
  };

  // CONTESTAR LLAMADA
  const contestarLlamada = async () => {
    const offerToUse = pendingOfferRef.current || llamadaActiva?.offer;
    const destinoRespuesta = miRol === 'vigilante' ? (llamadaActiva?.unidad || 'Torre 2 - 301') : 'Garita';

    if (!offerToUse) {
      alert('Aviso: Esperando oferta de llamada. Vuelve a intentar marcar.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      // 1. Agregar pistas locales de audio activas
      stream.getAudioTracks().forEach(t => {
        t.enabled = true;
        pc.addTrack(t, stream);
      });

      // 2. Escuchar audio entrante
      pc.ontrack = (event) => {
        console.log('🔊 [WebRTC] Audio remoto recibido al contestar:', event.streams, event.track);
        const remoteStream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = remoteStream;
          remoteAudioRef.current.muted = false;
          remoteAudioRef.current.volume = 1.0;
          remoteAudioRef.current.play().catch(e => console.warn('Audio play answerer deferred:', e));
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && canalRef.current) {
          canalRef.current.send({
            type: 'broadcast',
            event: 'webrtc_ice',
            payload: { candidate: event.candidate, destino: destinoRespuesta }
          });
        }
      };

      // 3. Establecer oferta remota
      await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));

      // 4. Drenar candidatos ICE que llegaron mientras timbraba
      if (iceCandidatesQueueRef.current.length > 0) {
        for (const cand of iceCandidatesQueueRef.current) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.warn('Aviso drenando candidato ICE en answerer:', e);
          }
        }
        iceCandidatesQueueRef.current = [];
      }

      // 5. Crear respuesta y emitir
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      canalRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_answer',
        payload: { destino: destinoRespuesta, answer }
      });

      setEstado('conectado');
      setEstaSilenciado(false);

      if (remoteAudioRef.current) {
        remoteAudioRef.current.play().catch(e => console.warn('Play answerer trigger:', e));
      }
    } catch (err: any) {
      console.error('Error al contestar citófono:', err);
      alert(`Error al conectar audio: ${err.message || 'Verifica permisos'}`);
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
        console.log('🎤 Micrófono local:', audioTrack.enabled ? 'ACTIVO' : 'SILENCIADO');
      }
    }
  };

  const colgarLlamada = () => {
    cerrarConexion(true);
  };

  const cerrarConexion = (notificar = true) => {
    if (notificar && canalRef.current) {
      canalRef.current.send({
        type: 'broadcast',
        event: 'terminar_llamada',
        payload: { unidad: miUnidad, destino: llamadaActiva?.unidad }
      });
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    iceCandidatesQueueRef.current = [];
    pendingOfferRef.current = null;
    setLlamadaActiva(null);
    setEstaSilenciado(false);
    setEstado('disponible');
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
    alternarSilencio,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada
  };
}
