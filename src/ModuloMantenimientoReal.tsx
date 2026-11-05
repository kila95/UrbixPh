import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { Wrench, Plus, CheckCircle2, AlertTriangle, X, UserCheck } from 'lucide-react';

export default function ModuloMantenimientoReal({ tenantId = 't1', onShowToast }: { tenantId?: string; onShowToast?: (msg: string) => void }) {
  const [reportes, setReportes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Estados del formulario de nueva orden (incluyendo asignado_to)
  const [categoria, setCategoria] = useState('Infraestructura');
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [asignadoA, setAsignadoA] = useState('Pedro (Toderos)');
  const [guardando, setGuardando] = useState(false);

  // Cargar reportes reales desde Supabase
  const cargarReportesReales = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        setCargando(false);
        return;
      }
      const { data, error } = await supabase
        .from('maintenance_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Aviso al consultar maintenance_reports:', error.message);
        return;
      }
      setReportes(data || []);
    } catch (err: any) {
      console.warn('Aviso cargando reportes reales de mantenimiento:', err?.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarReportesReales();

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('mantenimiento_realtime_changes_v3')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_reports' }, () => {
          cargarReportesReales();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [tenantId]);

  // Crear nueva orden de mantenimiento real en Supabase con empleado asignado
  const handleCrearOrden = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubicacion.trim() || !descripcion.trim()) return;

    try {
      setGuardando(true);
      const payload = {
        tenant_id: tenantId,
        category: categoria,
        location: ubicacion.trim(),
        description: descripcion.trim(),
        vigilante_name: 'Administración / Gerencia',
        assigned_to: asignadoA, // Asignación directa del empleado
        status: 'En Proceso',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('maintenance_reports').insert([payload]);
      if (error) throw error;

      onShowToast?.(`Orden asignada a ${asignadoA} y sincronizada en vivo`);
      setShowModal(false);
      setUbicacion('');
      setDescripcion('');
      setAsignadoA('Pedro (Toderos)');
      cargarReportesReales();
    } catch (err: any) {
      alert('Error al crear la orden: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar estado o asignar responsable
  const actualizarEstadoOrden = async (id: string | number, nuevoEstado: string, nuevoAsignado?: string) => {
    try {
      const updatePayload: any = { status: nuevoEstado };
      if (nuevoAsignado !== undefined) {
        updatePayload.assigned_to = nuevoAsignado;
      }

      const { error } = await supabase
        .from('maintenance_reports')
        .update(updatePayload)
        .eq('id', id);

      if (error) throw error;
      onShowToast?.(`Orden actualizada con éxito`);
      cargarReportesReales();
    } catch (err: any) {
      alert('Error actualizando la orden: ' + err.message);
    }
  };

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 font-sans text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Mantenimiento & Órdenes de Trabajo (Real)</h3>
            <p className="text-xs text-slate-400 font-mono">Control operativo e incidencias sincronizadas en tiempo real</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:brightness-110 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Orden de Trabajo</span>
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-slate-500 text-xs font-mono">
          Sincronizando órdenes de mantenimiento desde Supabase...
        </div>
      ) : reportes.length === 0 ? (
        <div className="text-center py-12 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono space-y-3">
          <p>No hay órdenes de mantenimiento registradas en este momento.</p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-bold text-cyan-400 hover:underline cursor-pointer"
          >
            + Crear la primera orden de trabajo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {reportes.map((rep) => (
            <div key={rep.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">
                    {rep.category || 'Infraestructura'}
                  </span>
                  <span className="text-xs font-bold text-white">{rep.location}</span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    rep.status === 'Solucionado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {rep.status}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{rep.description}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Reportado por: {rep.vigilante_name || 'Administración'} • Responsable: <strong className="text-cyan-400">{rep.assigned_to || 'Sin asignar'}</strong>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={rep.assigned_to || ''}
                  onChange={(e) => actualizarEstadoOrden(rep.id, rep.status, e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white text-xs font-mono p-2 rounded-xl outline-none cursor-pointer"
                >
                  <option value="" disabled>Asignar empleado...</option>
                  <option value="Pedro (Toderos)">Pedro (Toderos)</option>
                  <option value="Equipo de Aseo">Equipo de Aseo</option>
                  <option value="Contratista Externo">Contratista Externo</option>
                  <option value="Juan Carlos (Mantenimiento General)">Juan Carlos (Mantenimiento General)</option>
                </select>
                {rep.status !== 'Solucionado' && (
                  <button
                    onClick={() => actualizarEstadoOrden(rep.id, 'Solucionado')}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1 shadow"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolver
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL PARA CREAR NUEVA ORDEN CON SELECCIÓN DE EMPLEADO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Registrar Nueva Orden de Mantenimiento</span>
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCrearOrden} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Categoría</label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                >
                  <option value="Infraestructura">Infraestructura / Daño</option>
                  <option value="Seguridad / Puertas">Seguridad / Puertas / Portón</option>
                  <option value="Iluminación">Iluminación / Tableros</option>
                  <option value="Ascensores / Bombas">Ascensores / Bombas de Agua</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Asignar Empleado / Responsable</label>
                <select
                  value={asignadoA}
                  onChange={(e) => setAsignadoA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono cursor-pointer"
                >
                  <option value="Pedro (Toderos)">Pedro (Toderos)</option>
                  <option value="Equipo de Aseo">Equipo de Aseo</option>
                  <option value="Contratista Externo">Contratista Externo</option>
                  <option value="Juan Carlos (Mantenimiento General)">Juan Carlos (Mantenimiento General)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Ubicación Precisa</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Sótano 2, Torre 1 - Lobby"
                  value={ubicacion}
                  onChange={(e) => setUbicacion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Descripción del Incidente / Tarea</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalle técnico de la orden de trabajo..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar y Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
