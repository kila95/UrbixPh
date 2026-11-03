import React, { useState } from 'react';
import {
  Video, Mic, MicOff, VideoOff, ShieldCheck, Users, Radio, CheckCircle2,
  MessageSquare, Award, Hand, Maximize2, Minimize2, Send, Clock, AlertTriangle,
  FileCheck2, Check, X, ShieldAlert, Sparkles, Volume2, UserCheck
} from 'lucide-react';

export interface SalaAsambleaVirtualExecutiveProps {
  unidadResidenteActual?: string;
  esConsejero?: boolean; // Identifica si el apartamento pertenece al Consejo de Administración
  rolUsuario?: string; // 'admin' | 'supervisor' | 'residente'
  onShowToast?: (msg: string) => void;
  quorumActual?: number;
  mociones?: Array<{
    id: string;
    titulo: string;
    descripcion: string;
    tipoMayoria: string;
    votosFavor: number;
    votosContra: number;
    votosAbstencion: number;
    estado: 'Activa' | 'Cerrada';
    unidadesQueVotaron: string[];
    votosDetalle?: Record<string, 'favor' | 'contra' | 'abstencion'>;
    resultado?: string;
  }>;
  onVotarMocion?: (mocionId: string, unidadId: string, sentido: 'favor' | 'contra' | 'abstencion') => void;
  onToggleAsistenciaResidente?: (unidadId: string) => void;
  unidadId?: string;
  coeficiente?: number;
}

export default function SalaAsambleaVirtualExecutive({
  unidadResidenteActual = 'Torre 2 - 301',
  esConsejero = true,
  rolUsuario = 'residente',
  onShowToast,
  quorumActual = 92.4,
  mociones: mocionesProp,
  onVotarMocion,
  onToggleAsistenciaResidente,
  unidadId = 'u_301',
  coeficiente = 1.05
}: SalaAsambleaVirtualExecutiveProps) {
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [manoLevantada, setManoLevantada] = useState(false);
  const [modoPantalla, setModoPantalla] = useState<'normal' | 'enfoque_video' | 'enfoque_votacion'>('normal');
  const [mensajeChat, setMensajeChat] = useState('');

  // Fallback mociones si no vienen por props
  const [mockMociones, setMockMociones] = useState([
    {
      id: 'moc_1',
      titulo: 'Aprobación del Presupuesto Ordinario Vigencia 2026',
      descripcion: 'Incremento del 6.2% proyectado para IPC + Fondo de Imprevistos (Art. 35 Ley 675).',
      tipoMayoria: 'Simple (50% + 1)',
      votosFavor: 64.8,
      votosContra: 12.3,
      votosAbstencion: 4.2,
      estado: 'Activa' as const,
      unidadesQueVotaron: [] as string[],
      votosDetalle: {} as Record<string, 'favor' | 'contra' | 'abstencion'>
    },
    {
      id: 'moc_2',
      titulo: 'Cuota Extraordinaria: Mantenimiento Mayor Fachada e Impermeabilización',
      descripcion: 'Inversión de $48.000.000 COP diferida a 6 cuotas mensuales. Requiere mayoría calificada.',
      tipoMayoria: 'Calificada (70% Ley 675)',
      votosFavor: 71.4,
      votosContra: 8.5,
      votosAbstencion: 2.1,
      estado: 'Cerrada' as const,
      unidadesQueVotaron: ['u_301'],
      votosDetalle: { u_301: 'favor' } as Record<string, 'favor' | 'contra' | 'abstencion'>,
      resultado: 'APROBADA POR MAYORÍA CALIFICADA (71.4%)'
    }
  ]);

  const activeMociones = mocionesProp && mocionesProp.length > 0 ? mocionesProp : mockMociones;

  const [chatLog, setChatLog] = useState([
    {
      id: 1,
      autor: 'Dr. Mauricio Restrepo',
      cargo: 'Presidente Consejo',
      esConsejo: true,
      texto: 'Bienvenidos a la Asamblea General Virtual 2026 bajo el marco legal de la Ley 675 de 2001.',
      hora: '06:00 PM'
    },
    {
      id: 2,
      autor: 'Carlos Mario Pineda',
      cargo: 'Administrador PH',
      esConsejo: false,
      texto: 'Quórum inicial legalmente verificado y auditado en el 92.4% del coeficiente total.',
      hora: '06:02 PM'
    },
    {
      id: 3,
      autor: 'Dra. Claudia Ortiz',
      cargo: 'Revisora Fiscal',
      esConsejo: false,
      texto: 'Certifico la trazabilidad e inmutabilidad de los tarjetones electrónicos con sellado de tiempo.',
      hora: '06:05 PM'
    }
  ]);

  const toggleMic = () => {
    const next = !micOn;
    setMicOn(next);
    onShowToast?.(next ? '🎙️ Micrófono activado en la sala' : '🔇 Micrófono silenciado');
  };

  const toggleCam = () => {
    const next = !camOn;
    setCamOn(next);
    onShowToast?.(next ? '📹 Cámara transmitiendo en HD' : '🛑 Transmisión de cámara pausada');
  };

  const toggleMano = () => {
    const next = !manoLevantada;
    setManoLevantada(next);
    if (next) {
      onShowToast?.('✋ Has pedido la palabra. Notificación prioritaria enviada al moderador de la asamblea.');
      setChatLog(prev => [
        ...prev,
        {
          id: Date.now(),
          autor: `${unidadResidenteActual} ${esConsejero ? '⭐ (Consejero)' : ''}`,
          cargo: esConsejero ? 'Consejo de Administración' : 'Propietario',
          esConsejo: esConsejero,
          texto: '✋ Ha solicitado el uso de la palabra (Tiempo reglamentario: 3 minutos).',
          hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      onShowToast?.('✋ Solicitud de palabra retirada.');
    }
  };

  const handleEnviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeChat.trim()) return;

    const nuevoMsg = {
      id: Date.now(),
      autor: `${unidadResidenteActual} (${rolUsuario.toUpperCase()})`,
      cargo: esConsejero ? 'Consejo de Administración' : 'Residente Habilitado',
      esConsejo: esConsejero,
      texto: mensajeChat.trim(),
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatLog(prev => [...prev, nuevoMsg]);
    setMensajeChat('');
    onShowToast?.('💬 Intervención registrada en la bitácora legal de la asamblea.');
  };

  const handleVoteInternal = (mocionId: string, sentido: 'favor' | 'contra' | 'abstencion') => {
    if (onVotarMocion) {
      onVotarMocion(mocionId, unidadId, sentido);
    } else {
      setMockMociones(prev =>
        prev.map(m => {
          if (m.id === mocionId) {
            const yaVoto = m.unidadesQueVotaron.includes(unidadId);
            if (yaVoto) return m;
            return {
              ...m,
              unidadesQueVotaron: [...m.unidadesQueVotaron, unidadId],
              votosDetalle: { ...m.votosDetalle, [unidadId]: sentido },
              votosFavor: sentido === 'favor' ? +(m.votosFavor + coeficiente).toFixed(1) : m.votosFavor,
              votosContra: sentido === 'contra' ? +(m.votosContra + coeficiente).toFixed(1) : m.votosContra,
              votosAbstencion: sentido === 'abstencion' ? +(m.votosAbstencion + coeficiente).toFixed(1) : m.votosAbstencion
            };
          }
          return m;
        })
      );
    }
    const sentidoLabel = sentido === 'favor' ? 'A FAVOR' : sentido === 'contra' ? 'EN CONTRA' : 'ABSTENCIÓN';
    onShowToast?.(`🗳️ Voto [${sentidoLabel}] registrado con ${coeficiente}% de coeficiente (Ley 675).`);
  };

  return (
    <div className="w-full bg-[#07090e] border border-cyan-500/30 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.85)] overflow-hidden font-sans text-slate-100 transition-all">
      
      {/* 1. TOP BAR: SALA VIRTUAL EN VIVO, QUÓRUM Y BADGES DE IDENTIDAD */}
      <div className="bg-[#0b0f17] border-b border-cyan-500/20 px-4 py-3.5 md:px-6 md:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 font-mono text-xs font-bold">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </span>
            <span>TRANSMISIÓN EN VIVO</span>
          </div>

          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 rounded-lg hidden sm:inline-block">
            Ley 675 Art. 42 • No Presencial
          </span>

          {esConsejero && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>⭐ MIEMBRO DEL CONSEJO</span>
            </div>
          )}
        </div>

        {/* Quórum Legal e Identidad */}
        <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
          <div className="bg-[#10141f] border border-cyan-500/40 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 block uppercase leading-none">Quórum Acreditado</span>
            <span className="text-cyan-300 font-bold text-sm leading-tight flex items-center gap-1.5 justify-end">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              {quorumActual.toFixed(1)}% / 100%
            </span>
          </div>

          <div className="bg-[#10141f] border border-slate-800 px-3 py-1.5 rounded-xl text-right">
            <span className="text-[10px] text-slate-400 block uppercase leading-none">Mi Unidad</span>
            <span className="text-white font-bold leading-tight">{unidadResidenteActual}</span>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE QUÓRUM REGULATORIA (LEY 675 DE 2001) */}
      <div className="bg-[#0b0f17]/60 border-b border-slate-800 px-4 py-2.5 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Quórum Deliberatorio y Decisorio Válido (&gt;50%+1)
          </span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">Poder de Voto: <strong>{coeficiente}%</strong></span>
        </div>

        {/* Barra de progreso con marcas de umbral */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-700 ${quorumActual >= 70 ? 'bg-gradient-to-r from-cyan-400 to-emerald-400' : 'bg-cyan-400'}`}
              style={{ width: `${Math.min(100, quorumActual)}%` }}
            />
            {/* Umbral 50%+1 */}
            <div className="absolute top-0 bottom-0 left-[51%] w-0.5 bg-white shadow-sm" title="50%+1 Ley 675" />
            {/* Umbral 70% Calificada */}
            <div className="absolute top-0 bottom-0 left-[70%] w-0.5 bg-amber-400" title="70% Calificada Art. 46" />
          </div>
          <span className="text-[11px] font-bold text-cyan-400 shrink-0">{quorumActual.toFixed(1)}%</span>
        </div>
      </div>

      {/* 3. GRID PRINCIPAL: VIDEO TRANSMISIÓN + CHAT / TARJETÓN */}
      <div className="p-3 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* COLUMNA IZQUIERDA: PANTALLA PRINCIPAL DE TRANSMISIÓN Y CONTROLES (7 COLUMNAS EN DESKTOP) */}
        <div className={`${chatOpen ? 'lg:col-span-7' : 'lg:col-span-8'} space-y-4 transition-all duration-300`}>
          
          {/* ========================================================
              LIENZO DE TRANSMISIÓN MULTI-PARTICIPANTE (ESTILO GALERÍA)
             ======================================================== */}
          <div className="relative w-full aspect-video bg-[#0b0f17] border border-cyan-500/30 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(0,242,254,0.15)] p-3 flex flex-col justify-between">
            
            {/* Barra superior flotante de la sala */}
            <div className="flex items-center justify-between z-10 pb-2">
              <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-xl border border-cyan-500/20 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  Asamblea en Vivo • Urb. Tricentenario
                </span>
                <span className="text-[10px] text-cyan-300 font-mono bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/40">
                  9 Conectados
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[10px] text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  WebRTC HD
                </span>
              </div>
            </div>

            {/* Cuadrícula Galería de Participantes (3x3 simétrica) */}
            <div className="flex-1 grid grid-cols-3 grid-rows-3 gap-2 p-1">
              {[
                { id: '1', nombre: 'Esteban Ochoa', apt: 'T1-302', iniciales: 'EO', mic: false, activo: false },
                { id: '2', nombre: 'Eloina Mesa Mesa', apt: 'Admin', iniciales: 'EM', mic: false, activo: false },
                { id: '3', nombre: 'Andrés Vesga', apt: 'Portería', iniciales: 'AV', mic: false, activo: false },
                { id: '4', nombre: 'Darío Negrette', apt: 'T1-502', iniciales: 'DN', mic: true, activo: true },
                { id: '5', nombre: 'Carlos Andrés Gómez', apt: 'T1-101', iniciales: 'CG', mic: false, activo: false },
                { id: '6', nombre: 'María Camila Restrepo', apt: 'T1-102', iniciales: 'MR', mic: false, activo: false },
                { id: '7', nombre: 'Santiago Vélez', apt: 'T2-205', iniciales: 'SV', mic: false, activo: false },
                { id: '8', nombre: 'Daniela Restrepo', apt: 'T2-103', iniciales: 'DR', mic: false, activo: false },
                { id: '9', nombre: 'Juan Fernando', apt: 'T2-505', iniciales: 'JF', mic: false, activo: false },
              ].map((participante) => (
                <div
                  key={participante.id}
                  className={`relative rounded-xl flex items-center justify-center transition-all bg-[#070a10] border ${
                    participante.activo
                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)] bg-cyan-950/10'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {/* Círculo central con iniciales alineado a los tonos oscuros de la app */}
                  <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-mono font-bold text-sm md:text-lg select-none border shadow-md ${
                    participante.activo
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                      : 'bg-slate-900 text-slate-300 border-slate-700/80'
                  }`}>
                    {participante.iniciales}
                  </div>

                  {/* Píldora inferior de identificación */}
                  <div className="absolute bottom-1.5 left-1.5 max-w-[90%] flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-800/80">
                    <span className="truncate text-slate-200">{participante.nombre}</span>
                    <span className="text-cyan-400">({participante.apt})</span>
                    {participante.mic ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" title="Micrófono activo" />
                    ) : (
                      <span className="text-[9px] text-rose-400/80 ml-0.5">🔇</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* BARRA DE CONTROLES MULTIMEDIA & PARTICIPACIÓN */}
          <div className="bg-[#0b0f17] border border-cyan-500/25 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xl">
            {/* Controles de audio y video */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMic}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  micOn
                    ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                }`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{micOn ? 'Micrófono ON' : 'Silenciado'}</span>
              </button>

              <button
                type="button"
                onClick={toggleCam}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  camOn
                    ? 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                <span className="hidden sm:inline">{camOn ? 'Cámara ON' : 'Cámara OFF'}</span>
              </button>

              <button
                type="button"
                onClick={toggleMano}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  manoLevantada
                    ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.35)] animate-bounce'
                    : 'bg-slate-800/80 text-amber-300 border border-amber-500/30 hover:bg-slate-800'
                }`}
              >
                <Hand className="w-4 h-4" />
                <span className="hidden sm:inline">{manoLevantada ? 'Palabra Pedida' : 'Pedir la Palabra'}</span>
              </button>
            </div>

            {/* Botón de Chat y Asistencia */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setChatOpen(!chatOpen)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  chatOpen
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat y Bitácora ({chatLog.length})</span>
              </button>

              <div className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#10141f] border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Presente</span>
              </div>
            </div>
          </div>

          {/* TARJETÓN ELECTRÓNICO DE VOTACIÓN EN VIVO (CONECTADO AL COEFICIENTE DE LEY 675) */}
          <div className="bg-[#0b0f17] border border-cyan-500/30 rounded-2xl p-4 md:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold uppercase mb-1">
                  🗳️ Tarjetón Criptográfico • Ley 675
                </span>
                <h3 className="text-base font-bold text-white">Mociones Sometidas a Votación</h3>
              </div>

              <div className="text-right font-mono text-xs text-slate-400">
                <span>Tu Coeficiente Ponderado: </span>
                <strong className="text-cyan-300 font-bold">{coeficiente}%</strong>
              </div>
            </div>

            {/* Listado de Mociones */}
            <div className="space-y-4">
              {activeMociones.map(mocion => {
                const yaVoto = mocion.unidadesQueVotaron?.includes(unidadId);
                const sentidoVotado = mocion.votosDetalle?.[unidadId];
                const esActiva = mocion.estado === 'Activa';

                return (
                  <div
                    key={mocion.id}
                    className={`p-4 md:p-5 rounded-2xl border transition-all ${
                      esActiva
                        ? 'bg-[#10141f] border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                        : 'bg-[#0d1017] border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          {esActiva ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                              VOTACIÓN ABIERTA
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                              🔒 ESCRUTINIO CERRADO
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                            {mocion.tipoMayoria}
                          </span>
                        </div>
                        <h4 className="text-sm md:text-base font-bold text-white">{mocion.titulo}</h4>
                        <p className="text-xs text-slate-400 mt-1">{mocion.descripcion}</p>
                      </div>

                      {mocion.resultado && (
                        <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold shrink-0">
                          {mocion.resultado}
                        </div>
                      )}
                    </div>

                    {/* Barras de Coeficientes en tiempo real */}
                    <div className="bg-[#07090e] border border-slate-800 rounded-xl p-3 space-y-2.5 font-mono text-xs">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> A Favor
                          </span>
                          <span className="text-emerald-400 font-bold">{mocion.votosFavor.toFixed(1)}% Coeficiente</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${Math.min(100, mocion.votosFavor)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-rose-400 font-bold flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> En Contra
                          </span>
                          <span className="text-rose-400 font-bold">{mocion.votosContra.toFixed(1)}% Coeficiente</span>
                        </div>
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${Math.min(100, mocion.votosContra)}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-slate-400">⚪ Abstención</span>
                          <span className="text-slate-400">{mocion.votosAbstencion.toFixed(1)}% Coeficiente</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-600 transition-all duration-300" style={{ width: `${Math.min(100, mocion.votosAbstencion)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Botones de Voto para el Residente */}
                    {esActiva && (
                      yaVoto ? (
                        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4" />
                            Voto firmado y contabilizado ({sentidoVotado?.toUpperCase()})
                          </span>
                          <span className="text-[11px] text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-slate-700">
                            Hash SHA-256 inmutable • No modificable
                          </span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-3 pt-1">
                          <button
                            type="button"
                            onClick={() => handleVoteInternal(mocion.id, 'favor')}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer"
                          >
                            <Check className="w-4 h-4" /> Aprobar (+{coeficiente}%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVoteInternal(mocion.id, 'contra')}
                            className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <X className="w-4 h-4" /> Rechazar (+{coeficiente}%)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleVoteInternal(mocion.id, 'abstencion')}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold py-2.5 px-3 rounded-xl text-xs font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            ⚪ Abstención
                          </button>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: CHAT EN VIVO & BITÁCORA LEGAL LEY 675 (5 O 4 COLUMNAS EN DESKTOP) */}
        <div className={`${chatOpen ? 'lg:col-span-5' : 'lg:col-span-4'} flex flex-col space-y-4 transition-all duration-300`}>
          
          {/* PANEL DE ASISTENCIA Y ORDEN DEL DÍA */}
          <div className="bg-[#0b0f17] border border-cyan-500/25 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-mono uppercase font-bold text-cyan-400 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4" /> Orden del Día Legal
              </h4>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                Punto 4 de 7
              </span>
            </div>

            <ol className="space-y-2 text-xs font-sans text-slate-300">
              <li className="flex items-center gap-2 text-slate-500 line-through">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>1. Verificación del Quórum (92.4%)</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500 line-through">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>2. Elección Presidente y Secretario</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500 line-through">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>3. Informe de Gestión del Administrador</span>
              </li>
              <li className="flex items-center gap-2 text-cyan-300 font-bold bg-cyan-500/10 p-2 rounded-xl border border-cyan-500/30">
                <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse shrink-0" />
                <span>4. Presentación y Aprobación de Presupuesto 2026</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 pl-5">
                <span>5. Dictamen de la Revisoría Fiscal</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 pl-5">
                <span>6. Elección de miembros del Consejo</span>
              </li>
              <li className="flex items-center gap-2 text-slate-400 pl-5">
                <span>7. Proposiciones y Varios</span>
              </li>
            </ol>
          </div>

          {/* CHAT / BITÁCORA EN TIEMPO REAL */}
          <div className="bg-[#0b0f17] border border-cyan-500/25 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-xl min-h-[420px]">
            {/* Header del Chat */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0d121c] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-white">Intervenciones y Chat de Asamblea</h4>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded border border-slate-800">
                Auditado Ley 675
              </span>
            </div>

            {/* Mensajes */}
            <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-sans text-xs max-h-[360px] scrollbar-thin">
              {chatLog.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border ${
                    msg.esConsejo
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-100'
                      : 'bg-[#10141f] border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      {msg.esConsejo && <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {msg.autor}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{msg.hora}</span>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400/80 mb-1">{msg.cargo}</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{msg.texto}</p>
                </div>
              ))}
            </div>

            {/* Formulario para enviar mensaje */}
            <form onSubmit={handleEnviarMensaje} className="p-3 bg-[#0d121c] border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={mensajeChat}
                onChange={e => setMensajeChat(e.target.value)}
                placeholder="Escribe tu intervención o pregunta..."
                className="flex-1 bg-[#141923] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-400 outline-none font-sans"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer flex items-center justify-center shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

    </div>
  );
}
