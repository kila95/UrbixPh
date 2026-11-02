import React, { useState } from 'react';
import { 
  Building2, Sparkles, Check, Camera, ShieldCheck, Wrench, Paintbrush, Hammer, Box, Calendar, Droplet, Trees, Baby
} from 'lucide-react';

// =========================================================================
// URBIX PH - CONSOLA DE ASEO & OFICIOS VARIOS (INCLUYE PISCINA Y PARQUES)
// =========================================================================

export default function RolAseoOficiosVariosApp() {
  const [activeTabAseo, setActiveTabAseo] = useState('checklist');

  // Checklist de aseo
  const [tareasAseo, setTareasAseo] = useState([
    { id: '1', zona: 'Lobby y Recepción Torre 1', frecuencia: 'Diario (Mañana)', estado: 'Completado', hora: '07:30 AM' },
    { id: '2', zona: 'Cabina y Espejos Ascensor 1 y 2', frecuencia: 'Cada 4 horas', estado: 'Completado', hora: '10:00 AM' }
  ]);

  // Oficios varios y pintura
  const [tareasMantenimiento, setTareasMantenimiento] = useState([
    { id: '1', tarea: 'Pintura y retoque de muros en Hall de Acceso Torre 1', area: 'Torre 1 - Piso 1', estado: 'En Progreso', prioridad: 'Media', fecha: '2026-10-25' }
  ]);

  // NUEVO: Control diario de Piscinas, Zonas Verdes y Parques Infantiles
  const [mantenimientoZonasEspeciales, setMantenimientoZonasEspeciales] = useState([
    { 
      id: '1', 
      zona: 'Piscina Principal & Jacuzzi', 
      labor: 'Medición de Cloro (ppm) y pH (Ideal: 7.2 - 7.6)', 
      estadoControl: 'Completado (Cloro: 1.8 | pH: 7.4)', 
      responsable: 'Carlos (Oficios Varios)',
      hora: '08:00 AM' 
    },
    { 
      id: '2', 
      zona: 'Zonas Verdes & Jardines Perimetrales', 
      labor: 'Poda de césped, retiro de hojas y riego general', 
      estadoControl: 'En Proceso', 
      responsable: 'Personal de Jardinería / Apoyo',
      hora: 'En curso' 
    },
    { 
      id: '3', 
      zona: 'Parque Infantil & Juegos', 
      labor: 'Inspección de seguridad (ajuste de pernos, estado de columpios y piso de caucho)', 
      estadoControl: 'Completado (Sin novedades)', 
      responsable: 'Carlos (Oficios Varios)',
      hora: '09:30 AM' 
    }
  ]);

  const [inventarioBodega] = useState([
    { id: '1', item: 'Cloro Granulado x 45kg', stock: 2, unidad: 'Potes', estado: 'Óptimo' },
    { id: '2', item: 'Alguicida y Clarificador', stock: 4, unidad: 'Galones', estado: 'Óptimo' }
  ]);

  const marcarCompletadoZonaEspecial = (id: string) => {
    setMantenimientoZonasEspeciales(mantenimientoZonasEspeciales.map(z => z.id === id ? { ...z, estadoControl: 'Completado y Verificado', hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : z));
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
              URBIX PH <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Aseo, Oficios Varios & Zonas Comunes</span>
            </h1>
            <p className="text-xs text-gray-400">Luz Dary & Carlos • Mantenimiento Integral</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> Normativa Ley 675 & Salud Pública
        </span>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* NAVEGACIÓN INTERNA */}
        <div className="flex flex-wrap gap-2 border-b border-[#262629] pb-3">
          <button onClick={() => setActiveTabAseo('checklist')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'checklist' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            📋 Checklist Aseo
          </button>
          <button onClick={() => setActiveTabAseo('piscinas_parques')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'piscinas_parques' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            🏊♂️ Piscinas, Jardines & Parques
          </button>
          <button onClick={() => setActiveTabAseo('mantenimiento')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'mantenimiento' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            🎨 Oficios Varios & Pintura
          </button>
          <button onClick={() => setActiveTabAseo('bodega')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTabAseo === 'bodega' ? 'bg-[#1c1c1f] text-emerald-400 border border-[#262629]' : 'text-gray-400 hover:text-white'}`}>
            📦 Bodega PH
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
                  <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">{t.estado}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: PISCINAS, JARDINES Y PARQUES (NUEVO) */}
        {activeTabAseo === 'piscinas_parques' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white flex items-center gap-2">
              <Droplet className="w-5 h-5 text-cyan-400" /> Control Diario de Piscinas, Zonas Verdes y Parques Infantiles
            </h3>
            <p className="text-xs text-gray-400">Verificación de parámetros fisicoquímicos del agua, seguridad en juegos infantiles y mantenimiento de jardines.</p>
            
            <div className="space-y-3 font-mono text-xs">
              {mantenimientoZonasEspeciales.map(z => (
                <div key={z.id} className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] p-4 rounded-xl border border-[#262629] gap-3">
                  <div>
                    <p className="font-bold text-white text-sm flex items-center gap-2">
                      {z.zona.includes('Piscina') ? <Droplet className="w-4 h-4 text-cyan-400" /> : z.zona.includes('Verdes') ? <Trees className="w-4 h-4 text-emerald-400" /> : <Baby className="w-4 h-4 text-amber-400" />}
                      {z.zona}
                    </p>
                    <p className="text-gray-300 mt-1">Labor: {z.labor}</p>
                    <p className="text-gray-500 mt-1">Responsable: {z.responsable} | Hora: {z.hora}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded font-bold ${z.estadoControl.includes('Completado') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {z.estadoControl}
                    </span>
                    {!z.estadoControl.includes('Completado') && (
                      <button onClick={() => marcarCompletadoZonaEspecial(z.id)} className="bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Verificar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: OFICIOS VARIOS Y PINTURA */}
        {activeTabAseo === 'mantenimiento' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white">Cronograma de Pintura y Mantenimiento Locativo</h3>
            <div className="space-y-3 font-mono text-xs">
              {tareasMantenimiento.map(m => (
                <div key={m.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                  <div>
                    <p className="font-bold text-white text-sm">🎨 {m.tarea}</p>
                    <p className="text-gray-400 mt-1">Área: {m.area} | Fecha: {m.fecha}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-400 font-bold">{m.estado}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: BODEGA PH */}
        {activeTabAseo === 'bodega' && (
          <div className="bg-[#1c1c1f] p-6 rounded-2xl border border-[#262629] space-y-4">
            <h3 className="text-md font-semibold text-white">Stock de Insumos y Químicos de Piscina</h3>
            <div className="space-y-3 font-mono text-xs">
              {inventarioBodega.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-[#141416] p-4 rounded-xl border border-[#262629]">
                  <div>
                    <p className="font-bold text-white text-sm">{item.item}</p>
                    <p className="text-gray-400 mt-1">Stock: <strong className="text-cyan-400">{item.stock} {item.unidad}</strong></p>
                  </div>
                  <span className="px-3 py-1 rounded bg-emerald-500/20 text-emerald-400 font-bold">{item.estado}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
