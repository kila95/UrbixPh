import React, { useState, useEffect } from 'react';
import { 
  Car, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Search, 
  Plus, 
  LogOut, 
  AlertTriangle,
  Siren,
  Sparkles,
  PhoneCall
} from 'lucide-react';
import LectorQrConAsignacionParqueadero from './LectorQrConAsignacionParqueadero';

export interface CeldaParqueadero {
  id: string;
  numeroCelda: string;
  tipo: 'Carro' | 'Moto';
  estado: 'Disponible' | 'Ocupada';
  placa?: string;
  aptoVisita?: string;
  horaIngreso?: string; // Formato HH:MM
  minutosTranscurridos?: number;
}

export const INITIAL_CELDAS_GARITA: CeldaParqueadero[] = [
  { id: 'C-01', numeroCelda: 'V-01', tipo: 'Carro', estado: 'Ocupada', placa: 'HKS-291', aptoVisita: 'Torre 1 - 402', horaIngreso: '13:15', minutosTranscurridos: 260 },
  { id: 'C-02', numeroCelda: 'V-02', tipo: 'Carro', estado: 'Disponible' },
  { id: 'C-03', numeroCelda: 'V-03', tipo: 'Carro', estado: 'Ocupada', placa: 'MNZ-842', aptoVisita: 'Torre 2 - 201', horaIngreso: '16:00', minutosTranscurridos: 95 },
  { id: 'C-04', numeroCelda: 'V-04', tipo: 'Carro', estado: 'Disponible' },
  { id: 'C-05', numeroCelda: 'M-01', tipo: 'Moto', estado: 'Ocupada', placa: 'FGT-12D', aptoVisita: 'Torre 1 - 104', horaIngreso: '11:30', minutosTranscurridos: 365 },
  { id: 'C-06', numeroCelda: 'M-02', tipo: 'Moto', estado: 'Disponible' }
];

export default function GaritaParqueaderosYSosHub({
  onShowToast,
  nombreCopropiedad = 'P.H. Reserva del Tesoro',
  limiteHorasGratis = 4,
  celdasExternal,
  onActualizarCeldasExternal
}: {
  onShowToast?: (msg: string) => void;
  nombreCopropiedad?: string;
  limiteHorasGratis?: number;
  celdasExternal?: CeldaParqueadero[];
  onActualizarCeldasExternal?: (nuevasCeldas: CeldaParqueadero[]) => void;
}) {
  // --- ESTADO DEL BOTÓN SOS / PÁNICO ---
  const [alertaSosActiva, setAlertaSosActiva] = useState(false);
  const [motivoSos, setMotivoSos] = useState<'Intrusión' | 'Médica' | 'Incendio' | 'Orden Público'>('Intrusión');

  // --- CELDAS DE VISITANTES (BAHÍAS) ---
  const [internalCeldas, setInternalCeldas] = useState<CeldaParqueadero[]>(INITIAL_CELDAS_GARITA);

  const celdas = celdasExternal ?? internalCeldas;
  const updateCeldas = (updater: CeldaParqueadero[] | ((prev: CeldaParqueadero[]) => CeldaParqueadero[])) => {
    const next = typeof updater === 'function' ? updater(celdas) : updater;
    if (onActualizarCeldasExternal) {
      onActualizarCeldasExternal(next);
    } else {
      setInternalCeldas(next);
    }
  };

  // Modal para registrar ingreso
  const [celdaSeleccionadaParaIngreso, setCeldaSeleccionadaParaIngreso] = useState<CeldaParqueadero | null>(null);
  const [placaInput, setPlacaInput] = useState('');
  const [aptoInput, setAptoInput] = useState('');

  // Contador de tiempo simulado
  useEffect(() => {
    const intervalo = setInterval(() => {
      updateCeldas(prev => prev.map(c => {
        if (c.estado === 'Ocupada' && c.minutosTranscurridos !== undefined) {
          return { ...c, minutosTranscurridos: c.minutosTranscurridos + 1 };
        }
        return c;
      }));
    }, 60000); // Actualiza cada minuto
    return () => clearInterval(intervalo);
  }, [celdas]);

  const totalCeldas = celdas.length;
  const celdasOcupadas = celdas.filter(c => c.estado === 'Ocupada').length;
  const celdasDisponibles = totalCeldas - celdasOcupadas;

  // Registrar Ingreso de Vehículo
  const handleRegistrarIngreso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!celdaSeleccionadaParaIngreso || !placaInput.trim() || !aptoInput.trim()) return;

    const ahora = new Date();
    const horaStr = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    updateCeldas(prev => prev.map(c => {
      if (c.id === celdaSeleccionadaParaIngreso.id) {
        return {
          ...c,
          estado: 'Ocupada',
          placa: placaInput.toUpperCase().trim(),
          aptoVisita: aptoInput.trim(),
          horaIngreso: horaStr,
          minutosTranscurridos: 0
        };
      }
      return c;
    }));

    onShowToast?.(`🚗 Vehículo ${placaInput.toUpperCase()} asignado a celda ${celdaSeleccionadaParaIngreso.numeroCelda}.`);
    setCeldaSeleccionadaParaIngreso(null);
    setPlacaInput('');
    setAptoInput('');
  };

  // Liberar Celda (Salida)
  const handleLiberarCelda = (celda: CeldaParqueadero) => {
    updateCeldas(prev => prev.map(c => {
      if (c.id === celda.id) {
        return {
          id: c.id,
          numeroCelda: c.numeroCelda,
          tipo: c.tipo,
          estado: 'Disponible'
        };
      }
      return c;
    }));
    onShowToast?.(`✅ Celda ${celda.numeroCelda} liberada. Vehículo ${celda.placa} registró salida.`);
  };

  // Disparar Protocolo de Emergencia SOS
  const handleDispararSos = () => {
    setAlertaSosActiva(true);
    onShowToast?.(`🚨 PROTOCOLO SOS ACTIVADO (${motivoSos.toUpperCase()}). Notificando a cuadrilla, supervisor y cuadrante.`);
  };

  const handleDesactivarSos = () => {
    setAlertaSosActiva(false);
    onShowToast?.('🛡️ Protocolo SOS desactivado. Situación en garita normalizada.');
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA OPERATIVA DE GARITA */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Car className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Garita &amp; Portería Táctica • {nombreCopropiedad}
            </span>
            <h3 className="text-base font-black text-white mt-1">Control de Celdas de Visitantes &amp; Botón SOS</h3>
          </div>
        </div>

        {/* BOTÓN DE PÁNICO SILENCIOSO */}
        <div className="flex items-center gap-2">
          {!alertaSosActiva ? (
            <button
              type="button"
              onClick={handleDispararSos}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-[0_0_20px_rgba(225,29,72,0.4)] animate-pulse"
            >
              <Siren className="w-4 h-4" /> BOTÓN DE PÁNICO SOS
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDesactivarSos}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <ShieldAlert className="w-4 h-4" /> Desactivar Alarma Activa
            </button>
          )}
        </div>
      </div>

      {/* BANNER DE ALERTA SOS ACTIVA */}
      {alertaSosActiva && (
        <div className="bg-rose-950/40 border-2 border-rose-500 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-3">
            <AlertOctagon className="w-8 h-8 text-rose-500 shrink-0" />
            <div>
              <strong className="text-rose-200 text-sm uppercase font-mono tracking-wider">
                ¡EMERGENCIA CRÍTICA EN PORTERÍA PRINCIPAL!
              </strong>
              <p className="text-xs text-rose-300 font-sans mt-0.5">
                Protocolo: {motivoSos} • Supervisión y Policía informados en tiempo real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="bg-rose-900/60 text-white px-3 py-1.5 rounded-xl border border-rose-600 flex items-center gap-1.5">
              <PhoneCall className="w-3.5 h-3.5" /> Línea Cuadrante Marcada
            </span>
          </div>
        </div>
      )}

      {/* LECTOR QR CON ASIGNACIÓN AUTOMÁTICA DE PARQUEADERO EN 1 CLIC */}
      <LectorQrConAsignacionParqueadero
        celdas={celdas}
        onActualizarCeldas={(nuevas) => updateCeldas(nuevas)}
        onShowToast={onShowToast}
      />

      {/* CONTADORES DE CELDAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Celdas Totales Visitantes</span>
          <h4 className="text-2xl font-black text-white font-mono mt-1">{totalCeldas} Bahías</h4>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Carros y Motos demarcados</span>
        </div>
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Bahías Libres</span>
          <h4 className="text-2xl font-black text-emerald-400 font-mono mt-1 flex items-center gap-2">
            {celdasDisponibles} Libres
          </h4>
          <span className="text-[11px] text-slate-400 font-mono mt-1 block">Disponibilidad inmediata</span>
        </div>
        <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Límite Gratuito Reglamento</span>
          <h4 className="text-2xl font-black text-cyan-400 font-mono mt-1">{limiteHorasGratis} Horas</h4>
          <span className="text-[11px] text-amber-400 font-mono mt-1 block">Alerta automática tras 240 minutos</span>
        </div>
      </div>

      {/* GRILLA VISUAL DE CELDAS DE PARQUEADERO */}
      <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Car className="w-4 h-4 text-cyan-400" /> Grilla Visual de Bahías en Vivo
          </h4>
          <span className="text-[10px] font-mono text-slate-400">
            Verde: Libre • Rojo: Ocupada • Naranja: Tiempo Excedido
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {celdas.map((celda) => {
            const minutos = celda.minutosTranscurridos || 0;
            const horas = Math.floor(minutos / 60);
            const minutosRestantes = minutos % 60;
            const tiempoExcedido = minutos > (limiteHorasGratis * 60);

            if (celda.estado === 'Disponible') {
              return (
                <div
                  key={celda.id}
                  onClick={() => setCeldaSeleccionadaParaIngreso(celda)}
                  className="bg-[#07090e] border border-emerald-500/30 hover:border-emerald-400 p-4 rounded-2xl transition cursor-pointer flex flex-col justify-between min-h-[140px] group shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                      {celda.numeroCelda}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{celda.tipo}</span>
                  </div>

                  <div className="text-center py-2">
                    <span className="text-xs font-bold text-slate-400 group-hover:text-emerald-300 transition flex items-center justify-center gap-1.5">
                      <Plus className="w-4 h-4 text-emerald-400" /> Asignar Ingreso
                    </span>
                  </div>

                  <div className="text-[10px] font-mono text-emerald-500 text-center font-bold">
                    DISPONIBLE
                  </div>
                </div>
              );
            }

            // Celda Ocupada
            return (
              <div
                key={celda.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between min-h-[140px] shadow-lg ${
                  tiempoExcedido
                    ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#07090e] border-rose-500/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black text-white bg-slate-800 px-2.5 py-0.5 rounded">
                    {celda.numeroCelda}
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    tiempoExcedido 
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {tiempoExcedido ? '¡TIEMPO EXCEDIDO!' : 'OCUPADA'}
                  </span>
                </div>

                <div className="my-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <strong className="text-cyan-300 font-mono text-sm tracking-wider">{celda.placa}</strong>
                    <span className="text-slate-300 font-sans">{celda.aptoVisita}</span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Ingreso: {celda.horaIngreso}</span>
                    <span className={tiempoExcedido ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                      {horas}h {minutosRestantes}m
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleLiberarCelda(celda)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-1.5 rounded-xl text-[11px] font-mono transition cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-400" /> Registrar Salida
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL / FORMULARIO RÁPIDO PARA ASIGNAR CELDA */}
      {celdaSeleccionadaParaIngreso && (
        <div className="bg-[#0b0f17] border border-cyan-500/40 p-5 rounded-2xl space-y-4 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
              Asignar Ingreso a Celda {celdaSeleccionadaParaIngreso.numeroCelda} ({celdaSeleccionadaParaIngreso.tipo})
            </h4>
            <button
              type="button"
              onClick={() => setCeldaSeleccionadaParaIngreso(null)}
              className="text-slate-400 hover:text-white text-xs font-mono cursor-pointer"
            >
              ✕ Cancelar
            </button>
          </div>

          <form onSubmit={handleRegistrarIngreso} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Placa del Vehículo</label>
              <input
                type="text"
                placeholder="Ej. AAA-123"
                value={placaInput}
                onChange={(e) => setPlacaInput(e.target.value)}
                className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white font-mono rounded-xl outline-none focus:border-cyan-400 uppercase text-xs"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase block mb-1">Apartamento que Visita</label>
              <input
                type="text"
                placeholder="Ej. Torre 1 - 302"
                value={aptoInput}
                onChange={(e) => setAptoInput(e.target.value)}
                className="w-full p-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 text-xs"
                required
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" /> Confirmar Parqueo
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
