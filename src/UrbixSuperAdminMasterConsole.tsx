import React, { useState } from 'react';
import { 
  ShieldCheck, Building2, Users, DollarSign, AlertTriangle, 
  RefreshCw, Lock, Terminal, Cpu, Database, Server, GitBranch, HardDrive, UserPlus 
} from 'lucide-react';

export default function UrbixSuperAdminMasterConsole() {
  // Estado para controlar las pestañas del Superadministrador
  const [activeTab, setActiveTab] = useState('overview');

  // Datos simulados (Conectados conceptualmente a Supabase)
  const [coproperties, setCoproperties] = useState([
    { id: 1, name: 'P.H. Reserva del Tesoro', city: 'Medellín', units: 120, collectionRate: '94.5%', status: 'Activo' },
    { id: 2, name: 'Edificio Torre El Poblado', city: 'Medellín', units: 45, collectionRate: '88.2%', status: 'Activo' },
    { id: 3, name: 'C.C. San Diego (Localidades)', city: 'Medellín', units: 80, collectionRate: '96.0%', status: 'Activo' }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: 'Esteban Ochoa (Root)', email: 'admin@urbix.ph', role: 'super_admin', coproperty: 'Global' },
    { id: 2, name: 'Carlos Mario Pineda', email: 'carlos.admin@gmail.com', role: 'admin', coproperty: 'Reserva del Tesoro' },
    { id: 3, name: 'Julián Arango (Supervisor)', email: 'supervisor@urbix.ph', role: 'supervisor', coproperty: 'Torre El Poblado' }
  ]);

  const [tunnels, setTunnels] = useState([
    { id: 't_01', name: 'Supabase Main Cluster (Bogotá/AWS)', type: 'PostgreSQL Pooler', status: 'Activo', latency: '12ms' },
    { id: 't_02', name: 'WhatsApp API Gateway (Meta Business)', type: 'Webhook / REST', status: 'Activo', latency: '45ms' },
    { id: 't_03', name: 'Pasarela de Pagos (PSE / Bancolombia)', type: 'API Externa', status: 'Sincronizado', latency: '88ms' },
    { id: 't_04', name: 'Túnel SSH de Diagnóstico (Mantenimiento)', type: 'Secure Tunnel', status: 'Standby', latency: '-' }
  ]);

  const [appVersion, setAppVersion] = useState('v2.4.0-beta');
  const [updating, setUpdating] = useState(false);

  // Lógica de seguridad para evitar degradar al último super_admin
  const handleRoleChange = (userId: number, newRole: string) => {
    const targetUser = users.find(u => u.id === userId);
    const superAdminsCount = users.filter(u => u.role === 'super_admin').length;
    
    if (targetUser && targetUser.role === 'super_admin' && newRole !== 'super_admin' && superAdminsCount <= 1) {
      alert("⚠️ ACCIÓN BLOQUEADA: El sistema requiere al menos un Superadministrador activo para mantener la gobernanza.");
      return;
    }

    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleSystemUpdate = () => {
    setUpdating(true);
    setTimeout(() => {
      setAppVersion('v2.4.1-patch');
      setUpdating(false);
      alert("✅ Sistema actualizado correctamente al parche v2.4.1. Caché purgado.");
    }, 1500);
  };

  const toggleTunnel = (id: string) => {
    setTunnels(tunnels.map(t => {
      if (t.id === id) {
        const newStatus = t.status === 'Activo' || t.status === 'Sincronizado' ? 'Desconectado' : 'Activo';
        return { ...t, status: newStatus };
      }
      return t;
    }));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 p-6 lg:p-10 font-sans">
      
      {/* 1. HEADER GENERAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] border border-[#262629] p-6 rounded-xl mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              [ MASTER ROOT CONSOLE - URBIX PH ]
            </span>
            <span className="text-[10px] font-mono text-slate-400">MEDELLÍN & VALLE DE ABURRÁ</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Consola Central del Superadministrador
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gobernanza global, control multi-tenant, seguridad RBAC e infraestructura técnica.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#1c1c1f] px-4 py-2.5 rounded-lg border border-[#262629]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="text-xs font-mono">
            <p className="text-slate-300 font-bold">Supabase: Sincronizado</p>
            <p className="text-slate-500">RLS Active • Secure</p>
          </div>
        </div>
      </div>

      {/* 2. NAVEGACIÓN POR PESTAÑAS (TABS) */}
      <div className="flex border-b border-[#262629] mb-8 gap-2 font-mono text-xs overflow-x-auto">
        <button 
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview' 
              ? 'border-emerald-500 text-emerald-400 bg-[#141416]' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 size={16} /> 1. Copropiedades & Finanzas
        </button>

        <button 
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'rbac' 
              ? 'border-cyan-500 text-cyan-400 bg-[#141416]' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users size={16} /> 2. Control de Roles (RBAC)
        </button>

        <button 
          onClick={() => setActiveTab('infrastructure')}
          className={`px-4 py-3 border-b-2 font-bold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'infrastructure' 
              ? 'border-purple-500 text-purple-400 bg-[#141416]' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server size={16} /> 3. Infraestructura & Túneles Remotos
        </button>
      </div>

      {/* ================= PESTAÑA 1: VISTA GENERAL Y COPROPIEDADES ================= */}
      {activeTab === 'overview' && (
        <div>
          {/* Métricas Globales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Recaudo Global Mes</span>
                <DollarSign className="text-emerald-400" size={20} />
              </div>
              <div className="text-3xl font-black font-mono text-white">$486.200.000</div>
              <p className="text-xs text-emerald-400 mt-1">↑ 14.2% vs mes anterior</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Edificios / Copropiedades</span>
                <Building2 className="text-cyan-400" size={20} />
              </div>
              <div className="text-3xl font-black font-mono text-white">12 Activos</div>
              <p className="text-xs text-slate-400 mt-1">Medellín & Valle de Aburrá</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Cartera Crítica (+90d)</span>
                <AlertTriangle className="text-amber-400" size={20} />
              </div>
              <div className="text-3xl font-black font-mono text-amber-400">$34.150.000</div>
              <p className="text-xs text-slate-400 mt-1">Listos para prejurídico (Ley 675)</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Integridad Multi-Tenant</span>
                <ShieldCheck className="text-emerald-400" size={20} />
              </div>
              <div className="text-3xl font-black font-mono text-emerald-400">Protegido</div>
              <p className="text-xs text-slate-400 mt-1">RLS activo por copropiedad</p>
            </div>
          </div>

          {/* Tabla de Copropiedades */}
          <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-emerald-400" /> Copropiedades Administradas por la Firma
              </h2>
              <button className="bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-emerald-400 transition font-mono cursor-pointer">
                + Nueva Copropiedad
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
                  <tr>
                    <th className="p-3">Edificio / Conjunto</th>
                    <th className="p-3">Ubicación</th>
                    <th className="p-3">Unidades / Locales</th>
                    <th className="p-3">Eficacia Recaudo</th>
                    <th className="p-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262629]">
                  {coproperties.map(copro => (
                    <tr key={copro.id} className="hover:bg-[#1c1c1f]/50 transition">
                      <td className="p-3 font-medium text-white">{copro.name}</td>
                      <td className="p-3 text-slate-400">{copro.city}</td>
                      <td className="p-3 font-mono text-slate-300">{copro.units} unids</td>
                      <td className="p-3 font-mono text-emerald-400">{copro.collectionRate}</td>
                      <td className="p-3">
                        <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono border border-emerald-500/30">
                          {copro.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA 2: CONTROL DE ROLES (RBAC) ================= */}
      {activeTab === 'rbac' && (
        <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-cyan-400" /> Gestión de Permisos y Roles (RBAC)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Control jerárquico blindado contra pérdida de privilegios raíz.</p>
            </div>
            <button className="bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 font-mono cursor-pointer">
              <UserPlus size={14} /> Asignar Nuevo Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
                <tr>
                  <th className="p-3">Usuario / Email</th>
                  <th className="p-3">Rol del Sistema</th>
                  <th className="p-3">Asignación</th>
                  <th className="p-3 text-right">Modificar Rol (Acción Protegida)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262629]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-[#1c1c1f]/50 transition">
                    <td className="p-3">
                      <p className="font-medium text-white">{u.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                        u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                        u.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-300 font-mono">{u.coproperty}</td>
                    <td className="p-3 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-[#1c1c1f] border border-[#262629] text-xs text-slate-200 rounded p-1.5 font-mono focus:border-cyan-500 outline-none cursor-pointer"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Administrador</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="security_guard">Vigilancia (Portería)</option>
                        <option value="maintenance_staff">Aseo / Zonas Húmedas</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= PESTAÑA 3: INFRAESTRUCTURA Y TÚNELES ================= */}
      {activeTab === 'infrastructure' && (
        <div>
          {/* Telemetría Técnica */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Versión del Software</span>
                <GitBranch className="text-purple-400" size={20} />
              </div>
              <div className="text-2xl font-black font-mono text-white">{appVersion}</div>
              <p className="text-xs text-slate-400 mt-1">Desplegado en entorno AI Studio</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Latencia Base de Datos</span>
                <Database className="text-cyan-400" size={20} />
              </div>
              <div className="text-2xl font-black font-mono text-white">12ms (Óptimo)</div>
              <p className="text-xs text-emerald-400 mt-1">Supabase Cluster Active</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Seguridad RLS</span>
                <Lock className="text-emerald-400" size={20} />
              </div>
              <div className="text-2xl font-black font-mono text-emerald-400">Strict</div>
              <p className="text-xs text-slate-400 mt-1">Aislamiento por tenant</p>
            </div>

            <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
              <div className="flex justify-between items-center text-slate-400 mb-2">
                <span className="text-xs font-mono uppercase">Acción de Parche</span>
                <Cpu className="text-amber-400" size={20} />
              </div>
              <button 
                onClick={handleSystemUpdate}
                disabled={updating}
                className="w-full mt-1 bg-emerald-500 text-slate-950 font-bold text-xs py-1.5 rounded hover:bg-emerald-400 transition font-mono disabled:opacity-50 cursor-pointer"
              >
                {updating ? "ACTUALIZANDO..." : "FORZAR PATCH"}
              </button>
            </div>
          </div>

          {/* Tabla de Túneles Remotos */}
          <div className="bg-[#141416] border border-[#262629] rounded-xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Server size={18} className="text-purple-400" /> Túneles Remotos y Conexiones de Mantenimiento
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Control de pasarelas, bases de datos y canales de soporte técnico.</p>
              </div>
              <span className="text-xs font-mono bg-[#1c1c1f] border border-[#262629] text-slate-300 px-3 py-1 rounded">
                4 Canales
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
                  <tr>
                    <th className="p-3">Servicio / Destino</th>
                    <th className="p-3">Protocolo</th>
                    <th className="p-3">Latencia</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Control Remoto</th>
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
                          {tunnel.status === 'Activo' || tunnel.status === 'Sincronizado' ? 'Desconectar' : 'Conectar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <HardDrive size={18} className="text-cyan-400" /> Registro de Actividad y Auditoría (System Logs)
            </h2>
            <div className="bg-[#0a0a0a] border border-[#262629] p-4 rounded-lg font-mono text-xs space-y-2 text-slate-300">
              <p className="text-emerald-400">[2026-10-29 02:20:00 UTC] SYS_CORE: Núcleo de Urbix PH cargado en entorno AI Studio.</p>
              <p className="text-slate-400">[2026-10-29 02:15:10 UTC] RBAC_ENGINE: Verificación de roles (Admin, Supervisor, Vigilancia, Aseo) exitosa.</p>
              <p className="text-purple-400">[2026-10-29 01:50:30 UTC] SEC_RLS: Políticas multitenant aplicadas correctamente en Supabase.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
