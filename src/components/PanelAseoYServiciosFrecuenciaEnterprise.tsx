import React, { useState } from 'react';
import { Sparkles, CheckSquare, Wrench, PlusCircle, Clock, AlertTriangle, Camera, PackageOpen, LogIn, LogOut } from 'lucide-react';

export default function PanelAseoYServiciosFrecuenciaEnterprise({
  checklistConfig,
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
  // Estado del turno (Entrada / Salida)
  const [turnoIniciado, setTurnoIniciado] = useState(false);
  const [horaEntrada, setHoraEntrada] = useState<string | null>(null);
  const [horaSalida, setHoraSalida] = useState<string | null>(null);

  // Checklist con frecuencias configurables por la administración / supervisión
  const [checklistAseoLocal, setChecklistAseoLocal] = useState([
    { id: 'chk_1', zona: 'Lobby Principal y Recepción', frecuencia: 'Diaria (Mañana)', estado: 'Completado' },
    { id: 'chk_2', zona: 'Cabinas de Ascensores (Torres 1 y 2)', frecuencia: 'Dos veces al día', estado: 'Pendiente' },
    { id: 'chk_3', zona: 'Pasillos y Escaleras de Emergencia', frecuencia: 'Cada 2 días', estado: 'Pendiente' },
    { id: 'chk_4', zona: 'Plataforma Social y Baños Húmedos', frecuencia: 'Diaria', estado: 'Completado' }
  ]);

  const checklistAseo = checklistConfig && checklistConfig.length > 0 ? checklistConfig : checklistAseoLocal;
  const setChecklistAseo = setChecklistConfig || setChecklistAseoLocal;

  const [insumos, setInsumos] = useState([
    { id: 'ins_1', item: 'Galón de Cloro / Desinfectante', cantidad: '2 Unidades', estado: 'Solicitado a Administración' },
    { id: 'ins_2', item: 'Bolsas de Basura Heavy Duty (Cap. 150L)', cantidad: '1 Paquete', estado: 'Aprobado y Entregado' }
  ]);
  const [nuevoInsumo, setNuevoInsumo] = useState('');

  const [nuevaNovedad, setNuevaNovedad] = useState('');
  const [ubicacionNovedad, setUbicacionNovedad] = useState('');
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);

  const handleIniciarTurno = () => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHoraEntrada(horaActual);
    setTurnoIniciado(true);
    onShowToast?.(`🟢 Turno iniciado correctamente a las ${horaActual}.`);
  };

  const handleFinalizarTurno = () => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setHoraSalida(horaActual);
    setTurnoIniciado(false);
    onShowToast?.(`🔴 Turno finalizado a las ${horaActual}.`);
  };

  const handleToggleChecklist = (id: string) => {
    setChecklistAseo((prev: any[]) =>
      prev.map((item: any) => {
        if (item.id === id) {
          const nuevoEstado = item.estado === 'Completado' ? 'Pendiente' : 'Completado';
          onShowToast?.(`Zona "${item.zona}" marcada como: ${nuevoEstado}`);
          return { ...item, estado: nuevoEstado };
        }
        return item;
      })
    );
  };

  const handleCambiarEstadoTarea = (id: string, nuevoEstado: string) => {
    if (setTareasShared) {
      setTareasShared((prev: any[]) =>
        prev.map((t: any) => t.id === id ? { ...t, estado: nuevoEstado } : t)
      );
    }
    onShowToast?.(`✅ Orden actualizada a "${nuevoEstado}". Sincronizado con Supervisión.`);
  };

  const handleSolicitarInsumo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoInsumo.trim()) return;

    const req = {
      id: `ins_${Date.now()}`,
      item: nuevoInsumo.trim(),
      cantidad: '1 Unidades / Paquete',
      estado: 'Solicitado a Administración'
    };

    setInsumos([req, ...insumos]);
    setNuevoInsumo('');
    onShowToast?.('📦 Solicitud de insumo enviada a la administración.');
  };

  const handleReportarNovedad = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ubicacionNovedad.trim() || !nuevaNovedad.trim()) {
      onShowToast?.('Por favor ingresa la ubicación y el detalle de la novedad.');
      return;
    }

    if (setTareasShared) {
      const nuevaOrden = {
        id: `rep_${Date.now()}`,
        area: ubicacionNovedad.trim(),
        categoria: 'Hallazgo Aseo / Todero',
        detalle: nuevaNovedad.trim(),
        estado: 'Pendiente',
        fechaReporte: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fotoEvidencia: fotoEvidencia || undefined
      };
      setTareasShared((prev: any[]) => [nuevaOrden, ...(prev || [])]);
    }

    setNuevaNovedad('');
    setUbicacionNovedad('');
    setFotoEvidencia(null);
    onShowToast?.('🚨 Novedad con evidencia fotográfica enviada a la Supervisora.');
  };

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-8 font-sans">
      
      {/* Cabecera y Fichaje */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/25 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
              Consola Operativa • Frecuencias Configuradas por Administración
            </span>
            <h2 className="text-lg font-black text-white mt-1">Panel de Control de Aseo, Toderos y Mantenimiento</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900 p-2.5 rounded-2xl border border-slate-800">
          {!turnoIniciado ? (
            <button
              type="button"
              onClick={handleIniciarTurno}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
            >
              <LogIn className="w-4 h-4" /> Iniciar Turno (Fichar Entrada)
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <Clock className="w-3.5 h-3.5 animate-spin" /> En Turno ({horaEntrada})
              </span>
              <button
                type="button"
                onClick={handleFinalizarTurno}
                className="bg-rose-500 hover:bg-rose-400 text-white font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
              >
                <LogOut className="w-4 h-4" /> Finalizar Turno
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CHECKLIST DIARIO CON PARÁMETROS CONFIGURADOS */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <CheckSquare className="w-4 h-4 text-teal-400" /> Checklist Diario de Zonas Comunes (Parámetros de Frecuencia)
          </h3>
          <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg border border-teal-500/20">
            Regulado por Administración
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {checklistAseo.map((item) => (
            <div 
              key={item.id} 
              onClick={() => handleToggleChecklist(item.id)}
              className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                item.estado === 'Completado' 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <span className="font-bold text-xs block text-white">{item.zona}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 inline-block">
                  ⚡ Frecuencia: {item.frecuencia}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-[10px] text-slate-400 font-mono">Estado:</span>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                  item.estado === 'Completado' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  {item.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ÓRDENES DE TRABAJO ASIGNADAS */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <Wrench className="w-4 h-4 text-cyan-400" /> Órdenes de Trabajo Asignadas por Supervisión
        </h3>

        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
          {(tareasShared || []).length > 0 ? (
            tareasShared.map((t: any) => (
              <div key={t.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{t.area || t.titulo}</span>
                    <span className="bg-slate-900 text-cyan-400 px-2.5 py-0.5 rounded text-[11px] font-mono">{t.categoria || 'Mantenimiento'}</span>
                  </div>
                  <p className="text-slate-300">{t.detalle}</p>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={t.estado}
                    onChange={(e) => handleCambiarEstadoTarea(t.id, e.target.value)}
                    className="p-2 bg-slate-900 border border-slate-700 text-white rounded-xl text-xs outline-none font-bold cursor-pointer"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="Solucionado">Solucionado (Completado)</option>
                  </select>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
              No hay órdenes de trabajo asignadas.
            </p>
          )}
        </div>
      </div>

      {/* SOLICITUD DE INSUMOS Y DOTACIÓN */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <PackageOpen className="w-4 h-4 text-purple-400" /> Solicitud de Químicos, Insumos y Dotación
        </h3>

        <form onSubmit={handleSolicitarInsumo} className="flex gap-3">
          <input
            type="text"
            placeholder="Nombre del insumo requerido (Ej: Desengrasante industrial, escobas)..."
            value={nuevoInsumo}
            onChange={(e) => setNuevoInsumo(e.target.value)}
            className="flex-1 p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-purple-400"
            required
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-500 text-white font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer shrink-0 shadow-lg"
          >
            Solicitar a Administración
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {insumos.map((ins) => (
            <div key={ins.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{ins.item}</span>
                <span className="text-[10px] font-mono text-slate-400">Cant: {ins.cantidad}</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border ${
                ins.estado.includes('Aprobado') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {ins.estado}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* REPORTE DE DAÑOS CON FOTO HACIA SUPERVISIÓN */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4 text-amber-400" /> Reportar Daño o Hallazgo con Evidencia Fotográfica
        </h3>

        <form onSubmit={handleReportarNovedad} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Ubicación (Ej: Sótano 2, Muro Torre 1)..."
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

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setFotoEvidencia('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80');
                onShowToast?.('📸 Foto de evidencia adjuntada correctamente.');
              }}
              className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border shrink-0 ${
                fotoEvidencia ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" /> {fotoEvidencia ? 'Foto OK ✓' : 'Adjuntar Foto'}
            </button>

            <button
              type="submit"
              className="flex-1 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Enviar Reporte
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
