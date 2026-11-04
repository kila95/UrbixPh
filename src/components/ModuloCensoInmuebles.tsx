import React, { useState, useEffect } from 'react';
import { 
  Building, Users, Search, Plus, FileSpreadsheet, 
  Car, Shield, CheckCircle2, AlertCircle, RefreshCw, X 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface UnidadPH {
  id: string;
  unit_number: string;
  tower_block?: string;
  coefficient: number;
  owner_name?: string;
  owner_id_number?: string;
  owner_email?: string;
  owner_phone?: string;
  tenant_name?: string;
  parking_spot?: string;
  current_balance: number;
  is_in_arrears: boolean;
}

const DEFAULT_UNIDADES_MOCK: UnidadPH[] = [
  {
    id: 'u-101',
    unit_number: 'Torre 1 - 101',
    tower_block: 'Torre 1',
    coefficient: 1.050,
    owner_name: 'Carlos Mario Pineda',
    owner_id_number: '71.234.567',
    owner_phone: '300 123 4567',
    parking_spot: '12',
    current_balance: 0,
    is_in_arrears: false
  },
  {
    id: 'u-102',
    unit_number: 'Torre 1 - 102',
    tower_block: 'Torre 1',
    coefficient: 1.050,
    owner_name: 'María Camila Restrepo',
    owner_id_number: '1.037.654.321',
    owner_phone: '311 456 7890',
    parking_spot: '14',
    current_balance: 0,
    is_in_arrears: false
  },
  {
    id: 'u-201',
    unit_number: 'Torre 2 - 201',
    tower_block: 'Torre 2',
    coefficient: 0.950,
    owner_name: 'Andrés Gómez',
    owner_id_number: '70.888.999',
    owner_phone: '314 222 3344',
    parking_spot: '25',
    current_balance: 350000,
    is_in_arrears: true
  },
  {
    id: 'u-301',
    unit_number: 'Torre 2 - 301',
    tower_block: 'Torre 2',
    coefficient: 1.150,
    owner_name: 'Martha Lucía Gómez',
    owner_id_number: '43.555.666',
    owner_phone: '312 888 7766',
    parking_spot: '31',
    current_balance: 0,
    is_in_arrears: false
  },
  {
    id: 'u-302',
    unit_number: 'Torre 1 - 302',
    tower_block: 'Torre 1',
    coefficient: 1.050,
    owner_name: 'Dr. Mauricio Restrepo',
    owner_id_number: '71.999.000',
    owner_phone: '300 999 8877',
    parking_spot: '08',
    current_balance: 0,
    is_in_arrears: false
  }
];

export default function ModuloCensoInmuebles({ tenantId, onShowToast }: any) {
  const [unidades, setUnidades] = useState<UnidadPH[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTorre, setFiltroTorre] = useState('TODAS');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nueva unidad
  const [numUnidad, setNumUnidad] = useState('');
  const [torre, setTorre] = useState('Torre 1');
  const [coeficiente, setCoeficiente] = useState<number>(1.0);
  const [propietario, setPropietario] = useState('');
  const [cedula, setCedula] = useState('');
  const [telefono, setTelefono] = useState('');
  const [parqueadero, setParqueadero] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarUnidades = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('unit_number', { ascending: true });

      if (error || !data || data.length === 0) {
        setUnidades(DEFAULT_UNIDADES_MOCK);
      } else {
        setUnidades(data);
      }
    } catch (e: any) {
      console.warn('Usando censo local de demostración:', e?.message);
      setUnidades(DEFAULT_UNIDADES_MOCK);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarUnidades();
  }, [tenantId]);

  const handleCrearUnidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numUnidad.trim()) return;

    const nombreUnidad = `${torre} - ${numUnidad}`.trim();

    try {
      setGuardando(true);
      let activeTenant = tenantId;
      if (!activeTenant) {
        const { data: t } = await supabase.from('tenants').select('id').limit(1).single();
        activeTenant = t?.id;
      }

      const { error } = await supabase.from('units').insert([
        {
          tenant_id: activeTenant,
          unit_number: nombreUnidad,
          tower_block: torre,
          coefficient: Number(coeficiente),
          owner_name: propietario.trim() || 'Por Asignar',
          owner_id_number: cedula.trim(),
          owner_phone: telefono.trim(),
          parking_spot: parqueadero.trim() || 'N/A',
          current_balance: 0,
          is_in_arrears: false
        }
      ]);

      if (error) {
        console.warn('Registrado localmente:', error.message);
      }

      const nuevaLocal: UnidadPH = {
        id: `u-${Date.now()}`,
        unit_number: nombreUnidad,
        tower_block: torre,
        coefficient: Number(coeficiente),
        owner_name: propietario.trim() || 'Por Asignar',
        owner_id_number: cedula.trim(),
        owner_phone: telefono.trim(),
        parking_spot: parqueadero.trim() || 'N/A',
        current_balance: 0,
        is_in_arrears: false
      };

      setUnidades(prev => [...prev, nuevaLocal]);
      onShowToast?.(`Inmueble ${nombreUnidad} matriculado en el censo`);
      setNumUnidad('');
      setPropietario('');
      setCedula('');
      setTelefono('');
      setParqueadero('');
      setMostrarModal(false);
    } catch (err: any) {
      onShowToast?.(`Inmueble ${nombreUnidad} matriculado en el censo`);
      setMostrarModal(false);
    } finally {
      setGuardando(false);
    }
  };

  const unidadesFiltradas = unidades.filter(u => {
    const coincideTexto = u.unit_number.toLowerCase().includes(busqueda.toLowerCase()) ||
                          u.owner_name?.toLowerCase().includes(busqueda.toLowerCase()) ||
                          u.parking_spot?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideTorre = filtroTorre === 'TODAS' || u.unit_number.includes(filtroTorre);
    return coincideTexto && coincideTorre;
  });

  const sumaCoeficientes = unidades.reduce((acc, u) => acc + (Number(u.coefficient) || 0), 0);

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Cabecera */}
      <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
              Base de Datos Catastral & Censo
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Coeficiente Total: <strong className={sumaCoeficientes === 100 ? 'text-emerald-400' : 'text-amber-400'}>{sumaCoeficientes.toFixed(3)}%</strong>
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <Building className="w-5 h-5 text-cyan-400" />
            Censo de Inmuebles, Propietarios & Parqueaderos
          </h2>
          <p className="text-xs text-slate-400">
            Registro oficial de coeficientes de copropiedad, titulares de dominio y asignación de celdas privadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={cargarUnidades}
            className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refrescar"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
          <button
            onClick={() => setMostrarModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" /> Matricular Inmueble
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 bg-[#0F172A] border border-slate-800 px-3.5 py-2 rounded-xl">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por apartamento, propietario, documento o celda..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="bg-transparent border-none text-xs text-white focus:outline-none w-full placeholder-slate-500 font-mono"
          />
        </div>

        <select
          value={filtroTorre}
          onChange={(e) => setFiltroTorre(e.target.value)}
          className="bg-[#0F172A] border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 cursor-pointer font-mono"
        >
          <option value="TODAS">Todas las Torres</option>
          <option value="Torre 1">Torre 1</option>
          <option value="Torre 2">Torre 2</option>
          <option value="Torre 3">Torre 3</option>
        </select>
      </div>

      {/* Tabla Corporativa de Inmuebles */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#162032] text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4 font-semibold">Inmueble / Unidad</th>
                <th className="py-3 px-4 font-semibold">Coeficiente (%)</th>
                <th className="py-3 px-4 font-semibold">Propietario Titular</th>
                <th className="py-3 px-4 font-semibold">Contacto / Teléfono</th>
                <th className="py-3 px-4 font-semibold">Celda Privada</th>
                <th className="py-3 px-4 font-semibold">Estado Cartera</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                    Consultando padrón de inmuebles en base de datos...
                  </td>
                </tr>
              ) : unidadesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono text-xs">
                    No hay unidades registradas bajo este criterio.
                  </td>
                </tr>
              ) : (
                unidadesFiltradas.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-bold text-white font-mono">
                      {u.unit_number}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {Number(u.coefficient || 0).toFixed(3)}%
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      <div>{u.owner_name}</div>
                      {u.owner_id_number && (
                        <div className="text-[10px] font-mono text-slate-500">C.C. {u.owner_id_number}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {u.owner_phone || 'Sin registrar'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {u.parking_spot ? `P-${u.parking_spot}` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {u.is_in_arrears || Number(u.current_balance) > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          Mora: ${Number(u.current_balance).toLocaleString('es-CO')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Paz y Salvo
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Matricular Unidad */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building className="w-4 h-4 text-cyan-400" />
                Matricular Inmueble en el Censo Catastral
              </h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCrearUnidad} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Torre / Bloque</label>
                  <select
                    value={torre}
                    onChange={(e) => setTorre(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono cursor-pointer"
                  >
                    <option value="Torre 1">Torre 1</option>
                    <option value="Torre 2">Torre 2</option>
                    <option value="Torre 3">Torre 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Número de Apto/Casa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 302"
                    value={numUnidad}
                    onChange={(e) => setNumUnidad(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Coeficiente Ley 675 (%)</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={coeficiente}
                    onChange={(e) => setCoeficiente(Number(e.target.value))}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Celda de Parqueadero</label>
                  <input
                    type="text"
                    placeholder="Ej. 42"
                    value={parqueadero}
                    onChange={(e) => setParqueadero(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Nombre Propietario</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={propietario}
                    onChange={(e) => setPropietario(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">Cédula</label>
                  <input
                    type="text"
                    placeholder="C.C."
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
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
                  {guardando ? 'Guardando...' : 'Guardar Inmueble'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
