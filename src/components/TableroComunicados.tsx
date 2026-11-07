import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Megaphone, Pin, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';

interface Props {
  tenantId: string;
}

export const TableroComunicados: React.FC<Props> = ({ tenantId }) => {
  const [comunicados, setComunicados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [categoria, setCategoria] = useState('general');
  const [prioridad, setPrioridad] = useState('normal');
  const [fijado, setFijado] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
    } catch (err: any) {
      console.error('Error cargando circulares:', err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarComunicados();

    const canal = supabase
      .channel('announcements-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
        cargarComunicados();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [tenantId]);

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    try {
      setGuardando(true);
      const { error } = await supabase.from('announcements').insert([
        {
          tenant_id: tenantId,
          title: titulo.trim(),
          content: contenido.trim(),
          category: categoria,
          priority: prioridad,
          is_pinned: fijado,
          created_by: 'Administración (Eloina Mesa Mesa)'
        }
      ]);

      if (error) throw error;

      setTitulo('');
      setContenido('');
      setFijado(false);
      setMostrarModal(false);
      cargarComunicados();
    } catch (err: any) {
      alert('Error guardando circular: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Deseas retirar esta circular de la cartelera?')) return;
    await supabase.from('announcements').delete().eq('id', id);
    cargarComunicados();
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 text-slate-100 font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold bg-cyan-950/60 border border-cyan-800/50 px-2.5 py-1 rounded-full">
            Cartelera Virtual Ley 675
          </span>
          <h2 className="text-xl font-black text-white mt-2 flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-cyan-400" />
            Circulares y Avisos a Copropietarios
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Publicaciones oficiales para residentes de Urb. Copropiedad_PH y equipo de vigilancia.
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-cyan-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Emitir Comunicado</span>
        </button>
      </div>

      {cargando ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs">Cargando avisos...</div>
      ) : comunicados.length === 0 ? (
        <div className="py-12 text-center text-slate-500 font-mono text-xs bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
          No hay circulares activas. Crea un aviso para notificar a la comunidad.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {comunicados.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all ${
                item.is_pinned
                  ? 'bg-slate-950/90 border-cyan-500/40 shadow-lg shadow-cyan-950/20'
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {item.is_pinned && <Pin className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />}
                  <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold ${
                    item.priority === 'urgente'
                      ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {item.priority}
                  </span>
                  <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                    {item.category}
                  </span>
                </div>
                <button
                  onClick={() => handleEliminar(item.id)}
                  className="text-slate-500 hover:text-rose-400 transition"
                  title="Eliminar circular"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-slate-100 text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line mb-4 font-normal">
                {item.content}
              </p>

              <div className="flex justify-between items-center pt-3 border-t border-slate-800/80 text-[10px] text-slate-400 font-mono">
                <span>{item.created_by}</span>
                <span>{new Date(item.created_at).toLocaleDateString('es-CO')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Aviso */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-white font-mono mb-4 pb-2 border-b border-slate-800">
              Emitir Circular a Copropietarios
            </h3>
            <form onSubmit={handleCrear} className="space-y-4 text-xs">
              <div>
                <label className="block font-mono text-slate-400 uppercase mb-1">Título</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimiento hidroneumático y lavado de tanques"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Categoría</label>
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="general">Aviso General</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="servicios_epm">Cortes EPM</option>
                    <option value="seguridad">Seguridad / Vigilancia</option>
                  </select>
                </div>
                <div>
                  <label className="block font-mono text-slate-400 uppercase mb-1">Prioridad</label>
                  <select
                    value={prioridad}
                    onChange={(e) => setPrioridad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="urgente">Urgente (Destacado)</option>
                    <option value="baja">Informativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-mono text-slate-400 uppercase mb-1">Detalle del Comunicado</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Escribe el cuerpo del mensaje para los residentes..."
                  value={contenido}
                  onChange={(e) => setContenido(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fijar"
                  checked={fijado}
                  onChange={(e) => setFijado(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-cyan-500"
                />
                <label htmlFor="fijar" className="text-slate-300">Fijar al inicio de la cartelera</label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl"
                >
                  {guardando ? 'Guardando...' : 'Publicar Ahora'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
