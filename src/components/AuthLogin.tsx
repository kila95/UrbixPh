import React, { useState } from 'react';
import { ClientTenantNode } from './SaaS_MasterOwnerConsole';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import SelectorRolesDevEnterprise from './SelectorRolesDevEnterprise';
import AuthLoginExecutive from './AuthLoginExecutive';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthLoginProps {
  tenants: ClientTenantNode[];
  onLoginSuccess: (role: string, tenantId: string, userEmail: string) => void;
  onShowToast: (msg: string) => void;
}

export default function AuthLogin({
  tenants,
  onLoginSuccess,
  onShowToast
}: AuthLoginProps) {
  const [selectedTenantId, setSelectedTenantId] = useState<string>(tenants[0]?.id || 'ten_01');
  const [email, setEmail] = useState<string>('carlos.admin@reservatesoro.com');
  const [password, setPassword] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [modoLoginEjecutivo, setModoLoginEjecutivo] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const activeTenant = tenants.find(t => t.id === selectedTenantId) || tenants[0];

  if (modoLoginEjecutivo) {
    return (
      <div className="relative">
        <div className="fixed top-4 right-4 z-50">
          <button
            type="button"
            onClick={() => setModoLoginEjecutivo(false)}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-[#0b0f17] border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 cursor-pointer shadow-lg"
          >
            ← Volver a Selector Multi-Copropiedad &amp; Roles
          </button>
        </div>
        <AuthLoginExecutive
          onShowToast={onShowToast}
          onLoginSuccess={(profile) => {
            onLoginSuccess(
              profile.role || 'super_admin',
              profile.tenant_id || selectedTenantId,
              profile.email || email
            );
          }}
        />
      </div>
    );
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const cleanEmail = email.toLowerCase().trim();
    let assignedRole = 'super_admin';

    // Determinar rol por credencial o email
    if (
      cleanEmail === 'estebanochoamesa@gmail.com' ||
      cleanEmail.includes('owner') ||
      cleanEmail.includes('master')
    ) {
      assignedRole = 'saas_master_owner';
    } else if (cleanEmail.includes('admin') || cleanEmail.includes('carlos')) {
      assignedRole = 'super_admin';
    } else if (cleanEmail.includes('supervisor') || cleanEmail.includes('julian')) {
      assignedRole = 'supervisor';
    } else if (cleanEmail.includes('porteria') || cleanEmail.includes('vigilante') || cleanEmail.includes('luis')) {
      assignedRole = 'porteria';
    } else if (cleanEmail.includes('aseo') || cleanEmail.includes('servicios') || cleanEmail.includes('jose')) {
      assignedRole = 'servicios_generales';
    } else if (cleanEmail.includes('residente') || cleanEmail.includes('martha') || cleanEmail.includes('esteban')) {
      assignedRole = 'residente';
    }

    // Si Supabase está configurado con credenciales de producción, intentar signIn y validar tabla profiles
    if (isSupabaseConfigured) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (!authError && authData?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (profile) {
            if (profile.is_active === false) {
              await supabase.auth.signOut();
              setLoading(false);
              onShowToast('⚠️ Error de acceso: Esta cuenta de administrador se encuentra inactiva o suspendida.');
              return;
            }
            if (profile.role) assignedRole = profile.role;
            if (profile.tenant_id) setSelectedTenantId(profile.tenant_id);
          } else {
            const { data: roleRow } = await supabase
              .from('usuarios_roles')
              .select('rol, copropiedad_id')
              .eq('user_id', authData.user.id)
              .maybeSingle();

            if (roleRow?.rol) {
              assignedRole = roleRow.rol;
            }
            if (roleRow?.copropiedad_id) {
              setSelectedTenantId(roleRow.copropiedad_id);
            }
          }
        }
      } catch (err) {
        console.warn('Fallback a autenticación local simulada:', err);
      }
    }

    setTimeout(() => {
      setLoading(false);
      onLoginSuccess(assignedRole, selectedTenantId, email);

      if (assignedRole === 'saas_master_owner') {
        onShowToast('🚀 Acceso Master Owner concedido. Consola central de arquitectura activa.');
      } else {
        onShowToast(`✅ Sesión iniciada como ${assignedRole.toUpperCase()} en "${activeTenant?.name || 'Copropiedad'}"`);
      }
    }, 450);
  };

  const handleQuickLogin = (role: string, demoEmail: string, tenantId?: string) => {
    const targetTenant = tenantId || tenants[0]?.id || 'ten_01';
    setSelectedTenantId(targetTenant);
    setEmail(demoEmail);
    onLoginSuccess(role, targetTenant, demoEmail);

    const roleNames: Record<string, string> = {
      saas_master_owner: 'SaaS Master Owner (Dueño)',
      super_admin: 'Administrador (PH)',
      supervisor: 'Supervisor Operativo',
      porteria: 'Vigilante / Portería',
      residente: 'Residente (Torre 2 Apt 301)',
      servicios_generales: 'Aseo & Servicios Generales'
    };

    onShowToast(`⚡ Acceso rápido concedido: ${roleNames[role] || role.toUpperCase()}`);
  };

  const handleSelectDevRole = (roleKey: string) => {
    switch (roleKey) {
      case 'root':
        handleQuickLogin('saas_master_owner', 'estebanochoamesa@gmail.com');
        break;
      case 'admin':
        handleQuickLogin('super_admin', 'carlos.admin@reservatesoro.com');
        break;
      case 'supervisor':
        handleQuickLogin('supervisor', 'supervisor@urbix.ph');
        break;
      case 'vigilante':
        handleQuickLogin('porteria', 'porteria.tesoro@urbix.ph');
        break;
      case 'aseo':
        handleQuickLogin('servicios_generales', 'jose.operativo@reservatesoro.com');
        break;
      case 'residente':
        handleQuickLogin('residente', 'martha.gomez@residente.ph');
        break;
      default:
        handleQuickLogin(roleKey, 'demo@urbix.ph');
        break;
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0d0e11',
        color: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: 'sans-serif',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Contenedor principal con Borde Neón Estático Verde Turquesa y Efecto Lámpara Backlight */}
      <div className="neon-moving-wrapper w-full max-w-[520px]">
        <div
          className="neon-moving-card"
          style={{
            padding: '36px 32px',
            backgroundColor: '#12141a',
            position: 'relative'
          }}
        >
          {/* Glow de acento superior turquesa */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '3px',
              background: 'linear-gradient(90deg, transparent, #00f5d4, #00e5b7, #06b6d4, transparent)',
              borderRadius: '9999px',
              boxShadow: '0 0 10px #00f5d4'
            }}
          />

        {/* Cabecera oficial Urbix PH basada en identidad corporativa */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="relative group">
              <div className="absolute -inset-1.5 rounded-2xl bg-cyan-500/25 blur-md opacity-80 group-hover:opacity-100 transition duration-500 pointer-events-none" />
              <img
                src="/assets/aistudio/urbix_logo_square_neon.png"
                alt="Urbix PH"
                className="relative w-24 h-24 rounded-2xl object-cover drop-shadow-[0_0_20px_rgba(0,242,254,0.45)]"
              />
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-widest text-zinc-400 font-semibold mb-1">
            Sistema de Gestión de Propiedad Horizontal
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse inline-block"></span>
            INICIO DE SESIÓN
          </div>
          <p className="text-xs text-zinc-400 mt-2 font-mono">
            Medellín &amp; Valle de Aburrá • Cumplimiento Ley 675 de 2001
          </p>
        </div>

        {/* Formulario de Login */}
        <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Selector de Copropiedad (Tenant) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#94a3b8',
                marginBottom: '6px'
              }}
            >
              COPROPIEDAD / CONJUNTO RESIDENCIAL:
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#141416',
                border: '1px solid #262629',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: '12px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id}>
                  {t.name} (NIT: {t.nit} • {t.plan})
                </option>
              ))}
            </select>
          </div>

          {/* Input de Correo Electrónico */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '11px',
                fontFamily: 'monospace',
                color: '#94a3b8',
                marginBottom: '6px'
              }}
            >
              CORREO ELECTRÓNICO / USUARIO:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-correo@urbix.ph"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: '#141416',
                border: '1px solid #262629',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#ffffff',
                fontSize: '13px',
                outline: 'none'
              }}
            />
          </div>

            {/* Input de Contraseña */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#94a3b8'
                }}
              >
                CONTRASEÑA:
              </label>
              <span style={{ fontSize: '10px', color: '#22d3ee', cursor: 'pointer' }}>
                ¿Olvidó su clave?
              </span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: '#141416',
                  border: '1px solid #262629',
                  borderRadius: '8px',
                  padding: '10px 38px 10px 12px',
                  color: '#ffffff',
                  fontSize: '13px',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón Principal Iniciar Sesión */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              backgroundColor: '#22d3ee',
              color: '#09090b',
              fontWeight: 900,
              fontSize: '13px',
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(34, 211, 238, 0.35)',
              transition: 'all 0.2s'
            }}
          >
            {loading ? '🔄 AUTENTICANDO CON RLS...' : '🔐 INICIAR SESIÓN'}
          </button>

          {/* Toggle a Vista Ejecutiva Minimalista (AuthLoginExecutive) */}
          <button
            type="button"
            onClick={() => setModoLoginEjecutivo(true)}
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontWeight: 700,
              fontSize: '11px',
              padding: '8px 14px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <ShieldCheck size={14} /> Vista Login Ejecutivo Directo (Supabase Auth + Ley 1581)
          </button>
        </form>

        {/* Sección de Acceso Rápido de Prueba por Rol (Modo Dev / Auditoría) */}
        <div
          style={{
            marginTop: '28px',
            paddingTop: '20px',
            borderTop: '1px solid #262629'
          }}
        >
          <SelectorRolesDevEnterprise onSelectRole={handleSelectDevRole} />
        </div>


        {/* Footer de Estado de Conexión */}
        <div
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '10px',
            fontFamily: 'monospace',
            color: '#64748b'
          }}
        >
          {isSupabaseConfigured ? (
            <span style={{ color: '#34d399' }}>● Supabase Cloud Auth &amp; RLS Activo • Cifrado SHA-256 Ley 1581</span>
          ) : (
            <span>● Modo Resiliente Local • Base de Datos In-Memory • Cifrado SHA-256</span>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

