import React, { useState } from 'react';
import { Sparkles, CheckSquare, Wrench, PlusCircle, CheckCircle2, Clock, AlertTriangle, Camera } from 'lucide-react';

export default function PanelAseoYServiciosEnterprise({
  onShowToast,
  onDerivarMantenimientoTodero
}: {
  onShowToast?: (msg: string) => void;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
}) {
  // Estado local para el Checklist de Aseo diario
  const [checklistAseo, setChecklistAseo] = useState([
    { id: 'chk_1', zona: 'Lobby Principal y Recepción', frecuencia: 'Diaria (Mañana)', estado: 'Completado' },
    { id: 'chk_2', zona: 'Cabinas de Ascensores (Torres 1 y 2)', frecuencia: 'Diaria (2 veces)', estado: 'Pendiente' },
    { id: 'chk_3', zona: 'Pasillos y Escaleras de Emergencia', frecuencia: 'Interdiaria', estado: 'Pendiente' },
    { id: 'chk_4', zona: 'Plataforma Social y Baños Húmedos', frecuencia: 'Diaria', estado: 'Completado' },
    { id: 'chk_5', zona: 'Sótano Técnico y Cuarto de Basuras', frecuencia: 'Diaria', estado: 'En Proceso' }
  ]);

  // Estado local para Órdenes de Trabajo del Operario
  const [misTareas, setMisTareas] = useState([
    {
      id: 'task_1',
      titulo: 'Cambio de luminaria fundida',
      ubicacion: 'Pasillo Torre 2 - Piso 4',
      prioridad: 'Media',
      estado: 'Asignado'
    },
    {
      id: 'task_2',
      titulo: 'Lavado y desinfección de shut de basuras',
      ubicacion: 'Sótano 1',
      prioridad: 'Alta',
      estado: 'En Proceso'
    }
  ]);

  const [nuevaNovedad, setNuevaNovedad] = useState('');
  const [ubicacionNovedad, setUbicacionNovedad] = useState('');

  const handleToggleChecklist = (id: string) => {
    setChecklistAseo(checklistAseo.map(item => {
      if (item.id === id) {
        const nuevoEstado = item.estado === 'Completado' ? 'Pendiente' : 'Completado';
        onShowToast?.(`Zona "${item.zona}" marcada como: ${nuevoEstado}`);
        return { ...item, estado: nuevoEstado };
      }
      return item;
    }));
  };

  const handleCambiarEstadoTarea = (id: string, nuevoEstado: string) => {
    setMisTareas(misTareas.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t));
    onShowToast?.(`Estado de tarea actualizado a: ${nuevoEstado}`);
  };

  const handleReportarNovedadOperario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNovedad.trim() || !ubicacionNovedad.trim()) {
      onShowToast?.('Por favor ingresa la ubicación y el detalle de la novedad.');
      return;
    }

    onDerivarMantenimientoTodero?.({
      id: `NOV-ASEO-${Date.now()}`,
      punto: ubicacionNovedad.trim(),
      ubicacion: ubicacionNovedad.trim(),
      detalle: nuevaNovedad.trim(),
      prioridad: 'Alta',
      estado: 'Pendiente',
      origen: 'Reporte Directo Operario Aseo & Servicios',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });

    setNuevaNovedad('');
    setUbicacionNovedad('');
    onShowToast?.('✅ Novedad reportada con éxito a la Supervisora y Administración.');
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-8 font-sans">
      
      {/* Cabecera del Rol de Aseo & Servicios */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/25 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
              Consola Operativa • Personal de Aseo, Toderos y Mantenimiento
            </span>
            <h2 className="text-lg font-black text-white mt-1">Panel de Control de Servicios Generales y Zonas Comunes</h2>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: CHECKLIST DIARIO DE ASEO */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <CheckSquare className="w-4 h-4 text-teal-400" /> Checklist Diario de Zonas Comunes y Aseo
          </h3>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
            Control de Turno Activo
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {checklistAseo.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleToggleChecklist(item.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                item.estado === 'Completado' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <span className="font-bold text-xs block text-white">{item.zona}</span>
                <span className="text-[10px] font-mono text-slate-400 block">{item.frecuencia}</span>
              </div>
              <div className="shrink-0">
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                  item.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  item.estado === 'En Proceso' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {item.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: MIS TAREAS ASIGNADAS (ÓRDENES DE TRABAJO) */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Wrench className="w-4 h-4 text-cyan-400" /> Órdenes de Trabajo Asignadas por Supervisión
          </h3>
        </div>

        <div className="space-y-3">
          {misTareas.map((tarea) => (
            <div key={tarea.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-sm">{tarea.titulo}</span>
                  <span className="bg-slate-900 text-cyan-400 px-2 py-0.5 rounded text-[11px] font-mono">{tarea.ubicacion}</span>
                </div>
                <p className="text-slate-400">Prioridad: <strong className="text-amber-400">{tarea.prioridad}</strong></p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg font-bold text-[11px] border ${
                  tarea.estado === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  tarea.estado === 'En Proceso' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  {tarea.estado}
                </span>

                <select
                  value={tarea.estado}
                  onChange={(e) => handleCambiarEstadoTarea(tarea.id, e.target.value)}
                  className="p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none"
                >
                  <option value="Asignado">Asignado</option>
                  <option value="En Proceso">En Proceso</option>
                  <option value="Completado">Completado</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 3: REPORTE RÁPIDO DE NOVEDADES DESDE EL OPERARIO */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Reportar Daño o Anomalía Encontrada en Ronda
        </h3>

        <form onSubmit={handleReportarNovedadOperario} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Ubicación exacta (Ej: Sótano 2, Muro Torre 1)..."
            value={ubicacionNovedad}
            onChange={(e) => setUbicacionNovedad(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <input
            type="text"
            placeholder="Detalle de la novedad o daño observado..."
            value={nuevaNovedad}
            onChange={(e) => setNuevaNovedad(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Enviar Reporte a Supervisor
          </button>
        </form>
      </div>

    </div>
  );
}
