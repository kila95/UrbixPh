import React, { useState } from 'react';
import { 
  ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle2, 
  Search, HardHat, FileCheck, Phone, UserCheck, Plus, X 
} from 'lucide-react';

export interface ContratistaSGSST {
  id: string;
  empresa: string;
  nit: string;
  tecnico: string;
  cedula: string;
  telefono: string;
  unidadDestino: string;
  arl: string;
  arlVencimiento: string;
  arlVigente: boolean;
  polizaRCE: boolean;
  certificadoAlturas: boolean;
  estadoGarita: 'Adentro en Labor' | 'Autorizado' | 'Pendiente Validación' | 'Rechazado';
  horaIngreso?: string;
}

const DEFAULT_SGSST_CONTRATISTAS: ContratistaSGSST[] = [
  {
    id: 'sgsst-01',
    empresa: 'Claro Colombia S.A.S. (Redes)',
    nit: '800.153.993-9',
    tecnico: 'Andrés Felipe Morales',
    cedula: '1.037.492.102',
    telefono: '300 456 7890',
    unidadDestino: 'Torre 2 - 301',
    arl: 'ARL SURA (Riesgo IV)',
    arlVencimiento: '2026-11-20',
    arlVigente: true,
    polizaRCE: true,
    certificadoAlturas: true,
    estadoGarita: 'Adentro en Labor',
    horaIngreso: '09:15 AM'
  },
  {
    id: 'sgsst-02',
    empresa: 'Elevadores Otis S.A.',
    nit: '860.002.500-1',
    tecnico: 'Jhon Jairo Arango',
    cedula: '71.594.203',
    telefono: '311 890 1234',
    unidadDestino: 'Ascensores Torre 1 y 2',
    arl: 'ARL Positiva (Riesgo V)',
    arlVencimiento: '2026-11-15',
    arlVigente: true,
    polizaRCE: true,
    certificadoAlturas: true,
    estadoGarita: 'Autorizado',
    horaIngreso: '10:02 AM'
  },
  {
    id: 'sgsst-03',
    empresa: 'Servicios de Pintura & Fachadas',
    nit: '901.443.210-4',
    tecnico: 'Hernán Darío Gómez',
    cedula: '70.111.222',
    telefono: '314 222 3344',
    unidadDestino: 'Fachada Exterior Torre 1',
    arl: 'ARL SURA (Riesgo V)',
    arlVencimiento: '2026-10-01',
    arlVigente: false, // Vencida
    polizaRCE: false,
    certificadoAlturas: true,
    estadoGarita: 'Pendiente Validación',
    horaIngreso: '-'
  }
];

export const ModuloControlSGSST: React.FC<{
  tenantId?: string;
  onShowToast?: (msg: string) => void;
}> = ({ tenantId, onShowToast }) => {
  const [contratistas, setContratistas] = useState<ContratistaSGSST[]>(DEFAULT_SGSST_CONTRATISTAS);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [mostrarModal, setMostrarModal] = useState(false);

  const [nuevo, setNuevo] = useState({
    empresa: '',
    nit: '',
    tecnico: '',
    cedula: '',
    telefono: '',
    unidadDestino: '',
    arl: 'ARL SURA (Riesgo IV)',
    arlVencimiento: '',
    polizaRCE: true,
    certificadoAlturas: false
  });

  const handleCrear = (e: React.FormEvent) => {
    e.preventDefault();
    const esVigente = new Date(nuevo.arlVencimiento) >= new Date();
    const creado: ContratistaSGSST = {
      id: `sgsst-${Date.now()}`,
      ...nuevo,
      arlVigente: esVigente,
      estadoGarita: esVigente ? 'Autorizado' : 'Pendiente Validación'
    };
    setContratistas([creado, ...contratistas]);
    setMostrarModal(false);
    onShowToast?.(`Contratista ${creado.empresa} registrado en sistema SG-SST`);
  };

  const toggleEstadoGarita = (id: string) => {
    setContratistas(prev => prev.map(c => {
      if (c.id === id) {
        const nuevoEstado = c.estadoGarita === 'Autorizado' ? 'Pendiente Validación' : 'Autorizado';
        onShowToast?.(`Estado de Garita para ${c.tecnico} cambiado a: ${nuevoEstado}`);
        return { ...c, estadoGarita: nuevoEstado };
      }
      return c;
    }));
  };

  const filtrados = contratistas.filter(c => {
    const matchText = c.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
                      c.tecnico.toLowerCase().includes(busqueda.toLowerCase()) ||
                      c.cedula.includes(busqueda) ||
                      c.unidadDestino.toLowerCase().includes(busqueda.toLowerCase());
    
    if (filtroEstado === 'todos') return matchText;
    if (filtroEstado === 'vigente') return matchText && c.arlVigente;
    if (filtroEstado === 'vencido') return matchText && !c.arlVigente;
    if (filtroEstado === 'adentro') return matchText && c.estadoGarita === 'Adentro en Labor';
    return matchText;
  });

  return (
    <div className="space-y-4 font-sans text-slate-100">
      
      {/* Banner de Garantía SG-SST / Decreto 1072 */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
              Decreto 1072 / SG-SST • Garita & Portería
            </span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" /> Control de Planillas ARL y RCE
          </h2>
          <p className="text-xs text-slate-400">
            Verificación técnica pre-ingreso a áreas comunes y unidades privadas para evitar responsabilidad solidaria.
          </p>
        </div>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Registrar Planilla ARL
        </button>
      </div>

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar empresa, técnico, C.C. o unidad..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 rounded-lg text-xs text-white outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
          <button
            onClick={() => setFiltroEstado('todos')}
            className={`px-3 py-1 rounded-lg border cursor-pointer ${
              filtroEstado === 'todos' ? 'bg-slate-800 text-white border-slate-700' : 'text-slate-400 border-transparent'
            }`}
          >
            Todos ({contratistas.length})
          </button>
          <button
            onClick={() => setFiltroEstado('vigente')}
            className={`px-3 py-1 rounded-lg border cursor-pointer ${
              filtroEstado === 'vigente' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'text-slate-400 border-transparent'
            }`}
          >
            ARL Vigente
          </button>
          <button
            onClick={() => setFiltroEstado('vencido')}
            className={`px-3 py-1 rounded-lg border cursor-pointer ${
              filtroEstado === 'vencido' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'text-slate-400 border-transparent'
            }`}
          >
            ARL Vencida / Alerta
          </button>
        </div>
      </div>

      {/* Tarjetas de Contratistas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtrados.map((c) => (
          <div 
            key={c.id}
            className={`bg-[#0b0f17] border p-5 rounded-2xl flex flex-col justify-between space-y-4 transition ${
              c.arlVigente ? 'border-slate-800 hover:border-slate-700' : 'border-rose-500/40 bg-rose-950/10'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                  {c.unidadDestino}
                </span>

                <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                  c.arlVigente 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {c.arlVigente ? '✓ Planilla Ok' : '⚠️ Planilla Vencida'}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-white">{c.empresa}</h3>
                <p className="text-[11px] text-slate-400">NIT: {c.nit}</p>
              </div>

              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <p className="flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <strong>Técnico:</strong> {c.tecnico}
                </p>
                <p className="text-[11px] text-slate-400 pl-5">C.C. {c.cedula} • Tel: {c.telefono}</p>
                <p className="flex items-center gap-1.5 pt-1 border-t border-slate-800/60">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <strong>ARL:</strong> {c.arl}
                </p>
                <p className="text-[11px] text-slate-400 pl-5">
                  Vigencia hasta: <span className={c.arlVigente ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>{c.arlVencimiento}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[10px]">
                {c.polizaRCE && (
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-cyan-300">
                    🛡️ Póliza RCE
                  </span>
                )}
                {c.certificadoAlturas && (
                  <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-amber-300">
                    🧗 Trabajo en Alturas
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Estado Garita: <strong className="text-white">{c.estadoGarita}</strong>
              </span>

              <button
                onClick={() => toggleEstadoGarita(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  c.estadoGarita === 'Autorizado' || c.estadoGarita === 'Adentro en Labor'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                {c.estadoGarita === 'Autorizado' || c.estadoGarita === 'Adentro en Labor' ? 'Revocar Ingreso' : 'Autorizar Garita'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Registro SG-SST */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base">Registrar Planilla ARL / SG-SST</h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrear} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-bold">Empresa / Razon Social</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mantenimientos Hidráulicos S.A.S."
                  value={nuevo.empresa}
                  onChange={e => setNuevo({ ...nuevo, empresa: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">NIT</label>
                  <input
                    type="text"
                    required
                    placeholder="900.123.456-7"
                    value={nuevo.nit}
                    onChange={e => setNuevo({ ...nuevo, nit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Unidad Destino</label>
                  <input
                    type="text"
                    required
                    placeholder="Torre 1 - 202"
                    value={nuevo.unidadDestino}
                    onChange={e => setNuevo({ ...nuevo, unidadDestino: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Nombre del Técnico</label>
                  <input
                    type="text"
                    required
                    placeholder="Carlos Ruiz"
                    value={nuevo.tecnico}
                    onChange={e => setNuevo({ ...nuevo, tecnico: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Cédula</label>
                  <input
                    type="text"
                    required
                    placeholder="1.037.123.456"
                    value={nuevo.cedula}
                    onChange={e => setNuevo({ ...nuevo, cedula: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">ARL & Riesgo</label>
                  <input
                    type="text"
                    required
                    placeholder="ARL SURA (Riesgo IV)"
                    value={nuevo.arl}
                    onChange={e => setNuevo({ ...nuevo, arl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-bold">Fecha Vencimiento ARL</label>
                  <input
                    type="date"
                    required
                    value={nuevo.arlVencimiento}
                    onChange={e => setNuevo({ ...nuevo, arlVencimiento: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 p-2 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevo.polizaRCE}
                    onChange={e => setNuevo({ ...nuevo, polizaRCE: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                  />
                  <span>Póliza RCE Vigente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevo.certificadoAlturas}
                    onChange={e => setNuevo({ ...nuevo, certificadoAlturas: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-cyan-500"
                  />
                  <span>Certificado Trabajo Alturas</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                >
                  Guardar Planilla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
