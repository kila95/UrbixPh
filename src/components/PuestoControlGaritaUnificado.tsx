import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, DEFAULT_TENANT_UUID, normalizeTenantUuid } from '../supabaseClient';
import { 
  QrCode, 
  Camera, 
  Car, 
  Bike, 
  UserCheck, 
  CheckCircle2, 
  Search, 
  LogOut, 
  ParkingSquare, 
  Clock,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export function calcularEstadiaParqueadero(occupiedAt?: string | null, limiteHoras: number = 0) {
  if (!occupiedAt) return { tiempoTexto: '0 min', minutos: 0, excedido: false, restanteMin: limiteHoras * 60 };

  const inicio = new Date(occupiedAt).getTime();
  const ahora = Date.now();
  const diffMs = Math.max(0, ahora - inicio);
  
  const minutosTotales = Math.floor(diffMs / (1000 * 60));
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;
  
  const limiteMinutos = limiteHoras * 60;
  const excedido = limiteHoras > 0 && minutosTotales > limiteMinutos;
  const restanteMin = limiteHoras > 0 ? Math.max(0, limiteMinutos - minutosTotales) : 0;

  const tiempoTexto = horas > 0 ? `${horas}h ${minutos}m` : `${minutos} min`;

  return { tiempoTexto, minutos: minutosTotales, excedido, restanteMin };
}

export interface PuestoControlGaritaUnificadoProps {
  tenantId?: string;
  tenantConfig?: any;
  vigilanteName?: string;
  onShowToast?: (msg: string) => void;
  celdas?: any[];
  onActualizarCeldas?: (celdas: any[]) => void;
}

export default function PuestoControlGaritaUnificado({
  tenantId = 't1',
  tenantConfig,
  vigilanteName = 'Guarda en Turno',
  onShowToast,
  celdas: propCeldas,
  onActualizarCeldas
}: PuestoControlGaritaUnificadoProps) {
  // Límite dinámico según el manual de convivencia del conjunto
  const limiteHorasCopropiedad = tenantConfig?.visitor_parking_limit_hours ?? 0; // 0 = Sin límite
  const [paseEncontrado, setPaseEncontrado] = useState<any | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState<string | null>(null);
  const [codigoInput, setCodigoInput] = useState('');
  const [placaConfirmada, setPlacaConfirmada] = useState('');
  const [medioIngreso, setMedioIngreso] = useState<'PIE' | 'CARRO' | 'MOTO'>('PIE');
  const [bahias, setBahias] = useState<any[]>([]);
  const [bahiaSeleccionada, setBahiaSeleccionada] = useState<string>('');
  const [pasesList, setPasesList] = useState<any[]>([]);
  const [procesando, setProcesando] = useState(false);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const setPaseSeleccionado = setPaseEncontrado;
  const slotsParqueadero = bahias;
  const setSlotsParqueadero = setBahias;
  const setCeldaAsignada = setBahiaSeleccionada;
  const setBahiaAsignada = setBahiaSeleccionada;

  const cargarPasesActivos = async () => {
    const { data } = await supabase
      .from('visitor_passes')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setPasesList(data);
    }
  };

  useEffect(() => {
    cargarPasesActivos();
    const timer = setInterval(() => {
      setSlotsParqueadero((prev: any[]) => [...prev]);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // 1. Cargar bahías directo de Supabase
  const cargarCeldasParqueadero = async () => {
    try {
      let query = supabase
        .from('visitor_parking_slots')
        .select('*')
        .order('slot_number', { ascending: true });

      // Si hay un tenantId válido, filtramos; si no, trae todas las del edificio
      if (tenantId && tenantId !== 't1') {
        query = query.eq('tenant_id', tenantId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error cargando bahías:", error);
        return;
      }

      if (data && data.length > 0) {
        setSlotsParqueadero(data);
        const primeraLibre = data.find((b: any) => b.status === 'DISPONIBLE' || b.status === 'LIBRE');
        if (primeraLibre && !bahiaSeleccionada) {
          setBahiaSeleccionada(primeraLibre.slot_number);
        }
      }
    } catch (err) {
      console.error("Error al consultar parqueaderos:", err);
    }
  };

  useEffect(() => {
    cargarCeldasParqueadero();

    // Suscripción en tiempo real a cambios de parqueadero (cuando se ocupa o libera una celda)
    const canalCeldas = supabase
      .channel('realtime_bahias_garita')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_parking_slots' },
        () => {
          cargarCeldasParqueadero();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'visitor_passes' },
        () => {
          cargarPasesActivos();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalCeldas);
    };
  }, [tenantId]);

  // 2. Búsqueda de Pase en Supabase (por code o pin)
  const handleBuscarOClicPase = async (textoIngresado: string) => {
    if (!textoIngresado) return;

    // 1. Limpieza: quitar espacios y pasar a mayúsculas
    let clean = textoIngresado.trim().toUpperCase();

    // 2. Si el usuario solo escribió números (ej: "8821"), le creamos el código "QR-8821"
    const soloNumeros = clean.replace(/\D/g, '');
    const codigoConPrefijo = clean.startsWith('QR-') ? clean : `QR-${clean}`;

    try {
      // 3. Busca por el código con o sin QR-, o directamente por el PIN numérico
      const { data, error } = await supabase
        .from('visitor_passes')
        .select('*')
        .or(`code.eq.${codigoConPrefijo},code.eq.${clean},pin.eq.${soloNumeros}`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const pase = data[0];
        setPaseSeleccionado(pase);
        setErrorBusqueda(null);
        setPlacaConfirmada(pase.vehicle_plate || '');
        const tipo = pase.vehicle_type === 'MOTO' ? 'MOTO' : (pase.vehicle_type === 'CARRO' || pase.vehicle_plate) ? 'CARRO' : 'PIE';
        setMedioIngreso(tipo);

        // Busca si está disponible admitiendo 'DISPONIBLE' o 'LIBRE'
        const celdaLibre = slotsParqueadero.find(
          (s: any) => 
            (s.status === 'DISPONIBLE' || s.status === 'LIBRE') && 
            (s.vehicle_type === 'CARRO' || !s.vehicle_type)
        );

        if (celdaLibre) {
          setCeldaAsignada(celdaLibre.slot_number);
        }
        onShowToast?.(`Autorización confirmada para: ${pase.visitor_name}`);
      } else {
        setPaseSeleccionado(null);
        setErrorBusqueda(`Código "${textoIngresado}" no encontrado.`);
      }
    } catch (err: any) {
      console.error('Error buscando pase:', err);
      setErrorBusqueda(`Error de consulta: ${err.message}`);
    }
  };

  const handleValidarAccesoEnVivo = async () => {
    await handleBuscarOClicPase(codigoInput);
  };

  const handleBuscarPase = async (termino?: string) => {
    const query = termino ?? codigoInput;
    if (termino && termino !== codigoInput) {
      setCodigoInput(termino);
    }
    await handleBuscarOClicPase(query);
  };

  // 3. Confirmar Ingreso (Actualiza Pase + Ocupa Celda en una sola operación)
  const handleDarIngreso = async () => {
    if (!paseEncontrado) return;
    try {
      setProcesando(true);
      const ahora = new Date().toISOString();

      // Actualizar Pase
      await supabase
        .from('visitor_passes')
        .update({
          status: 'ADENTRO',
          entry_time: ahora,
          vehicle_plate: medioIngreso !== 'PIE' ? placaConfirmada.trim().toUpperCase() : null,
          assigned_parking_slot: medioIngreso !== 'PIE' ? bahiaSeleccionada : null,
          processed_by_guard: vigilanteName
        })
        .eq('id', paseEncontrado.id);

      // Ocupar Celda en Supabase
      if (medioIngreso !== 'PIE' && bahiaSeleccionada) {
        let updateQuery = supabase
          .from('visitor_parking_slots')
          .update({
            status: 'OCUPADA',
            occupied_by_plate: placaConfirmada.trim().toUpperCase(),
            assigned_unit: paseEncontrado.unit_reference,
            occupied_at: ahora
          })
          .eq('slot_number', bahiaSeleccionada);

        if (tenantId && tenantId !== 't1') {
          updateQuery = updateQuery.eq('tenant_id', tenantId);
        }
        await updateQuery;
      }

      onShowToast?.(`Ingreso registrado: ${paseEncontrado.visitor_name} ${medioIngreso !== 'PIE' ? `-> Bahía ${bahiaSeleccionada}` : ''}`);
      setPaseEncontrado(null);
      setCodigoInput('');
      setPlacaConfirmada('');
      cargarCeldasParqueadero();
      cargarPasesActivos();
    } catch (err: any) {
      alert('Error al dar ingreso: ' + err.message);
    } finally {
      setProcesando(false);
    }
  };

  // 4. Salida Rápida de Vehículo desde el Mapa de Celdas
  const handleLiberarBahia = async (slotNumber: string) => {
    try {
      // 1. Actualizar en Supabase para ponerla en verde y borrar la placa
      const { error: errorSlot } = await supabase
        .from('visitor_parking_slots')
        .update({
          status: 'DISPONIBLE',
          occupied_by_plate: null,
          assigned_unit: null,
          occupied_at: null
        })
        .eq('slot_number', slotNumber);

      if (errorSlot) throw errorSlot;

      // 2. Si la celda tenía un vehículo asignado, marcar el pase del visitante como 'SALIO'
      await supabase
        .from('visitor_passes')
        .update({
          status: 'SALIO',
          exit_time: new Date().toISOString()
        })
        .eq('assigned_parking_slot', slotNumber)
        .eq('status', 'ADENTRO');

      // 3. Actualizar la vista local inmediatamente a color verde
      setSlotsParqueadero((prev: any[]) =>
        prev.map((s) =>
          s.slot_number === slotNumber
            ? { ...s, status: 'DISPONIBLE', occupied_by_plate: null, assigned_unit: null }
            : s
        )
      );

      onShowToast?.(`Bahía ${slotNumber} liberada y puesta en disponible.`);
      cargarPasesActivos();
    } catch (err: any) {
      console.error('Error liberando celda:', err);
      alert('No se pudo liberar la celda: ' + err.message);
    }
  };

  // Control Cámara Física
  const alternarCamara = async () => {
    if (camaraActiva) {
      if (videoRef.current && videoRef.current.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      }
      setCamaraActiva(false);
      return;
    }
    try {
      setCamaraActiva(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e: any) {
      alert('No se pudo iniciar la cámara: ' + e.message);
      setCamaraActiva(false);
    }
  };

  const celdasLibres = bahias.filter(b => b.status === 'DISPONIBLE' || b.status === 'LIBRE').length;
  const celdasOcupadas = bahias.filter(b => b.status === 'OCUPADA' || (b.status !== 'DISPONIBLE' && b.status !== 'LIBRE')).length;

  return (
    <div className="bg-[#090d14] border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 font-sans shadow-2xl">
      
      {/* CABECERA UNIFICADA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 rounded font-bold">
              Consola Operativa de Garita
            </span>
            <span className="text-xs text-slate-400 font-mono">Control de Acceso y Parqueaderos en Tiempo Real</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Puesto de Control de Accesos & Bahías Vehiculares</h2>
        </div>

        {/* Buscador Rápido y Gatillo de Cámara */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Digitar PIN, Placa o Cédula..."
              value={codigoInput}
              onChange={(e) => setCodigoInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleBuscarPase()}
              className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl text-xs font-mono text-white placeholder-slate-500 outline-none w-52 focus:border-cyan-400"
            />
            <button
              onClick={() => handleBuscarPase()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-white cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={alternarCamara}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
              camaraActiva 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/20'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{camaraActiva ? 'Cerrar Cámara' : 'Lector Óptico'}</span>
          </button>
        </div>
      </div>

      {/* STREAM CÁMARA */}
      {camaraActiva && (
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col items-center gap-2">
          <p className="text-xs text-slate-400 font-mono">Apunta la cámara al código QR en la pantalla del celular</p>
          <div className="relative w-full max-w-sm aspect-video bg-black rounded-xl overflow-hidden border-2 border-cyan-400/60">
            <video ref={videoRef} className="w-full h-full object-cover" />
            <div className="absolute inset-0 border-2 border-dashed border-cyan-400 m-8 rounded-lg pointer-events-none animate-pulse" />
          </div>
        </div>
      )}

      {/* CUERPO PRINCIPAL: PANEL DUAL (ACCESO IZQUIERDA | PARQUEADEROS DERECHA) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: VALIDACIÓN DE INGRESO (5 COLUMNAS) */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h3 className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-cyan-400" />
            <span>Validación de Pase Activo</span>
          </h3>

          {errorBusqueda && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorBusqueda}</span>
            </div>
          )}

          {paseEncontrado ? (
            <div className="space-y-4 pt-1">
              <div className="p-3 bg-[#0F172A] border border-cyan-500/30 rounded-xl space-y-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{paseEncontrado.visitor_name}</h4>
                    <p className="text-xs text-slate-400 font-mono">Doc: {paseEncontrado.visitor_document || 'N/A'}</p>
                  </div>
                  <span className="text-xs font-mono font-bold bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                    Apto {paseEncontrado.unit_reference}
                  </span>
                </div>
              </div>

              {/* Modo de transporte */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Tipo de Ingreso:</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMedioIngreso('PIE')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      medioIngreso === 'PIE' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>A Pie</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedioIngreso('CARRO')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      medioIngreso === 'CARRO' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Car className="w-4 h-4" />
                    <span>Carro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedioIngreso('MOTO')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition cursor-pointer ${
                      medioIngreso === 'MOTO' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Bike className="w-4 h-4" />
                    <span>Moto</span>
                  </button>
                </div>
              </div>

              {/* Si viene en vehículo: Placa y Bahía */}
              {medioIngreso !== 'PIE' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Confirmar Placa</label>
                    <input
                      type="text"
                      required
                      placeholder="Placa del vehículo"
                      value={placaConfirmada}
                      onChange={(e) => setPlacaConfirmada(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-800 p-2.5 rounded-xl text-sm font-mono font-bold text-cyan-300 uppercase outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                      Asignar Bahía (Toca una celda libre o selecciona)
                    </label>
                    <select
                      value={bahiaSeleccionada}
                      onChange={(e) => setBahiaSeleccionada(e.target.value)}
                      className="w-full bg-[#0F172A] border border-slate-800 p-2.5 rounded-xl text-xs font-mono text-white outline-none cursor-pointer"
                    >
                      {bahias.filter(b => b.status === 'DISPONIBLE' || b.status === 'LIBRE').map(b => (
                        <option key={b.id} value={b.slot_number}>
                          Bahía {b.slot_number} ({b.zone || 'Visitantes'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaseEncontrado(null)}
                  className="flex-1 py-2.5 bg-slate-900 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={procesando || (medioIngreso !== 'PIE' && !placaConfirmada.trim())}
                  onClick={handleDarIngreso}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg disabled:opacity-50"
                >
                  {procesando ? 'Registrando...' : 'Autorizar Ingreso'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="py-6 px-4 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl space-y-2">
                <p>Escanea un código QR o ingresa la placa/PIN arriba para verificar la autorización de ingreso.</p>
              </div>
              {pasesList.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase text-slate-400">
                    <span>Pases Recientes en Sistema ({pasesList.length})</span>
                    <span className="text-cyan-400">Toca para seleccionar</span>
                  </div>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {pasesList.slice(0, 6).map((p: any) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          const cod = p.code || p.pin || '';
                          setCodigoInput(cod);
                          handleBuscarOClicPase(cod);
                        }}
                        className="w-full p-2.5 bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-xl flex items-center justify-between text-left text-xs transition cursor-pointer"
                      >
                        <div>
                          <span className="font-mono font-bold text-cyan-400 mr-2">{p.code || p.pin}</span>
                          <span className="text-white font-semibold">{p.visitor_name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{p.unit_reference || p.status}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL DERECHO: MAPA DE BAHÍAS DE VISITANTES EN VIVO (7 COLUMNAS) */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-xs font-mono uppercase font-bold text-slate-400 flex items-center gap-2">
              <ParkingSquare className="w-4 h-4 text-cyan-400" />
              <span>Estado de Bahías de Visitantes en Vivo</span>
            </h3>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-400 font-bold">{celdasLibres} Libres</span>
              <span className="text-rose-400 font-bold">{celdasOcupadas} Ocupadas</span>
            </div>
          </div>

          {bahias.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs font-mono border border-dashed border-slate-800 rounded-xl">
              No hay bahías de parqueadero configuradas en esta copropiedad.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {bahias.map((slot) => {
                const isLibre = slot.status === 'DISPONIBLE' || slot.status === 'LIBRE';
                const isSelectedForIncoming = bahiaSeleccionada === slot.slot_number;
                const estadia = !isLibre ? calcularEstadiaParqueadero(slot.occupied_at, limiteHorasCopropiedad) : null;

                return (
                  <div
                    key={slot.slot_number || slot.id}
                    onClick={() => {
                      if (slot.status === 'OCUPADA' || !isLibre) {
                        handleLiberarBahia(slot.slot_number);
                      } else {
                        setBahiaSeleccionada(slot.slot_number);
                        if (!paseEncontrado) {
                          onShowToast?.(`Bahía ${slot.slot_number} seleccionada para próximo ingreso`);
                        }
                      }
                    }}
                    className={`p-3 rounded-2xl border flex flex-col justify-between transition cursor-pointer relative min-h-[92px] ${
                      slot.status === 'OCUPADA' || !isLibre
                        ? estadia?.excedido
                          ? 'border-amber-500 bg-amber-950/25 hover:border-amber-400'
                          : 'border-rose-500 bg-rose-950/20 hover:border-rose-400'
                        : isSelectedForIncoming
                        ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.25)]'
                        : 'bg-[#0F172A] border-cyan-500/30 hover:border-emerald-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-xs font-black text-white">{slot.slot_number}</span>
                      <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        isLibre
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : estadia?.excedido
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {isLibre ? 'LIBRE' : estadia?.excedido ? 'EXCEDIDO' : 'OCUPADA'}
                      </span>
                    </div>

                    {!isLibre ? (
                      <div className="mt-1 space-y-0.5 text-left font-mono">
                        <span className="text-xs font-black text-rose-300 block">{slot.occupied_by_plate}</span>
                        <span className="text-[10px] text-slate-400 block truncate">Destino: {slot.assigned_unit || 'Apto'}</span>
                        {estadia && (
                          <span className={`text-[9px] flex items-center gap-1 font-bold ${estadia.excedido ? 'text-amber-400' : 'text-cyan-400'}`}>
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>
                              {estadia.tiempoTexto}{' '}
                              {limiteHorasCopropiedad > 0
                                ? estadia.excedido
                                  ? '(Excedido)'
                                  : `(${estadia.restanteMin}m rest.)`
                                : ''}
                            </span>
                          </span>
                        )}
                        <span className="text-[9px] text-slate-500 flex items-center gap-1 pt-0.5">
                          <LogOut className="w-2.5 h-2.5 text-rose-400" /> Toca para salida
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 text-left text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Disponible
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
