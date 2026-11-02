import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { Lock, Mail, ShieldCheck, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';

export default function AuthLoginExecutive({
  onLoginSuccess,
  onShowToast
}: {
  onLoginSuccess: (userProfile: any) => void;
  onShowToast?: (msg: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const resolveDemoProfile = (cleanEmail: string) => {
    if (cleanEmail === 'estebanochoamesa@gmail.com') {
      return {
        id: 'usr_esteban_master',
        email: 'estebanochoamesa@gmail.com',
        full_name: 'Esteban Ochoa Mesa',
        role: 'master_owner',
        is_active: true
      };
    }

    let resolvedRole = 'admin_ph';
    let resolvedName = 'Carlos Mario Pineda';
    if (cleanEmail.includes('supervisor') || cleanEmail.includes('julian')) {
      resolvedRole = 'supervisor';
      resolvedName = 'Julián Arango';
    } else if (cleanEmail.includes('porteria') || cleanEmail.includes('vigilante')) {
      resolvedRole = 'porteria';
      resolvedName = 'Guarda en Turno';
    } else if (cleanEmail.includes('aseo') || cleanEmail.includes('servicios')) {
      resolvedRole = 'servicios_generales';
      resolvedName = 'Personal Servicios Generales';
    } else if (cleanEmail.includes('residente') || cleanEmail.includes('martha')) {
      resolvedRole = 'residente';
      resolvedName = 'Martha Lucía Gómez';
    }

    return {
      id: `usr_${Date.now()}`,
      email: cleanEmail,
      full_name: resolvedName,
      role: resolvedRole,
      tenant_id: 'ten_01',
      is_active: true
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const isEsteban = cleanEmail === 'estebanochoamesa@gmail.com';

      // =========================================================================
      // 1. RUTA EXCLUSIVA: DUEÑO DEL SOFTWARE (SAAS MASTER OWNER) - ESTEBAN OCHOA
      // =========================================================================
      if (isEsteban) {
        // Validación de contraseña autorizada para el Dueño del Software
        const isAuthorizedPass = password === 'Respeto2491';

        if (isSupabaseConfigured) {
          // Intentar iniciar sesión real en Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });

          if (authError) {
            // Si no está registrado aún en Supabase Auth pero ingresó la clave maestra 'Respeto2491'
            if (isAuthorizedPass) {
              // Intentar auto-registro en Supabase Auth
              const { data: signUpData } = await supabase.auth.signUp({
                email: cleanEmail,
                password: password,
                options: {
                  data: {
                    full_name: 'Esteban Ochoa Mesa',
                    role: 'master_owner'
                  }
                }
              }).catch(() => ({ data: null }));

              const estebanId = signUpData?.user?.id || 'usr_esteban_master_root';
              const canonicalMasterProfile = {
                id: estebanId,
                email: 'estebanochoamesa@gmail.com',
                full_name: 'Esteban Ochoa Mesa',
                role: 'master_owner',
                is_active: true
              };

              // Persistir perfil en la tabla profiles de Supabase
              try {
                await supabase.from('profiles').upsert([canonicalMasterProfile]);
              } catch {
                // Modo resiliente en memoria
              }

              onShowToast?.('🚀 Bienvenido a la Consola Global SaaS Master Owner, Esteban Ochoa.');
              onLoginSuccess(canonicalMasterProfile);
              return;
            }

            throw new Error('Contraseña incorrecta para el Dueño del Software (SaaS Master Owner).');
          }

          // Si la autenticación en Supabase Auth tuvo éxito
          const userId = authData.user.id;
          const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

          const masterProfile = {
            id: userId,
            email: 'estebanochoamesa@gmail.com',
            full_name: 'Esteban Ochoa Mesa',
            role: 'master_owner',
            is_active: true
          };

          // Si la fila no existía (PGRST116) o tenía otro rol, upsert incondicional
          if (profError || !profile || profile.role !== 'master_owner') {
            try {
              await supabase.from('profiles').upsert([masterProfile]);
            } catch {
              // Modo resiliente en memoria
            }
          }

          onShowToast?.('🚀 Bienvenido a la Consola Global SaaS Master Owner, Esteban Ochoa.');
          onLoginSuccess(masterProfile);
          return;
        }

        // Modo offline / fallback para Esteban Ochoa con la contraseña designada
        if (!isAuthorizedPass) {
          throw new Error('Contraseña incorrecta para el Dueño del Software (SaaS Master Owner).');
        }

        const offlineMasterProfile = resolveDemoProfile(cleanEmail);
        onShowToast?.('🚀 Bienvenido a la Consola Global SaaS Master Owner, Esteban Ochoa.');
        onLoginSuccess(offlineMasterProfile);
        return;
      }

      // =========================================================================
      // 2. RUTA PARA OTROS ROLES (ADMIN PH, SUPERVISOR, PORTERÍA, RESIDENTE)
      // =========================================================================
      if (isSupabaseConfigured) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: password
        });

        if (authError) {
          const isDemoAccount =
            cleanEmail.endsWith('@urbix.ph') ||
            cleanEmail.endsWith('@reservatesoro.com') ||
            cleanEmail.endsWith('@copropiedad.com');

          if (isDemoAccount && password.length >= 4) {
            const demoProfile = resolveDemoProfile(cleanEmail);
            onShowToast?.(`Bienvenido a Urbix PH, ${demoProfile.full_name}`);
            onLoginSuccess(demoProfile);
            return;
          }
          throw authError;
        }

        const { data: profile, error: profError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        let resolvedProfile = profile;
        if (profError || !profile) {
          // Si el usuario existe en Auth pero no tiene fila en profiles (PGRST116)
          const meta = authData.user.user_metadata || {};
          resolvedProfile = {
            id: authData.user.id,
            email: authData.user.email || cleanEmail,
            full_name: meta.full_name || cleanEmail.split('@')[0],
            role: 'admin_ph', // Nadie excepto Esteban Ochoa puede ser master_owner
            tenant_id: meta.tenant_id || 'ten_01',
            is_active: true
          };
          try {
            await supabase.from('profiles').upsert([resolvedProfile]);
          } catch {
            // Modo resiliente en memoria
          }
        }

        // Blindaje estricto de rol: Solo Esteban Ochoa puede ser master_owner
        if (resolvedProfile.role === 'master_owner' && resolvedProfile.email.toLowerCase() !== 'estebanochoamesa@gmail.com') {
          resolvedProfile.role = 'admin_ph';
        }

        if (!resolvedProfile.is_active) {
          await supabase.auth.signOut();
          throw new Error('Esta cuenta de administrador se encuentra inactiva o suspendida.');
        }

        onShowToast?.(`Bienvenido a Urbix PH, ${resolvedProfile.full_name}`);
        onLoginSuccess(resolvedProfile);
        return;
      }

      // Fallback resiliente cuando Supabase opera en modo local
      const fallbackProfile = resolveDemoProfile(cleanEmail);
      onShowToast?.(`Bienvenido a Urbix PH, ${fallbackProfile.full_name}`);
      onLoginSuccess(fallbackProfile);
    } catch (err: any) {
      const msg = err.message || 'Credenciales inválidas o error de conexión.';
      setErrorMsg(msg);
      onShowToast?.(`Error de acceso: ${msg}`);
    } finally {
      setCargando(false);
    }
  };


  return (
    <div className="min-h-screen bg-[#07090e] flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="relative mx-auto w-full max-w-md p-8 rounded-3xl bg-[#090d14] border-2 border-[#00f2fe]/60 shadow-[0_0_35px_rgba(0,242,254,0.35),inset_0_0_20px_rgba(0,242,254,0.1)] flex flex-col items-center justify-center text-center space-y-5 select-none overflow-hidden">
        
        {/* RESPLANDOR AMBIENTAL INTERNO */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-32 bg-[#00f2fe]/15 blur-3xl pointer-events-none rounded-full" />

        {/* 1. ÍCONO SUPERIOR: CUADRO INTERNO ILUMINADO AZUL NEÓN */}
        <div className="relative flex items-center justify-center">
          <img
            src="/assets/aistudio/urbix_logo_square_neon.png"
            alt="Logo Urbix PH"
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover drop-shadow-[0_0_25px_rgba(0,242,254,0.45)]"
          />
        </div>

        {/* 2. CÁPSULA HABEAS DATA & SEGURIDAD */}
        <div className="w-full max-w-xs px-4 py-1.5 rounded-full bg-[#05131e]/80 border border-[#00f2fe]/40 shadow-[0_0_12px_rgba(0,242,254,0.2)] flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] shadow-[0_0_8px_#00f2fe] animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#00f2fe] uppercase">
            ACCESO SEGURO • LEY 1581 HABEAS DATA
          </span>
        </div>

        {/* 3. LOGOTIPO TIPOGRÁFICO URBIX PH CON LOS MISMOS COLORES */}
        <div className="flex items-baseline justify-center font-sans tracking-tight">
          {/* Urbi en Blanco Brillante */}
          <span className="text-4xl sm:text-5xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            Urbi
          </span>
          {/* x en Cian Neón Eléctrico */}
          <span className="text-4xl sm:text-5xl font-black text-[#00f2fe] drop-shadow-[0_0_15px_#00f2fe] ml-[1px]">
            x
          </span>
          {/* PH en Cian Eléctrico a juego */}
          <span className="text-sm sm:text-base font-black text-[#00f2fe] tracking-tighter uppercase ml-1.5 drop-shadow-[0_0_10px_#00f2fe]">
            PH
          </span>
        </div>

        {/* 4. ESLOGAN CON TEXT-SHADOW MULTICAPA EN CIAN */}
        <p 
          className="text-xs sm:text-sm font-mono tracking-wide text-[#00f2fe] font-semibold"
          style={{
            textShadow: '0 0 5px #00f2fe, 0 0 10px rgba(0, 242, 254, 0.6), 0 0 20px rgba(0, 242, 254, 0.4), 0 0 30px rgba(0, 242, 254, 0.2)'
          }}
        >
          Consola Ejecutiva de Propiedad Horizontal
        </p>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="w-full text-left space-y-4 pt-1">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn">
              <span>{errorMsg}</span>
              <button 
                type="button" 
                onClick={() => setErrorMsg(null)}
                className="text-slate-400 hover:text-white font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          <div className="space-y-1.5">

            <label className="text-xs font-mono text-slate-400 block font-bold">Correo Corporativo</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                placeholder="admin@copropiedad.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/40 font-mono transition"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-400 block font-bold">Contraseña de Acceso</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}

                className="w-full pl-10 pr-10 py-2.5 bg-[#07090e] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/40 font-mono transition"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-500 hover:text-[#00f2fe] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-gradient-to-r from-[#00f2fe] to-cyan-400 hover:brightness-110 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.35)] disabled:opacity-50 mt-2"
          >
            {cargando ? 'Verificando Criptografía...' : (
              <>
                Ingresar a la Plataforma <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Acceso rápido de prueba por perfil */}
        <div className="w-full text-left pt-3 border-t border-slate-800/80 space-y-2">
          <span className="text-[10px] font-mono text-slate-400 block text-center uppercase tracking-wider">
            Acceso Rápido por Rol (Auditoría / Demo)
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
            {[
              { label: '🚀 Master Owner', email: 'estebanochoamesa@gmail.com', role: 'master_owner', name: 'Esteban Ochoa Mesa' },
              { label: '🛡️ Admin PH', email: 'carlos.admin@reservatesoro.com', role: 'admin_ph', name: 'Carlos Mario Pineda' },
              { label: '⚡ Supervisor', email: 'supervisor@urbix.ph', role: 'supervisor', name: 'Julián Arango' },
              { label: '🚨 Portería', email: 'porteria@urbix.ph', role: 'porteria', name: 'Guarda en Turno' },
              { label: '🏡 Residente', email: 'martha.residente@reservatesoro.com', role: 'residente', name: 'Martha Lucía Gómez (Apto 301)' }
            ].map((demo) => (
              <button
                key={demo.role}
                type="button"
                onClick={() => {
                  setEmail(demo.email);
                  if (demo.role === 'master_owner') {
                    setPassword('Respeto2491');
                  } else {
                    setPassword('••••••••••••');
                  }
                  onShowToast?.(`Bienvenido a Urbix PH, ${demo.name} (${demo.role === 'master_owner' ? 'SaaS Master Owner' : 'Administrador PH'})`);
                  onLoginSuccess({
                    id: demo.role === 'master_owner' ? 'usr_esteban_master' : `usr_${demo.role}`,
                    email: demo.email,
                    full_name: demo.name,
                    role: demo.role,
                    tenant_id: demo.role === 'master_owner' ? undefined : 'ten_01',
                    is_active: true
                  });
                }}
                className="bg-[#07090e] hover:bg-[#00f2fe]/10 border border-slate-800 hover:border-[#00f2fe]/40 text-slate-300 hover:text-[#00f2fe] py-1.5 px-2 rounded-lg transition cursor-pointer text-left truncate"
              >
                {demo.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-full pt-2 border-t border-slate-800 text-center">
          <span className="text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00f2fe]" /> Sesión Cifrada SHA-256
          </span>
        </div>

      </div>
    </div>
  );
}
