import React, { useState } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  Send,
  Clock,
  Users,
  CheckCircle2,
  Building2,
  BellRing,
  MessageSquare
} from 'lucide-react';
import { useCitofonoEngine } from '../useCitofonoEngine';
import { PanelNotasVigilante } from './PanelNotasVigilante';

export interface CitofonoVirtualEnterpriseProps {
  unidadResidenteActual?: string;
  rolUsuario?: 'residente' | 'vigilante' | string;
  onShowToast?: (msg: string) => void;
}

export default function CitofonoVirtualEnterprise({
  unidadResidenteActual = 'Torre 2 - 301',
  rolUsuario = 'vigilante',
  onShowToast
}: CitofonoVirtualEnterpriseProps) {
  const esVigilante = rolUsuario === 'vigilante';

  const {
    estado,
    tiempoFormateado,
    llamadaActiva,
    colaLlamadas,
    estaSilenciado,
    alternarSilencio,
    iniciarLlamada,
    contestarLlamada,
    colgarLlamada
  } = useCitofonoEngine({
    miRol: esVigilante ? 'vigilante' : 'residente',
    miUnidad: unidadResidenteActual,
    miNombre: 'Esteban Ochoa Mesa'
  });

  const [audioActivo, setAudioActivo] = useState(true);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [unidadConectada, setUnidadConectada] = useState(unidadResidenteActual);

  // Estado de la garita: 'disponible' | 'ocupado'
  const [estadoGarita, setEstadoGarita] = useState<'disponible' | 'ocupado'>('disponible');

  // Cola de residentes llamando a portería (vista vigilante)
  const [colaLlamadasGarita, setColaLlamadasGarita] = useState<Array<{
    id: string;
    unidad: string;
    residente: string;
    motivo: string;
    tiempoEspera: string;
  }>>([]);

  // Directorio rápido de unidades para marcado directo desde Garita
  const directorioUnidades = [
    { unidad: 'Torre 2 - 301', propietario: 'Esteban Ochoa Mesa', estado: 'En línea' },
    { unidad: 'Torre 1 - 502', propietario: 'Martha Lucía Gómez', estado: 'En línea' },
    { unidad: 'Torre 1 - 202', propietario: 'María Fernanda Gómez', estado: 'En línea' },
    { unidad: 'Torre 2 - 404', propietario: 'Dr. Mauricio Restrepo', estado: 'En línea' }
  ];

  // Notas prioritarias recibidas en garita
  const [notasPrioritarias, setNotasPrioritarias] = useState([
    {
      id: 101,
      unidad: 'Torre 2 - 301',
      mensaje: 'Guarda Carlos, por favor autorizar ingreso de domiciliario de Farmatodo que viene en camino.',
      hora: 'Hace 5 min',
      atendida: false
    },
    {
      id: 102,
      unidad: 'Torre 1 - 202',
      mensaje: 'Favor confirmar si llegó correspondencia certificada a nombre de María Fernanda.',
      hora: 'Hace 18 min',
      atendida: true
    }
  ]);

  const [historialLlamadas, setHistorialLlamadas] = useState([
    {
      id: 1,
      tipo: 'Llamada de Voz WebRTC',
      destino: esVigilante ? 'Torre 2 - 301 (Esteban Ochoa)' : 'Portería Principal',
      hora: '08:30 AM',
      estado: 'Atendido (Guarda Carlos)'
    },
    {
      id: 2,
      tipo: 'Nota Prioritaria',
      destino: esVigilante ? 'Torre 1 - 502 (Martha Gómez)' : 'Portería Principal',
      hora: 'Ayer 04:15 PM',
      estado: 'Resuelto'
    }
  ]);

  const enLlamada = estado === 'conectado';
  const enLlamando = estado === 'llamando';
  const enEntrante = estado === 'entrante' || (esVigilante && llamadaActiva);
  const enColaEspera = colaLlamadas.length > 0;
  const posicionCola = colaLlamadas.length;

  const intentarLlamada = (unidadObjetivo?: string) => {
    const target = unidadObjetivo || unidadResidenteActual;
    setUnidadConectada(target);
    iniciarLlamada(target);
    onShowToast?.(
      esVigilante
        ? `📞 Llamando al citófono virtual de ${target}...`
        : '📞 Conectando citófono virtual con la Garita Principal...'
    );
  };

  const atenderLlamadaDeCola = (item: { id: string; unidad: string; residente: string }) => {
    setUnidadConectada(`${item.unidad} (${item.residente})`);
    contestarLlamada();
    onShowToast?.(`🟢 Llamada conectada con ${item.unidad} (${item.residente}).`);
  };

  const cancelarCola = () => {
    colgarLlamada();
    onShowToast?.('❌ Saliste de la cola de espera de la garita.');
  };

  const colgarLlamadaAccion = () => {
    colgarLlamada();
    setHistorialLlamadas(prev => [
      {
        id: Date.now(),
        tipo: 'Llamada de Voz WebRTC',
        destino: esVigilante ? unidadConectada : 'Portería Principal',
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: 'Finalizada OK'
      },
      ...prev
    ]);
    onShowToast?.('📴 Llamada de citófono finalizada. Línea disponible.');
  };

  const enviarMensajeRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeTexto.trim()) return;

    const nuevoDestino = esVigilante ? unidadConectada : 'Portería Principal';

    setHistorialLlamadas(prev => [
      {
        id: Date.now(),
        tipo: esVigilante ? 'Aviso de Portería' : 'Nota Prioritaria',
        destino: nuevoDestino,
        hora: 'Hace un momento',
        estado: esVigilante ? 'Notificado al Residente' : 'Enviado a Bandeja de Garita'
      },
      ...prev
    ]);

    if (!esVigilante) {
      setNotasPrioritarias(prev => [
        {
          id: Date.now(),
          unidad: unidadResidenteActual,
          mensaje: mensajeTexto.trim(),
          hora: 'Hace un momento',
          atendida: false
        },
        ...prev
      ]);
    }

    setMensajeTexto('');
    onShowToast?.(
      esVigilante
        ? `📨 Aviso rápido enviado a ${unidadConectada}.`
        : '📨 Nota prioritaria enviada a la garita correctamente.'
    );
  };

  const marcarNotaAtendida = (id: number) => {
    setNotasPrioritarias(prev =>
      prev.map(n => (n.id === id ? { ...n, atendida: !n.atendida } : n))
    );
    onShowToast?.('✅ Estado de nota prioritaria actualizado en garita.');
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6 animate-fadeIn">
      {/* CABECERA DEL CITÓFONO */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30 shrink-0">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Intercomunicador Digital • Urbix PH ({esVigilante ? 'Consola Vigilante' : 'Portal Residente'})
            </span>
            <h3 className="text-base font-black text-white mt-1">
              Citófono Virtual Directo (Residente ⇄ Garita)
            </h3>
          </div>
        </div>

        {/* SIMULADOR DE ESTADO DE LÍNEA */}
        <div className="flex items-center gap-3 font-mono text-xs flex-wrap">
          <button
            type="button"
            onClick={() => setEstadoGarita(estadoGarita === 'disponible' ? 'ocupado' : 'disponible')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
              estadoGarita === 'disponible'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title="Haz clic para cambiar estado de línea"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                estadoGarita === 'disponible' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'
              }`}
            />
            {estadoGarita === 'disponible' ? 'Línea Disponible' : 'Vigilante Ocupado (Simulador)'}
          </button>
        </div>
      </div>

      {/* SECCIÓN PRINCIPAL SUPERIOR: MÓDULO PRINCIPAL DE LLAMADA Y COLA ENTRANTE (BIEN VISIBLE ARRIBA) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Principal de Intercomunicación y Contestador */}
        <div className="lg:col-span-2 bg-[#0b0f17] border border-cyan-500/30 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative min-h-[320px]">
          <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">
            {enLlamada ? (
              <>
                Canal Activo: <strong className="text-emerald-400">{unidadConectada}</strong>
              </>
            ) : esVigilante && colaLlamadasGarita.length > 0 ? (
              <>
                Llamada Entrante: <strong className="text-amber-400">{colaLlamadasGarita[0].unidad}</strong>
              </>
            ) : (
              <>
                Estado del Canal: <strong className="text-emerald-400">Línea Disponible</strong>
              </>
            )}
          </div>

          {esVigilante ? (
            /* CONSOLA DE VIGILANTE DEDICADA Y 100% DINÁMICA */
            <div className="w-full space-y-5">
              {/* 1. ESTADO EN ESPERA (NADIE ESTÁ LLAMANDO) */}
              {estado === 'disponible' && (
                <div className="space-y-4 py-8">
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Phone className="w-8 h-8 opacity-40" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-300 font-mono">
                      Línea en Espera
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-1">
                      Esperando llamadas entrantes de residentes o marca desde el directorio.
                    </p>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    ● Garita Lista para Recibir
                  </span>
                </div>
              )}

              {/* 2. ESTADO ENTRANTE (CUANDO EL RESIDENTE MARCA EN VIVO) */}
              {estado === 'entrante' && (
                <div className="space-y-4 py-4 animate-pulse">
                  <div className="w-20 h-20 mx-auto rounded-full bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(0,242,254,0.4)]">
                    <PhoneCall className="w-9 h-9 animate-bounce text-cyan-400" />
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full font-bold">
                      🔔 Llamada Entrante: {llamadaActiva?.unidad || 'Torre 2 - 301'}
                    </span>
                    <h3 className="text-lg font-black text-white font-mono mt-2">
                      {llamadaActiva?.nombre || 'Residente'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-1">
                      Motivo: &ldquo;{llamadaActiva?.motivo || 'Llamada a portería'}&rdquo;
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={contestarLlamada}
                    className="w-full max-w-xs mx-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Contestar a {llamadaActiva?.unidad || 'Torre 2 - 301'}
                  </button>
                </div>
              )}

              {/* 3. ESTADO CONECTADO (AUDIO ACTIVO EN VIVO) */}
              {estado === 'conectado' && (
                <div className="space-y-4 py-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center text-emerald-300 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
                    <Phone className="w-9 h-9 text-emerald-400" />
                  </div>

                  <div>
                    <span className="text-[11px] font-mono uppercase bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-0.5 rounded-full font-bold">
                      ● COMUNICACIÓN ACTIVA ({tiempoFormateado})
                    </span>
                    <h3 className="text-lg font-black text-white font-mono mt-2">
                      {llamadaActiva?.unidad || unidadConectada} {llamadaActiva?.nombre ? `(${llamadaActiva.nombre})` : ''}
                    </h3>
                    <p className="text-xs text-cyan-400 font-mono mt-1">
                      Audio WebRTC bidireccional transmitiendo
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={alternarSilencio}
                      className={`p-3 rounded-2xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                        !estaSilenciado ? 'bg-slate-800 text-white border border-slate-700' : 'bg-amber-500 text-slate-950 font-black'
                      }`}
                    >
                      {!estaSilenciado ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                      {!estaSilenciado ? 'Micrófono Abierto' : 'Micrófono Silenciado'}
                    </button>
                    <button
                      type="button"
                      onClick={colgarLlamadaAccion}
                      className="w-full max-w-xs mx-auto bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <PhoneOff className="w-4 h-4" />
                      Finalizar Llamada
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* CONSOLA DE RESIDENTE */
            <div className="w-full space-y-4">
              {estado === 'entrante' ? (
                <div className="space-y-4 animate-pulse">
                  <div className="w-20 h-20 mx-auto rounded-full bg-cyan-950/60 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(0,242,254,0.4)]">
                    <PhoneCall className="w-9 h-9 animate-bounce text-cyan-400" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-0.5 rounded-full font-bold">
                      🔔 Llamada de Portería
                    </span>
                    <h3 className="text-lg font-black text-white font-mono mt-2">
                      Portería Principal
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={contestarLlamada}
                    className="w-full max-w-xs mx-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4" /> Contestar
                  </button>
                </div>
              ) : estado === 'conectado' ? (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-950/60 border-2 border-emerald-400 flex items-center justify-center text-emerald-300">
                    <Phone className="w-9 h-9 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-black text-white font-mono">
                    En Llamada con Portería ({tiempoFormateado})
                  </h4>
                  <button
                    type="button"
                    onClick={colgarLlamadaAccion}
                    className="bg-rose-600 hover:bg-rose-500 text-white font-black py-3 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                  >
                    Colgar
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                    <Phone className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-bold text-white font-mono">Llamar a Portería</h4>
                  <button
                    type="button"
                    onClick={() => intentarLlamada()}
                    className="bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition cursor-pointer"
                  >
                    Iniciar Llamada a Garita
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cola de Llamadas Entrantes en Garita (Lado Derecho Superior para Vigilante) */}
        {esVigilante ? (
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                <BellRing className="w-4 h-4 text-amber-400" /> Cola de Llamadas Entrantes
              </h4>
              <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
                {colaLlamadasGarita.length} en espera
              </span>
            </div>

            {colaLlamadasGarita.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {colaLlamadasGarita.map((llamada, idx) => (
                  <div
                    key={llamada.id}
                    className="p-3.5 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col justify-between gap-2.5 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          Turno #{idx + 1}
                        </span>
                        <span className="font-bold text-white text-sm">{llamada.unidad}</span>
                      </div>
                      <p className="text-slate-300 font-medium text-xs mt-0.5">{llamada.residente}</p>
                      <p className="text-slate-400 mt-1 text-[11px]">
                        Motivo: <span className="text-slate-200">{llamada.motivo}</span> • Espera: {llamada.tiempoEspera}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        atenderLlamadaDeCola(llamada);
                        contestarLlamada();
                      }}
                      className="w-full bg-[#00f2fe] text-slate-950 font-black py-2 rounded-xl text-xs font-mono transition hover:brightness-110 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      Contestar Ahora
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
                No hay llamadas de residentes en cola de espera.
              </p>
            )}
          </div>
        ) : (
          /* Panel Lateral para Residente: Nota Rápida */
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
                <Camera className="w-4 h-4 text-cyan-400" /> Nota Rápida a Garita
              </h4>
              <p className="text-[11px] text-slate-400">
                ¿Prefieres no esperar en la cola? Deja un mensaje directo para que el guarda lo lea de inmediato.
              </p>
            </div>
            <form onSubmit={enviarMensajeRapido} className="space-y-3 pt-2 border-t border-slate-800/80">
              <textarea
                rows={3}
                placeholder="Escribe tu requerimiento para portería..."
                value={mensajeTexto}
                onChange={(e) => setMensajeTexto(e.target.value)}
                className="w-full p-3 text-xs bg-[#07090e] border border-slate-700 text-white rounded-2xl outline-none focus:border-cyan-400 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-2xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Nota Rápida
              </button>
            </form>
          </div>
        )}
      </div>

      {/* SECCIÓN SECUNDARIA: DIRECTORIO RÁPIDO & NOTAS PRIORITARIAS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Directorio Rápido de Unidades */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-400" /> Directorio Rápido de Unidades (Marcar desde Garita)
            </h4>
            <span className="text-[10px] font-mono text-slate-400">WebRTC Directo</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {directorioUnidades.map((item) => (
              <div
                key={item.unidad}
                className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-bold text-white">{item.unidad}</div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">{item.propietario}</div>
                </div>
                <button
                  type="button"
                  onClick={() => estado === 'conectado' ? colgarLlamada() : intentarLlamada(item.unidad)}
                  className="px-3.5 py-1.5 rounded-xl border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  {estado === 'conectado' && llamadaActiva?.unidad === item.unidad ? 'Colgar' : 'Llamar'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Lateral: Notas Prioritarias Conectadas en Tiempo Real */}
        {esVigilante && (
          <PanelNotasVigilante />
        )}
      </div>

      {/* HISTORIAL DE LLAMADAS Y REPORTES CON GARITA */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Registro de Intercomunicación Reciente
          </h4>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {historialLlamadas.length} Eventos Registrados
          </span>
        </div>

        <div className="space-y-2">
          {historialLlamadas.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-[#07090e] border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  {item.tipo.includes('Voz') || item.tipo.includes('Llamada') ? (
                    <Phone className="w-4 h-4" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-xs">{item.tipo}</span>
                    <span className="text-[10px] font-mono text-slate-400">→ {item.destino}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{item.hora}</span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
