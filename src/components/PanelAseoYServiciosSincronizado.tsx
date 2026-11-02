import React, { useState } from 'react';
import { Sparkles, CheckSquare, Wrench, PlusCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function PanelAseoYServiciosSincronizado({
  tareasShared = [],
  setTareasShared,
  onShowToast
}: {
  tareasShared?: any[];
  setTareasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}) {
  // Checklist diario local del operario
  const [checklistAseo, setChecklistAseo] = useState([
    { id: 'chk_1', zona: 'Lobby Principal y Recepción', frecuencia: 'Diaria (Mañana)', estado: 'Completado' },
    { id: 'chk_2', zona: 'Cabinas de Ascensores (Torres 1 y 2)', frecuencia: 'Diaria (2 veces)', estado: 'Pendiente' },
    { id: 'chk_3', zona: 'Pasillos y Escaleras de Emergencia', frecuencia: 'Interdiaria', estado: 'Pendiente' },
    { id: 'chk_4', zona: 'Plataforma Social y Baños Húmedos', frecuencia: 'Diaria', estado: 'Completado' }
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

  // Cambiar estado de la tarea y notificar al supervisor en tiempo real
  const handleCambiarEstadoTareaOperario = (id: string, nuevoEstado: string) => {
    const estadoTareaMapeado =
      nuevoEstado === 'Solucionado'
        ? 'Resuelto y Verificado ✅'
        : nuevoEstado === 'En Proceso'
        ? 'En Reparación por Todero'
        : 'Pendiente Asignación';

    if (setTareasShared) {
      setTareasShared((prev: any[]) =>
        prev.map((t: any) =>
          t.id === id ? { ...t, estado: nuevoEstado, estadoTarea: estadoTareaMapeado } : t
        )
      );
    }
    onShowToast?.(`✅ Orden actualizada a "${nuevoEstado}". Sincronizado con la Supervisora.`);
  };

  const handleReportarNovedadOperario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaNovedad.trim() || !ubicacionNovedad.trim()) {
      onShowToast?.('Por favor ingresa la ubicación y el detalle de la novedad.');
      return;
    }

    if (setTareasShared) {
      const horaReporte = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nuevaOrden = {
        id: `TOD-${Date.now().toString().slice(-5)}`,
        codigoNfcQr: 'REP-ASEO-CAMPO',
        area: ubicacionNovedad.trim(),
        titulo: ubicacionNovedad.trim(),
        zona: ubicacionNovedad.trim(),
        ubicacion: ubicacionNovedad.trim(),
        categoria: 'Mantenimiento / Aseo',
        detalle: nuevaNovedad.trim(),
        hallazgo: nuevaNovedad.trim(),
        guardaReportante: 'Operario de Turno (Aseo & Todero)',
        horaReporte,
        fechaReporte: `Hoy ${horaReporte}`,
        prioridad: 'Alta (Correctivo Inmediato)',
        estado: 'Pendiente',
        estadoTarea: 'Pendiente Asignación',
        responsableTodero: 'Cuadrilla de Toderos & Mantenimiento Interno'
      };
      setTareasShared((prev: any[]) => [nuevaOrden, ...prev]);
    }

    setNuevaNovedad('');
    setUbicacionNovedad('');
    onShowToast?.('🚨 Novedad reportada con éxito al panel de la Supervisora.');
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-8 font-sans">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/25 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
              Consola Operativa • Enlazada con Supervisión en Vivo
            </span>
            <h2 className="text-lg font-black text-white mt-1">Panel de Control de Aseo, Toderos y Mantenimiento</h2>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: CHECKLIST DIARIO */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <CheckSquare className="w-4 h-4 text-teal-400" /> Checklist Diario de Zonas Comunes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
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
              <span className={`px-2 py-1 rounded-lg font-bold text-[10px] border ${
                item.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {item.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: TAREAS ASIGNADAS DESDE EL SUPERVISOR */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <Wrench className="w-4 h-4 text-cyan-400" /> Órdenes de Trabajo Enviadas por la Supervisora
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            Sincronización Bidireccional Activa
          </span>
        </div>

        <div className="space-y-3">
          {(tareasShared || []).length > 0 ? (
            tareasShared.map((t: any) => {
              const estadoActual =
                t.estado ||
                (t.estadoTarea === 'Resuelto y Verificado ✅'
                  ? 'Solucionado'
                  : t.estadoTarea === 'En Reparación por Todero'
                  ? 'En Proceso'
                  : 'Pendiente');
              return (
                <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{t.area || t.titulo || t.zona}</span>
                      <span className="bg-slate-900 text-cyan-400 px-2.5 py-0.5 rounded text-[11px] font-mono">{t.categoria || 'Mantenimiento'}</span>
                    </div>
                    <p className="text-slate-300">{t.detalle || t.hallazgo}</p>
                    <p className="text-slate-400 font-mono text-[11px]">🕒 Reporte: {t.fechaReporte || t.horaReporte || 'Hoy'}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg font-bold text-[11px] border ${
                      estadoActual === 'Solucionado' || estadoActual === 'Completado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      estadoActual === 'En Proceso' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                    }`}>
                      {estadoActual}
                    </span>

                    <select
                      value={estadoActual}
                      onChange={(e) => handleCambiarEstadoTareaOperario(t.id, e.target.value)}
                      className="p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none font-bold focus:border-cyan-400 cursor-pointer"
                    >
                      <option value="Pendiente">Pendiente</option>
                      <option value="En Proceso">En Proceso</option>
                      <option value="Solucionado">Solucionado (Completado)</option>
                    </select>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
              No hay órdenes de trabajo asignadas por el supervisor en este momento.
            </p>
          )}
        </div>
      </div>

      {/* SECCIÓN 3: REPORTE DE NOVEDADES HACIA EL SUPERVISOR */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Reportar Daño o Novedad a la Supervisora
        </h3>

        <form onSubmit={handleReportarNovedadOperario} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Ubicación (Ej: Sótano 2, Torre 1)..."
            value={ubicacionNovedad}
            onChange={(e) => setUbicacionNovedad(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <input
            type="text"
            placeholder="Detalle del daño encontrado..."
            value={nuevaNovedad}
            onChange={(e) => setNuevaNovedad(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
          >
            <PlusCircle className="w-4 h-4" /> Enviar Reporte a Supervisión
          </button>
        </form>
      </div>

    </div>
  );
}
