import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface Props {
  tenantId: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'mantenimiento' | 'servicios_epm' | 'asamblea' | 'seguridad' | 'general';
  priority: 'baja' | 'normal' | 'urgente';
  target_audience: string;
  is_pinned: boolean;
  created_by: string;
  created_at: string;
}

export const TableroComunicados: React.FC<Props> = ({ tenantId }) => {
  const [comunicados, setComunicados] = useState<Announcement[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  
  // Estados para nuevo comunicado
  const [mostrarModal, setMostrarModal] = useState<boolean>(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState<Announcement['category']>('general');
  const [prioridad, setPrioridad] = useState<Announcement['priority']>('normal');
  const [audiencia, setAudiencia] = useState('todos');
  const [fijado, setFijado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // 1. Cargar comunicados desde Supabase
  const cargarComunicados = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComunicados(data || []);
    } catch (err) {
      console.error('Error cargando comunicados:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComunicados();

    // Suscripción en tiempo real para que residentes y portería vean los avisos al instante
    const channel = supabase
      .channel('announcements-realtime')
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
  }, [tenantId]);

  // 2. Publicar nuevo comunicado
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    try {
      setGuardando(true);
      const { error } = await supabase
        .from('announcements')
        .insert([
          {
            tenant_id: tenantId,
            title: titulo.trim(),
            content: contenido.trim(),
            category: categoria,
            priority: prioridad,
            target_audience: audiencia,
            is_pinned: fijado,
            created_by: 'Administración (Eloina Mesa)'
          }
        ]);

      if (error) throw error;

      // Limpiar formulario y cerrar modal
      setTitulo('');
      setContenido('');
      setCategoria('general');
      setPrioridad('normal');
      setAudiencia('todos');
      setFijado(false);
      setMostrarModal(false);
      cargarComunicados();
    } catch (err: any) {
      alert('Error al publicar comunicado: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // 3. Eliminar comunicado
  const handleEliminar = async (id: string) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      cargarComunicados();
    } catch (err: any) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Helpers visuales para etiquetas
  const getCategoryBadge = (cat: Announcement['category']) => {
    const estilos = {
      mantenimiento: { label: '🔧 Mantenimiento', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
      servicios_epm: { label: '💧 Servicios EPM', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
      asamblea: { label: '⚖️ Asamblea / Consejo', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
      seguridad: { label: '🛡️ Seguridad', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
      general: { label: '📢 Circular General', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' }
    };
    return estilos[cat] || estilos.general;
  };

  const getPriorityBadge = (prio: Announcement['priority']) => {
    if (prio === 'urgente') {
      return <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 rounded-full animate-pulse">🔴 Urgente</span>;
    }
    if (prio === 'baja') {
      return <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-slate-800 text-slate-400 rounded-full">Informativo</span>;
    }
    return null;
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 text-slate-100 shadow-xl">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <h2 className="text-lg font-bold tracking-wide text-white uppercase">
              Cartelera Virtual y Circulares Oficiales
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Comunicación directa con residentes, propietarios y portería • Ley 675 de 2001
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-all shadow-lg shadow-cyan-500/20 cursor-pointer"
        >
          <span>+ Emitir Nuevo Comunicado</span>
        </button>
      </div>

      {/* Lista de Comunicados */}
      <div className="mt-6 space-y-4">
        {cargando ? (
          <div className="text-center py-12 text-slate-400 text-sm animate-pulse">
            Sincronizando cartelera oficial de Urb. Tricentenario...
          </div>
        ) : comunicados.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
            No hay comunicados publicados actualmente.
          </div>
        ) : (
          comunicados.map((item) => {
            const badge = getCategoryBadge(item.category);
            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border transition-all ${
                  item.is_pinned
                    ? 'bg-slate-800/70 border-cyan-500/40 shadow-md shadow-cyan-950/30'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {item.is_pinned && (
                      <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-full">
                        📌 Fijado
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 text-xs font-medium border rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                    {getPriorityBadge(item.priority)}
                    <span className="text-xs text-slate-400 font-mono">
                      • Para: <strong className="text-slate-300 uppercase">{item.target_audience}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(item.created_at).toLocaleDateString('es-CO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    <button
                      onClick={() => handleEliminar(item.id)}
                      className="text-slate-500 hover:text-red-400 text-xs transition-colors cursor-pointer"
                      title="Eliminar comunicado"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white mb-2">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Firmado por: <strong className="text-cyan-400">{item.created_by}</strong></span>
                  <span className="font-mono text-[11px] text-emerald-400">✓ Notificado en Portería y App</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Crear Comunicado */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white uppercase tracking-wider">
                Redactar Circular Oficial
              </h3>
              <button
                onClick={() => setMostrarModal(false)}
                className="text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Título del Comunicado
                </label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Corte programado de agua EPM este jueves..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Categoría
                  </label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value as Announcement['category'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="general">📢 General</option>
                    <option value="mantenimiento">🔧 Mantenimiento</option>
                    <option value="servicios_epm">💧 Servicios EPM</option>
                    <option value="seguridad">🛡️ Seguridad</option>
                    <option value="asamblea">⚖️ Asamblea</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Prioridad
                  </label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value as Announcement['priority'])}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="baja">Informativo</option>
                    <option value="normal">Normal</option>
                    <option value="urgente">🔴 Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={audiencia}
                    onChange={(e) => setAudiencia(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="todos">Toda la Copropiedad</option>
                    <option value="Torre 1">Solo Torre 1</option>
                    <option value="Torre 2">Solo Torre 2</option>
                    <option value="Torre 3">Solo Torre 3</option>
                    <option value="Torre 4">Solo Torre 4</option>
                    <option value="consejo">Solo Consejo Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Contenido del Aviso
                </label>
                <textarea
                  rows={5}
                  required
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  placeholder="Escriba aquí el detalle de la circular, horarios o recomendaciones para los residentes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fijar"
                  checked={fijado}
                  onChange={(e) => setFijado(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500"
                />
                <label htmlFor="fijar" className="text-xs text-slate-300 cursor-pointer">
                  📌 Fijar este comunicado en la parte superior de la cartelera
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase rounded-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {guardando ? 'Publicando...' : 'Publicar Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableroComunicados;
