import React, { useState, useEffect } from 'react';
import { 
  FolderLock, Hammer, Clock, Calendar, Search, 
  Plus, CheckCircle2, XCircle, AlertTriangle, RefreshCw, X, ShieldAlert
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface PermisoRemodelacion {
  id: string;
  unit_number: string;
  resident_name: string;
  resident_phone?: string;
  contractor_in_charge: string;
  contractor_phone?: string;
  description_scope: string;
  has_structural_impact: boolean;
  start_date: string;
  estimated_end_date: string;
  status: 'en_revision' | 'aprobado' | 'en_ejecucion' | 'finalizado' | 'rechazado';
  deposit_amount: number;
  deposit_status: 'pendiente' | 'custodiado' | 'reembolsado' | 'retenido_por_danos';
  deposit_receipt_number?: string;
}

interface Props {
  tenantId?: string;
  onShowToast?: (msg: string) => void;
}

const DEMO_PERMISOS: PermisoRemodelacion[] = [
  {
    id: 'perm-1',
    unit_number: 'Torre 1 - 302',
    resident_name: 'Esteban Ochoa',
    resident_phone: '3001234567',
    contractor_in_charge: 'Sistemas & Acabados SAS',
    description_scope: 'Demolición de muros no estructurales en cocina e instalación de porcelanato.',
    has_structural_impact: false,
    start_date: '2026-03-01',
    estimated_end_date: '2026-03-20',
    status: 'aprobado',
    deposit_amount: 500000,
    deposit_status: 'custodiado',
    deposit_receipt_number: 'DEP-8842'
  },
  {
    id: 'perm-2',
    unit_number: 'Torre 2 - 501',
    resident_name: 'Carolina Gómez',
    resident_phone: '3119876543',
    contractor_in_charge: 'Pinturas & Diseños E.I.R.L.',
    description_scope: 'Pintura general de interiores y adecuación de iluminación LED.',
    has_structural_impact: false,
    start_date: '2026-02-15',
    estimated_end_date: '2026-02-28',
    status: 'finalizado',
    deposit_amount: 300000,
    deposit_status: 'reembolsado',
    deposit_receipt_number: 'DEP-7721'
  }
];

export const ModuloPermisosRemodelacion: React.FC<Props> = ({ tenantId, onShowToast }) => {
  const [permisos, setPermisos] = useState<PermisoRemodelacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nuevo permiso
  const [unidad, setUnidad] = useState('');
  const [propietario, setPropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contratista, setContratista] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [impactoEstructural, setImpactoEstructural] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => new Date().toISOString().split('T')[0]);
  const [fechaFin, setFechaFin] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [deposito, setDeposito] = useState<number>(500000);
  const [guardando, setGuardando] = useState(false);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('renovation_permits')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        if (error) console.warn('Cargando fallback local para permisos:', error.message);
        setPermisos(DEMO_PERMISOS);
      } else {
        setPermisos(data);
      }
    } catch (err: any) {
      console.error('Error cargando permisos de reforma:', err.message);
      setPermisos(DEMO_PERMISOS);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, [tenantId]);

  const handleCrearPermiso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unidad.trim() || !propietario.trim() || !contratista.trim()) return;

    try {
      setGuardando(true);
      let activeTenant = tenantId;
      if (!activeTenant) {
        const { data: t } = await supabase.from('tenants').select('id').limit(1).single();
        activeTenant = t?.id;
      }

      const nuevoPermisoObj = {
        tenant_id: activeTenant,
        unit_number: unidad.trim(),
        resident_name: propietario.trim(),
        resident_phone: telefono.trim(),
        contractor_in_charge: contratista.trim(),
        description_scope: descripcion.trim(),
        has_structural_impact: impactoEstructural,
        start_date: fechaInicio,
        estimated_end_date: fechaFin,
        deposit_amount: Number(deposito),
        status: 'aprobado' as const,
        deposit_status: 'custodiado' as const,
        deposit_receipt_number: `DEP-${Math.floor(1000 + Math.random() * 9000)}`
      };

      const { error } = await supabase.from('renovation_permits').insert([nuevoPermisoObj]);

      if (error) {
        console.warn('Supabase insert fallback local:', error.message);
        setPermisos(prev => [{ id: `perm-loc-${Date.now()}`, ...nuevoPermisoObj }, ...prev]);
      } else {
        cargarPermisos();
      }

      onShowToast?.(`Permiso de obra para ${unidad} radicado con depósito en custodia`);
      setUnidad('');
      setPropietario('');
      setContratista('');
      setDescripcion('');
      setMostrarModal(false);
    } catch (err: any) {
      alert('Error registrando permiso: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (
    id: string, 
    nuevoEstado: PermisoRemodelacion['status'], 
    nuevoDeposito?: PermisoRemodelacion['deposit_status']
  ) => {
    try {
      const updateData: any = { status: nuevoEstado };
      if (nuevoDeposito) updateData.deposit_status = nuevoDeposito;

      const { error } = await supabase
        .from('renovation_permits')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.warn('Supabase update fallback local:', error.message);
      }

      setPermisos(prev => prev.map(p => p.id === id ? { ...p, ...updateData } : p));
      onShowToast?.(`Estado de reforma e inspección actualizado`);
    } catch (err: any) {
      alert('Error actualizando estado: ' + err.message);
    }
  };

  const permisosFiltrados = permisos.filter(p => {
    const coincideTexto = p.unit_number.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.resident_name.toLowerCase().includes(busqueda.toLowerCase()) ||
                          p.contractor_in_charge.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = filtroEstado === 'todos' || p.status === filtroEstado;
    return coincideTexto && coincideEstado;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. CABECERA INSTITUCIONAL */}
      <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
              SUPERVISIÓN DE OBRAS PRIVADAS • LEY 675
            </span>
            <span className="text-xs text-slate-400 font-mono">Control de Áreas Comunes & Acústica</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-amber-400" />
            Permisos de Remodelación & Depósitos en Garantía
          </h2>
          <p className="text-xs text-slate-400">
            Control de intervenciones internas, supervisión de afectación a muros estructurales y fondos en custodia por averías.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={cargarPermisos}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refrescar datos"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Radicar Permiso de Obra</span>
          </button>
        </div>
      </div>

      {/* 2. FRANJA INFORMATIVA: REGLAMENTO DE CONVIVENCIA Y HORARIOS */}
      <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span><strong>Horario Oficial de Ruido:</strong> Lunes a Viernes 08:00 - 17:00 • Sábados 08:00 - 12:00</span>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] font-bold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Domingos y Festivos: Trabajo Ruidoso Prohibido</span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS & BÚSQUEDA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#0F172A] border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por apartamento, copropietario o contratista encargado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none text-white focus:outline-none placeholder-slate-500 w-full font-sans"
          />
        </div>

        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value)}
          className="bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
        >
          <option value="todos">Todos los Estados</option>
          <option value="aprobado">Obras Activas / Aprobadas</option>
          <option value="finalizado">Obras Concluidas & Reembolsadas</option>
          <option value="en_revision">En Revisión Técnica</option>
        </select>
      </div>

      {/* 4. LISTADO DE REFORMAS (Grid Corporativo) */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Hammer className="w-4 h-4 text-amber-400" />
              Obras Privadas en Ejecución ({permisosFiltrados.length})
            </h3>
            <p className="text-xs text-slate-400">
              Expedientes de reformas internas y estado del depósito de garantía en tesorería.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {permisos.filter(p => p.status === 'aprobado').length} Activas
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            Consultando registros de remodelaciones en base de datos...
          </div>
        ) : permisosFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            No hay remodelaciones registradas. Radica una nueva obra con el botón superior.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {permisosFiltrados.map((p) => (
              <div 
                key={p.id}
                className="bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 p-5 rounded-2xl flex flex-col justify-between space-y-3.5 transition"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                      {p.unit_number}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                      p.status === 'aprobado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      p.status === 'finalizado' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.status?.toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{p.resident_name}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Encargado: <strong className="text-slate-200">{p.contractor_in_charge}</strong>
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 line-clamp-2">
                    {p.description_scope}
                  </p>

                  {/* Estado del Depósito de Garantía */}
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Depósito en Garantía:</span>
                      <span className="font-bold text-white">${Number(p.deposit_amount).toLocaleString('es-CO')} COP</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Custodia:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        p.deposit_status === 'custodiado' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        p.deposit_status === 'reembolsado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      }`}>
                        {p.deposit_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  {/* Vigencia y fechas */}
                  <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {p.start_date}
                    </span>
                    <span>➜</span>
                    <span className="text-white font-bold">{p.estimated_end_date}</span>
                  </div>
                </div>

                {/* Acciones de Inspección y Cierre */}
                <div className="pt-2 border-t border-slate-800">
                  {p.status !== 'finalizado' ? (
                    <button
                      onClick={() => handleCambiarEstado(p.id, 'finalizado', 'reembolsado')}
                      className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Inspeccionar & Reembolsar</span>
                    </button>
                  ) : (
                    <span className="block text-center text-[11px] font-mono text-slate-500 py-1">
                      Obra Concluida • Depósito Liquidado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. MODAL RADICAR REFORMA & DEPÓSITO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-amber-400" />
                Radicar Permiso de Remodelación & Depósito
              </h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCrearPermiso} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Apartamento / Unidad</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Torre 1 - 302"
                    value={unidad}
                    onChange={(e) => setUnidad(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Nombre del Copropietario</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Esteban Ochoa"
                    value={propietario}
                    onChange={(e) => setPropietario(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Contratista / Maestro a Cargo</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre o razón social"
                    value={contratista}
                    onChange={(e) => setContratista(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Teléfono de Contacto</label>
                  <input
                    type="text"
                    placeholder="300 000 0000"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Descripción del Alcance de la Obra</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Detalle: enchape, demolición leve, tuberías, pintura general..."
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    required
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha Estimada Fin</label>
                  <input
                    type="date"
                    required
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Depósito ($ COP)</label>
                  <input
                    type="number"
                    step={50000}
                    value={deposito}
                    onChange={(e) => setDeposito(Number(e.target.value))}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={impactoEstructural}
                    onChange={(e) => setImpactoEstructural(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-cyan-500"
                  />
                  <span>¿Afecta muros estructurales o requiere concepto de ingeniería?</span>
                </label>
                {impactoEstructural && (
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Exige Plano / Firma
                  </span>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  {guardando ? 'Radicando...' : 'Aprobar & Custodiar Depósito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModuloPermisosRemodelacion;
