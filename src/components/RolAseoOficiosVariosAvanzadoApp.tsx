import React, { useState } from 'react';
import { 
  Building2, Sparkles, Check, Camera, ShieldCheck, Wrench, Paintbrush, Hammer, Box, Calendar, AlertCircle
} from 'lucide-react';

// =========================================================================
// URBIX PH - CONSOLA DE ASEO & OFICIOS VARIOS (CON BODEGA Y PREVENTIVOS)
// =========================================================================

export default function RolAseoOficiosVariosAvanzadoApp() {
  const [activeTabAseo, setActiveTabAseo] = useState('checklist');

  // Checklist de aseo
  const [tareasAseo, setTareasAseo] = useState([
    { id: '1', zona: 'Lobby y Recepción Torre 1', frecuencia: 'Diario (Mañana)', estado: 'Completado', hora: '07:30 AM' },
    { id: '2', zona: 'Cabina y Espejos Ascensor 1 y 2', frecuencia: 'Cada 4 horas', estado: 'Completado', hora: '10:00 AM' },
    { id: '3', zona: 'Pasillos y Escaleras Torre 2', frecuencia: 'Diario', estado: 'En Proceso', hora: 'En curso' }
  ]);

  // Mantenimiento locativo (pintura, arreglos)
  const [tareasMantenimiento, setTareasMantenimiento] = useState([
    { id: '1', tarea: 'Pintura y retoque de muros en Hall de Acceso Torre 1', area: 'Torre 1 - Piso 1', estado: 'En Progreso', prioridad: 'Media', fecha: '2026-10-25' },
    { id: '2', tarea: 'Cambio de luminarias LED fundidas en Sótano 2', area: 'Parqueaderos', estado: 'Pendiente', prioridad: 'Alta', fecha: '2026-10-26' }
  ]);

  // NUEVO 1: Inventario de Bodega / Insumos de Mantenimiento
  const [inventarioBodega, setInventarioBodega] = useState([
    { id: '1', item: 'Galón de Pintura Viniltex Blanco (Fachadas)', stock: 4, unidad: 'Galones', estado: 'Óptimo' },
    { id: '2', item: 'Bombillo LED Tubular 18W', stock: 12, unidad: 'Unidades', estado: 'Óptimo' },
    { id: '3', item: 'Lijas para madera y pared (Grano 120)', stock: 5, unidades: 'Pliegos', estado: 'Bajo stock' },
    { id: '4', item: 'Silicona sell transparente', stock: 2, unidad: 'Tubos', estado: 'Óptimo' }
  ]);

  // NUEVO 2: Cronograma de Mantenimiento Preventivo PH
  const [mantenimientoPreventivo, setMantenimientoPreventivo] = useState([
    { id: '1', equipo: 'Lavado y Desinfección de Tanques de Agua', frecuencia: 'Semestral', ultimaFecha: '2026-05-15', proximaFecha: '2026-11-15', estado: 'Programado' },
    { id: '2', equipo: 'Mantenimiento Preventivo Ascensores (Schindler)', frecuencia: 'Mensual', ultimaFecha: '2026-09-28', proximaFecha: '2026-10-28', estado: 'Al día' },
    { id: '3', equipo: 'Revisión Sistema Hidroneumático y Bombas', frecuencia: 'Trimestral', ultimaFecha: '2026-08-10', proximaFecha: '2026-11-10', estado: 'Próximo' }
  ]);

  const [novedadesAseo] = useState([
    { id: '1', ubicacion: 'Sótano 2 - Parqueadero 45', descripcion: 'Fuga leve de agua limpia en tubería de suministro.', estado: 'Notificado a Supervisor' }
  ]);

  const marcarCompletadoAseo = (id: string) => {
    setTareasAseo(tareasAseo.map(t => t.id === id ? { ...t, estado: 'Completado', hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : t));
  };

  const marcarCompletadoMantenimiento = (id: string) => {
    setTareasMantenimiento(tareasMantenimiento.map(m => m.id === id ? { ...m, estado: 'Completado' } : m));
  };

  const registrarMantenimientoLocativo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const tarea = (form.elements.namedItem('nombreTarea') as HTMLInputElement).value;
    const area = (form.elements.namedItem('areaTarea') as HTMLInputElement).value;
    const prioridad = (form.elements.namedItem('prioridadTarea') as HTMLSelectElement).value;

    const nueva = {
      id: Date.now().toString(),
      tarea,
      area,
      estado: 'Pendiente',
      prioridad,
      fecha: new Date().toLocaleDateString()
    };

    setTareasMantenimiento([nueva, ...tareasMantenimiento]);
    form.reset();
    alert("¡Labor de oficios varios registrada con éxito!");
  };

  return (
    <div className="min-h-screen bg-[#141416] text-gray-200 font-sans flex flex-col">
      
      {/* CABECERA */}
      <header className="bg-[#1c1c1f] border-b border-[#262629] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/30">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              URBIX PH <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Aseo, Oficios Varios & Bodega PH</span>
            </h1>
            <p className="text-xs text-gray-400">Luz Dary & Carlos • Mantenimiento & Operaciones</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> ARL & Dotación Vigente
        </span>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* NAVEGACIÓN INTERNA */}
        <div className="flex flex-wrap gap-2 border-b border-[#262629] pb-3">
          <button onClick={() => setActiveTabAseo('checklist')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'checklist' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            📋 Checklist Aseo
          </button>
          <button onClick={() => setActiveTabAseo('mantenimiento')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'mantenimiento' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            🎨 Oficios Varios & Pintura ({tareasMantenimiento.filter(t => t.estado !== 'Completado').length})
          </button>
          <button onClick={() => setActiveTabAseo('bodega')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'bodega' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            📦 Inventario Bodega PH
          </button>
          <button onClick={() => setActiveTabAseo('preventivos')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'preventivos' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            🛠️ Mantenimiento Preventivo
          </button>
        </div>

        {/* PESTAÑA 1: CHECKLIST DE ASEO */}
        {activeTabAseo === 'checklist' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white">Labores de Aseo y Desinfección del Día</h3>
            <div className="space-y-3 font-mono text-xs">
              {tareasAseo.map(t => (
                <div key={t.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                  <div>
                    <p className="font-bold text-white text-sm">{t.zona}</p>
                    <p className="text-gray-400 mt-1">Frecuencia: {t.frecuencia} | Registro: {t.hora}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded font-bold ${t.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {t.estado}
                    </span>
                    {t.estado !== 'Completado' && (
                      <button onClick={() => marcarCompletadoAseo(t.id)} className="bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Listo
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: OFICIOS VARIOS Y MANTENIMIENTO PH */}
        {activeTabAseo === 'mantenimiento' && (
          <div className="space-y-6">
            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
              <h3 className="text-md font-semibold text-white mb-2 flex items-center gap-2">
                <Paintbrush className="w-5 h-5 text-emerald-400" /> Registrar Labor de Mantenimiento / Pintura PH
              </h3>
              <form onSubmit={registrarMantenimientoLocativo} className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs mt-4">
                <input name="nombreTarea" type="text" placeholder="Labor (Ej. Pintura muro salón social)" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none" />
                <input name="areaTarea" type="text" placeholder="Área / Zona (Ej. Torre 2 Piso 3)" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none" />
                <select name="prioridadTarea" required className="bg-[#141416] border border-[#262629] rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none">
                  <option value="">Prioridad...</option>
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Urgente">Urgente</option>
                </select>
                <button type="submit" className="bg-emerald-500 text-black font-bold px-4 py-2.5 rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2">
                  <Hammer className="w-4 h-4" /> Registrar Tarea
                </button>
              </form>
            </div>

            <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629]">
              <h3 className="text-md font-semibold text-white mb-4">Cronograma de Mantenimiento Locativo & Pintura</h3>
              <div className="space-y-3 font-mono text-xs">
                {tareasMantenimiento.map(m => (
                  <div key={m.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] p-4 rounded-xl border border-[#262629] gap-3">
                    <div>
                      <p className="font-bold text-white text-sm">🎨 {m.tarea}</p>
                      <p className="text-gray-400 mt-1">Ubicación: <span className="text-cyan-400">{m.area}</span> | Fecha: {m.fecha}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded font-bold ${m.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {m.estado}
                      </span>
                      {m.estado !== 'Completado' && (
                        <button onClick={() => marcarCompletadoMantenimiento(m.id)} className="bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-all">
                          Finalizar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: INVENTARIO DE BODEGA PH (NUEVO) */}
        {activeTabAseo === 'bodega' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Box className="w-5 h-5 text-emerald-400" /> Stock de Materiales e Insumos en Bodega PH
            </h3>
            <p className="text-xs text-gray-400">Control de insumos disponibles para pintura, iluminación y reparaciones locativas.</p>
            
            <div className="space-y-3 font-mono text-xs">
              {inventarioBodega.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                  <div>
                    <p className="font-bold text-white text-sm">{item.item}</p>
                    <p className="text-gray-400 mt-1">Stock actual: <strong className="text-cyan-400">{item.stock} {item.unidad || 'Unidades'}</strong></p>
                  </div>
                  <span className={`px-3 py-1 rounded font-bold ${item.estado === 'Óptimo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: MANTENIMIENTO PREVENTIVO (NUEVO) */}
        {activeTabAseo === 'preventivos' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" /> Cronograma de Mantenimiento Preventivo de Equipos PH
            </h3>
            <p className="text-xs text-gray-400">Control de mantenimientos periódicos obligatorios en la copropiedad.</p>
            
            <div className="space-y-3 font-mono text-xs">
              {mantenimientoPreventivo.map(prev => (
                <div key={prev.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] p-4 rounded-xl border border-[#262629] gap-3">
                  <div>
                    <p className="font-bold text-white text-sm">🛠️ {prev.equipo}</p>
                    <p className="text-gray-400 mt-1">Frecuencia: {prev.frecuencia} | Último: {prev.ultimaFecha} | Próximo: <span className="text-cyan-400 font-bold">{prev.proximaFecha}</span></p>
                  </div>
                  <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                    {prev.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
