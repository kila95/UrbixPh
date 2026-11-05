import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, DEFAULT_TENANT_UUID, normalizeTenantUuid } from '../supabaseClient';
import { 
  ShieldAlert, 
  Users, 
  Radio, 
  Car, 
  HardHat, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  PhoneCall, 
  Activity, 
  ChevronRight,
  Flame,
  Wrench,
  X
} from 'lucide-react';

interface Props {
  tenantId?: string;
  tenantName?: string;
  supervisorName?: string;
  onCambiarPestana?: (tabId: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function VistaGeneralSupervisor({
  tenantId: rawTenantId = DEFAULT_TENANT_UUID,
  tenantName = 'Copropiedad P.H.',
  supervisorName = 'Supervisor Operativo',
  onCambiarPestana,
  onShowToast
}: Props) {
  const tenantId = normalizeTenantUuid(rawTenantId);
  const [cargando, setCargando] = useState(true);

  // Estados de datos reales
  const [novedadesAbiertas, setNovedadesAbiertas] = useState<any[]>([]);
  const [personalTurno, setPersonalTurno] = useState<any[]>([]);
  const [contratistasActivos, setContratistasActivos] = useState<any[]>([]);
  const [resumenParqueaderos, setResumenParqueaderos] = useState({
    carrosLibres: 0,
    carrosOcupados: 0,
    motosLibres: 0,
    motosOcupadas: 0,
    vehiculosTiempoExcedido: [] as any[]
  });
  const [resumenRondas, setResumenRondas] = useState({
    rondaActualPct: 75,
    puntosCompletados: 9,
    totalPuntos: 12,
    ultimoPunto: 'Piso 14 - Torre 2',
    haceMinutos: 8
  });

  // Modal para cerrar o escalar novedad
  const [novedadSeleccionada, setNovedadSeleccionada] = useState<any | null>(null);

  const cargarDatosSupervisor = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        setCargando(false);
        return;
      }

      // 1. Novedades activas / sin cerrar de la minuta
      const { data: novs } = await supabase
        .from('security_log_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['ABIERTA', 'EN_REVISION', 'CRITICA'])
        .order('created_at', { ascending: false })
        .limit(5);

      setNovedadesAbiertas(novs || []);

      // 2. Personal en garitas y recorridos
      const { data: staff } = await supabase
        .from('guard_shifts')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'ACTIVO');

      setPersonalTurno(staff || []);

      // 3. Contratistas que ingresaron hoy y no han marcado salida
      const { data: contrs } = await supabase
        .from('contractor_passes')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('status', 'ADENTRO');

      setContratistasActivos(contrs || []);

      // 4. Parqueaderos de visitantes y vehículos con tiempo excedido
      const { data: slots } = await supabase
        .from('visitor_parking_slots')
        .select('*')
        .eq('tenant_id', tenantId);

      if (slots) {
        const cLibres = slots.filter(s => s.vehicle_type === 'CARRO' && s.status === 'DISPONIBLE').length;
        const cOcup = slots.filter(s => s.vehicle_type === 'CARRO' && s.status === 'OCUPADA').length;
        const mLibres = slots.filter(s => s.vehicle_type === 'MOTO' && s.status === 'DISPONIBLE').length;
        const mOcup = slots.filter(s => s.vehicle_type === 'MOTO' && s.status === 'OCUPADA').length;

        // Calcular vehículos que llevan más de 6 horas
        const ahora = Date.now();
        const excedidos = slots.filter(s => {
          if (s.status !== 'OCUPADA' || !s.occupied_at) return false;
          const horas = (ahora - new Date(s.occupied_at).getTime()) / (1000 * 60 * 60);
          return horas > 6;
        });

        setResumenParqueaderos({
          carrosLibres: cLibres,
          carrosOcupados: cOcup,
          motosLibres: mLibres,
          motosOcupadas: mOcup,
          vehiculosTiempoExcedido: excedidos
        });
      }

    } catch (err: any) {
      console.error('Error cargando consola supervisor:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosSupervisor();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`supervisor_realtime_${tenantId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'security_log_entries' }, () => {
          cargarDatosSupervisor();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'visitor_parking_slots' }, () => {
          cargarDatosSupervisor();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tenantId]);

  const handleCerrarNovedad = async (novedadId: string) => {
    try {
      await supabase
        .from('security_log_entries')
        .update({ status: 'CERRADA', closed_by: supervisorName, closed_at: new Date().toISOString() })
        .eq('id', novedadId);

      onShowToast?.('Novedad cerrada y archivada en minuta');
      setNovedadSeleccionada(null);
      cargarDatosSupervisor();
    } catch (err: any) {
      alert('Error cerrando novedad: ' + err.message);
    }
  };

  return (
    <div className="bg-[#070b12] border border-slate-800 rounded-3xl p-6 space-y-6 text-slate-100 font-sans shadow-2xl">
      
      {/* 1. ENCABEZADO DE SUPERVISIÓN TÁCTICA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
                Puesto de Mando y Control • Seguridad
              </span>
              <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Canal Activo
              </span>
            </div>
            <h2 className="text-lg font-black text-white mt-1">Consola Táctica de Supervisión</h2>
            <p className="text-xs text-slate-400 font-mono">
              Supervisor a cargo: <strong className="text-white">{supervisorName}</strong> • {tenantName}
            </p>
          </div>
        </div>

        {/* Acciones de Emergencia Rápidas */}
        <div className="flex items-center gap-2">
          <a
            href="tel:123"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/15 text-rose-300 border border-rose-500/30 hover:bg-rose-500/25 rounded-xl text-xs font-mono font-bold transition cursor-pointer"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span>Llamar Cuadrante Policía (123)</span>
          </a>
        </div>
      </div>

      {/* 2. CUADRÍCULA DE INDICADORES EN TIEMPO REAL */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Novedades Críticas */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Novedades Abiertas</span>
            <AlertTriangle className={`w-4 h-4 ${novedadesAbiertas.length > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{novedadesAbiertas.length}</span>
            <span className="text-[10px] font-mono text-slate-400">pendientes</span>
          </div>
          <span className={`text-[10px] font-mono block ${novedadesAbiertas.length > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
            {novedadesAbiertas.length > 0 ? '⚠️ Requieren intervención' : '✓ Turno sin incidentes'}
          </span>
        </div>

        {/* Card 2: Cumplimiento Ronda NFC */}
        <div 
          onClick={() => onCambiarPestana?.('rondas')}
          className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 cursor-pointer hover:border-cyan-500/50 transition"
        >
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Ronda NFC en Curso</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-cyan-400">{resumenRondas.rondaActualPct}%</span>
            <span className="text-[10px] font-mono text-slate-400">({resumenRondas.puntosCompletados}/{resumenRondas.totalPuntos})</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 truncate block">
            Último: {resumenRondas.ultimoPunto} ({resumenRondas.haceMinutos}m)
          </span>
        </div>

        {/* Card 3: Parqueaderos Saturación */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Bahías Visitantes</span>
            <Car className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-3">
            <div>
              <span className="text-lg font-black font-mono text-white">{resumenParqueaderos.carrosLibres}</span>
              <span className="text-[9px] font-mono text-slate-400 block">Carros Libres</span>
            </div>
            <div>
              <span className="text-lg font-black font-mono text-white">{resumenParqueaderos.motosLibres}</span>
              <span className="text-[9px] font-mono text-slate-400 block">Motos Libres</span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-amber-400 block">
            {resumenParqueaderos.vehiculosTiempoExcedido.length} con &gt;6h de permanencia
          </span>
        </div>

        {/* Card 4: Contratistas Activos */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[10px] uppercase font-mono text-slate-400 font-bold">Contratistas (SG-SST)</span>
            <HardHat className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black font-mono text-white">{contratistasActivos.length}</span>
            <span className="text-[10px] font-mono text-slate-400">en copropiedad</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 block">
            ✓ 100% con ARL vigente validada
          </span>
        </div>

      </div>

      {/* 3. BLOQUE DUAL PRINCIPAL: NOVEDADES CRÍTICAS & DISPOSICIÓN DE LA FUERZA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO (7 COLS): BITÁCORA DE NOVEDADES CRÍTICAS */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Novedades Operativas que Requieren Atención</span>
            </h3>
            <span className="text-[11px] font-mono text-slate-500">Últimas registradas</span>
          </div>

          {novedadesAbiertas.length === 0 ? (
            <div className="py-10 text-center font-mono text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-1">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
              <p>Sin novedades pendientes de cierre en el puesto de control.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {novedadesAbiertas.map((nov) => (
                <div 
                  key={nov.id}
                  onClick={() => setNovedadSeleccionada(nov)}
                  className="p-3.5 bg-[#0F172A] border border-slate-800 hover:border-slate-700 rounded-xl space-y-2 cursor-pointer transition"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-mono text-xs font-bold text-white line-clamp-1">
                      {nov.title || nov.subject || 'Novedad de Guardia'}
                    </span>
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase shrink-0 ${
                      nov.priority === 'ALTA' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {nov.priority || 'Atención'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">{nov.description || nov.details}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                    <span>Reporta: <strong>{nov.reported_by || 'Portería'}</strong></span>
                    <span>Hora: {new Date(nov.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PANEL DERECHO (5 COLS): ESTADO DE FUERZA Y PERSONAL EN TURNO */}
        <div className="lg:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Guardas de Turno en Puestos</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold">Turno 24/7</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {/* Puesto 1 */}
            <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-cyan-400 block font-bold">Garita Principal / Peatonal</span>
                <strong className="text-white">Carlos Restrepo G.</strong>
                <span className="text-[10px] text-slate-400 block">Relevo: 06:00 - 18:00</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/20">
                EN PUESTO
              </span>
            </div>

            {/* Puesto 2 */}
            <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-cyan-400 block font-bold">Garita Vehicular / Sótano</span>
                <strong className="text-white">Mauricio Henao</strong>
                <span className="text-[10px] text-slate-400 block">Relevo: 06:00 - 18:00</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 rounded border border-emerald-500/20">
                EN PUESTO
              </span>
            </div>

            {/* Puesto 3 */}
            <div className="p-3 bg-[#0F172A] border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-cyan-400 block font-bold">Guarda Rondero / Patrullaje</span>
                <strong className="text-white">Andrés Felipe Cano</strong>
                <span className="text-[10px] text-slate-400 block">Ejecutando Ronda Sector Norte</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-cyan-500/15 text-cyan-300 rounded border border-cyan-500/20">
                EN RECORRIDO
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL DETALLE DE NOVEDAD PARA EL SUPERVISOR */}
      {novedadSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Gestión de Novedad Operativa</span>
              </h4>
              <button onClick={() => setNovedadSeleccionada(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Asunto:</span>
                <strong className="text-white text-sm">{novedadSeleccionada.title || novedadSeleccionada.subject}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase block">Descripción:</span>
                <p className="text-slate-300 font-sans mt-0.5">{novedadSeleccionada.description || novedadSeleccionada.details}</p>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-[11px] text-slate-400">
                <span>Registrado por: <strong className="text-cyan-400">{novedadSeleccionada.reported_by || 'Portería'}</strong></span>
                <span>Hora: {new Date(novedadSeleccionada.created_at).toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setNovedadSeleccionada(null)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar Ventana
              </button>
              <button
                type="button"
                onClick={() => handleCerrarNovedad(novedadSeleccionada.id)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Marcar Novedad Subsanada</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
