import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

export interface UserPresenceInfo {
  id: string;
  name: string;
  role: string;
  unit?: string;
  micActivo?: boolean;
  camActiva?: boolean;
}

export interface SignalingPacket {
  event: 'solicitar_llamada' | 'webrtc_offer' | 'webrtc_answer' | 'ice_candidate' | 'terminar_llamada' | 'asamblea_convocatoria' | 'asamblea_estado_media' | 'asamblea_cerrada';
  senderId: string;
  senderName?: string;
  targetId?: string;
  targetUnit?: string;
  payload: any;
  timestamp: number;
}

/**
 * Conecta un canal distribuido en Supabase Realtime con Broadcast y Presence
 */
export function inicializarCanalRealtime(
  canalNombre: string,
  userPresence: UserPresenceInfo,
  onSignalReceived: (packet: SignalingPacket) => void,
  onPresenceUpdate?: (usuariosEnLinea: UserPresenceInfo[]) => void
): RealtimeChannel {
  const channel = supabase.channel(canalNombre, {
    config: {
      broadcast: { self: false },
      presence: { key: userPresence.id }
    }
  });

  // 1. Escucha de señales WebRTC y llamadas por broadcast
  channel.on('broadcast', { event: 'webrtc_signal' }, ({ payload }) => {
    if (payload) {
      onSignalReceived(payload as SignalingPacket);
    }
  });

  // 2. Control de quórum y presencia en línea
  channel.on('presence', { event: 'sync' }, () => {
    const estado = channel.presenceState();
    const listaUsuarios: UserPresenceInfo[] = [];

    Object.keys(estado).forEach((key) => {
      const presencias = estado[key] as any[];
      presencias.forEach((p) => {
        if (p.id) listaUsuarios.push(p);
      });
    });

    onPresenceUpdate?.(listaUsuarios);
  });

  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(userPresence);
    }
  });

  return channel;
}

/**
 * Emite una señal a través del canal
 */
export async function despacharSignal(
  channel: RealtimeChannel,
  event: SignalingPacket['event'],
  userPresence: UserPresenceInfo,
  payload: any,
  targetId?: string,
  targetUnit?: string
): Promise<void> {
  await channel.send({
    type: 'broadcast',
    event: 'webrtc_signal',
    payload: {
      event,
      senderId: userPresence.id,
      senderName: userPresence.name,
      targetId,
      targetUnit,
      payload,
      timestamp: Date.now()
    }
  });
}
