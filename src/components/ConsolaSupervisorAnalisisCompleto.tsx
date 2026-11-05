import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, Sliders, Wrench, Radio, Clock, AlertTriangle, Users, FileCheck, CheckCircle2, PlusCircle, Bell, ArrowRight, ShieldAlert, Sparkles, LogOut } from 'lucide-react';
import VersionShieldGuardBanner from './VersionShieldGuardBanner';
import { UrbixLogoMark, UrbixFullLogo } from '../UrbixLogo';
import LogoUrbix from './LogoUrbix';
import VistaGeneralSupervisor from './VistaGeneralSupervisor';
import ModuloRondasNFC from './ModuloRondasNFC';

export interface ConsolaSupervisorAnalisisCompletoProps {
  checklistConfig?: any[];
  setChecklistConfig?: React.Dispatch<React.SetStateAction<any[]>>;
  tareasShared?: any[];
  setTareasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  alertasShared?: any[];
  setAlertasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
  onActivarAlertaCriticaSupervisor?: (alerta: any) => void;
  onCerrarSesion?: () => void;
  userProfile?: any;
}

export default function ConsolaSupervisorAnalisisCompleto({
  checklistConfig = [],
  setChecklistConfig,
  tareasShared = [],
  setTareasShared,
  rondasShared = [],
  setRondasShared,
  alertasShared = [],
  setAlertasShared,
  onShowToast,
  onDerivarMantenimientoTodero,
  onActivarAlertaCriticaSupervisor,
  onCerrarSesion,
  userProfile
}: ConsolaSupervisorAnalisisCompletoProps) {
  const activeTenantId = userProfile?.tenant_id || '22079bb5-6ac7-4a15-be89-c53d14e4221b';
  const tenantName = userProfile?.building_name || 'Reserva del Tesoro';
  const [tabSupervisor, setTabSupervisor] = useState<'general' | 'rondas' | 'frecuencias' | 'ordenes' | 'alertas'>('general');
  const subTab = tabSupervisor;
  const setSubTab = setTabSupervisor;
  const [comunicados, setComunicados] = useState<any[]>([]);

  useEffect(() => {
    const cargarComunicados = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });
        if (!error && data) {
          setComunicados(data);
        }
      } catch (err) {
        console.error('Error cargando comunicados en supervisor:', err);
      }
    };

    cargarComunicados();

    const channel = supabase
      .channel('announcements-supervisor-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          cargarComunicados();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fallback data for rondas NFC if empty
  const defaultRondas = [
    {
      id: 'rnd_1',
      punto: 'Cuarto de Bombas e Hidroneumáticos',
      tagNfc: 'NFC-BOMB-01',
      ubicacion: 'Sótano Técnico - Nivel -1',
      estado: 'Verificado Normal ✓',
      hora: '08:00 AM',
      guarda: 'Carlos Restrepo',
      presion: '65 PSI (Óptimo)',
      hash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
    },
    {
      id: 'rnd_2',
      punto: 'Subestación Eléctrica y Planta Diésel',
      tagNfc: 'NFC-ELEC-02',
      ubicacion: 'Cuarto de Transformadores Bloque A',
      estado: 'Verificado Normal ✓',
      hora: '08:25 AM',
      guarda: 'Carlos Restrepo',
      presion: 'Combustible 92% ACPM',
      hash: 'sha256:4a382e7834575fbef546f3d9d300d869279a32c63dfbe9ff200057088198f7e2'
    },
    {
      id: 'rnd_3',
      punto: 'Perímetro Externo y Portón Vehicular',
      tagNfc: 'NFC-PERIM-03',
      ubicacion: 'Cerramiento Calle 10 con Carrera 43',
      estado: 'Novedad Reportada',
      hora: '09:10 AM',
      guarda: 'Luis Fernando Pérez',
      presion: 'Lámpara perimetral intermitente',
      hash: 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    },
    {
      id: 'rnd_4',
      punto: 'Terraza Técnica y Sala de Máquinas Ascensores',
      tagNfc: 'NFC-ASC-04',
      ubicacion: 'Azotea Torres 1 y 2',
      estado: 'Verificado Normal ✓',
      hora: '09:40 AM',
      guarda: 'Luis Fernando Pérez',
      presion: 'Frenos y guayas en parámetro',
      hash: 'sha256:5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'
    }
  ];

  const activeRondas = rondasShared && rondasShared.length > 0 ? rondasShared : defaultRondas;

  // Local state for creating new work order
  const [nuevaArea, setNuevaArea] = useState('');
  const [nuevaCategoria, setNuevaCategoria] = useState('Mantenimiento Locativo');
  const [nuevoDetalle, setNuevoDetalle] = useState('');
  const [nuevaPrioridad, setNuevaPrioridad] = useState<'Media' | 'Alta' | 'Urgente'>('Media');

  // Fallback default checklist if none provided
  const defaultChecklist = [
    { id: 'chk_1', zona: 'Lobby Principal y Recepción', frecuencia: 'Diaria (Mañana)', estado: 'Completado' },
    { id: 'chk_2', zona: 'Cabinas de Ascensores (Torres 1 y 2)', frecuencia: 'Dos veces al día', estado: 'Pendiente' },
    { id: 'chk_3', zona: 'Pasillos y Escaleras de Emergencia', frecuencia: 'Cada 2 días', estado: 'Pendiente' },
    { id: 'chk_4', zona: 'Plataforma Social y Baños Húmedos', frecuencia: 'Diaria', estado: 'Completado' },
    { id: 'chk_5', zona: 'Sótano Técnico y Cuarto de Basuras', frecuencia: 'Diaria', estado: 'En Proceso' }
  ];

  const activeChecklist = checklistConfig && checklistConfig.length > 0 ? checklistConfig : defaultChecklist;

  // Fallback default work orders if none provided
  const defaultTareas = [
    { id: 'ord_1', area: 'Sótano 1 - Entrada Parqueaderos', categoria: 'Mantenimiento Locativo', detalle: 'Cambio de luminaria balasto LED en rampa', estado: 'En proceso', fechaReporte: 'Hoy 08:30 AM' },
    { id: 'ord_2', area: 'Piscina y Zonas Húmedas', categoria: 'Reparación / Plomería', detalle: 'Ajuste de llave de purga en filtro de arena', estado: 'Pendiente', fechaReporte: 'Hoy 09:15 AM' },
    { id: 'ord_3', area: 'Lobby Principal', categoria: 'Aseo Profundo', detalle: 'Cristalizado de pisos de mármol y zócalos', estado: 'Solucionado', fechaReporte: 'Ayer 04:00 PM' }
  ];

  const activeTareas = tareasShared && tareasShared.length > 0 ? tareasShared : defaultTareas;

  // Fallback default alerts
  const [alertasLocales, setAlertasLocales] = useState([
    {
      id: 'alt_1',
      tipo: 'BOTON_PANICO_RUTA',
      punto: 'Garita Principal / Portería',
      detalle: 'Alerta de apoyo prioritario en control de acceso vehicular.',
      hora: '10:15 AM',
      atendida: false
    },
    {
      id: 'alt_2',
      tipo: 'SENSOR_INUNDACION',
      punto: 'Fosa Cuarto de Bombas',
      detalle: 'Nivel freático alcanzó el 70% del sensor de seguridad.',
      hora: '07:45 AM',
      atendida: true
    }
  ]);

  const handleCambiarFrecuencia = (id: string, nuevaFrecuencia: string) => {
    if (setChecklistConfig) {
      setChecklistConfig((prev: any[]) =>
        prev.map((item: any) => item.id === id ? { ...item, frecuencia: nuevaFrecuencia } : item)
      );
    }
    onShowToast?.(`⚡ Frecuencia de la zona actualizada a: ${nuevaFrecuencia}`);
  };

  const handleEnviarOrdenTrabajo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaArea.trim() || !nuevoDetalle.trim()) {
      onShowToast?.('Por favor ingresa el área y la descripción de la orden.');
      return;
    }

    const nuevaOrden = {
      id: `ord_${Date.now()}`,
      area: nuevaArea.trim(),
      categoria: nuevaCategoria,
      detalle: nuevoDetalle.trim(),
      prioridad: nuevaPrioridad,
      estado: 'Pendiente',
      fechaReporte: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    if (setTareasShared) {
      setTareasShared((prev: any[]) => [nuevaOrden, ...prev]);
    }
    onDerivarMantenimientoTodero?.(nuevaOrden);

    setNuevaArea('');
    setNuevoDetalle('');
    onShowToast?.(`🛠️ Orden despachada a toderos y mantenimiento: ${nuevaOrden.area}`);
  };

  const handleToggleEstadoTarea = (id: string) => {
    if (setTareasShared) {
      setTareasShared((prev: any[]) =>
        prev.map(t => {
          if (t.id === id) {
            const nuevo = t.estado === 'Pendiente' ? 'En proceso' : t.estado === 'En proceso' ? 'Solucionado' : 'Pendiente';
            return { ...t, estado: nuevo };
          }
          return t;
        })
      );
    }
    onShowToast?.('Estado de la orden de trabajo actualizado.');
  };

  const handleAtenderAlerta = (id: string) => {
    setAlertasLocales(prev =>
      prev.map(a => a.id === id ? { ...a, atendida: true } : a)
    );
    onShowToast?.('✅ Alerta atendida y confirmada por el Supervisor Operativo.');
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col">
      
      {/* BANNER DE BLINDAJE DE VERSIÓN Y ARQUITECTURA */}
      <VersionShieldGuardBanner currentUserEmail={userProfile?.email} onShowToast={onShowToast} compact />

      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0">
        <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-[0_0_30px_rgba(34,211,238,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <LogoUrbix size="sm" rolBadge="SUPERVISOR" />
            <div className="hidden sm:block h-7 w-px bg-slate-800" />
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
                Supervisor Operativo • Análisis Integral
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1">Centro de Control, Rondas NFC y Auditoría de Terreno</h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl">
              ● Cuadrilla 100% Sincronizada
            </span>
            {onCerrarSesion && (
              <button
                type="button"
                onClick={onCerrarSesion}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 hover:border-rose-500/60 text-rose-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px] shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.35)]"
                title="Cerrar sesión de Supervisor Operativo"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Cerrar Sesión</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 mt-4">
          <div className="text-[11px] font-mono text-cyan-400 uppercase font-semibold mb-2">
            📌 Circulares Activas de Administración
          </div>
          <div className="space-y-2">
            {comunicados.slice(0, 2).map((c) => (
              <div key={c.id} className="text-xs text-slate-300 border-l-2 border-cyan-500 pl-2">
                <p className="font-bold text-white">{c.title}</p>
                <p className="text-[11px] text-slate-400 line-clamp-1">{c.content}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="md:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Submódulo:</span>
        <select
          value={subTab}
          onChange={(e) => setSubTab(e.target.value as any)}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="general">📊 Vista General</option>
          <option value="rondas">📡 1. Auditoría de Rondas NFC</option>
          <option value="frecuencias">🧹 2. Frecuencias de Aseo</option>
          <option value="ordenes">🛠️ 3. Órdenes a Toderos</option>
          <option value="alertas">🚨 4. Centro de Alertas Críticas</option>
        </select>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN EN UNA SOLA LÍNEA HORIZONTAL SIN SALTOS */}
      <nav className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-3 bg-[#0b0f17] border border-cyan-500/20 rounded-2xl shrink-0 shadow-lg touch-pan-x">
        {/* Botón Vista General */}
        <button
          type="button"
          onClick={() => setTabSupervisor('general')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border shrink-0 ${
            tabSupervisor === 'general'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          Vista General
        </button>

        {/* Botón Rondas NFC */}
        <button
          type="button"
          onClick={() => setTabSupervisor('rondas')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer border shrink-0 flex items-center gap-2 ${
            tabSupervisor === 'rondas'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
              : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 text-cyan-400" />
          <span>((o)) 1. Auditoría de Rondas NFC</span>
        </button>

        {[
          { id: 'frecuencias', label: '2. Frecuencias de Aseo', icon: Sliders },
          { id: 'ordenes', label: '3. Órdenes a Toderos', icon: Wrench },
          { id: 'alertas', label: '4. Centro de Alertas Críticas', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = tabSupervisor === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTabSupervisor(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition cursor-pointer shrink-0 border min-h-[38px] ${
                isActive 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]' 
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 text-cyan-400" /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 3. CONTENIDO PRINCIPAL ABAJO */}
      <main className="w-full flex-1 space-y-6">
        
        {/* SUBTAB 0: VISTA GENERAL TÁCTICA DEL SUPERVISOR */}
        {tabSupervisor === 'general' && (
          <VistaGeneralSupervisor
            tenantId={activeTenantId}
            tenantName={tenantName}
            supervisorName={userProfile?.full_name || 'Supervisor'}
            onCambiarPestana={(tab) => setTabSupervisor(tab as any)}
            onShowToast={onShowToast}
          />
        )}

        {/* SUBTAB 1: RONDAS NFC */}
        {tabSupervisor === 'rondas' && (
          <ModuloRondasNFC
            tenantId={activeTenantId}
            onShowToast={onShowToast}
            onDerivarMantenimientoTodero={(tarea) => {
              setTareasShared?.((prev: any[]) => [tarea, ...prev]);
              onDerivarMantenimientoTodero?.(tarea);
            }}
          />
        )}

        {/* SUBTAB 2: FRECUENCIAS DE ASEO */}
        {subTab === 'frecuencias' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-teal-400 font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4" /> 2. Configuración de Frecuencias del Checklist de Aseo
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Define la periodicidad de limpieza para cada zona común de la copropiedad (sincronizado con el operario).
                </p>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-500/10 px-3 py-1 rounded-xl border border-teal-500/30">
                {activeChecklist.length} Zonas Configuradas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeChecklist.map((item: any) => (
                <div key={item.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block text-sm">{item.zona}</span>
                    <span className="text-[11px] font-mono text-slate-400 mt-1 block">
                      Estado: <strong className="text-teal-400">{item.estado}</strong>
                    </span>
                  </div>
                  <select
                    value={item.frecuencia}
                    onChange={(e) => handleCambiarFrecuencia(item.id, e.target.value)}
                    className="p-2.5 bg-slate-900 border border-slate-700 text-cyan-400 rounded-xl text-xs font-mono outline-none cursor-pointer font-bold"
                  >
                    <option value="Diaria">Diaria</option>
                    <option value="Diaria (Mañana)">Diaria (Mañana)</option>
                    <option value="Dos veces al día">Dos veces al día</option>
                    <option value="Cada 2 días">Cada 2 días</option>
                    <option value="Semanal">Semanal</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUBTAB 3: ÓRDENES A TODEROS */}
        {subTab === 'ordenes' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                <Wrench className="w-4 h-4" /> 3. Despacho de Órdenes a Toderos y Mantenimiento
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Centraliza las órdenes correctivas nacidas de rondas o inspecciones y asígnalas al personal operativo.
              </p>
            </div>

            {/* FORMULARIO PARA AGREGAR NUEVA ORDEN */}
            <form onSubmit={handleEnviarOrdenTrabajo} className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#07090e] p-5 rounded-2xl border border-slate-800">
              <input
                type="text"
                placeholder="Área o Ubicación (Ej: Torre 1 - Lobby)..."
                value={nuevaArea}
                onChange={(e) => setNuevaArea(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-cyan-400"
                required
              />

              <select
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                className="p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-cyan-400"
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
                <PlusCircle className="w-4 h-4" /> Asignar Orden a Todero
              </button>

              <input
                type="text"
                placeholder="Descripción detallada de la labor a realizar..."
                value={nuevoDetalle}
                onChange={(e) => setNuevoDetalle(e.target.value)}
                className="md:col-span-3 p-3 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-cyan-400"
                required
              />
            </form>

            {/* LISTADO DE ÓRDENES ACTIVAS */}
            <div className="space-y-3">
              <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Bandeja de Órdenes Despachadas
              </h5>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {activeTareas.map((tarea: any) => (
                  <div key={tarea.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{tarea.area}</span>
                        <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded text-[10px] font-mono font-bold border border-slate-800">
                          {tarea.categoria}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{tarea.detalle}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{tarea.fechaReporte || 'Hoy'}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                        tarea.estado === 'Solucionado'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : tarea.estado === 'En proceso'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {tarea.estado}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleEstadoTarea(tarea.id)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer text-xs"
                      >
                        Avanzar Estado →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUBTAB 4: CENTRO DE ALERTAS CRÍTICAS */}
        {subTab === 'alertas' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 font-mono flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> 4. Monitor de Alertas Críticas y Botón de Pánico
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Panel de reacción inmediata ante incidentes mayores reportados en garita o zonas comunes.
                </p>
              </div>
              <span className="text-xs font-mono text-rose-400 bg-rose-500/10 px-3 py-1 rounded-xl border border-rose-500/30">
                {alertasLocales.filter(a => !a.atendida).length} Alertas Pendientes
              </span>
            </div>

            <div className="space-y-3">
              {alertasLocales.map((alerta) => (
                <div
                  key={alerta.id}
                  className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    alerta.atendida
                      ? 'bg-[#07090e] border-slate-800 text-slate-400'
                      : 'bg-rose-950/20 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                        {alerta.tipo}
                      </span>
                      <strong className="text-white text-sm">{alerta.punto}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">• {alerta.hora}</span>
                    </div>
                    <p className="text-slate-300">{alerta.detalle}</p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {alerta.atendida ? (
                      <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-[10px]">
                        Atendida por Supervisor ✓
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAtenderAlerta(alerta.id)}
                        className="bg-rose-600 hover:bg-rose-500 text-white font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/30"
                      >
                        Reaccionar y Atender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
