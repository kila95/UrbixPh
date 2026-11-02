import React, { useState } from 'react';
import { 
  QrCode, 
  Car, 
  Bike, 
  Footprints, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  User, 
  Building,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { CeldaParqueadero } from './GaritaParqueaderosYSosHub';

export interface PaseQrVisitante {
  id: string;
  nombreVisitante: string;
  documento: string;
  aptoDestino: string;
  fechaVigencia: string;
  placaPrevia?: string;
}

export default function LectorQrConAsignacionParqueadero({
  celdas,
  onActualizarCeldas,
  onShowToast
}: {
  celdas: CeldaParqueadero[];
  onActualizarCeldas: (nuevasCeldas: CeldaParqueadero[]) => void;
  onShowToast?: (msg: string) => void;
}) {
  const [paseEscaneado, setPaseEscaneado] = useState<PaseQrVisitante | null>(null);
  const [placaManual, setPlacaManual] = useState('');
  const [modalidadSeleccionada, setModalidadSeleccionada] = useState<'peatonal' | 'carro' | 'moto' | null>(null);

  // Simulación de escaneo de un pase QR generado por el residente
  const simularEscaneoQr = () => {
    const paseSimulado: PaseQrVisitante = {
      id: `QR-${Date.now().toString().slice(-4)}`,
      nombreVisitante: 'Alejandro Morales Restrepo',
      documento: 'CC 1.020.458.912',
      aptoDestino: 'Torre 2 - Apto 301',
      fechaVigencia: 'Hoy (Acceso Único)',
      placaPrevia: 'KLS-982' // A veces el residente ya la puso en la invitación
    };

    setPaseEscaneado(paseSimulado);
    setPlacaManual(paseSimulado.placaPrevia || '');
    setModalidadSeleccionada(null);
    onShowToast?.('📲 QR Escaneado con éxito. Selecciona modalidad de acceso.');
  };

  // Confirmar el ingreso según la modalidad
  const ejecutarIngreso = (tipoTransporte: 'peatonal' | 'carro' | 'moto') => {
    if (!paseEscaneado) return;

    const ahora = new Date();
    const horaActual = `${ahora.getHours().toString().padStart(2, '0')}:${ahora.getMinutes().toString().padStart(2, '0')}`;

    // CASO 1: A PIE / PEATONAL
    if (tipoTransporte === 'peatonal') {
      onShowToast?.(`🚶 Ingreso Peatonal autorizado para ${paseEscaneado.nombreVisitante} -> ${paseEscaneado.aptoDestino}.`);
      setPaseEscaneado(null);
      setPlacaManual('');
      return;
    }

    // CASO 2: CARRO O MOTO -> ASIGNACIÓN AUTOMÁTICA DE PARQUEADERO
    const tipoFiltro = tipoTransporte === 'carro' ? 'Carro' : 'Moto';
    const celdaLibre = celdas.find(c => c.tipo === tipoFiltro && c.estado === 'Disponible');

    if (!celdaLibre) {
      onShowToast?.(`⚠️ No hay celdas disponibles para ${tipoTransporte.toUpperCase()} en este momento.`);
      return;
    }

    const placaDefinitiva = placaManual.trim().toUpperCase() || (tipoTransporte === 'carro' ? 'EXT-000' : 'MOT-000');

    // Actualizamos las celdas asignando la primera disponible
    const nuevasCeldas = celdas.map(c => {
      if (c.id === celdaLibre.id) {
        return {
          ...c,
          estado: 'Ocupada' as const,
          placa: placaDefinitiva,
          aptoVisita: paseEscaneado.aptoDestino,
          horaIngreso: horaActual,
          minutosTranscurridos: 0
        };
      }
      return c;
    });

    onActualizarCeldas(nuevasCeldas);
    onShowToast?.(`✨ Asignación automática: ${tipoTransporte === 'carro' ? '🚗 Carro' : '🏍️ Moto'} asignado a Bahía ${celdaLibre.numeroCelda} (${placaDefinitiva}).`);
    
    setPaseEscaneado(null);
    setPlacaManual('');
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/20 rounded-3xl p-5 sm:p-6 space-y-5 text-slate-100 font-sans shadow-xl">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/20 uppercase tracking-widest">
              Control de Garita • Fast Access
            </span>
            <h4 className="text-sm font-black text-white mt-0.5">Escaneo QR con Asignación de Parqueadero</h4>
          </div>
        </div>

        <button
          type="button"
          onClick={simularEscaneoQr}
          className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] shrink-0"
        >
          <QrCode className="w-4 h-4" /> Simular Escaneo de QR
        </button>
      </div>

      {/* ESTADO SI NO SE HA ESCANEADO NADA */}
      {!paseEscaneado ? (
        <div className="bg-[#07090e] border border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-cyan-400/50 mx-auto" />
          <h5 className="text-xs font-bold text-slate-300">Lector Criptográfico QR en Espera</h5>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Escanea el código del visitante desde la tablet de garita. Al detectarlo, podrás decidir si ingresa a pie o asignarle bahía en 1 clic.
          </p>
        </div>
      ) : (
        /* PANEL DE ACCESO TRAS DETECTAR EL QR */
        <div className="bg-[#07090e] border border-cyan-500/40 p-5 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <strong className="text-white text-sm">{paseEscaneado.nombreVisitante}</strong>
              <span className="text-[11px] font-mono text-slate-400">({paseEscaneado.documento})</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 self-start sm:self-auto">
              Destino: {paseEscaneado.aptoDestino}
            </span>
          </div>

          {/* OPCIONAL: EDITAR O CONFIRMAR PLACA */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-[#0b0f17] p-3 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[11px] shrink-0">Placa detectada / confirmada:</span>
            <input
              type="text"
              placeholder="Ej. KLS-982"
              value={placaManual}
              onChange={(e) => setPlacaManual(e.target.value.toUpperCase())}
              className="bg-[#07090e] border border-slate-700 text-cyan-300 font-mono font-bold px-3 py-1.5 rounded-lg outline-none focus:border-cyan-400 text-xs w-full sm:w-36 uppercase"
            />
            <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
              (Solo requerida si ingresa con vehículo)
            </span>
          </div>

          {/* BOTONES DE ASIGNACIÓN EN 1 CLIC */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider block">
              Selecciona Medio de Ingreso:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* BOTÓN 1: PEATONAL */}
              <button
                type="button"
                onClick={() => ejecutarIngreso('peatonal')}
                className="bg-slate-800 hover:bg-slate-700 hover:border-slate-600 border border-slate-700 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group"
              >
                <div className="p-2 bg-slate-700/50 rounded-xl group-hover:text-emerald-400 text-slate-300 transition">
                  <Footprints className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <strong className="text-white text-xs block">Ingreso a Pie</strong>
                  <span className="text-[10px] text-slate-400 font-mono">Sin celda vehicular</span>
                </div>
              </button>

              {/* BOTÓN 2: EN CARRO (ASIGNACIÓN AUTOMÁTICA) */}
              <button
                type="button"
                onClick={() => ejecutarIngreso('carro')}
                className="bg-[#0b0f17] hover:bg-cyan-950/30 border border-cyan-500/30 hover:border-cyan-400 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group shadow-lg"
              >
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:scale-110 transition">
                  <Car className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <strong className="text-white text-xs block">Viene en Carro</strong>
                  <span className="text-[10px] text-cyan-300 font-mono">Auto-asignar Bahía</span>
                </div>
              </button>

              {/* BOTÓN 3: EN MOTO (ASIGNACIÓN AUTOMÁTICA) */}
              <button
                type="button"
                onClick={() => ejecutarIngreso('moto')}
                className="bg-[#0b0f17] hover:bg-teal-950/30 border border-teal-500/30 hover:border-teal-400 p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 transition cursor-pointer group shadow-lg"
              >
                <div className="p-2 bg-teal-500/10 text-teal-400 rounded-xl group-hover:scale-110 transition">
                  <Bike className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <strong className="text-white text-xs block">Viene en Moto</strong>
                  <span className="text-[10px] text-teal-300 font-mono">Auto-asignar Bahía</span>
                </div>
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
