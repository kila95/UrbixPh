import React, { useState, useEffect } from 'react';
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

  const [enLlamada, setEnLlamada] = useState(false);
  const [enColaEspera, setEnColaEspera] = useState(false);
  const [posicionCola, setPosicionCola] = useState(0);
  const [audioActivo, setAudioActivo] = useState(true);
  const [mensajeTexto, setMensajeTexto] = useState('');
  const [unidadConectada, setUnidadConectada] = useState(unidadResidenteActual);

  // Estado de la garita: 'disponible' | 'ocupado'
  const [estadoGarita, setEstadoGarita] = useState<'disponible' | 'ocupado'>('disponible');

  // Cola de residentes llamando a portería (vista vigilante)
  const [colaLlamadasGarita, setColaLlamadasGarita] = useState([
    {
      id: 'call_1',
      unidad: 'Torre 2 - 301',
      residente: 'Esteban Ochoa Mesa',
      motivo: 'Autorización ingreso domicilio farmacia',
      tiempoEspera: '00:18s'
    },
    {
      id: 'call_2',
      unidad: 'Torre 1 - 502',
      residente: 'Martha Lucía Gómez',
      motivo: 'Consulta llegada de paquete Servientrega',
      tiempoEspera: '00:45s'
    }
  ]);

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

  // Simulación del movimiento de la cola cuando el residente espera turno
  useEffect(() => {
    let timer: any;
    if (enColaEspera && posicionCola > 0) {
      timer = setTimeout(() => {
        const siguiente = posicionCola - 1;
        setPosicionCola(siguiente);
        if (siguiente === 0) {
          setEnColaEspera(false);
          setEnLlamada(true);
          onShowToast?.('🟢 ¡Es tu turno! Llamada conectada con la Garita Principal.');
        }
      }, 4000);
    }
    return () => clearTimeout(timer);
  }, [enColaEspera, posicionCola, onShowToast]);

  const intentarLlamada = (unidadObjetivo?: string) => {
    const target = unidadObjetivo || unidadResidenteActual;
    setUnidadConectada(target);

    if (!esVigilante && estadoGarita === 'ocupado') {
      setEnColaEspera(true);
      setPosicionCola(2);
      onShowToast?.('⚠️ Vigilante en otra llamada. Has sido agregado a la cola de espera (Posición #2).');
      return;
    }

    setEnLlamada(true);
    setEstadoGarita('ocupado');
    onShowToast?.(
      esVigilante
        ? `📞 Llamando al citófono virtual de ${target}...`
        : '📞 Conectando citófono virtual con la Garita Principal...'
    );
  };

  const atenderLlamadaDeCola = (item: { id: string; unidad: string; residente: string }) => {
    setUnidadConectada(`${item.unidad} (${item.residente})`);
    setEnLlamada(true);
    setEstadoGarita('ocupado');
    setColaLlamadasGarita(prev => prev.filter(c => c.id !== item.id));
    setHistorialLlamadas(prev => [
      {
        id: Date.now(),
        tipo: 'Llamada Entrante Atendida',
        destino: `${item.unidad} (${item.residente})`,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        estado: 'Conectado en Garita'
      },
      ...prev
    ]);
    onShowToast?.(`🟢 Llamada conectada con ${item.unidad} (${item.residente}).`);
  };

  const cancelarCola = () => {
    setEnColaEspera(false);
    setPosicionCola(0);
    onShowToast?.('❌ Saliste de la cola de espera de la garita.');
  };

  const colgarLlamada = () => {
    setEnLlamada(false);
    setEstadoGarita('disponible');
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

          {/* ESTADO 1: EN COLA DE ESPERA */}
          {enColaEspera ? (
            <div className="space-y-5 animate-fadeIn">
              <div className="w-24 h-24 bg-amber-500/20 border border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Users className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Vigilante en otra llamada</h4>
                <p className="text-xs text-amber-300 font-mono mt-1">
                  Estás en la cola de espera. Posición: <strong className="text-white text-base">#{posicionCola}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  El sistema te conectará automáticamente cuando sea tu turno.
                </p>
              </div>
              <button
                type="button"
                onClick={cancelarCola}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar y Salir de la Cola
              </button>
            </div>
          ) : !enLlamada ? (
            /* ESTADO 2: DISPONIBLE / RECEPCIÓN DE LLAMADA ENTRANTE */
            <div className="space-y-4 animate-fadeIn">
              <div
                className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition ${
                  esVigilante && colaLlamadasGarita.length > 0
                    ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                }`}
              >
                {esVigilante && colaLlamadasGarita.length > 0 ? (
                  <PhoneCall className="w-10 h-10 animate-bounce text-emerald-400" />
                ) : (
                  <Phone className="w-10 h-10 text-emerald-400" />
                )}
              </div>
              <div>
                <h4 className="text-lg font-black text-white">
                  {esVigilante
                    ? colaLlamadasGarita.length > 0
                      ? `🔔 Llamada Entrante: ${colaLlamadasGarita[0].unidad} (${colaLlamadasGarita[0].residente})`
                      : '🟢 Disponible para Llamadas'
                    : 'Llamar a Portería / Garita'}
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {esVigilante
                    ? colaLlamadasGarita.length > 0
                      ? `Motivo: "${colaLlamadasGarita[0].motivo}". Presiona el botón para contestar de inmediato.`
                      : 'La consola de portería está lista. Selecciona un apartamento del directorio para marcar o aguarda llamadas entrantes.'
                    : estadoGarita === 'disponible'
                    ? 'Presiona el botón para entablar comunicación directa por voz con el guarda de turno.'
                    : '⚠️ La línea está ocupada. Si llamas, ingresarás a la cola de espera automática.'}
                </p>
              </div>

              {esVigilante ? (
                colaLlamadasGarita.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => atenderLlamadaDeCola(colaLlamadasGarita[0])}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)] inline-flex items-center gap-2 animate-bounce"
                  >
                    <PhoneCall className="w-4 h-4" /> Contestar a {colaLlamadasGarita[0].unidad}
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Línea de Portería Libre • Listo para recibir o marcar
                  </div>
                )
              ) : (
                <button
                  type="button"
                  onClick={() => intentarLlamada(unidadConectada)}
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] inline-flex items-center gap-2"
                >
                  <PhoneCall className="w-4 h-4" />{' '}
                  {estadoGarita === 'disponible'
                    ? 'Iniciar Llamada a Garita'
                    : 'Llamar (Entrar en Cola de Espera)'}
                </button>
              )}
            </div>
          ) : (
            /* ESTADO 3: EN LLAMADA ACTIVA */
            <div className="space-y-6 animate-fadeIn">
              <div className="w-24 h-24 bg-rose-500/20 border border-rose-500/40 rounded-full mx-auto flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                <PhoneCall className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">🔴 En Llamada con {unidadConectada}</h4>
                <p className="text-xs text-emerald-400 font-mono mt-1">
                  Canal de audio WebRTC seguro activo en tiempo real
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setAudioActivo(!audioActivo)}
                  className={`p-3 rounded-2xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${
                    audioActivo ? 'bg-slate-800 text-white border border-slate-700' : 'bg-amber-500 text-slate-950 font-black'
                  }`}
                >
                  {audioActivo ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                  {audioActivo ? 'Micrófono Abierto' : 'Micrófono Silenciado'}
                </button>
                <button
                  type="button"
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <PhoneOff className="w-4 h-4" /> Colgar / Finalizar
                </button>
              </div>
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
                      onClick={() => atenderLlamadaDeCola(llamada)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5 shadow-lg w-full"
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Contestar Ahora
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
                  onClick={() => intentarLlamada(item.unidad)}
                  className="bg-cyan-500/15 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold px-3 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Phone className="w-3.5 h-3.5" /> Llamar
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Panel Lateral: Nota Prioritaria / Envío de Mensaje por Vigilante */}
        {esVigilante && (
          <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
                <MessageSquare className="w-4 h-4 text-cyan-400" /> Notas Prioritarias de Residentes
              </h4>

              <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                {notasPrioritarias.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border text-xs space-y-1.5 ${
                      n.atendida
                        ? 'bg-[#07090e]/60 border-slate-800/80 text-slate-400'
                        : 'bg-[#07090e] border-cyan-500/30 text-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-cyan-400 font-mono">{n.unidad}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{n.hora}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{n.mensaje}</p>
                    <button
                      type="button"
                      onClick={() => marcarNotaAtendida(n.id)}
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border cursor-pointer transition inline-flex items-center gap-1 ${
                        n.atendida
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {n.atendida ? 'Atendida ✓' : 'Marcar Atendida'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={enviarMensajeRapido} className="space-y-3 pt-2 border-t border-slate-800/80">
              <textarea
                rows={2}
                placeholder={`Enviar aviso rápido a ${unidadConectada}...`}
                value={mensajeTexto}
                onChange={(e) => setMensajeTexto(e.target.value)}
                className="w-full p-3 text-xs bg-[#07090e] border border-slate-700 text-white rounded-2xl outline-none focus:border-cyan-400 resize-none"
                required
              />
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-2xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" /> Enviar Aviso al Apartamento
              </button>
            </form>
          </div>
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
