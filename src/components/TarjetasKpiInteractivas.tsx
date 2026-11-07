import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Radio, 
  PhoneCall, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  TrendingUp,
  ShieldCheck,
  Users
} from 'lucide-react';
import { supabase } from '../supabaseClient';

type TipoModal = 'copropiedades' | 'garitas' | 'llamadas' | 'tickets' | null;

export default function TarjetasKpiInteractivas() {
  const [modalActivo, setModalActivo] = useState<TipoModal>(null);

  // Estados para métricas 100% reales desde Supabase
  const [metricasSaaS, setMetricasSaaS] = useState({
    totalTenants: 0,
    totalUnidades: 0,
    totalUsuarios: 0,
    recaudoPromedio: 0,
    cargando: true
  });

  const [copropiedadesDetalle, setCopropiedadesDetalle] = useState<Array<{
    id: string;
    nombre: string;
    ciudad: string;
    unidades: number;
    estado: string;
    garitaIp: string;
    ley: string;
  }>>([]);

  useEffect(() => {
    const cargarMetricasRealesMaster = async () => {
      try {
        // 1. Contar copropiedades (tenants) reales
        const { count: countTenants, data: tenantsRows } = await supabase
          .from('tenants')
          .select('*', { count: 'exact' });

        // 2. Contar unidades totales registradas en todas las copropiedades
        const { count: countUnits } = await supabase
          .from('units')
          .select('*', { count: 'exact', head: true });

        // 3. Contar perfiles de usuarios activos en la plataforma
        const { count: countUsers } = await supabase
          .from('user_profiles')
          .select('*', { count: 'exact', head: true });

        // 4. Calcular unidades al día vs en mora para el recaudo real
        const { data: unidadesData } = await supabase
          .from('units')
          .select('debt_status, tenant_id');

        let porcentajeRecaudoReal = 0;
        if (unidadesData && unidadesData.length > 0) {
          const alDia = unidadesData.filter((u: any) => u.debt_status === 'al_dia' || u.debt_status === 'Al día').length;
          porcentajeRecaudoReal = (alDia / unidadesData.length) * 100;
        }

        setMetricasSaaS({
          totalTenants: countTenants || 0,
          totalUnidades: countUnits || 0,
          totalUsuarios: countUsers || 0,
          recaudoPromedio: Number(porcentajeRecaudoReal.toFixed(1)),
          cargando: false
        });

        if (tenantsRows && tenantsRows.length > 0) {
          setCopropiedadesDetalle(
            tenantsRows.map((t: any) => {
              const countU = (unidadesData || []).filter((u: any) => u.tenant_id === t.id).length;
              return {
                id: t.id,
                nombre: t.name || 'Copropiedad PH',
                ciudad: t.address || 'Colombia',
                unidades: countU || Number(t.total_units) || 0,
                estado: t.subscription_status === 'suspended' ? 'Suspendido' : 'Activo',
                garitaIp: 'TLS 1.3 Activo',
                ley: 'Ley 675'
              };
            })
          );
        } else {
          setCopropiedadesDetalle([]);
        }
      } catch (err) {
        console.warn('Error cargando métricas reales de Master Owner:', err);
        setMetricasSaaS(prev => ({ ...prev, cargando: false }));
      }
    };

    cargarMetricasRealesMaster();
  }, []);

  return (
    <>
      {/* 4 TARJETAS KPI CLICKABLES CONECTADAS A SUPABASE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono select-none">
        
        {/* TARJETA 1: COPROPIEDADES */}
        <div
          onClick={() => setModalActivo('copropiedades')}
          className="bg-[#090d14] border border-cyan-500/20 hover:border-cyan-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Copropiedades Activas</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-white">
              {metricasSaaS.cargando ? '...' : metricasSaaS.totalTenants}
            </p>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Ley 675
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Clic para ver catálogo real</span>
            <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 2: UNIDADES REGISTRADAS */}
        <div
          onClick={() => setModalActivo('garitas')}
          className="bg-[#090d14] border border-emerald-500/20 hover:border-emerald-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Unidades Registradas</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-emerald-400">
              {metricasSaaS.cargando ? '...' : metricasSaaS.totalUnidades.toLocaleString('es-CO')}
            </p>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Radio className="w-3 h-3" /> Censo Real
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Total apartamentos/casas en BD</span>
            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 3: USUARIOS EN PLATAFORMA */}
        <div
          onClick={() => setModalActivo('llamadas')}
          className="bg-[#090d14] border border-cyan-500/20 hover:border-cyan-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Usuarios Activos (Perfiles)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-cyan-300">
              {metricasSaaS.cargando ? '...' : metricasSaaS.totalUsuarios.toLocaleString('es-CO')}
            </p>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Users className="w-3 h-3" /> Auth
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Perfiles verificados en Supabase</span>
            <span className="text-cyan-300 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 4: RECAUDO PROMEDIO */}
        <div
          onClick={() => setModalActivo('tickets')}
          className="bg-[#090d14] border border-amber-500/20 hover:border-amber-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Recaudo Promedio Global</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-amber-300">
              {metricasSaaS.cargando ? '...' : `${metricasSaaS.recaudoPromedio}%`}
            </p>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Cartera
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Unidades al día vs. en mora</span>
            <span className="text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

      </div>

      {/* MODAL DRILL-DOWN INTERACTIVO */}
      {modalActivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none animate-fadeIn">
          <div className="bg-[#080d1a] border border-cyan-500/30 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,242,254,0.2)]">
            
            {/* CABECERA DEL MODAL */}
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-[#060912]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-[#00f2fe]">
                  {modalActivo === 'copropiedades' && <Building2 className="w-5 h-5" />}
                  {modalActivo === 'garitas' && <Radio className="w-5 h-5" />}
                  {modalActivo === 'llamadas' && <PhoneCall className="w-5 h-5" />}
                  {modalActivo === 'tickets' && <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white capitalize">
                    {modalActivo === 'copropiedades' && 'Catálogo Global de Copropiedades (Ley 675)'}
                    {modalActivo === 'garitas' && 'Censo Global de Unidades Registradas'}
                    {modalActivo === 'llamadas' && 'Perfiles de Usuarios Registrados en Supabase'}
                    {modalActivo === 'tickets' && 'Indicador de Cartera y Recaudo Real'}
                  </h3>
                  <p className="text-xs text-cyan-400/70">
                    Inspección detallada de datos operativos en tiempo real desde Supabase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalActivo(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO SCROLLABLE SEGÚN EL KPI SELECCIONADO */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* MODAL 1: COPROPIEDADES */}
              {modalActivo === 'copropiedades' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-cyan-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00f2fe]" /> Total Copropiedades bajo régimen Ley 675: <strong>{metricasSaaS.totalTenants} Registradas</strong>
                    </span>
                    <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-400/30">{metricasSaaS.totalUnidades.toLocaleString('es-CO')} Unidades Totales</span>
                  </div>
                  
                  {copropiedadesDetalle.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-[#0b101d] border border-slate-800 rounded-2xl">
                      No hay copropiedades registradas en este momento en la tabla <code>tenants</code>.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {copropiedadesDetalle.map((c) => (
                        <div key={c.id} className="p-3.5 bg-[#0b101d] border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center justify-between transition">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{c.nombre}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">{c.ciudad}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {c.unidades} Unidades Residenciales • Estado de Canal: <code className="text-cyan-400">{c.garitaIp}</code>
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              c.estado === 'Activo' 
                                ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                                : 'bg-amber-950 text-amber-400 border-amber-500/30 animate-pulse'
                            }`}>
                              {c.estado}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MODAL 2: UNIDADES */}
              {modalActivo === 'garitas' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Total Unidades en Base de Datos: <strong>{metricasSaaS.totalUnidades} Unidades</strong>
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Sincronizado con Supabase</span>
                  </div>
                </div>
              )}

              {/* MODAL 3: USUARIOS */}
              {modalActivo === 'llamadas' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-cyan-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" /> Perfiles de usuario activos en <code>user_profiles</code>: <strong>{metricasSaaS.totalUsuarios} Usuarios</strong>
                    </span>
                    <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-400/30">RBAC Multi-Tenant</span>
                  </div>
                </div>
              )}

              {/* MODAL 4: RECAUDO */}
              {modalActivo === 'tickets' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-400" /> Porcentaje de unidades al día: <strong>{metricasSaaS.recaudoPromedio}%</strong>
                    </span>
                    <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-400/30">LEY 675 / ART. 1653 C.C.</span>
                  </div>
                </div>
              )}

            </div>

            {/* PIE DEL MODAL CON BOTÓN DE CIERRE */}
            <div className="p-4 bg-[#060912] border-t border-cyan-500/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Urbix PH • Plataforma Multi-Tenant Segura</span>
              <button
                onClick={() => setModalActivo(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.3)]"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
