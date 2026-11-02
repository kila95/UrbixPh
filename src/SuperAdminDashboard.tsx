import React, { useState } from 'react';
import { ShieldCheck, Building2, Users, DollarSign, AlertTriangle, Lock, RefreshCw, CheckCircle2, UserPlus } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [coproperties, setCoproperties] = useState([
    { id: 1, name: 'P.H. Reserva del Tesoro', city: 'Medellín', units: 120, collectionRate: '94.5%', status: 'Activo' },
    { id: 2, name: 'Edificio Torre El Poblado', city: 'Medellín', units: 45, collectionRate: '88.2%', status: 'Activo' },
    { id: 3, name: 'C.C. San Diego (Localidades)', city: 'Medellín', units: 80, collectionRate: '96.0%', status: 'Activo' }
  ]);

  const [users, setUsers] = useState([
    { id: 1, name: 'Esteban Ochoa (Root)', email: 'admin@urbix.ph', role: 'super_admin', copropropiedad: 'Global' },
    { id: 2, name: 'Carlos Mario Pineda', email: 'carlos.admin@gmail.com', role: 'admin', copropropiedad: 'Reserva del Tesoro' },
    { id: 3, name: 'Julián Arango (Cobrador)', email: 'cobros@urbix.ph', role: 'collector', copropropiedad: 'Torre El Poblado' }
  ]);

  const [connectionStatus, setConnectionStatus] = useState('Conectado y Sincronizado');
  const [errorLog, setErrorLog] = useState(null);

  // Simulación de auditoría y protección de rol raíz
  const handleRoleChange = (userId: number, newRole: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser && targetUser.role === 'super_admin' && newRole !== 'super_admin') {
      alert("⚠️ ACCIÓN BLOQUEADA: No se puede degradar al Superadministrador raíz para proteger la gobernanza del sistema.");
      return;
    }
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 p-6 lg:p-10 font-sans">
      
      {/* 1. HEADER DE SEGURIDAD Y ESTADO DEL SISTEMA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#141416] border border-[#262629] p-6 rounded-xl mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded">
              [ MASTER ROOT CONSOLE ]
            </span>
            <span className="text-[10px] font-mono text-slate-400">LEY 675 COMPLIANT</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white">
            Panel de Control del Superadministrador
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gobernanza global, control multi-tenant y auditoría de seguridad para el Valle de Aburrá.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#1c1c1f] px-4 py-2.5 rounded-lg border border-[#262629]">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className="text-xs font-mono">
            <p className="text-slate-300 font-bold">DB Status: {connectionStatus}</p>
            <p className="text-slate-500">RLS Active • Supabase Secure</p>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS GLOBALES (FINANCIERO / OPERATIVO) */}
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
            <span className="text-xs font-mono uppercase">Copropiedades Activas</span>
            <Building2 className="text-cyan-400" size={20} />
          </div>
          <div className="text-3xl font-black font-mono text-white">12 Edificios</div>
          <p className="text-xs text-slate-400 mt-1">Medellín, Envigado, Sabaneta</p>
        </div>

        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Cartera Crítica (+90d)</span>
            <AlertTriangle className="text-amber-400" size={20} />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400">$34.150.000</div>
          <p className="text-xs text-slate-400 mt-1">Listos para paquete prejurídico</p>
        </div>

        <div className="bg-[#141416] border border-[#262629] p-5 rounded-xl">
          <div className="flex justify-between items-center text-slate-400 mb-2">
            <span className="text-xs font-mono uppercase">Integridad de Roles (RBAC)</span>
            <ShieldCheck className="text-emerald-400" size={20} />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400">Blindado</div>
          <p className="text-xs text-slate-400 mt-1">0 errores de permisos root</p>
        </div>
      </div>

      {/* 3. SECCIÓN DE GESTIÓN DE COPROPIEDADES (TENANTS) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 size={18} className="text-emerald-400" /> Copropiedades Administradas
            </h2>
            <button className="bg-emerald-500 text-slate-950 font-bold text-xs px-3 py-1.5 rounded hover:bg-emerald-400 transition cursor-pointer">
              + Nueva Copropiedad
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
                <tr>
                  <th className="p-3">Edificio / Conjunto</th>
                  <th className="p-3">Ubicación</th>
                  <th className="p-3">Recaudo</th>
                  <th className="p-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262629]">
                {coproperties.map(copro => (
                  <tr key={copro.id} className="hover:bg-[#1c1c1f]/50 transition">
                    <td className="p-3 font-medium text-white">{copro.name}</td>
                    <td className="p-3 text-slate-400">{copro.city}</td>
                    <td className="p-3 font-mono text-emerald-400">{copro.collectionRate}</td>
                    <td className="p-3">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono">
                        {copro.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. GESTOR DE USUARIOS Y ROLES (PROTECCIÓN CONTRA ELIMINACIÓN DE ROOT) */}
        <div className="bg-[#141416] border border-[#262629] rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users size={18} className="text-cyan-400" /> Control de Permisos y Roles (RBAC)
            </h2>
            <button className="bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs px-3 py-1.5 rounded hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer">
              <UserPlus size={14} /> Asignar Usuario
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1c1c1f] text-slate-400 font-mono text-xs">
                <tr>
                  <th className="p-3">Usuario / Email</th>
                  <th className="p-3">Rol Actual</th>
                  <th className="p-3">Asignación</th>
                  <th className="p-3 text-right">Acción</th>
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
                    <td className="p-3 text-xs text-slate-300">{u.copropropiedad}</td>
                    <td className="p-3 text-right">
                      <select 
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-[#1c1c1f] border border-[#262629] text-xs text-slate-200 rounded p-1 font-mono focus:border-emerald-500 outline-none cursor-pointer"
                      >
                        <option value="super_admin">Super Admin</option>
                        <option value="admin">Administrador</option>
                        <option value="collector">Cobrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
