import React, { useState, useEffect } from 'react';
import { Building2, Users, ShieldCheck, ChevronDown, DollarSign, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { cargarMetricasTenant, MetricasTenant } from '../lib/metricasTenant';

export interface SelectorPortafolioMultiConjuntoProps {
  onShowToast?: (msg: string) => void;
  onSelectCopropiedad?: (copropiedad: string) => void;
  edificiosAsignados?: { id: string; name: string }[];
  edificioActivoId?: string;
  onSelectEdificioId?: (id: string) => void;
  metricas?: MetricasTenant;
}

export default function SelectorPortafolioMultiConjunto({
  onShowToast,
  onSelectCopropiedad,
  edificiosAsignados = [],
  edificioActivoId,
  onSelectEdificioId,
  metricas: propMetricas
}: SelectorPortafolioMultiConjuntoProps) {
  const [tenantsReales, setTenantsReales] = useState<any[]>([]);

  useEffect(() => {
    const cargarConjuntosReales = async () => {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });
      setTenantsReales(data || []);
    };
    cargarConjuntosReales();
  }, []);

  const baseEdificios = edificiosAsignados.length > 0 ? edificiosAsignados : tenantsReales;

  // Estado para la copropiedad seleccionada en el portafolio
  const [copropiedadSeleccionada, setCopropiedadSeleccionada] = useState(
    edificiosAsignados[0]?.name || ''
  );

  useEffect(() => {
    if (!copropiedadSeleccionada && baseEdificios.length > 0) {
      setCopropiedadSeleccionada(baseEdificios[0].name);
    }
  }, [baseEdificios, copropiedadSeleccionada]);

  const [supervisorFiltro, setSupervisorFiltro] = useState('Todos');
  const [metricasLocal, setMetricasLocal] = useState<MetricasTenant>({
    recaudo: '0.0%',
    unidadesMora: '0 Aptos',
    totalUnidades: 0,
    alDia: 0,
    enMora: 0,
    unidadesPagadas: 0,
    unidadesEnMora: 0,
    porcentajeRecaudo: '0.0%'
  });

  // Listado de copropiedades del empresario (incorporando las asignadas desde Supabase)
  const misCopropiedades = [
    ...baseEdificios.map(e => ({
      id: e.id,
      nombre: e.name,
      nit: e.nit || '900.781.234-5',
      supervisor: 'Administración Directa',
      recaudo: propMetricas?.recaudo || '0.0%',
      morosos: propMetricas?.enMora ?? 0,
      pqrs: 0
    })),
    ...(baseEdificios.length === 0 ? [
      { id: '', nombre: 'Sin Copropiedad Seleccionada', nit: '900.781.234-5', supervisor: 'Administración Directa', recaudo: '0.0%', morosos: 0, pqrs: 0 },
    ] : [])
  ];

  const copropiedadesFiltradas = supervisorFiltro === 'Todos'
    ? misCopropiedades
    : misCopropiedades.filter(c => c.supervisor === supervisorFiltro);

  const datosActuales =
    (edificioActivoId && misCopropiedades.find(c => c.id === edificioActivoId)) ||
    misCopropiedades.find(c => c.nombre === copropiedadSeleccionada) ||
    copropiedadesFiltradas[0] ||
    misCopropiedades[0];

  useEffect(() => {
    const currentId = edificioActivoId || datosActuales?.id;
    if (currentId && !propMetricas) {
      cargarMetricasTenant(currentId).then((res) => {
        if (res) setMetricasLocal(res);
      });
    }
  }, [edificioActivoId, datosActuales?.id, propMetricas]);

  const metricasActivas = propMetricas || metricasLocal;
  const unidadesPendientes = metricasActivas.unidadesEnMora !== undefined 
    ? metricasActivas.unidadesEnMora 
    : (parseInt(metricasActivas.unidadesMora, 10) || 0);

  const handleCambioCopropiedad = (nombre: string) => {
    setCopropiedadSeleccionada(nombre);
    const match = misCopropiedades.find(c => c.nombre === nombre);
    if (match && onSelectEdificioId) {
      onSelectEdificioId(match.id);
    }
    onSelectCopropiedad?.(nombre);
    onShowToast?.(`🏢 Cambiando vista activa a: ${nombre}`);
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl space-y-6 shadow-2xl font-sans text-slate-100">
      
      {/* BARRA SUPERIOR DE FILTRO MULTI-CONJUNTO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
            Control Gerencial Multi-Copropiedad
          </span>
          <h3 className="text-base font-black text-white mt-1">Portafolio Empresarial de Urbanizaciones</h3>
        </div>

        {/* SELECTORES DE CAMBIO RÁPIDO */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector de Copropiedad / Urbanización */}
          <div className="flex items-center gap-2 bg-[#07090e] border border-slate-700 px-3.5 py-2 rounded-2xl hover:border-cyan-500/50 transition">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={copropiedadSeleccionada}
              onChange={(e) => handleCambioCopropiedad(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              {copropiedadesFiltradas.map(c => (
                <option key={c.id} value={c.nombre} className="bg-slate-900 text-white">
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Supervisor a Cargo */}
          <div className="flex items-center gap-2 bg-[#07090e] border border-slate-700 px-3.5 py-2 rounded-2xl hover:border-teal-500/50 transition">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <select
              value={supervisorFiltro}
              onChange={(e) => {
                const nuevoSup = e.target.value;
                setSupervisorFiltro(nuevoSup);
                if (nuevoSup !== 'Todos') {
                  const match = misCopropiedades.find(c => c.supervisor === nuevoSup);
                  if (match) {
                    setCopropiedadSeleccionada(match.nombre);
                    onSelectCopropiedad?.(match.nombre);
                  }
                }
                onShowToast?.(`Filtro supervisor: ${nuevoSup}`);
              }}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900 text-white">Supervisor: Todos</option>
              <option value="Julián Arango" className="bg-slate-900 text-white">Julián Arango</option>
              <option value="Carlos Mario Pineda" className="bg-slate-900 text-white">Carlos Mario Pineda</option>
            </select>
          </div>

        </div>
      </div>

      {/* MÉTRICAS DINÁMICAS DE LA UNIDAD SELECCIONADA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-cyan-500/30 transition">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Recaudo Copropiedad</span>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-black text-cyan-400">{metricasActivas.recaudo}</p>
            <span className="text-xs font-mono font-bold text-emerald-400">
              (${(metricasActivas.totalRecaudadoCalculado ?? ((metricasActivas.alDia || 0) * 300000)).toLocaleString('es-CO')} COP)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">Total {metricasActivas.totalUnidades} unidades censadas ({metricasActivas.alDia || 0} al día)</p>
        </div>

        {/* Tarjeta Central Corregida */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-lg">
          <p className="text-xs uppercase tracking-wider text-slate-400 font-mono">
            Unidades Pendientes por Cobro
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {unidadesPendientes} Aptos
            </span>
            <span className="text-xs text-slate-500">de 100</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            Gestión preventiva & cobro Ley 675
          </p>
        </div>

        <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-amber-500/30 transition">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Censo Activo / Supervisor</span>
          <p className="text-2xl font-black text-amber-400">{metricasActivas.totalUnidades} Aptos</p>
          <p className="text-[11px] text-slate-500">
            Responsable: <strong className="text-slate-300">{datosActuales.supervisor}</strong>
          </p>
        </div>

      </div>

    </div>
  );
}
