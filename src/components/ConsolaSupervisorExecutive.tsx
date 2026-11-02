import React, { useState } from 'react';
import { ShieldCheck, Sliders, Wrench, PlusCircle, CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';

export default function ConsolaSupervisorExecutive({
  checklistConfig = [],
  setChecklistConfig,
  tareasShared = [],
  setTareasShared,
  onShowToast
}: {
  checklistConfig?: any[];
  setChecklistConfig?: React.Dispatch<React.SetStateAction<any[]>>;
  tareasShared?: any[];
  setTareasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}) {
  const [zonaTrabajo, setZonaTrabajo] = useState('');
  const [detalleTrabajo, setDetalleTrabajo] = useState('');
  const [categoria, setCategoria] = useState('Mantenimiento Locativo');

  const handleCambiarFrecuencia = (id: string, nuevaFrecuencia: string) => {
    if (setChecklistConfig) {
      setChecklistConfig((prev: any[]) =>
        prev.map((item: any) => item.id === id ? { ...item, frecuencia: nuevaFrecuencia } : item)
      );
    }
    onShowToast?.(`⚡ Frecuencia actualizada exitosamente.`);
  };

  const handleEnviarOrdenTrabajo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zonaTrabajo.trim() || !detalleTrabajo.trim()) {
      onShowToast?.('Por favor completa la zona y el detalle de la orden.');
      return;
    }

    const nuevaOrden = {
      id: `ord_${Date.now()}`,
      area: zonaTrabajo.trim(),
      categoria: categoria,
      detalle: detalleTrabajo.trim(),
      estado: 'Pendiente',
      fechaReporte: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    if (setTareasShared) {
      setTareasShared((prev: any[]) => [nuevaOrden, ...prev]);
    }

    setZonaTrabajo('');
    setDetalleTrabajo('');
    onShowToast?.('🛠️ Orden de trabajo enviada al panel del operario.');
  };

  return (
    <div className="bg-[#07090e] border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-7 font-sans text-slate-100">
      
      {/* Cabecera del Supervisor */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-cyan-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Supervisión Operativa • Consola Ejecutiva
            </span>
            <h3 className="text-lg font-black text-white mt-1">Control de Frecuencias de Aseo y Órdenes de Mantenimiento</h3>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: FRECUENCIAS DEL CHECKLIST */}
      <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
          <Sliders className="w-4 h-4 text-cyan-400" /> Parámetros de Frecuencia del Checklist (Zonas Comunes)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(checklistConfig || []).map((item: any) => (
            <div key={item.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-white block">{item.zona}</span>
                <span className="text-[10px] font-mono text-slate-400">Estado: {item.estado}</span>
              </div>
              <select
                value={item.frecuencia}
                onChange={(e) => handleCambiarFrecuencia(item.id, e.target.value)}
                className="p-2 bg-slate-900 border border-slate-700 text-cyan-400 rounded-xl text-xs font-mono outline-none cursor-pointer font-bold"
              >
                <option value="Diaria">Diaria</option>
                <option value="Diaria (Mañana)">Diaria (Mañana)</option>
                <option value="Cada 2 días">Cada 2 días</option>
                <option value="Dos veces al día">Dos veces al día</option>
                <option value="Semanal">Semanal</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* SECCIÓN 2: ASIGNAR ORDEN DE TRABAJO */}
      <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
          <Wrench className="w-4 h-4 text-teal-400" /> Enviar Orden de Trabajo a Operarios o Toderos
        </h4>

        <form onSubmit={handleEnviarOrdenTrabajo} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Área o Ubicación (Ej: Torre 1 - Lobby)..."
            value={zonaTrabajo}
            onChange={(e) => setZonaTrabajo(e.target.value)}
            className="p-3 bg-[#07090e] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="p-3 bg-[#07090e] border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-teal-400"
          >
            <option>Mantenimiento Locativo</option>
            <option>Aseo Profundo</option>
            <option>Reparación / Plomería</option>
            <option>Eléctrico / Luminarias</option>
          </select>

          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:opacity-90"
          >
            <PlusCircle className="w-4 h-4" /> Asignar Orden
          </button>

          <input
            type="text"
            placeholder="Descripción detallada de la labor a realizar..."
            value={detalleTrabajo}
            onChange={(e) => setDetalleTrabajo(e.target.value)}
            className="md:col-span-3 p-3 bg-[#07090e] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />
        </form>
      </div>

    </div>
  );
}
