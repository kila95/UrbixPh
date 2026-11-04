import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Radio,
  Wifi,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  RefreshCw
} from 'lucide-react';

export interface ParticipanteReal {
  peerId: string;
  nombre: string;
  unidad: string;
  rol: string;
  iniciales: string;
  micActivo: boolean;
  camActiva: boolean;
  hablando: boolean;
  conectado: boolean;
  esLocal?: boolean;
}

interface Props {
  userProfile?: any;
  copropiedadNombre?: string;
}

const BROADCAST_BUS_NAME = 'urbix_asamblea_webrtc_bus_v2';

const ICE_SERVERS_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 4
};

export default function SalaAsambleaVirtualReal({
  userProfile,
  copropiedadNombre = 'Urb. Tricentenario'
}: Props) {
  const [llamadaActiva, setLlamadaActiva] = useState(false);
  const [participantesRemotos, setParticipantesRemotos] = useState<ParticipanteReal[]>([]);
  const [miMic, setMiMic] = useState(true);
  const [miCam, setMiCam] = useState(true);

  const miPeerIdRef = useRef<string>(
    `peer-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36).slice(-4)}`
  );
  const miRol = userProfile?.role === 'admin' ? 'admin' : 'residente';
  const miNombre = userProfile?.full_name || (miRol === 'admin' ? 'Administración' : 'Copropietario');
  const miUnidad = miRol === 'admin' ? 'Admin' : (userProfile?.unit || 'T1-302');
  const misIniciales =
    miNombre
      .split(' ')
      .filter(Boolean)
      .map((n: string) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'AD';

  const llamadaActivaRef = useRef(llamadaActiva);
  useEffect(() => {
    llamadaActivaRef.current = llamadaActiva;
  }, [llamadaActiva]);

  const miMicRef = useRef(miMic);
  useEffect(() => {
    miMicRef.current = miMic;
  }, [miMic]);

  const miCamRef = useRef(miCam);
  useEffect(() => {
    miCamRef.current = miCam;
  }, [miCam]);

  const streamLocalRef = useRef<MediaStream | null>(null);
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);
  const peersMapRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const pendingIceMapRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const remoteStreamsMapRef = useRef<Map<string, MediaStream>>(new Map());
  const remoteVideoElementsMapRef = useRef<Map<string, HTMLVideoElement>>(new Map());
  const remoteAudioElementsMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const processedMsgIdsRef = useRef<Set<string>>(new Set());
  const canvasRespaldoIntervalRef = useRef<any>(null);

  const setVideoLocalElement = useCallback((node: HTMLVideoElement | null) => {
    videoLocalRef.current = node;
    if (node && streamLocalRef.current) {
      if (node.srcObject !== streamLocalRef.current) {
        node.srcObject = streamLocalRef.current;
        node.muted = true;
        node.play().catch(() => {});
      } else if (node.paused) {
        node.muted = true;
        node.play().catch(() => {});
      }
    }
  }, []);

  const bindRemoteVideo = useCallback((peerId: string, node: HTMLVideoElement | null) => {
    if (!node) {
      remoteVideoElementsMapRef.current.delete(peerId);
      return;
    }
    remoteVideoElementsMapRef.current.set(peerId, node);
    const st = remoteStreamsMapRef.current.get(peerId);
    if (st && st.getVideoTracks().length > 0) {
      if (node.srcObject !== st) {
        node.srcObject = st;
        node.muted = true;
        node.play().catch(() => {});
      } else if (node.paused) {
        node.muted = true;
        node.play().catch(() => {});
      }
    }
  }, []);

  const bindRemoteAudio = useCallback((peerId: string, node: HTMLAudioElement | null) => {
    if (!node) {
      remoteAudioElementsMapRef.current.delete(peerId);
      return;
    }
    remoteAudioElementsMapRef.current.set(peerId, node);
    const st = remoteStreamsMapRef.current.get(peerId);
    if (st && st.getAudioTracks().length > 0) {
      if (node.srcObject !== st) {
        node.srcObject = st;
        node.muted = false;
        node.volume = 1.0;
        node.play().catch(() => {});
      } else if (node.paused) {
        node.play().catch(() => {});
      }
    }
  }, []);

  const emitirEvento = useCallback((event: string, payload: any) => {
    const enriched = {
      ...payload,
      _msgId: `${miPeerIdRef.current}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      _senderPeerId: miPeerIdRef.current
    };
    processedMsgIdsRef.current.add(enriched._msgId);

    fetch('/api/asamblea-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, payload: enriched })
    }).catch(() => {});

    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload: enriched });
      } catch {}
    }
  }, []);

  const crearStreamRespaldo = useCallback(
    (soloAudio?: MediaStream | null): MediaStream => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d')!;
      let tick = 0;

      const draw = () => {
        tick += 1;
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#06101e');
        grad.addColorStop(1, '#0b1f33');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 - 15, 44, 0, Math.PI * 2);
        ctx.fillStyle = '#0e7490';
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 26px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(misIniciales, canvas.width / 2, canvas.height / 2 - 6);

        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(`${miNombre} (${miUnidad})`, canvas.width / 2, canvas.height / 2 + 60);
      };

      draw();
      if (canvasRespaldoIntervalRef.current) clearInterval(canvasRespaldoIntervalRef.current);
      canvasRespaldoIntervalRef.current = setInterval(draw, 60);

      const stream = (canvas as any).captureStream ? (canvas as any).captureStream(24) : new MediaStream();
      if (soloAudio && soloAudio.getAudioTracks().length > 0) {
        soloAudio.getAudioTracks().forEach((t) => stream.addTrack(t));
      } else {
        try {
          const Ctx = window.AudioContext || (window as any).webkitAudioContext;
          if (Ctx) {
            const actx = new Ctx();
            actx.resume().catch(() => {});
            const dst = actx.createMediaStreamDestination();
            const osc = actx.createOscillator();
            const gain = actx.createGain();
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(dst);
            osc.start();
            dst.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
          }
        } catch {}
      }
      return stream;
    },
    [miNombre, miUnidad, misIniciales]
  );

  const obtenerOCrearPeer = useCallback(
    (remotePeerId: string, esIniciadorOferta: boolean, meta?: Partial<ParticipanteReal>, forzarReinicio = false) => {
      const existente = peersMapRef.current.get(remotePeerId);
      if (existente && !forzarReinicio && esIniciadorOferta && existente.signalingState !== 'closed') {
        return existente;
      }
      if (existente) {
        try {
          existente.close();
        } catch {}
        peersMapRef.current.delete(remotePeerId);
      }

      const pc = new RTCPeerConnection(ICE_SERVERS_CONFIG);
      peersMapRef.current.set(remotePeerId, pc);

      if (streamLocalRef.current) {
        streamLocalRef.current.getTracks().forEach((track) => {
          try {
            pc.addTrack(track, streamLocalRef.current!);
          } catch {}
        });
      }

      pc.ontrack = (evt) => {
        const prev = remoteStreamsMapRef.current.get(remotePeerId);
        const trackMap = new Map<string, MediaStreamTrack>();
        if (prev) {
          prev.getTracks().forEach((t) => {
            if (t.readyState !== 'ended') trackMap.set(t.id, t);
          });
        }
        if (evt.streams && evt.streams[0]) {
          evt.streams[0].getTracks().forEach((t) => {
            t.enabled = true;
            trackMap.set(t.id, t);
          });
        }
        if (evt.track) {
          evt.track.enabled = true;
          trackMap.set(evt.track.id, evt.track);
        }

        const remoteStream = new MediaStream(Array.from(trackMap.values()));
        remoteStreamsMapRef.current.set(remotePeerId, remoteStream);

        setParticipantesRemotos((prevList) => {
          const existe = prevList.some((p) => p.peerId === remotePeerId);
          if (existe) {
            return prevList.map((p) => (p.peerId === remotePeerId ? { ...p, conectado: true } : p));
          }
          return [
            ...prevList,
            {
              peerId: remotePeerId,
              nombre: meta?.nombre || 'Participante',
              unidad: meta?.unidad || 'PH',
              rol: meta?.rol || 'residente',
              iniciales: meta?.iniciales || 'PH',
              micActivo: meta?.micActivo ?? true,
              camActiva: meta?.camActiva ?? true,
              hablando: false,
              conectado: true
            }
          ];
        });

        const vid = remoteVideoElementsMapRef.current.get(remotePeerId);
        if (vid && remoteStream.getVideoTracks().length > 0) {
          vid.srcObject = remoteStream;
          vid.muted = true;
          vid.play().catch(() => {});
        }
        const aud = remoteAudioElementsMapRef.current.get(remotePeerId);
        if (aud && remoteStream.getAudioTracks().length > 0) {
          aud.srcObject = remoteStream;
          aud.muted = false;
          aud.volume = 1.0;
          aud.play().catch(() => {});
        }
      };

      pc.onicecandidate = (evt) => {
        if (evt.candidate) {
          emitirEvento('asamblea_candidato_ice', {
            candidate: evt.candidate.toJSON ? evt.candidate.toJSON() : evt.candidate,
            fromPeerId: miPeerIdRef.current,
            toPeerId: remotePeerId,
            remitenteRol: miRol,
            unidad: miUnidad
          });
        }
      };

      if (esIniciadorOferta) {
        pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true })
          .then(async (oferta) => {
            await pc.setLocalDescription(oferta);
            emitirEvento('asamblea_oferta', {
              sdp: pc.localDescription,
              fromPeerId: miPeerIdRef.current,
              toPeerId: remotePeerId,
              fromRol: miRol,
              fromUnidad: miRol === 'admin' ? 'ADMIN' : miUnidad,
              orador: miNombre
            });
          })
          .catch(() => {});
      }

      return pc;
    },
    [emitirEvento, miNombre, miRol, miUnidad]
  );

  const manejarEvento = useCallback(
    async (event: string, payload: any) => {
      if (!payload) return;
      if (payload._senderPeerId && payload._senderPeerId === miPeerIdRef.current) return;
      if (payload._msgId) {
        if (processedMsgIdsRef.current.has(payload._msgId)) return;
        processedMsgIdsRef.current.add(payload._msgId);
      }

      const remotePeerId = payload.peerId || payload.fromPeerId || payload._senderPeerId;

      if (event === 'participante_listo' || event === 'participante_presente') {
        if (!remotePeerId || remotePeerId === miPeerIdRef.current) return;
        const esAdminRem = payload.rol === 'admin' || payload.unidad === 'ADMIN' || payload.unidad === 'Admin';
        const nombreRem = payload.nombre || (esAdminRem ? 'Administración' : (payload.unidad || 'Residente'));
        const unidadRem = esAdminRem ? 'Admin' : (payload.unidad || 'PH');
        const inicialesRem =
          payload.iniciales ||
          nombreRem
            .split(' ')
            .filter(Boolean)
            .map((n: string) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase() ||
          'RS';

        setParticipantesRemotos((prev) => {
          const existe = prev.some((p) => p.peerId === remotePeerId);
          if (existe) {
            return prev.map((p) =>
              p.peerId === remotePeerId
                ? {
                    ...p,
                    nombre: nombreRem,
                    unidad: unidadRem,
                    rol: esAdminRem ? 'admin' : 'residente',
                    iniciales: inicialesRem,
                    micActivo: payload.micActivo ?? p.micActivo,
                    camActiva: payload.camActiva ?? p.camActiva
                  }
                : p
            );
          }
          return [
            ...prev,
            {
              peerId: remotePeerId,
              nombre: nombreRem,
              unidad: unidadRem,
              rol: esAdminRem ? 'admin' : 'residente',
              iniciales: inicialesRem,
              micActivo: payload.micActivo ?? true,
              camActiva: payload.camActiva ?? true,
              hablando: false,
              conectado: remoteStreamsMapRef.current.has(remotePeerId)
            }
          ];
        });

        if (event === 'participante_listo' && llamadaActivaRef.current && streamLocalRef.current) {
          emitirEvento('participante_presente', {
            peerId: miPeerIdRef.current,
            nombre: miNombre,
            unidad: miRol === 'admin' ? 'ADMIN' : miUnidad,
            rol: miRol,
            iniciales: misIniciales,
            micActivo: miMicRef.current,
            camActiva: miCamRef.current
          });
          obtenerOCrearPeer(
            remotePeerId,
            true,
            {
              nombre: nombreRem,
              unidad: unidadRem,
              rol: esAdminRem ? 'admin' : 'residente',
              iniciales: inicialesRem
            },
            Boolean(payload.forzarRenegociacion)
          );
        }
      } else if (event === 'asamblea_oferta') {
        if (!llamadaActivaRef.current || !streamLocalRef.current) return;
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;
        if (!remotePeerId) return;

        const pcExistente = peersMapRef.current.get(remotePeerId);
        if (pcExistente && pcExistente.signalingState === 'have-local-offer' && miPeerIdRef.current > remotePeerId) {
          return;
        }

        const esAdminRem = payload.fromRol === 'admin' || payload.fromUnidad === 'ADMIN';
        const pc = obtenerOCrearPeer(
          remotePeerId,
          false,
          {
            nombre: payload.orador || (esAdminRem ? 'Administración' : payload.fromUnidad || 'Residente'),
            unidad: esAdminRem ? 'Admin' : (payload.fromUnidad || 'PH'),
            rol: esAdminRem ? 'admin' : 'residente'
          },
          true
        );

        try {
          await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
          pc.getTransceivers().forEach((tr) => {
            if (tr.sender && tr.sender.track && tr.direction === 'recvonly') {
              try {
                tr.direction = 'sendrecv';
              } catch {}
            }
          });
          const cola = pendingIceMapRef.current.get(remotePeerId) || [];
          while (cola.length > 0) {
            const c = cola.shift();
            if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
          }
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          emitirEvento('asamblea_respuesta', {
            sdp: pc.localDescription,
            fromPeerId: miPeerIdRef.current,
            toPeerId: remotePeerId,
            fromRol: miRol,
            unidad: miRol === 'admin' ? 'ADMIN' : miUnidad
          });
        } catch {}
      } else if (event === 'asamblea_respuesta') {
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;
        if (!remotePeerId) return;
        const pc = peersMapRef.current.get(remotePeerId);
        if (pc && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
            const cola = pendingIceMapRef.current.get(remotePeerId) || [];
            while (cola.length > 0) {
              const c = cola.shift();
              if (c) await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
            }
          } catch {}
        }
      } else if (event === 'asamblea_candidato_ice') {
        if (payload.toPeerId && payload.toPeerId !== miPeerIdRef.current) return;
        if (!remotePeerId || !payload.candidate) return;
        const pc = peersMapRef.current.get(remotePeerId);
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(() => {});
        } else {
          const actual = pendingIceMapRef.current.get(remotePeerId) || [];
          actual.push(payload.candidate);
          pendingIceMapRef.current.set(remotePeerId, actual);
        }
      } else if (event === 'asamblea_estado_media') {
        if (!remotePeerId) return;
        setParticipantesRemotos((prev) =>
          prev.map((p) =>
            p.peerId === remotePeerId
              ? {
                  ...p,
                  micActivo: payload.micActivo ?? p.micActivo,
                  camActiva: payload.camActiva ?? p.camActiva
                }
              : p
          )
        );
      } else if (event === 'asamblea_peer_salio') {
        if (!remotePeerId) return;
        const pc = peersMapRef.current.get(remotePeerId);
        if (pc) {
          try {
            pc.close();
          } catch {}
          peersMapRef.current.delete(remotePeerId);
        }
        remoteStreamsMapRef.current.delete(remotePeerId);
        setParticipantesRemotos((prev) => prev.filter((p) => p.peerId !== remotePeerId));
      } else if (event === 'asamblea_cerrada') {
        setLlamadaActiva(false);
        llamadaActivaRef.current = false;
        setParticipantesRemotos([]);
      }
    },
    [emitirEvento, miNombre, miRol, miUnidad, misIniciales, obtenerOCrearPeer]
  );

  const manejarEventoRef = useRef(manejarEvento);
  useEffect(() => {
    manejarEventoRef.current = manejarEvento;
  }, [manejarEvento]);

  useEffect(() => {
    const es = new EventSource(`/api/asamblea-events?peerId=${encodeURIComponent(miPeerIdRef.current)}`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.event) {
          manejarEventoRef.current(data.event, data.payload);
        }
      } catch {}
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel(BROADCAST_BUS_NAME);
      bc.onmessage = (ev) => {
        if (ev.data && ev.data.event) {
          manejarEventoRef.current(ev.data.event, ev.data.payload);
        }
      };
      localBroadcastRef.current = bc;
    }

    return () => {
      es.close();
      if (localBroadcastRef.current) {
        localBroadcastRef.current.close();
      }
      if (canvasRespaldoIntervalRef.current) {
        clearInterval(canvasRespaldoIntervalRef.current);
      }
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

  const handleAbrirSala = async () => {
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 360 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch {
      try {
        const audioOnly = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        stream = crearStreamRespaldo(audioOnly);
      } catch {
        stream = crearStreamRespaldo(null);
      }
    }

    streamLocalRef.current = stream;
    llamadaActivaRef.current = true;
    setLlamadaActiva(true);
    setMiCam(true);
    setMiMic(true);

    setTimeout(() => {
      if (videoLocalRef.current && streamLocalRef.current) {
        videoLocalRef.current.srcObject = streamLocalRef.current;
        videoLocalRef.current.muted = true;
        videoLocalRef.current.play().catch(() => {});
      }
    }, 40);

    fetch('/api/asamblea-state')
      .then((r) => r.json())
      .then((stateData) => {
        const existentes = Array.isArray(stateData?.participantes) ? stateData.participantes : [];
        existentes.forEach((remoto: any) => {
          if (!remoto?.peerId || remoto.peerId === miPeerIdRef.current) return;
          manejarEventoRef.current('participante_presente', remoto);
          setTimeout(() => {
            if (llamadaActivaRef.current && streamLocalRef.current && !peersMapRef.current.has(remoto.peerId)) {
              obtenerOCrearPeer(remoto.peerId, true, remoto, false);
            }
          }, 600);
        });
      })
      .catch(() => {});

    emitirEvento('participante_listo', {
      peerId: miPeerIdRef.current,
      nombre: miNombre,
      unidad: miRol === 'admin' ? 'ADMIN' : miUnidad,
      rol: miRol,
      iniciales: misIniciales,
      micActivo: true,
      camActiva: true
    });
  };

  const handleFinalizarLlamada = async () => {
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
    if (streamLocalRef.current) {
      streamLocalRef.current.getTracks().forEach((t) => t.stop());
      streamLocalRef.current = null;
    }
    setLlamadaActiva(false);
    llamadaActivaRef.current = false;
    setParticipantesRemotos([]);
    emitirEvento(miRol === 'admin' ? 'asamblea_cerrada' : 'asamblea_peer_salio', {
      peerId: miPeerIdRef.current
    });
  };

  const toggleMicLocal = () => {
    const nuevo = !miMic;
    if (streamLocalRef.current) {
      streamLocalRef.current.getAudioTracks().forEach((t) => {
        t.enabled = nuevo;
      });
    }
    setMiMic(nuevo);
    emitirEvento('asamblea_estado_media', {
      peerId: miPeerIdRef.current,
      micActivo: nuevo,
      camActiva: miCam
    });
  };

  const toggleCamLocal = () => {
    const nuevo = !miCam;
    if (streamLocalRef.current) {
      streamLocalRef.current.getVideoTracks().forEach((t) => {
        t.enabled = nuevo;
      });
    }
    setMiCam(nuevo);
    emitirEvento('asamblea_estado_media', {
      peerId: miPeerIdRef.current,
      micActivo: miMic,
      camActiva: nuevo
    });
  };

  const participantesReales: ParticipanteReal[] = llamadaActiva
    ? [
        {
          peerId: miPeerIdRef.current,
          nombre: miNombre,
          unidad: miUnidad,
          rol: miRol,
          iniciales: misIniciales,
          micActivo: miMic,
          camActiva: miCam,
          hablando: false,
          conectado: true,
          esLocal: true
        },
        ...participantesRemotos
      ]
    : [];

  const getGridCols = (total: number) => {
    if (total <= 1) return 'grid-cols-1 max-w-2xl mx-auto';
    if (total === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (total <= 4) return 'grid-cols-2';
    if (total <= 6) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-3';
  };

  return (
    <div className="w-full bg-[#0b0f17] border border-cyan-500/20 rounded-3xl p-5 shadow-2xl font-sans text-slate-100">
      {/* BARRA SUPERIOR CON NÚMERO REAL DE CONECTADOS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
              llamadaActiva
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {llamadaActiva ? 'TRANSMISIÓN EN VIVO' : 'SALA EN ESPERA'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/50 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            {copropiedadNombre}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${llamadaActiva ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
            {llamadaActiva
              ? `${participantesReales.length} Conectado${participantesReales.length === 1 ? '' : 's'}`
              : '0 Conectados'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {llamadaActiva && (
            <>
              <button
                type="button"
                onClick={toggleMicLocal}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  miMic ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-900 border-slate-800 text-rose-400'
                }`}
              >
                {miMic ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={toggleCamLocal}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                  miCam ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-slate-900 border-slate-800 text-rose-400'
                }`}
              >
                {miCam ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() =>
                  emitirEvento('participante_listo', {
                    peerId: miPeerIdRef.current,
                    nombre: miNombre,
                    unidad: miRol === 'admin' ? 'ADMIN' : miUnidad,
                    rol: miRol,
                    iniciales: misIniciales,
                    micActivo: miMic,
                    camActiva: miCam,
                    forzarRenegociacion: true
                  })
                }
                className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 hover:bg-slate-800 cursor-pointer"
                title="Sincronizar video y audio"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {!llamadaActiva ? (
            <button
              type="button"
              onClick={handleAbrirSala}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 text-slate-950 rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Abrir Sala en Vivo</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizarLlamada}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Finalizar Llamada</span>
            </button>
          )}
        </div>
      </div>

      {/* CONTENEDOR CONMUTABLE */}
      {!llamadaActiva ? (
        <div className="w-full aspect-video min-h-[400px] bg-[#070a10] border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
            <Radio className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold font-mono text-white">
            Sala Lista para Convocatoria y Citación en Vivo
          </h3>
          <p className="text-xs text-slate-400 font-mono max-w-md">
            Al abrir la sala se activará tu cámara y audio en tiempo real y los participantes conectados aparecerán en pantalla.
          </p>
        </div>
      ) : (
        <div
          className={`w-full aspect-video min-h-[400px] bg-[#070a10] border border-cyan-500/30 rounded-2xl p-3 grid gap-3 ${getGridCols(
            participantesReales.length
          )}`}
        >
          {participantesReales.map((p) => {
            const mostrarVideo = p.esLocal ? miCam : p.conectado && p.camActiva !== false;
            return (
              <div
                key={p.peerId}
                className={`relative rounded-2xl overflow-hidden flex items-center justify-center transition-all bg-[#0b0f17] border min-h-[180px] ${
                  p.hablando
                    ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.esLocal ? (
                  <video
                    ref={setVideoLocalElement}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                      mostrarVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                  />
                ) : (
                  <>
                    <video
                      ref={(node) => bindRemoteVideo(p.peerId, node)}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
                        mostrarVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                      }`}
                    />
                    <audio ref={(node) => bindRemoteAudio(p.peerId, node)} autoPlay playsInline />
                  </>
                )}

                {!mostrarVideo && (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center font-mono font-bold text-lg select-none border border-slate-700 bg-slate-900 text-cyan-300 shadow-md z-10">
                    {p.iniciales}
                  </div>
                )}

                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-20 flex items-center justify-between gap-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-[11px] font-mono border border-slate-800">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate text-slate-200 font-bold">{p.nombre}</span>
                    <span className="text-cyan-400 font-semibold">({p.unidad})</span>
                  </div>
                  {p.micActivo ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  ) : (
                    <span className="text-[10px] text-rose-400 ml-0.5">🔇</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
