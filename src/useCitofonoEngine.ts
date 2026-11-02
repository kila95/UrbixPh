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
  } | null>(null);
  const [segundos, setSegundos] = useState(0);
  const [colaLlamadas, setColaLlamadas] = useState<Array<{
    unidad: string;
    nombre: string;
    motivo: string;
    espera: string;
  }>>([]);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const canalRef = useRef<any>(null);

  useEffect(() => {
    // Instanciar audio de fondo para reproducir al interlocutor
    if (!remoteAudioRef.current && typeof window !== 'undefined') {
      const audio = new Audio();
      audio.autoplay = true;
      remoteAudioRef.current = audio;
    }

    const canal = supabase.channel(`citofonia_${tenantId}`, {
      config: { broadcast: { self: false } }
    });

    // 1. Alguien inicia llamada
    canal.on('broadcast', { event: 'solicitar_llamada' }, ({ payload }) => {
      if (miRol === 'vigilante' && payload.destino === 'Garita') {
        setLlamadaActiva({
          unidad: payload.unidad,
          nombre: payload.nombre,
          motivo: payload.motivo || 'Llamada directa desde citófono',
          origen: 'residente'
        });
        setEstado('entrante');
        // Agregar a la cola si no está
        setColaLlamadas(prev => {
          if (prev.some(c => c.unidad === payload.unidad)) return prev;
          return [{ unidad: payload.unidad, nombre: payload.nombre, motivo: payload.motivo || 'Consulta rápida', espera: '00:05s' }, ...prev];
        });
      } else if (miRol === 'residente' && payload.destino === miUnidad) {
        setLlamadaActiva({
          unidad: 'Portería Principal',
          nombre: payload.nombre || 'Guarda en Turno',
          origen: 'vigilante'
        });
        setEstado('entrante');
      }
    });

    // 2. Intercambio de Oferta WebRTC
    canal.on('broadcast', { event: 'webrtc_offer' }, async ({ payload }) => {
      const esParaMi = (miRol === 'vigilante' && payload.destino === 'Garita') ||
                       (miRol === 'residente' && payload.destino === miUnidad);
      if (esParaMi) {
        (window as any).__pendingOffer = payload.offer;
      }
    });

    // 3. Respuesta WebRTC al contestar
    canal.on('broadcast', { event: 'webrtc_answer' }, async ({ payload }) => {
      const esMiLlamada = (miRol === 'residente' && payload.destino === miUnidad) ||
                          (miRol === 'vigilante' && payload.destino === 'Garita');
      if (esMiLlamada && pcRef.current) {
        await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        setEstado('conectado');
      }
    });

    // 4. Candidatos ICE de red
    canal.on('broadcast', { event: 'webrtc_ice' }, async ({ payload }) => {
      const esParaMi = (miRol === 'vigilante' && payload.destino === 'Garita') ||
                       (miRol === 'residente' && payload.destino === miUnidad);
      if (esParaMi && pcRef.current && payload.candidate) {
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
        } catch (e) {
          console.warn('Candidato ICE:', e);
        }
      }
    });

    // 5. Fin de la llamada
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
  }, [tenantId, miRol, miUnidad, miNombre]);

  // Cronómetro de llamada activa
  useEffect(() => {
    let t: any;
    if (estado === 'conectado') {
      t = setInterval(() => setSegundos(s => s + 1), 1000);
    } else {
      setSegundos(0);
    }
    return () => clearInterval(t);
  }, [estado]);

  // A. Iniciar llamada hacia Garita o hacia un Apartamento
  const iniciarLlamada = async (destinoApto?: string) => {
    const destinoFinal = miRol === 'residente' ? 'Garita' : (destinoApto || 'Torre 2 - 301');
    setEstado('llamando');
    setLlamadaActiva({
      unidad: destinoFinal,
      nombre: miRol === 'residente' ? 'Portería / Garita' : `Residente (${destinoFinal})`,
      origen: miRol
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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
          motivo: 'Llamada directa desde citófono'
        }
      });

      canalRef.current?.send({
        type: 'broadcast',
        event: 'webrtc_offer',
        payload: { destino: destinoFinal, offer }
      });
    } catch (err) {
      console.error('Error micrófono:', err);
      alert('Debes permitir el acceso al micrófono en el navegador para usar el citófono.');
      cerrarConexion(false);
    }
  };

  // B. Contestar llamada entrante
  const contestarLlamada = async () => {
    const pendingOffer = (window as any).__pendingOffer;
    const destinoRespuesta = miRol === 'vigilante' ? (llamadaActiva?.unidad || 'Torre 2 - 301') : 'Garita';

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
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

      if (pendingOffer) {
        await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        canalRef.current?.send({
          type: 'broadcast',
          event: 'webrtc_answer',
          payload: { destino: destinoRespuesta, answer }
        });
      }

      setEstado('conectado');
      // Quitar de la cola de espera en vigilante
      setColaLlamadas(prev => prev.filter(c => c.unidad !== llamadaActiva?.unidad));
    } catch (err) {
      console.error('Error al contestar:', err);
      cerrarConexion(true);
    }
  };

  // C. Colgar llamada
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
    (window as any).__pendingOffer = null;
    setLlamadaActiva(null);
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
    colaLlamadas,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada
  };
}
