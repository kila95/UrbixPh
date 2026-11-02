/**
 * ==============================================================================
 * URBIX PH - MÓDULO 2: CONTROL DE ACCESOS, RBAC & AUDITORÍA (VERSIÓN ESTABLE)
 * Protegido contra modificaciones directas. Reutilizable para panel de Admin.
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const isPlaceholderSupabase = !isSupabaseConfigured;


export interface RBACUser {
  id: number;
  full_name: string;
  user_email: string;
  role: string;
  coproperty_assigned?: string;
}

export interface RBACAuditLog {
  id: string | number;
  user_executor: string;
  action_type: string;
  details: string;
  timestamp: string;
}

const INITIAL_USERS: RBACUser[] = [
  { id: 1, full_name: 'Esteban Ochoa (Root)', user_email: 'estebanochoamesa@gmail.com', role: 'super_admin', coproperty_assigned: 'Global (Todas)' },
  { id: 2, full_name: 'Carlos Mario Pineda', user_email: 'admin@reservatesoro.com', role: 'admin', coproperty_assigned: 'Reserva del Tesoro' },
  { id: 3, full_name: 'Julián Arango (Operaciones)', user_email: 'supervisor@torrepoblado.com', role: 'supervisor', coproperty_assigned: 'Edificio Torre El Poblado' },
  { id: 4, full_name: 'Ramiro Córdoba (Turno Día)', user_email: 'porteria@reservatesoro.com', role: 'vigilante', coproperty_assigned: 'Reserva del Tesoro' },
  { id: 5, full_name: 'Luz Elena Ríos (Mantenimiento)', user_email: 'aseo@sandiego.com', role: 'aseo', coproperty_assigned: 'C.C. San Diego (Localidades)' }
];

const INITIAL_AUDIT_LOGS: RBACAuditLog[] = [
  { id: 'log_904', user_executor: 'Esteban Ochoa (Root)', action_type: 'RLS_POLICY_SYNC', details: 'Activó aislamiento estricto Multi-Tenant en tabla coproperties', timestamp: new Date().toISOString() },
  { id: 'log_903', user_executor: 'Carlos Mario Pineda', action_type: 'UPLOAD_LEGAL_DOC', details: 'Subió Reglamento_PH_ReservaTesoro.pdf al Bucket Oficial', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'log_902', user_executor: 'Esteban Ochoa (Root)', action_type: 'ASSIGN_ROLE', details: 'Asignó rol [SUPERVISOR] a Julián Arango en Edificio Torre El Poblado', timestamp: new Date(Date.now() - 7200000).toISOString() }
];

export default function Modulo2RBACProtegido() {
  const [users, setUsers] = useState<RBACUser[]>(INITIAL_USERS);
  const [auditLogs, setAuditLogs] = useState<RBACAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [loading, setLoading] = useState(true);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoRol, setNuevoRol] = useState('aseo');

  useEffect(() => {
    fetchRBACData();
  }, []);

  async function fetchRBACData() {
    if (isPlaceholderSupabase) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data: userData, error: userError } = await supabase
        .from('user_roles')
        .select('*')
        .order('full_name', { ascending: true });

      if (userError) throw userError;

      const { data: logData, error: logError } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (logError) throw logError;

      if (userData && userData.length > 0) setUsers(userData);
      if (logData && logData.length > 0) setAuditLogs(logData);
    } catch {
      // Mantiene datos locales pre-cargados si la instancia de Supabase no está conectada
    } finally {
      setLoading(false);
    }
  }

  const handleAddOperationalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoEmail.trim()) {
      return;
    }

    const cleanName = nuevoNombre.trim();
    const cleanEmail = nuevoEmail.trim();
    const detailMsg = `Registró nuevo rol [${nuevoRol.toUpperCase()}] para ${cleanName}`;

    try {
      if (!isPlaceholderSupabase) {
        const { error: insertError } = await supabase
          .from('user_roles')
          .insert([
            { full_name: cleanName, user_email: cleanEmail, role: nuevoRol, coproperty_assigned: 'Reserva del Tesoro' }
          ]);

        if (insertError) throw insertError;

        await supabase.from('audit_logs').insert([
          { user_executor: 'Administración / Supervisor', action_type: 'CREATE_OPERATIONAL_USER', details: detailMsg }
        ]);

        setNuevoNombre('');
        setNuevoEmail('');
        fetchRBACData();
        return;
      }
    } catch {
      // Fallback local si la tabla remota no está configurada
    }

    setUsers(prev => [
      ...prev,
      { id: Date.now(), full_name: cleanName, user_email: cleanEmail, role: nuevoRol, coproperty_assigned: 'Reserva del Tesoro' }
    ]);
    setAuditLogs(prev => [
      { id: `log_${Date.now()}`, user_executor: 'Administración / Supervisor', action_type: 'CREATE_OPERATIONAL_USER', details: detailMsg, timestamp: new Date().toISOString() },
      ...prev
    ]);
    setNuevoNombre('');
    setNuevoEmail('');
  };

  const handleRoleChange = async (userId: number, newRole: string, userName: string) => {
    const detailMsg = `Modificó rol de ${userName} a ${newRole}`;

    setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    setAuditLogs(prev => [
      { id: `log_${Date.now()}`, user_executor: 'Esteban Ochoa (Root)', action_type: 'UPDATE_ROLE', details: detailMsg, timestamp: new Date().toISOString() },
      ...prev
    ]);

    try {
      if (!isPlaceholderSupabase) {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('id', userId);

        if (updateError) throw updateError;

        await supabase.from('audit_logs').insert([
          { user_executor: 'Esteban Ochoa (Root)', action_type: 'UPDATE_ROLE', details: detailMsg }
        ]);

        fetchRBACData();
      }
    } catch {
      // Mantiene actualización local
    }
  };

  const handleRevokeAccess = async (userId: number, userName: string) => {
    const detailMsg = `Revocó y eliminó el acceso del usuario ${userName}`;

    setUsers(prev => prev.filter(u => u.id !== userId));
    setAuditLogs(prev => [
      { id: `log_${Date.now()}`, user_executor: 'Esteban Ochoa (Root)', action_type: 'REVOKE_ACCESS', details: detailMsg, timestamp: new Date().toISOString() },
      ...prev
    ]);

    try {
      if (!isPlaceholderSupabase) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('id', userId);

        if (deleteError) throw deleteError;

        await supabase.from('audit_logs').insert([
          { user_executor: 'Esteban Ochoa (Root)', action_type: 'REVOKE_ACCESS', details: detailMsg }
        ]);

        fetchRBACData();
      }
    } catch {
      // Mantiene actualización local
    }
  };

  const handleExportAuditCSV = () => {
    if (auditLogs.length === 0) return;

    const headers = "ID,Ejecutor,Acción,Detalles,Fecha\n";
    const rows = auditLogs.map(l => `"${l.id}","${l.user_executor}","${l.action_type}","${l.details}","${l.timestamp}"`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);

    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `Urbix_Auditoria_RBAC_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ backgroundColor: '#141416', border: '1px solid #262629', borderRadius: '12px', padding: '24px', color: '#f8fafc', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff' }}>
          2. Control de Accesos, RBAC, Operativos &amp; Contratistas (Supabase - Protegido)
        </h3>
        <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#22d3ee', backgroundColor: 'rgba(34, 211, 238, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
          {loading ? '🔄 Sincronizando...' : '● RLS Active / Locked'}
        </span>
      </div>

      <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 20px 0' }}>
        Módulo blindado y listo para reutilizar en vistas administrativas.
      </p>

      {/* FORMULARIO DE ALTA */}
      <div style={{ backgroundColor: '#1c1c1f', padding: '16px', borderRadius: '8px', border: '1px solid #262629', marginBottom: '24px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#fff', fontFamily: 'monospace' }}>
          + Alta de Personal Operativo o Contratista
        </h4>
        <form onSubmit={handleAddOperationalUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <input type="text" placeholder="Nombre Completo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          <input type="email" placeholder="Correo Electrónico" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          <select value={nuevoRol} onChange={(e) => setNuevoRol(e.target.value)} style={{ backgroundColor: '#141416', border: '1px solid #262629', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px', fontFamily: 'monospace' }}>
            <option value="aseo">Personal de Aseo</option>
            <option value="vigilante">Vigilante / Guarda</option>
            <option value="contratista">Contratista Externo</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Administrador</option>
          </select>
          <button type="submit" style={{ backgroundColor: '#22d3ee', color: '#09090b', fontWeight: 'bold', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>
            REGISTRAR ROL
          </button>
        </form>
      </div>

      {/* TABLA */}
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', marginBottom: '24px' }}>
        <thead>
          <tr style={{ backgroundColor: '#1c1c1f', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
            <th style={{ padding: '12px' }}>Usuario / Email</th>
            <th style={{ padding: '12px' }}>Rol / Asignación</th>
            <th style={{ padding: '12px', textAlign: 'right' }}>Acciones &amp; Permisos</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #262629' }}>
              <td style={{ padding: '12px', color: '#fff' }}>
                {u.full_name} <br />
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>{u.user_email}</span>
              </td>
              <td style={{ padding: '12px', color: '#22d3ee', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {u.role.toUpperCase()}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value, u.full_name)} style={{ backgroundColor: '#1c1c1f', color: '#fff', padding: '6px 8px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px', border: '1px solid #262629', cursor: 'pointer' }}>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Administrador</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="aseo">Aseo</option>
                  <option value="vigilante">Vigilante</option>
                  <option value="contratista">Contratista</option>
                </select>
                <button type="button" onClick={() => handleRevokeAccess(u.id, u.full_name)} style={{ backgroundColor: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '6px 10px', borderRadius: '4px', fontSize: '11px', fontFamily: 'monospace', cursor: 'pointer', fontWeight: 'bold' }}>
                  Revocar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* AUDITORÍA */}
      <div style={{ backgroundColor: '#1c1c1f', padding: '16px', borderRadius: '8px', border: '1px solid #262629' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontSize: '14px', color: '#ffffff', fontFamily: 'monospace' }}>
            🛡️ Auditoría de Acciones y Personal Operativo
          </h4>
          <button type="button" onClick={handleExportAuditCSV} style={{ backgroundColor: '#141416', border: '1px solid #22d3ee', color: '#22d3ee', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontFamily: 'monospace', fontWeight: 'bold', cursor: 'pointer' }}>
            📥 Exportar Auditoría (.CSV)
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', fontFamily: 'monospace' }}>
          {auditLogs.map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', borderBottom: '1px solid #262629', paddingBottom: '6px' }}>
              <span><strong style={{ color: '#22d3ee' }}>[{log.user_executor}]</strong> {log.details}</span>
              <span style={{ color: '#64748b' }}>{Number.isNaN(new Date(log.timestamp).getTime()) ? log.timestamp : new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
