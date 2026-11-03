import React, { useState } from 'react';
import { 
  Radio, Volume2, Users, Video, Mic, MicOff, VideoOff, 
  PhoneCall, PhoneOff, Wifi 
} from 'lucide-react';

export default function SalaAsambleaVirtual() {
  // Estado que define si la asamblea / llamada está en curso o en espera
  const [llamadaActiva, setLlamadaActiva] = useState(false);

  // Lista de participantes (cuando la llamada está en vivo)
  const participantes = [
    { id: '1', nombre: 'Esteban Ochoa', apt: 'T1-302', iniciales: 'EO', mic: false, activo: false },
    { id: '2', nombre: 'Eloina Mesa Mesa', apt: 'Admin', iniciales: 'EM', mic: false, activo: false },
    { id: '3', nombre: 'Andrés Vesga', apt: 'Portería', iniciales: 'AV', mic: false, activo: false },
    { id: '4', nombre: 'Darío Negrette', apt: 'T1-502', iniciales: 'DN', mic: true, activo: true },
    { id: '5', nombre: 'Carlos Andrés Gómez', apt: 'T1-101', iniciales: 'CG', mic: false, activo: false },
    { id: '6', nombre: 'María Camila Restrepo', apt: 'T1-102', iniciales: 'MR', mic: false, activo: false },
    { id: '7', nombre: 'Santiago Vélez', apt: 'T2-205', iniciales: 'SV', mic: false, activo: false },
    { id: '8', nombre: 'Daniela Restrepo', apt: 'T2-103', iniciales: 'DR', mic: false, activo: false },
    { id: '9', nombre: 'Juan Fernando', apt: 'T2-505', iniciales: 'JF', mic: false, activo: false },
  ];

  return (
    <div className="w-full bg-[#0b0f17] border border-cyan-500/20 rounded-3xl p-5 shadow-2xl font-sans text-slate-100">
      
      {/* ========================================================
          1. BARRA SUPERIOR DE ESTADO
         ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge de Estado Dinámico */}
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 ${
            llamadaActiva 
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse' 
              : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
          }`}>
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            {llamadaActiva ? 'TRANSMISIÓN EN VIVO' : 'SALA EN ESPERA'}
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-mono text-cyan-300 bg-cyan-950/50 border border-cyan-800/50 flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-cyan-400" />
            Canal Masivo SFU (Capacidad: 100-200 Personas)
          </span>

          <span className="px-3 py-1 rounded-full text-xs font-mono text-slate-300 bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${llamadaActiva ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
            {llamadaActiva ? `${participantes.length} Conectados` : '0 Conectados'}
          </span>
        </div>

        {/* Botón para Iniciar / Terminar Llamada */}
        <div className="flex items-center gap-2">
          {!llamadaActiva ? (
            <button
              onClick={() => setLlamadaActiva(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Conectar / Abrir Sala</span>
            </button>
          ) : (
            <button
              onClick={() => setLlamadaActiva(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-lg shadow-rose-600/20"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>Finalizar Llamada</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. CONTENEDOR PRINCIPAL INTERCAMBIABLE
         ======================================================== */}
      {!llamadaActiva ? (
        /* ESTADO A: SALA EN ESPERA (Tu diseño original) */
        <div className="w-full aspect-video min-h-[420px] bg-[#070a10] border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
            <Radio className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-xl font-bold font-mono text-white">
              Sala Lista para Convocatoria y Citación en Vivo
            </h3>
            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              Elige Asamblea General (canal masivo 100–200 personas) o Reunión de Consejo/Comité. Al pulsar conectar se habilitará la cuadrícula de video para los copropietarios.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setLlamadaActiva(true)}
              className="px-5 py-2.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
            >
              ▶ Iniciar Transmisión de la Asamblea
            </button>
          </div>
        </div>
      ) : (
        /* ESTADO B: CUADRÍCULA ACTIVA TEAMS (Mismo espacio exacto) */
        <div className="w-full aspect-video min-h-[420px] bg-[#070a10] border border-cyan-500/30 rounded-2xl p-2 grid grid-cols-3 grid-rows-3 gap-2 shadow-[0_0_25px_rgba(0,242,254,0.1)]">
          {participantes.map((p) => (
            <div
              key={p.id}
              className={`relative rounded-xl flex items-center justify-center transition-all bg-[#0b0f17] border ${
                p.activo
                  ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.3)] bg-cyan-950/20'
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Círculo central con iniciales */}
              <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center font-mono font-bold text-sm md:text-lg select-none border shadow-md ${
                p.activo
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50'
                  : 'bg-slate-900 text-slate-300 border-slate-700/80'
              }`}>
                {p.iniciales}
              </div>

              {/* Etiqueta inferior con nombre y micrófono */}
              <div className="absolute bottom-1.5 left-1.5 max-w-[90%] flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-mono border border-slate-800/80">
                <span className="truncate text-slate-200">{p.nombre}</span>
                <span className="text-cyan-400">({p.apt})</span>
                {p.mic ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                ) : (
                  <span className="text-[9px] text-rose-400/80 ml-0.5">🔇</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
