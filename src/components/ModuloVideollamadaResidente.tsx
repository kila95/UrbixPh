import React, { useState, useEffect } from 'react';
import { Radio } from 'lucide-react';
import { ModalLlamadaEntranteResidente } from './ModalLlamadaEntranteResidente';

export default function ModuloVideollamadaResidente({
  userProfile,
  copropiedadNombre = 'Urb. Tricentenario'
}: {
  userProfile?: any;
  copropiedadNombre?: string;
}) {
  const [enLlamada, setEnLlamada] = useState(false);
  const [llamadaEntrante, setLlamadaEntrante] = useState<any>(null);
  const [enEspera, setEnEspera] = useState(false);

  const miUnidad = userProfile?.unit || 'Torre 1 - 101';
  const miNombre = userProfile?.full_name || 'Residente Copropietario';

  // Escuchar por SSE cuando el administrador abre la sala
  useEffect(() => {
    const sse = new EventSource('/api/asamblea-events');

    sse.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data);

        // Cuando el administrador emite la convocatoria
        if (data.event === 'asamblea_convocatoria_abierta') {
          const citados = data.payload?.citados || data.payload?.apartamentosConvocados || [];
          // Si citaron a todos o citaron específicamente a esta unidad
          const aplicaParaMi = citados.length === 0 || 
                               citados.includes('TODOS') || 
                               citados.some((c: string) => c.toLowerCase().includes(miUnidad.toLowerCase()));

          if (aplicaParaMi) {
            setLlamadaEntrante({
              tipo: data.payload?.tipo || data.payload?.titulo || 'Reunión Ordinaria',
              copropiedadNombre,
              organizador: 'Administración P.H.'
            });
          }
        }

        // Si la administración finaliza la sesión
        if (data.event === 'asamblea_cerrada') {
          setEnLlamada(false);
          setLlamadaEntrante(null);
          setEnEspera(false);
        }
      } catch (err) {}
    };

    return () => sse.close();
  }, [miUnidad, copropiedadNombre]);

  // Manejadores de los botones
  const handleContestar = () => {
    setEnLlamada(true);
    setLlamadaEntrante(null);
    setEnEspera(false);

    // Notificar al administrador que contestó
    fetch('/api/asamblea-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'participante_listo',
        payload: {
          peerId: userProfile?.id || `res-${Date.now()}`,
          nombre: miNombre,
          unidad: miUnidad,
          iniciales: miNombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase(),
          micActivo: true
        }
      })
    }).catch(console.error);
  };

  const handleDeclinar = () => {
    setLlamadaEntrante(null);
    setEnEspera(false);
  };

  const handlePonerEnEspera = () => {
    setLlamadaEntrante(null);
    setEnEspera(true);
  };

  return (
    <div className="w-full bg-[#0b0f17] border border-cyan-500/20 rounded-3xl p-6 text-slate-100 font-sans shadow-2xl">
      
      {/* Modal flotante que suena y muestra los 3 botones */}
      <ModalLlamadaEntranteResidente
        isOpen={Boolean(llamadaEntrante)}
        convocatoria={llamadaEntrante}
        onContestar={handleContestar}
        onDeclinar={handleDeclinar}
        onPonerEnEspera={handlePonerEnEspera}
      />

      {/* ESTADO 1: EN ESPERA PASIVA (SIN BOTÓN DE INICIAR PARA RESIDENTE) */}
      {!enLlamada ? (
        <div className="w-full aspect-video min-h-[380px] bg-[#070a10] border border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,242,254,0.15)]">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Recepción Automática de Citaciones
            </div>

            <h3 className="text-lg font-bold font-mono text-white pt-1">
              {enEspera ? 'Llamada en Espera' : 'Canal de Conferencia Conectado'}
            </h3>

            <p className="text-xs text-slate-400 font-mono leading-relaxed">
              {enEspera 
                ? 'Pusiste la llamada en espera. Puedes reincorporarte cuando lo desees.'
                : `Tu inmueble (${miUnidad}) está en línea. Cuando la Administración inicie la asamblea o reunión de consejo, tu dispositivo timbrará automáticamente para que contestes.`}
            </p>
          </div>

          {enEspera && (
            <button
              onClick={handleContestar}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl font-mono transition cursor-pointer"
            >
              Reanudar y Contestar Llamada
            </button>
          )}
        </div>
      ) : (
        /* ESTADO 2: EN LLAMADA ACTIVA (CUADRÍCULA TEAMS) */
        <div className="w-full aspect-video min-h-[380px] bg-[#070a10] border border-cyan-500/30 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 font-mono text-xs">
            <span className="text-emerald-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Conectado a la Sesión Oficial
            </span>
            <button
              onClick={() => setEnLlamada(false)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              Colgar
            </button>
          </div>

          {/* Cuadrícula Teams */}
          <div className="flex-1 grid grid-cols-2 gap-3 p-3">
            <div className="rounded-2xl border border-cyan-400/40 bg-slate-950 flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 flex items-center justify-center font-bold font-mono text-lg">
                {miNombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <span className="text-xs font-mono text-white mt-2 font-bold">{miNombre} ({miUnidad})</span>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-4">
              <div className="w-16 h-16 rounded-full bg-slate-900 text-slate-300 border border-slate-700 flex items-center justify-center font-bold font-mono text-lg">
                AD
              </div>
              <span className="text-xs font-mono text-white mt-2 font-bold">Administración Central</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
