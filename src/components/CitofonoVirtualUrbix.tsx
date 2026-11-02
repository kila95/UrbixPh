import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, Camera, Send, Clock, AlertCircle, Users } from 'lucide-react';

export default function CitofonoVirtualUrbix({
  unidadResidenteActual = 'Torre 2 - 301',
  rolUsuario = 'residente',
  onShowToast
}: {
  unidadResidenteActual?: string;
  rolUsuario?: 'residente' | 'vigilante' | string;
  onShowToast?: (msg: string) => void;
}) {
  const [enLlamada, setEnLlamada] = useState(false);
  const [enColaEspera, setEnColaEspera] = useState(false);
  const [posicionCola, setPosicionCola] = useState(0);
  const [audioActivo, setAudioActivo] = useState(true);
  const [mensajeTexto, setMensajeTexto] = useState('');
  
  // Estado de la garita: 'disponible' | 'ocupado'
  const [estadoGarita, setEstadoGarita] = useState<'disponible' | 'ocupado'>('disponible');

  const [historialLlamadas, setHistorialLlamadas] = useState([
    { id: 1, tipo: 'Llamada de Voz', destino: 'Portería Principal', hora: '08:30 AM', estado: 'Atendido (Guarda Carlos)' },
    { id: 2, tipo: 'Reporte con Foto', destino: 'Portería Principal', hora: 'Ayer 04:15 PM', estado: 'Resuelto' }
  ]);

  // Simulación del movimiento de la cola cuando el vigilante está ocupado
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
      }, 4000); // Simula que cada 4 segundos avanza un turno
    }
    return () => clearTimeout(timer);
  }, [enColaEspera, posicionCola]);

  const intentarLlamada = () => {
    if (estadoGarita === 'ocupado') {
      setEnColaEspera(true);
      setPosicionCola(2); // Supongamos que hay 2 unidades antes en la cola
      onShowToast?.('⚠️ Vigilante en otra llamada. Has sido agregado a la cola de espera (Posición #2).');
      return;
    }
    setEnLlamada(true);
    onShowToast?.('📞 Conectando citófono virtual con la Garita Principal...');
  };

  const cancelarCola = () => {
    setEnColaEspera(false);
    setPosicionCola(0);
    onShowToast?.('❌ Saliste de la cola de espera de la garita.');
  };

  const colgarLlamada = () => {
    setEnLlamada(false);
    onShowToast?.('📴 Llamada de citófono finalizada.');
  };

  const enviarMensajeRapido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensajeTexto.trim()) return;
    setHistorialLlamadas(prev => [
      { id: Date.now(), tipo: 'Nota Prioritaria', destino: 'Portería Principal', hora: 'Hace un momento', estado: 'Enviado a Bandeja de Garita' },
      ...prev
    ]);
    setMensajeTexto('');
    onShowToast?.('📨 Nota prioritaria enviada a la garita correctamente.');
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA DEL CITÓFONO */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <PhoneCall className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Intercomunicador Digital • Urbix PH
            </span>
            <h3 className="text-base font-black text-white mt-1">Citófono Virtual Directo (Residente ⇄ Garita)</h3>
          </div>
        </div>

        {/* SIMULADOR DE ESTADO DE LÍNEA */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setEstadoGarita(estadoGarita === 'disponible' ? 'ocupado' : 'disponible')}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
              estadoGarita === 'disponible'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}
            title="Haz clic para simular ocupado"
          >
            <span className={`w-2 h-2 rounded-full ${estadoGarita === 'disponible' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500 animate-ping'}`} />
            {estadoGarita === 'disponible' ? 'Línea Disponible' : 'Vigilante Ocupado (Simulador)'}
          </button>
        </div>
      </div>

      {/* CUERPO PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel de Intercomunicación y Cola */}
        <div className="lg:col-span-2 bg-[#0b0f17] border border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-6 shadow-inner relative min-h-[320px]">
          
          <div className="absolute top-4 left-4 text-xs font-mono text-slate-400">
            Unidad Activa: <strong className="text-cyan-400">{unidadResidenteActual}</strong>
          </div>

          {/* ESTADO 1: EN COLA DE ESPERA */}
          {enColaEspera ? (
            <div className="space-y-5 animate-fade-in">
              <div className="w-24 h-24 bg-amber-500/20 border border-amber-500/40 rounded-full mx-auto flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
                <Users className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Vigilante en otra llamada</h4>
                <p className="text-xs text-amber-300 font-mono mt-1">
                  Estás en la cola de espera. Posición: <strong className="text-white text-base">#{posicionCola}</strong>
                </p>
                <p className="text-[11px] text-slate-400 mt-1">El sistema te conectará automáticamente cuando sea tu turno.</p>
              </div>
              <button
                onClick={cancelarCola}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-6 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancelar y Salir de la Cola
              </button>
            </div>
          ) : !enLlamada ? (
            /* ESTADO 2: INICIO DE LLAMADA */
            <div className="space-y-4">
              <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center transition ${
                estadoGarita === 'disponible'
                  ? 'bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_30px_rgba(34,211,238,0.2)]'
                  : 'bg-rose-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.2)]'
              }`}>
                <Phone className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Llamar a Portería / Garita</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  {estadoGarita === 'disponible'
                    ? 'Presiona el botón para entablar comunicación directa por voz con el guarda de turno.'
                    : '⚠️ La línea está ocupada. Si llamas, ingresarás a la cola de espera automática.'}
                </p>
              </div>
              <button
                onClick={intentarLlamada}
                className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-[0_0_20px_rgba(34,211,238,0.3)] inline-flex items-center gap-2"
              >
                <PhoneCall className="w-4 h-4" /> {estadoGarita === 'disponible' ? 'Iniciar Llamada a Garita' : 'Llamar (Entrar en Cola de Espera)'}
              </button>
            </div>
          ) : (
            /* ESTADO 3: EN LLAMADA ACTIVA */
            <div className="space-y-6 animate-pulse">
              <div className="w-24 h-24 bg-rose-500/20 border border-rose-500/40 rounded-full mx-auto flex items-center justify-center text-rose-400 shadow-[0_0_30px_rgba(244,63,94,0.3)]">
                <PhoneCall className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Comunicación en Curso...</h4>
                <p className="text-xs text-emerald-400 font-mono mt-1">🔴 Canal de audio WebRTC seguro activo con Portería Principal</p>
              </div>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setAudioActivo(!audioActivo)}
                  className={`p-3 rounded-2xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-1.5 ${audioActivo ? 'bg-slate-800 text-white' : 'bg-amber-500 text-slate-950'}`}
                >
                  <Mic className="w-4 h-4" /> {audioActivo ? 'Micrófono Abierto' : 'Silenciado'}
                </button>
                <button
                  onClick={colgarLlamada}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-3 rounded-2xl text-xs transition cursor-pointer inline-flex items-center gap-2 shadow-lg shadow-rose-500/20"
                >
                  <PhoneOff className="w-4 h-4" /> Colgar / Finalizar
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Panel Lateral: Nota Prioritaria */}
        <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Camera className="w-4 h-4 text-cyan-400" /> Nota Rápida a Garita
            </h4>
            <p className="text-[11px] text-slate-400 mt-2">¿Prefieres no esperar en la cola? Deja un mensaje directo para que el guarda lo lea de inmediato.</p>
          </div>

          <form onSubmit={enviarMensajeRapido} className="space-y-3">
            <textarea
              rows={3}
              placeholder="Escribe tu requerimiento..."
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
                  {item.tipo.includes('Voz') ? <Phone className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
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
