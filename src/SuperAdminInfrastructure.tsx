import React, { useState } from 'react';
import { Shield, Terminal, Cpu, Database, RefreshCw, Lock, Server, GitBranch, HardDrive, CheckCircle2, AlertOctagon } from 'lucide-react';

export default function SuperAdminInfrastructure() {
  const [dbStatus, setDbStatus] = useState('Óptimo (14ms)');
  const [appVersion, setAppVersion] = useState('v2.4.0-beta');
  const [updating, setUpdating] = useState(false);

  // Lista de túneles remotos y conexiones de mantenimiento activas
  const [tunnels, setTunnels] = useState([
    { id: 't_01', name: 'Supabase Main Cluster (Bogotá/AWS)', type: 'PostgreSQL Pooler', status: 'Activo', latency: '12ms' },
    { id: 't_02', name: 'WhatsApp API Gateway (Meta Business)', type: 'Webhook / REST', status: 'Activo', latency: '45ms' },
    { id: 't_03', name: 'Pasarela de Pagos (PSE / Bancolombia)', type: 'API Externa', status: 'Sincronizado', latency: '88ms' },
    { id: 't_04', name: 'Túnel SSH de Diagnóstico (Mantenimiento)', type: 'Secure Tunnel', status: 'Standby', latency: '-' }
  ]);

  const handleSystemUpdate = () => {
    setUpdating(true);
    setTimeout(() => {
      setAppVersion('v2.4.1-patch');
      setUpdating(false);
      alert("✅ Sistema actualizado correctamente al parche v2.4.1. Caché purgado en Vercel.");
    }, 2000);
  };

  const toggleTunnel = (id: string) => {
    setTunnels(tunnels.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'Activo' ? 'Desconectado' : 'Activo';
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 p-6 lg:p-10 font-sans">
      
      {/* 1. HEADER DE CONTROL DE INFRAESTRUCTURA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] border border-[#262629] p-6 rounded-xl mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              [ INFRAESTRUCTURA & CORE ]
            </span>
            <span className="text-[10px] font-mono text-slate-400">DEV_MODE: ACTIVE</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Gestión de Software y Conexiones Remotas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Control de versiones, despliegues, parches y túneles de mantenimiento de Urbix PH.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleSystemUpdate}
            disabled={updating}
            className="bg-emerald-500 text-slate-950 font-bold text-xs px-4 py-2.5 rounded hover:bg-emerald-400 transition flex items-center gap-2 font-mono disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={updating ? "animate-spin" : ""} />
            {updating ? "DESPLEGANDO PARCHE..." : "ACTUALIZAR SOFTWARE"}
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE ESTADO DEL SISTEMA (TELEMETRÍA) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        
        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Versión Actual</span>
            <GitBranch className="text-emerald-400" size={20} />
          </div>
          <div className="text-2xl font-black font-mono text-white">{appVersion}</div>
          <p className="text-xs text-slate-400 mt-1">Build desplegado en Vercel</p>
        </div>

        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Latencia Base de Datos</span>
            <Database className="text-cyan-400" size={20} />
          </div>
          <div className="text-2xl font-black font-mono text-white">{dbStatus}</div>
          <p className="text-xs text-emerald-400 mt-1">Conexión Supabase estable</p>
        </div>

        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Seguridad RLS</span>
            <Lock className="text-purple-400" size={20} />
          </div>
          <div className="text-2xl font-black font-mono text-purple-400">Activa (Strict)</div>
          <p className="text-xs text-slate-400 mt-1">Aislamiento por Copropiedad</p>
        </div>

        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Uso de Memoria / Caché</span>
            <Cpu className="text-amber-400" size={20} />
          </div>
          <div className="text-2xl font-black font-mono text-white">18.4%</div>
          <p className="text-xs text-slate-400 mt-1">Optimizado con Context Caching</p>
        </div>

      </div>

      {/* 3. GESTIÓN DE TÚNELES REMOTOS Y CONEXIONES DE MANTENIMIENTO */}
      <div className="bg-[#141416] border border-[#262629] rounded-xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server size={18} className="text-emerald-400" /> Túneles Remotos y Conexiones de Mantenimiento
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Control de pasarelas, bases de datos y accesos seguros para soporte técnico.</p>
          </div>
          <span className="text-xs font-mono bg-[#1c1c1f] border border-[#262629] text-slate-300 px-3 py-1 rounded">
            4 Canales Configurados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
              <tr>
                <th className="p-3">Servicio / Destino</th>
                <th className="p-3">Protocolo / Tipo</th>
                <th className="p-3">Latencia</th>
                <th className="p-3">Estado del Enlace</th>
                <th className="p-3 text-right">Acción de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262629]">
              {tunnels.map(tunnel => (
                <tr key={tunnel.id} className="hover:bg-[#1c1c1f]/50 transition">
                  <td className="p-3 font-medium text-white flex items-center gap-2">
                    <Terminal size={14} className="text-slate-400" />
                    {tunnel.name}
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-xs">{tunnel.type}</td>
                  <td className="p-3 font-mono text-emerald-400 text-xs">{tunnel.latency}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                      tunnel.status === 'Activo' || tunnel.status === 'Sincronizado' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}>
                      {tunnel.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button 
                      onClick={() => toggleTunnel(tunnel.id)}
                      className={`text-xs font-mono px-3 py-1 rounded border transition cursor-pointer ${
                        tunnel.status === 'Activo' || tunnel.status === 'Sincronizado'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                      }`}
                    >
                      {tunnel.status === 'Activo' || tunnel.status === 'Sincronizado' ? 'Desconectar' : 'Conectar Túnel'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CONSOLA DE REGISTROS DE INFRAESTRUCTURA (SYSTEM LOGS) */}
      <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
          <HardDrive size={18} className="text-cyan-400" /> Registro de Actividad y Parches del Sistema (System Logs)
        </h2>
        
        <div className="bg-[#0a0a0a] border border-[#262629] p-4 rounded-lg font-mono text-xs space-y-2 text-slate-300">
          <p className="text-emerald-400">[2026-10-29 02:05:12 UTC] SYSTEM_BOOT: Núcleo multi-tenant inicializado correctamente en Supabase.</p>
          <p className="text-slate-400">[2026-10-29 01:40:00 UTC] RLS_CHECK: Políticas de seguridad validadas para el rol 'super_admin'.</p>
          <p className="text-cyan-400">[2026-10-28 22:15:45 UTC] DEPLOY: Vercel build completado para Urbix PH v2.4.0-beta.</p>
          <p className="text-slate-400">[2026-10-28 19:10:22 UTC] DB_POOL: Conexiones simultáneas estables (12 pools activos).</p>
        </div>
      </div>

    </div>
  );
}
