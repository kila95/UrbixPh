import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Car, 
  Bike, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  X, 
  Search,
  Settings
} from 'lucide-react';
import ModalConfiguradorParqueaderos from './ModalConfiguradorParqueaderos';

export interface GrillaParqueaderosOptimizadaProps {
  tenantId?: string;
  onSelectSlot?: (slot: any) => void;
  onShowToast?: (msg: string) => void;
}

export default function GrillaParqueaderosOptimizada({
  tenantId = 't1',
  onSelectSlot,
  onShowToast
}: GrillaParqueaderosOptimizadaProps) {
  // Pestaña activa: Carros vs Motos
  const [tipoVehiculoTab, setTipoVehiculoTab] = useState<'CARRO' | 'MOTO'>('CARRO');
  const [bahias, setBahias] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Paginación (12 celdas compactas por página)
  const [paginaActual, setPaginaActual] = useState(1);
  const CELDAS_POR_PAGINA = 12;

  // Modal para liberar o ver detalle de celda ocupada
  const [celdaDetalle, setCeldaDetalle] = useState<any | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Cargar bahías reales desde Supabase
  const cargarBahias = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        setCargando(false);
        return;
      }
      const { data, error } = await supabase
        .from('visitor_parking_slots')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('slot_number', { ascending: true });

      if (error) throw error;
      setBahias(data || []);
    } catch (err: any) {
      console.error('Error cargando bahías:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarBahias();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`slots_realtime_${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_parking_slots' }, () => {
          cargarBahias();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tenantId]);

  // Filtrar según la pestaña (Carros suelen empezar por V- o tener type CARRO, Motos por M-)
  const bahiasFiltradas = bahias.filter(b => {
    const isMoto = b.slot_number?.startsWith('M-') || b.vehicle_type === 'MOTO';
    return tipoVehiculoTab === 'MOTO' ? isMoto : !isMoto;
  });

  // Paginación de celdas
  const totalPaginas = Math.ceil(bahiasFiltradas.length / CELDAS_POR_PAGINA) || 1;
  const indexInicio = (paginaActual - 1) * CELDAS_POR_PAGINA;
  const bahiasPaginadas = bahiasFiltradas.slice(indexInicio, indexInicio + CELDAS_POR_PAGINA);

  // Liberar bahía (Marcar salida)
  const handleLiberarBahia = async (celda: any) => {
    try {
      const { error } = await supabase
        .from('visitor_parking_slots')
        .update({
          status: 'DISPONIBLE',
          occupied_by_plate: null,
          assigned_unit: null,
          occupied_at: null
        })
        .eq('id', celda.id);

      if (error) throw error;

      // Actualizar también en el registro de pases
      await supabase
        .from('visitor_passes')
        .update({ status: 'SALIO', exit_time: new Date().toISOString() })
        .eq('tenant_id', tenantId)
        .eq('assigned_parking_slot', celda.slot_number)
        .eq('status', 'ADENTRO');

      onShowToast?.(`Bahía ${celda.slot_number} liberada correctamente.`);
      setCeldaDetalle(null);
      cargarBahias();
    } catch (err: any) {
      alert('Error liberando celda: ' + err.message);
    }
  };

  const totalLibres = bahiasFiltradas.filter(b => b.status === 'DISPONIBLE').length;
  const totalOcupadas = bahiasFiltradas.filter(b => b.status === 'OCUPADA').length;

  return (
    <div className="bg-[#090d14] border border-slate-800 rounded-3xl p-5 space-y-4 font-sans text-slate-100 shadow-2xl">
      
      {/* BARRA SUPERIOR: SELECTOR CARROS / MOTOS + CONTADORES + PAGINACIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        
        {/* Pestañas Carros / Motos */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setTipoVehiculoTab('CARRO');
              setPaginaActual(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tipoVehiculoTab === 'CARRO'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Bahías Carros</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTipoVehiculoTab('MOTO');
              setPaginaActual(1);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              tipoVehiculoTab === 'MOTO'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/40'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Bahías Motos</span>
          </button>

          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 shadow-sm"
            title="Aprovisionar o agregar bahías de visitantes en Supabase"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Configurar Bahías</span>
          </button>
        </div>

        {/* Indicadores de Estado y Paginador */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold">{totalLibres} Libres</span>
            <span className="text-rose-400 font-bold">{totalOcupadas} Ocupadas</span>
          </div>

          {/* Controles de Página */}
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                disabled={paginaActual === 1}
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 text-[11px] font-bold text-white">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                disabled={paginaActual === totalPaginas}
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GRILLA COMPACTA DE BAHÍAS (12 CELDAS POR PÁGINA) */}
      {cargando ? (
        <div className="text-center py-10 text-xs font-mono text-slate-500">
          Cargando inventario de bahías desde Supabase...
        </div>
      ) : bahiasFiltradas.length === 0 ? (
        <div className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl text-xs font-mono text-slate-500">
          No hay bahías de {tipoVehiculoTab.toLowerCase()} configuradas en esta copropiedad.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {bahiasPaginadas.map((celda) => {
            const isLibre = celda.status === 'DISPONIBLE';

            return (
              <div
                key={celda.id}
                onClick={() => {
                  if (isLibre) {
                    onSelectSlot?.(celda);
                    onShowToast?.(`Bahía ${celda.slot_number} seleccionada para asignar`);
                  } else {
                    setCeldaDetalle(celda);
                  }
                }}
                className={`p-2.5 rounded-xl border flex flex-col justify-between transition cursor-pointer relative min-h-[75px] ${
                  isLibre
                    ? 'bg-[#0B132B]/60 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-500/10'
                    : 'bg-rose-950/20 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/30'
                }`}
              >
                {/* Cabecera del Slot */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-white">{celda.slot_number}</span>
                  <span className={`text-[8px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    isLibre ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {isLibre ? 'LIBRE' : 'OCUPADA'}
                  </span>
                </div>

                {/* Contenido Dinámico según Estado */}
                {isLibre ? (
                  <div className="text-[10px] font-mono text-emerald-400/80 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Disponible</span>
                  </div>
                ) : (
                  <div className="space-y-0.5 text-left font-mono pt-1">
                    <span className="text-xs font-black text-rose-300 block tracking-wider">
                      {celda.occupied_by_plate || 'SIN PLACA'}
                    </span>
                    <span className="text-[9px] text-slate-400 block truncate">
                      Destino: {celda.assigned_unit || 'Apto'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETALLE DE BAHÍA OCUPADA / SALIDA RÁPIDA */}
      {celdaDetalle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                <span>Control de Bahía: {celdaDetalle.slot_number}</span>
              </h4>
              <button onClick={() => setCeldaDetalle(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Placa Vehículo:</span>
                <strong className="text-rose-400 text-sm font-black">{celdaDetalle.occupied_by_plate}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inmueble Visitado:</span>
                <span className="text-white">{celdaDetalle.assigned_unit || 'No especificado'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hora Ingreso:</span>
                <span className="text-slate-300">
                  {celdaDetalle.occupied_at ? new Date(celdaDetalle.occupied_at).toLocaleTimeString() : 'En curso'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCeldaDetalle(null)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => handleLiberarBahia(celdaDetalle)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Marcar Salida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURADOR DE BAHÍAS (MASIVO E INDIVIDUAL) */}
      <ModalConfiguradorParqueaderos
        tenantId={tenantId}
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        onBahiasActualizadas={cargarBahias}
        onShowToast={onShowToast}
      />

    </div>
  );
}
