import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';

const ICE_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export type EstadoCitofono = 'disponible' | 'llamando' | 'entrante' | 'conectado';

interface UseCitofonoProps {
  tenantId?: string;
  miRol: 'residente' | 'vigilante';
  miUnidad?: string; // Ej: "Torre 2 - 301"
  miNombre?: string; // Ej: "Esteban Ochoa Mesa"
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

  useEffect(() => {
    if (!remoteAudioRef.current && typeof window !== 'undefined') {
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
    }

    const canal = supabase.channel(`citofonia_${tenantId}`, {
      config: { broadcast: { self: false } }
    });

    // 1. Recibir solicitud con la oferta SDP incluida directamente
    canal.on('broadcast', { event: 'solicitar_llamada' }, ({ payload }) => {
      console.log('Solicitud entrante recibida:', payload);
      if (miRol === 'vigilante' && payload.destino === 'Garita') {
        pendingOfferRef.current = payload.offer;
        setLlamadaActiva({
          unidad: payload.unidad,
          nombre: payload.nombre,
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
      console.log('Respuesta recibida:', payload);
      const esMiLlamada = (miRol === 'residente' && payload.destino === miUnidad) ||
                          (miRol === 'vigilante' && payload.destino === 'Garita');
      if (esMiLlamada && pcRef.current) {
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          setEstado('conectado');
        } catch (e) {
          console.error('Error al fijar remote description:', e);
        }
      }
    });

    // 3. Candidatos ICE
    canal.on('broadcast', { event: 'webrtc_ice' }, async ({ payload }) => {
      const esParaMi = (miRol === 'vigilante' && payload.destino === 'Garita') ||
                       (miRol === 'residente' && payload.destino === miUnidad);
      if (esParaMi && pcRef.current && payload.candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.warn('Aviso candidato ICE:', e);
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

  // Iniciar llamada
  const iniciarLlamada = async (destinoApto?: string) => {
    const destinoFinal = miRol === 'residente' ? 'Garita' : (destinoApto || 'Torre 2 - 301');
    setEstado('llamando');
    setLlamadaActiva({
      unidad: destinoFinal,
      nombre: miRol === 'residente' ? 'Portería / Garita' : `Residente (${destinoFinal})`,
      origen: miRol
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(console.error);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate && canalRef.current) {
          canalRef.current.send({
            type: 'broadcast',
            event: 'webrtc_ice',
            payload: { candidate: event.candidate, destino: destinoFinal }
          });
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      canalRef.current?.send({
        type: 'broadcast',
        event: 'solicitar_llamada',
        payload: {
          unidad: miUnidad,
          nombre: miNombre,
          destino: destinoFinal,
          motivo: 'Autorización ingreso domicilio farmacia',
          offer: offer
        }
      });
    } catch (err: any) {
      console.error('Error al iniciar llamada:', err);
      alert(`No se pudo acceder al micrófono: ${err.message || 'Permiso denegado'}`);
      cerrarConexion(false);
    }
  };

  // Contestar llamada
  const contestarLlamada = async () => {
    const offerToUse = pendingOfferRef.current || llamadaActiva?.offer;
    const destinoRespuesta = miRol === 'vigilante' ? (llamadaActiva?.unidad || 'Torre 2 - 301') : 'Garita';

    if (!offerToUse) {
      alert('Error: La oferta de audio no llegó a tiempo. Vuelve a intentar marcar.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      const pc = new RTCPeerConnection(ICE_CONFIG);
      pcRef.current = pc;

      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      pc.ontrack = (event) => {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch(console.error);
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

      await pc.setRemoteDescription(new RTCSessionDescription(offerToUse));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      canalRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_answer',
        payload: { destino: destinoRespuesta, answer }
      });

      setEstado('conectado');
    } catch (err: any) {
      console.error('Error al contestar citófono:', err);
      alert(`Error al contestar: ${err.message || 'Verifica permisos del micrófono'}`);
      cerrarConexion(true);
    }
  };

  const alternarSilencio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setEstaSilenciado(!audioTrack.enabled);
        console.log('Estado del micrófono local:', audioTrack.enabled ? 'ACTIVO' : 'SILENCIADO');
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
