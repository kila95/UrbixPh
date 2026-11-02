import React from 'react';
import { Phone, PhoneCall, PhoneOff } from 'lucide-react';
import { useCitofonoEngine } from '../useCitofonoEngine';

export default function ModuloCitofonoVigilante() {
  const {
    estado,
    tiempoFormateado,
    llamadaActiva,
    colaLlamadas,
    contestarLlamada,
    colgarLlamada
  } = useCitofonoEngine({
    miRol: 'vigilante'
  });

  return (
    <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-6 text-center space-y-5">
      
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
              {llamadaActiva?.unidad} ({llamadaActiva?.nombre})
            </h3>
            <p className="text-xs text-cyan-400 font-mono mt-1">
              Audio WebRTC bidireccional transmitiendo
            </p>
          </div>

          <button
            onClick={colgarLlamada}
            className="w-full max-w-xs mx-auto bg-rose-600 hover:bg-rose-500 text-white font-black py-3.5 px-6 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(244,63,94,0.4)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            Finalizar Llamada
          </button>
        </div>
      )}

    </div>
  );
}
