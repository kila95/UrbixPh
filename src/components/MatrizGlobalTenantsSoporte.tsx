import React, { useState } from 'react';
import { 
  Building2, 
  Activity, 
  PhoneCall, 
  ShieldAlert, 
  LogIn, 
  RefreshCw, 
  Wrench, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

export function MatrizGlobalTenantsSoporte({
  onImpersonateTenant,
  onSelectTenantSupport
}: {
  onImpersonateTenant?: (tenantName: string) => void;
  onSelectTenantSupport?: (tenantId: string) => void;
}) {
  const [tenants, setTenants] = useState([
    {
      id: 't1',
      nombre: 'Reserva del Tesoro PH',
      ciudad: 'Medellín, Poblado',
      unidades: 180,
      garitaOnline: true,
      llamadasHoy: 42,
      ticketsPendientes: 0,
      plan: 'Enterprise Anual',
      licencia: 'Al Día',
      version: 'v2.4'
    },
    {
      id: 't2',
      nombre: 'Torres de San Juan',
      ciudad: 'Medellín, Laureles',
      unidades: 96,
      garitaOnline: false, // Garita desconectada (alerta soporte)
      llamadasHoy: 12,
      ticketsPendientes: 1,
      plan: 'Pro Mensual',
      licencia: 'Al Día',
      version: 'v2.4'
    },
    {
      id: 't3',
      nombre: 'Edificio Vizcaya Panorámico',
      ciudad: 'Medellín, El Poblado',
      unidades: 120,
      garitaOnline: true,
      llamadasHoy: 68,
      ticketsPendientes: 0,
      plan: 'Enterprise Anual',
      licencia: 'Al Día',
      version: 'v2.4'
    },
    {
      id: 't4',
      nombre: 'Conjunto Portal de la 80',
      ciudad: 'Bogotá, Engativá',
      unidades: 240,
      garitaOnline: true,
      llamadasHoy: 114,
      ticketsPendientes: 1,
      plan: 'Enterprise Anual',
      licencia: 'Al Día',
      version: 'v2.4'
    }
  ]);

  return (
    <div className="bg-[#05080e] border border-cyan-500/20 rounded-3xl p-6 font-mono text-xs select-none space-y-6">
      
      {/* HEADER DEL MÓDULO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              Matriz Global de Tenants &amp; Diagnóstico de Soporte
            </h3>
            <p className="text-xs text-slate-400 font-sans mt-0.5">
              Supervisión de conectividad WebRTC en garitas, consumo de red y acceso remoto para soporte en vivo.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setTenants(prev => prev.map(t => ({ ...t, llamadasHoy: t.llamadasHoy + Math.floor(Math.random() * 3) })));
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-300 hover:border-cyan-500/40 text-[11px] font-mono transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Actualizar Métricas</span>
        </button>
      </div>

      {/* 1. KPIs DE SALUD GLOBAL DEL SOFTWARE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#090d14] border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Copropiedades</span>
          <span className="text-lg font-black text-white">{tenants.length} Activas</span>
        </div>
        <div className="bg-[#090d14] border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Porterías Conectadas</span>
          <span className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {tenants.filter(t => t.garitaOnline).length} / {tenants.length}
          </span>
        </div>
        <div className="bg-[#090d14] border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Túneles WebRTC Hoy</span>
          <span className="text-lg font-black text-cyan-300">
            {tenants.reduce((acc, t) => acc + t.llamadasHoy, 0)} Llamadas
          </span>
        </div>
        <div className="bg-[#090d14] border border-slate-800 p-3.5 rounded-2xl">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Incidentes Técnicos</span>
          <span className="text-lg font-black text-amber-300">
            {tenants.reduce((acc, t) => acc + t.ticketsPendientes, 0)} Pendientes
          </span>
        </div>
      </div>

      {/* 2. TABLA MAESTRA DE DIAGNÓSTICO Y ACCESO DE SOPORTE */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-[#090d14]/70">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Copropiedad / Tenant</th>
                <th className="py-3 px-4">Garita / Citófono</th>
                <th className="py-3 px-4">Tráfico Hoy</th>
                <th className="py-3 px-4">Licencia SaaS</th>
                <th className="py-3 px-4 text-right">Acciones de Soporte</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-cyan-950/10 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-white text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.nombre}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{t.ciudad} • {t.unidades} Unds</div>
                  </td>

                  <td className="py-3.5 px-4">
                    {t.garitaOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Garita Online
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        Sin Conexión
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1 text-[11px]">
                      <PhoneCall className="w-3 h-3 text-cyan-400" />
                      <span>{t.llamadasHoy} llamadas</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {t.plan}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTenantSupport) {
                            onSelectTenantSupport(t.id);
                          } else {
                            alert(`Cambiando a pestaña "🛠️ Soporte Técnico & Impersonación" para: ${t.nombre}`);
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:border-purple-400 font-bold transition flex items-center gap-1 text-[10px] cursor-pointer"
                      >
                        🛠️ Gestionar Soporte
                      </button>

                      <button
                        type="button"
                        onClick={() => alert(`🔧 Diagnóstico de red para "${t.nombre}":\n\n• Túnel WebRTC: Activo\n• Latencia ICE: 18ms\n• Estado Garita: ${t.garitaOnline ? 'Online' : 'Revisando reconexión auto'}`)}
                        className="p-1.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-cyan-400 hover:border-cyan-400 transition cursor-pointer"
                        title="Diagnóstico de Red y Logs"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onImpersonateTenant) {
                            onImpersonateTenant(t.nombre);
                          } else {
                            alert(`Accediendo en Modo Impersonación Soporte a: ${t.nombre}`);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 hover:bg-[#00f2fe] hover:text-slate-950 font-bold transition flex items-center gap-1.5 text-[10px] cursor-pointer"
                      >
                        <LogIn className="w-3 h-3" />
                        Entrar a Consola
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default MatrizGlobalTenantsSoporte;
