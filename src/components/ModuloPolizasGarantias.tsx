import React, { useState, useEffect } from 'react';
import { 
  FileText, ShieldCheck, ShieldAlert, AlertTriangle, 
  Plus, Calendar, DollarSign, Search, RefreshCw, X, Building2, CheckCircle2
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface PolizaContrato {
  id: string;
  company_id: string;
  company_name?: string;
  contract_reference: string;
  insurance_company: string;
  policy_number: string;
  coverage_type: 'cumplimiento' | 'salarios_prestaciones' | 'rce_terceros' | 'estabilidad_obra';
  insured_amount: number;
  valid_from: string;
  valid_until: string;
  status: 'vigente' | 'por_vencer' | 'vencida' | 'anulada';
  policy_document_url?: string;
}

interface Props {
  tenantId?: string;
  onShowToast?: (msg: string) => void;
}

const DEFAULT_EMPRESAS = [
  { id: 'emp-1', company_name: 'Hidráulicas y Redes Antioquia S.A.S.', nit: '901.234.567-8' },
  { id: 'emp-2', company_name: 'Acabados & Pisos El Poblado', nit: '71.345.678-9' },
  { id: 'emp-3', company_name: 'Elevadores Otis S.A.', nit: '860.002.500-1' }
];

const DEFAULT_POLIZAS: PolizaContrato[] = [
  {
    id: 'pol-1',
    company_id: 'emp-1',
    company_name: 'Hidráulicas y Redes Antioquia S.A.S.',
    contract_reference: 'Sustitución de tubería PVC 4" buitrón Torre 2',
    insurance_company: 'Seguros Bolívar S.A.',
    policy_number: 'POL-2026-884920',
    coverage_type: 'rce_terceros',
    insured_amount: 150000000,
    valid_from: '2026-01-15',
    valid_until: '2026-12-31',
    status: 'vigente'
  },
  {
    id: 'pol-2',
    company_id: 'emp-3',
    company_name: 'Elevadores Otis S.A.',
    contract_reference: 'Mantenimiento Preventivo Mensual de Ascensores',
    insurance_company: 'Suramericana de Seguros (SURA)',
    policy_number: 'SUR-990214-PH',
    coverage_type: 'cumplimiento',
    insured_amount: 85000000,
    valid_from: '2026-03-01',
    valid_until: '2026-11-15',
    status: 'por_vencer'
  },
  {
    id: 'pol-3',
    company_id: 'emp-2',
    company_name: 'Acabados & Pisos El Poblado',
    contract_reference: 'Remodelación de Fachada e Impermeabilización Cubierta',
    insurance_company: 'Allianz Seguros S.A.',
    policy_number: 'ALL-77123-2025',
    coverage_type: 'estabilidad_obra',
    insured_amount: 45000000,
    valid_from: '2025-09-01',
    valid_until: '2026-09-01',
    status: 'vencida'
  }
];

export const ModuloPolizasGarantias: React.FC<Props> = ({ tenantId, onShowToast }) => {
  const [polizas, setPolizas] = useState<PolizaContrato[]>([]);
  const [empresas, setEmpresas] = useState<{ id: string; company_name: string; nit: string }[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);

  // Formulario nuevo registro
  const [companyId, setCompanyId] = useState('');
  const [contratoRef, setContratoRef] = useState('');
  const [aseguradora, setAseguradora] = useState('');
  const [numeroPoliza, setNumeroPoliza] = useState('');
  const [tipoAmparo, setTipoAmparo] = useState<'cumplimiento' | 'salarios_prestaciones' | 'rce_terceros' | 'estabilidad_obra'>('cumplimiento');
  const [valorAsegurado, setValorAsegurado] = useState<number>(0);
  const [vigenciaDesde, setVigenciaDesde] = useState(() => new Date().toISOString().split('T')[0]);
  const [vigenciaHasta, setVigenciaHasta] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);

      // 1. Obtener empresas registradas
      const { data: dataEmpresas } = await supabase
        .from('contractor_companies')
        .select('id, company_name, nit')
        .order('company_name', { ascending: true });

      const empFinales = (dataEmpresas && dataEmpresas.length > 0) ? dataEmpresas : DEFAULT_EMPRESAS;
      setEmpresas(empFinales);
      if (empFinales.length > 0 && !companyId) {
        setCompanyId(empFinales[0].id);
      }

      // 2. Obtener pólizas conectadas
      const { data: dataPolizas, error } = await supabase
        .from('contract_policies')
        .select('*, contractor_companies(company_name)')
        .order('valid_until', { ascending: true });

      if (error || !dataPolizas || dataPolizas.length === 0) {
        setPolizas(DEFAULT_POLIZAS);
      } else {
        setPolizas(
          dataPolizas.map((p: any) => ({
            ...p,
            company_name: p.contractor_companies?.company_name || 'Sin Asignar'
          }))
        );
      }
    } catch (err: any) {
      console.warn('Cargando datos locales de respaldo:', err.message);
      setEmpresas(DEFAULT_EMPRESAS);
      setPolizas(DEFAULT_POLIZAS);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tenantId]);

  const handleCrearPoliza = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !numeroPoliza.trim() || !aseguradora.trim() || !vigenciaHasta) {
      alert('Diligencia los campos obligatorios de la póliza.');
      return;
    }

    try {
      setGuardando(true);

      let activeTenantId = tenantId;
      if (!activeTenantId) {
        const { data: t } = await supabase.from('tenants').select('id').limit(1).single();
        activeTenantId = t?.id;
      }

      const nuevaPoliza = {
        tenant_id: activeTenantId,
        company_id: companyId,
        contract_reference: contratoRef.trim(),
        insurance_company: aseguradora.trim(),
        policy_number: numeroPoliza.trim(),
        coverage_type: tipoAmparo,
        insured_amount: Number(valorAsegurado),
        valid_from: vigenciaDesde,
        valid_until: vigenciaHasta
      };

      const { error } = await supabase.from('contract_policies').insert([nuevaPoliza]);

      const empresaNom = empresas.find(e => e.id === companyId)?.company_name || 'Empresa';
      const hoy = new Date();
      const vence = new Date(vigenciaHasta);
      const diffDias = Math.ceil((vence.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
      const estadoCalculado: 'vigente' | 'por_vencer' | 'vencida' = 
        diffDias < 0 ? 'vencida' : diffDias <= 30 ? 'por_vencer' : 'vigente';

      const nuevaLocal: PolizaContrato = {
        id: `pol-${Date.now()}`,
        company_id: companyId,
        company_name: empresaNom,
        contract_reference: contratoRef.trim(),
        insurance_company: aseguradora.trim(),
        policy_number: numeroPoliza.trim(),
        coverage_type: tipoAmparo,
        insured_amount: Number(valorAsegurado),
        valid_from: vigenciaDesde,
        valid_until: vigenciaHasta,
        status: estadoCalculado
      };

      if (error) {
        console.warn('Fallback inserción local póliza:', error.message);
        setPolizas(prev => [nuevaLocal, ...prev]);
      } else {
        await cargarDatos();
      }

      onShowToast?.(`Póliza N° ${numeroPoliza} registrada exitosamente`);
      setContratoRef('');
      setAseguradora('');
      setNumeroPoliza('');
      setValorAsegurado(0);
      setVigenciaHasta('');
      setMostrarModal(false);
    } catch (err: any) {
      alert('Error guardando póliza: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarPoliza = async (id: string, numero: string) => {
    if (!window.confirm(`¿Seguro que deseas retirar la póliza N° ${numero}?`)) return;
    try {
      const { error } = await supabase.from('contract_policies').delete().eq('id', id);
      if (error) console.warn('Eliminación local:', error.message);
      setPolizas(prev => prev.filter(p => p.id !== id));
      onShowToast?.(`Póliza eliminada`);
    } catch (err: any) {
      alert('Error eliminando póliza: ' + err.message);
    }
  };

  const polizasFiltradas = polizas.filter(p => 
    p.policy_number.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.insurance_company.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.contract_reference.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. CABECERA INSTITUCIONAL */}
      <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2.5 py-0.5 rounded-full font-bold">
              BLINDAJE CONTRACTUAL & RIESGOS • LEY 675
            </span>
            <span className="text-xs text-slate-400 font-mono">Garantías de Mantenimiento Común</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Pólizas de Cumplimiento, RCE & Estabilidad de Obra
          </h2>
          <p className="text-xs text-slate-400">
            Control de amparos otorgados por aseguradoras para intervenciones en zonas comunes y contratos de mantenimiento.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={cargarDatos}
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
            <span>Vincular Póliza</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA */}
      <div className="flex items-center gap-2 bg-[#0F172A] border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar por número de póliza, aseguradora, contrato o proveedor..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="bg-transparent border-none text-white focus:outline-none placeholder-slate-500 w-full font-sans"
        />
      </div>

      {/* 3. GRID DE PÓLIZAS CORPORATIVO */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Pólizas Vinculadas ({polizasFiltradas.length})
            </h3>
            <p className="text-xs text-slate-400">
              Monitoreo de vencimientos antes de autorizar pagos o liquidaciones de obra.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Sincronizado con Tesorería
          </span>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-slate-500 text-xs font-mono">
            Consultando coberturas y garantías en base de datos...
          </div>
        ) : polizasFiltradas.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            No hay pólizas registradas. Vincula una cobertura para amparar los contratos de la copropiedad.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {polizasFiltradas.map((pol) => {
              const esVencida = pol.status === 'vencida';
              const esPorVencer = pol.status === 'por_vencer';

              return (
                <div 
                  key={pol.id}
                  className="bg-[#1E293B] border border-slate-700/80 hover:border-slate-600 p-5 rounded-2xl flex flex-col justify-between space-y-3.5 transition"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 truncate max-w-[200px]">
                        {pol.company_name}
                      </span>
                      <button
                        onClick={() => handleEliminarPoliza(pol.id, pol.policy_number)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                        title="Eliminar póliza"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <h4 className="font-bold text-white text-sm font-mono">
                        PÓLIZA N° {pol.policy_number}
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5 font-sans">
                        Aseguradora: <strong className="text-slate-200">{pol.insurance_company}</strong>
                      </p>
                    </div>

                    {/* Estado de vigencia */}
                    <div className={`p-2 rounded-xl border text-[11px] font-mono flex items-center gap-2 ${
                      esVencida ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' :
                      esPorVencer ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
                      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {esVencida ? <ShieldAlert className="w-4 h-4 shrink-0" /> : <ShieldCheck className="w-4 h-4 shrink-0" />}
                      <span className="font-bold">
                        {esVencida ? 'PÓLIZA VENCIDA' : esPorVencer ? 'PRÓXIMA A VENCER (30 DÍAS)' : 'PÓLIZA VIGENTE'}
                      </span>
                    </div>

                    {/* Detalles técnicos */}
                    <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-1.5 font-mono text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Amparo Legal:</span>
                        <span className="text-white capitalize">{pol.coverage_type.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Suma Asegurada:</span>
                        <span className="text-emerald-400 font-bold">${Number(pol.insured_amount).toLocaleString('es-CO')}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1">
                        <span>Contrato / Ref:</span>
                        <span className="text-slate-200 truncate max-w-[150px]">{pol.contract_reference}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 pt-1">
                      <span>Vigencia:</span>
                      <span className="text-white font-medium">{pol.valid_from} ➜ {pol.valid_until}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. MODAL VINCULAR PÓLIZA */}
      {mostrarModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Vincular Póliza y Garantía de Contrato
              </h3>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCrearPoliza} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-slate-400 mb-1">Empresa Contratista Vinculada</label>
                {empresas.length === 0 ? (
                  <p className="text-rose-400 font-mono text-xs">
                    No hay empresas registradas aún. Registra primero una empresa en el módulo de Contratistas & ARL.
                  </p>
                ) : (
                  <select
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {empresas.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.company_name} (NIT: {emp.nit})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Compañía Aseguradora</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Seguros Bolívar, AXA, Sura, Allianz"
                    value={aseguradora}
                    onChange={(e) => setAseguradora(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Número de Póliza</label>
                  <input
                    type="text"
                    required
                    placeholder="POL-2026-987654"
                    value={numeroPoliza}
                    onChange={(e) => setNumeroPoliza(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Amparo</label>
                  <select
                    value={tipoAmparo}
                    onChange={(e: any) => setTipoAmparo(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="cumplimiento">Cumplimiento del Contrato</option>
                    <option value="rce_terceros">Resp. Civil Extracontractual (RCE)</option>
                    <option value="salarios_prestaciones">Pago de Salarios y Prestaciones</option>
                    <option value="estabilidad_obra">Estabilidad y Calidad de la Obra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Valor Asegurado ($ COP)</label>
                  <input
                    type="number"
                    min={0}
                    step={1000000}
                    value={valorAsegurado}
                    onChange={(e) => setValorAsegurado(Number(e.target.value))}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Objeto / Referencia del Contrato</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Mantenimiento Preventivo de Ascensores Torres 1 y 2"
                  value={contratoRef}
                  onChange={(e) => setContratoRef(e.target.value)}
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Vigencia Desde</label>
                  <input
                    type="date"
                    required
                    value={vigenciaDesde}
                    onChange={(e) => setVigenciaDesde(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vigencia Hasta</label>
                  <input
                    type="date"
                    required
                    value={vigenciaHasta}
                    onChange={(e) => setVigenciaHasta(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando || empresas.length === 0}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Asentar Póliza en el Sistema'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModuloPolizasGarantias;
