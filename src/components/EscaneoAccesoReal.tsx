import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  QrCode, 
  Camera, 
  Car, 
  Bike, 
  UserCheck, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  X,
  ParkingSquare
} from 'lucide-react';

export interface EscaneoAccesoRealProps {
  tenantId?: string;
  vigilanteName?: string;
  celdas?: any[];
  onActualizarCeldas?: (nuevasCeldas: any[]) => void;
  onShowToast?: (msg: string) => void;
}

export default function EscaneoAccesoReal({
  tenantId = 't1',
  vigilanteName = 'Guarda en Turno',
  onShowToast
}: EscaneoAccesoRealProps) {
  const [paseEncontrado, setPaseEncontrado] = useState<any | null>(null);
  const [codigoInput, setCodigoInput] = useState('');
  const [placaConfirmada, setPlacaConfirmada] = useState('');
  const [medioIngreso, setMedioIngreso] = useState<'PIE' | 'CARRO' | 'MOTO'>('PIE');
  const [bahiasDisponibles, setBahiasDisponibles] = useState<any[]>([]);
  const [bahiaSeleccionada, setBahiaSeleccionada] = useState<string>('');
  const [procesando, setProcesando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Cargar bahías libres reales desde Supabase
  const cargarBahiasLibres = async () => {
    try {
      if (!isSupabaseConfigured) return;
      const { data, error } = await supabase
        .from('visitor_parking_slots')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'DISPONIBLE')
        .order('slot_number', { ascending: true });

      if (!error && data) {
        setBahiasDisponibles(data);
        if (data.length > 0) setBahiaSeleccionada(data[0].slot_number);
      }
    } catch (e) {
      console.warn('Error consultando parqueaderos:', e);
    }
  };

  useEffect(() => {
    cargarBahiasLibres();
  }, [tenantId]);

  // Buscar pase real en Supabase por Código QR o Cédula
  const handleBuscarPase = async (codigoABuscar?: string) => {
    const query = (codigoABuscar || codigoInput).trim().toUpperCase();
    if (!query) return;

    try {
      const { data, error } = await supabase
        .from('visitor_passes')
        .select('*')
        .eq('tenant_id', tenantId)
        .or(`code.eq.${query},pin.eq.${query},visitor_document.eq.${query}`)
        .in('status', ['AUTORIZADO', 'PENDIENTE'])
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        alert(`No se encontró ningún pase activo con el código o cédula: ${query}`);
        setPaseEncontrado(null);
        return;
      }

      setPaseEncontrado(data);
      setPlacaConfirmada(data.vehicle_plate || '');
      setMedioIngreso(data.vehicle_type === 'MOTO' ? 'MOTO' : data.vehicle_plate ? 'CARRO' : 'PIE');
      onShowToast?.(`Pase verificado para: ${data.visitor_name}`);
    } catch (err: any) {
      alert('Error verificando pase: ' + err.message);
    }
  };

  // Encender cámara web / tablet para escanear QR físicamente
  const iniciarCamara = async () => {
    setCamaraActiva(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      alert('No se pudo acceder a la cámara de la garita: ' + err.message);
      setCamaraActiva(false);
    }
  };

  const detenerCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setCamaraActiva(false);
  };

  // Confirmar y Dar Ingreso Real
  const handleConfirmarIngreso = async () => {
    if (!paseEncontrado) return;

    try {
      setProcesando(true);
      const horaIngreso = new Date().toISOString();

      // 1. Marcar el pase del visitante como 'ADENTRO'
      const { error: errPase } = await supabase
        .from('visitor_passes')
        .update({
          status: 'ADENTRO',
          entry_time: horaIngreso,
          vehicle_plate: medioIngreso !== 'PIE' ? placaConfirmada.trim().toUpperCase() : null,
          assigned_parking_slot: medioIngreso !== 'PIE' ? bahiaSeleccionada : null,
          processed_by_guard: vigilanteName
        })
        .eq('id', paseEncontrado.id);

      if (errPase) throw errPase;

      // 2. Si ingresa con carro o moto, ocupar la bahía de parqueadero en Supabase
      if (medioIngreso !== 'PIE' && bahiaSeleccionada) {
        await supabase
          .from('visitor_parking_slots')
          .update({
            status: 'OCUPADA',
            occupied_by_plate: placaConfirmada.trim().toUpperCase(),
            assigned_unit: paseEncontrado.unit_reference,
            occupied_at: horaIngreso
          })
          .eq('tenant_id', tenantId)
          .eq('slot_number', bahiaSeleccionada);
      }

      onShowToast?.(`Ingreso registrado: ${paseEncontrado.visitor_name} ${medioIngreso !== 'PIE' ? `(Bahía ${bahiaSeleccionada})` : ''}`);
      setPaseEncontrado(null);
      setCodigoInput('');
      setPlacaConfirmada('');
      cargarBahiasLibres();
    } catch (err: any) {
      alert('Error dando ingreso: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="bg-[#090d14] border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 font-sans shadow-2xl">
      
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
              Control de Garita • Fast Access
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">Control de Accesos QR & Bahías de Visitantes</h3>
          </div>
        </div>

        {/* Buscador de Código / Cédula y Botón Cámara */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Digitar PIN o Código..."
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarPase()}
              className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none w-48"
            />
            <button
              onClick={() => handleBuscarPase()}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => (camaraActiva ? detenerCamara() : iniciarCamara())}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              camaraActiva
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{camaraActiva ? 'Cerrar Cámara' : 'Escanear con Cámara'}</span>
          </button>
        </div>
      </div>

      {/* Ventana de video de la cámara física */}
      {camaraActiva && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center gap-3">
          <p className="text-xs text-slate-400 font-mono">Enfoca el código QR de la pantalla del visitante</p>
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden border-2 border-cyan-500/50">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-dashed border-cyan-400/60 m-6 rounded-lg pointer-events-none" />
          </div>
        </div>
      )}

      {/* RESULTADO: PASE REAL ENCONTRADO EN BASE DE DATOS */}
      {paseEncontrado ? (
        <div className="p-5 bg-slate-950 border border-cyan-500/40 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h4 className="font-bold text-white text-sm">{paseEncontrado.visitor_name}</h4>
                <p className="text-xs text-slate-400 font-mono">CC {paseEncontrado.visitor_document || 'No registrada'}</p>
              </div>
            </div>
            <div className="bg-[#0F172A] px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
              Destino: <strong className="text-cyan-400">{paseEncontrado.unit_reference}</strong>
            </div>
          </div>

          {/* Selección del Medio de Ingreso */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Selecciona Medio de Ingreso:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMedioIngreso('PIE')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  medioIngreso === 'PIE'
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span className="text-xs font-bold">Ingreso a Pie</span>
                <span className="text-[10px] font-mono text-slate-500">Sin celda vehicular</span>
              </button>

              <button
                type="button"
                onClick={() => setMedioIngreso('CARRO')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  medioIngreso === 'CARRO'
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="text-xs font-bold">Viene en Carro</span>
                <span className="text-[10px] font-mono text-emerald-400">{bahiasDisponibles.length} bahías libres</span>
              </button>

              <button
                type="button"
                onClick={() => setMedioIngreso('MOTO')}
                className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  medioIngreso === 'MOTO'
                    ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Bike className="w-5 h-5" />
                <span className="text-xs font-bold">Viene en Moto</span>
                <span className="text-[10px] font-mono text-emerald-400">Bahía moto</span>
              </button>
            </div>
          </div>

          {/* Confirmación de Placa y Asignación de Bahía */}
          {medioIngreso !== 'PIE' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Placa Confirmada
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. KLS-982"
                  value={placaConfirmada}
                  onChange={(e) => setPlacaConfirmada(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-bold text-cyan-300 uppercase outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                  Bahía de Parqueadero Asignada
                </label>
                {bahiasDisponibles.length > 0 ? (
                  <select
                    value={bahiaSeleccionada}
                    onChange={(e) => setBahiaSeleccionada(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none cursor-pointer"
                  >
                    {bahiasDisponibles.map((b) => (
                      <option key={b.id} value={b.slot_number}>
                        {b.slot_number} ({b.zone || 'Visitantes'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono">
                    ⚠️ Sin bahías disponibles
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botón de Confirmación Real */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setPaseEncontrado(null)}
              className="px-4 py-2 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={procesando || (medioIngreso !== 'PIE' && !placaConfirmada.trim())}
              onClick={handleConfirmarIngreso}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
            >
              {procesando ? 'Registrando en garita...' : 'Confirmar Ingreso a la Copropiedad'}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono space-y-2">
          <p>Garita en espera. Digita el código/cédula o activa la cámara para escanear el QR físico del visitante.</p>
        </div>
      )}

    </div>
  );
}
