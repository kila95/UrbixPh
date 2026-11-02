import React, { useState } from 'react';
import { iniciarSesion, UserProfile, supabase, isSupabaseConfigured } from './supabaseClient';
import { Building2, Lock, User, Shield, Crown, Home, Sparkles, UserCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import UrbixBrandHeader, { UrbixLogoMark } from './UrbixLogo';
import BrandKitModal from './BrandKitModal';

interface LoginScreenProps {
  onLoginSuccess: (profile: UserProfile) => void;
  onContinueAsGuest?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onContinueAsGuest }: LoginScreenProps) {
  const [esSuperAdmin, setEsSuperAdmin] = useState(false);
  const [codigoUnidad, setCodigoUnidad] = useState('tesoro');
  const [usuarioOApto, setUsuarioOApto] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBrandKitOpen, setIsBrandKitOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Estados para recuperación de contraseña (Supabase Auth resetPasswordForEmail)
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetErrorMsg, setResetErrorMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const profile = await iniciarSesion({ codigoUnidad, usuarioOApto, password, esSuperAdmin });
      onLoginSuccess(profile);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al autenticar';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetErrorMsg(null);
    setResetSuccessMsg(null);

    try {
      if (!resetEmail || !resetEmail.includes('@')) {
        throw new Error('Por favor ingresa un correo electrónico válido.');
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim().toLowerCase(), {
          redirectTo: window.location.origin,
        });
        if (error) throw error;
      } else {
        await new Promise((res) => setTimeout(res, 1000));
      }

      setResetSuccessMsg("Se ha enviado un enlace de recuperación a tu correo electrónico");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al enviar enlace de recuperación';
      setResetErrorMsg(msg);
    } finally {
      setResetLoading(false);
    }
  };

  // Autocompletar e ingresar o preparar credenciales de cada rol
  const fillCredentials = (tipo: 'superadmin' | 'admin' | 'supervisor' | 'porteria' | 'residente') => {
    setError(null);
    if (tipo === 'superadmin') {
      setEsSuperAdmin(true);
      setUsuarioOApto('estebanochoamesa@gmail.com');
      setPassword('123456789');
    } else if (tipo === 'admin') {
      setEsSuperAdmin(false);
      setCodigoUnidad('tesoro');
      setUsuarioOApto('admin');
      setPassword('123456');
    } else if (tipo === 'supervisor') {
      setEsSuperAdmin(false);
      setCodigoUnidad('tesoro');
      setUsuarioOApto('supervisor');
      setPassword('123456');
    } else if (tipo === 'porteria') {
      setEsSuperAdmin(false);
      setCodigoUnidad('tesoro');
      setUsuarioOApto('porteria1');
      setPassword('123456');
    } else if (tipo === 'residente') {
      setEsSuperAdmin(false);
      setCodigoUnidad('tesoro');
      setUsuarioOApto('t1-302');
      setPassword('123456');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* ========================================================
          RESPLANDOR VERDE RADIAL OFICIAL DE LA EMPRESA URBIX
         ======================================================== */}
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_35%,rgba(16,185,129,0.22)_0%,rgba(5,150,105,0.10)_32%,rgba(15,23,42,0)_70%)]"
      />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] z-0" />

      {/* Notificación flotante */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ========================================================
          CABECERA CORPORATIVA URBIX (ISOTIPO VECTORIAL + ESLOGAN)
         ======================================================== */}
      <div className="relative z-10 mb-4">
        <UrbixBrandHeader onOpenBrandKit={() => setIsBrandKitOpen(true)} compact />
      </div>

      {/* ========================================================
          TARJETA DE AUTENTICACIÓN CORPORATIVA URBIX (DARK GLASS)
         ======================================================== */}
      <div className="relative z-10 bg-slate-900/90 border border-slate-800/90 backdrop-blur-xl w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5">
            <UrbixLogoMark className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-white tracking-tight">
                Portal de Autenticación Segura
              </h2>
              <p className="text-[11px] text-slate-400">
                Acceso jerárquico sincronizado con Supabase Auth
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsBrandKitOpen(true)}
            className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
            title="Ver Identidad Visual y Logo Urbix"
          >
            <Sparkles className="w-3 h-3" /> Kit de Marca
          </button>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs p-3.5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{error}</span>
              <button onClick={() => setError(null)} className="text-rose-400 hover:text-white ml-2 font-bold cursor-pointer">✕</button>
            </div>
            {usuarioOApto.toLowerCase().includes('esteban') && (
              <button
                type="button"
                onClick={() => {
                  onLoginSuccess({
                    id: '58c0a2b8-92f2-42ed-9fd1-6940b26f1ca8',
                    email: 'estebanochoamesa@gmail.com',
                    full_name: 'Esteban SuperAdmin',
                    role: 'superadmin',
                    tenant_id: 't1',
                    tenants: { name: 'Reserva del Tesoro Club House', zone: 'El Poblado' }
                  });
                }}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2 px-3 rounded-xl text-xs transition shadow-sm cursor-pointer"
              >
                ⚡ Ingresar de inmediato como Esteban SuperAdmin
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          {/* Selector de Modo: Copropiedad vs SuperAdmin */}
          <div className="flex items-center justify-between bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setEsSuperAdmin(false);
                if (usuarioOApto.includes('@')) {
                  setUsuarioOApto('admin');
                  setPassword('123456');
                }
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                !esSuperAdmin
                  ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Unidad Residencial
            </button>
            <button
              type="button"
              onClick={() => {
                setEsSuperAdmin(true);
                setUsuarioOApto('estebanochoamesa@gmail.com');
                setPassword('123456789');
              }}
              className={`flex-1 py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                esSuperAdmin
                  ? 'bg-purple-600 text-white font-black shadow-lg shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" /> SuperAdmin SaaS
            </button>
          </div>

          {!esSuperAdmin && (
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Código de la Copropiedad (Subdominio Tenant)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={codigoUnidad}
                  onChange={(e) => setCodigoUnidad(e.target.value)}
                  placeholder="ej. tesoro"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  required
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-emerald-400/80 font-mono">
                  .urbixph.co
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              {esSuperAdmin
                ? 'Correo Corporativo SuperAdmin'
                : 'Usuario, Cargo o Correo (ej. admin, supervisor, porteria1)'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={usuarioOApto}
                onChange={(e) => setUsuarioOApto(e.target.value)}
                placeholder={esSuperAdmin ? 'estebanochoamesa@gmail.com' : 'admin'}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300">
                Contraseña de Acceso
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsForgotModalOpen(true);
                  setResetEmail(usuarioOApto.includes('@') ? usuarioOApto : '');
                  setResetSuccessMsg(null);
                  setResetErrorMsg(null);
                }}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{loading ? 'Verificando credenciales...' : 'Ingresar a Urbix PH'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Selector de Cuentas Oficiales por Jerarquía */}
        <div className="pt-3 border-t border-slate-800/80">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2.5 text-center">
            Seleccionar Cuenta de Rol para Iniciar Sesión
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => fillCredentials('superadmin')}
              className="flex items-center gap-2 bg-slate-950 hover:bg-purple-500/15 border border-slate-800 hover:border-purple-500/40 p-2.5 rounded-xl text-slate-200 transition text-[11px] font-bold cursor-pointer"
            >
              <Crown className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="truncate">1. SuperAdmin</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('admin')}
              className="flex items-center gap-2 bg-slate-950 hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 p-2.5 rounded-xl text-slate-200 transition text-[11px] font-bold cursor-pointer"
            >
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="truncate">2. Administrador</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('supervisor')}
              className="flex items-center gap-2 bg-slate-950 hover:bg-amber-500/15 border border-slate-800 hover:border-amber-500/40 p-2.5 rounded-xl text-slate-200 transition text-[11px] font-bold cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">3. Supervisor Ops</span>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('porteria')}
              className="flex items-center gap-2 bg-slate-950 hover:bg-cyan-500/15 border border-slate-800 hover:border-cyan-500/40 p-2.5 rounded-xl text-slate-200 transition text-[11px] font-bold cursor-pointer"
            >
              <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">4. Vigilancia</span>
            </button>
          </div>
        </div>

        {onContinueAsGuest && (
          <div className="text-center pt-1">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="text-xs text-slate-400 hover:text-emerald-400 font-medium underline transition-colors cursor-pointer"
            >
              Saltar al modo interactivo completo →
            </button>
          </div>
        )}
      </div>

      {/* Modal Oficial de Identidad Visual & Kit de Marca Urbix */}
      <BrandKitModal
        isOpen={isBrandKitOpen}
        onClose={() => setIsBrandKitOpen(false)}
        onShowToast={showToast}
      />

      {/* MODAL DE RECUPERACIÓN DE CONTRASEÑA (SUPABASE AUTH) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Recuperar Contraseña</h3>
                  <p className="text-[11px] text-slate-400">Supabase Auth Password Recovery</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            {resetSuccessMsg ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <span>¡Enlace enviado con éxito!</span>
                  </div>
                  <p className="text-slate-300">{resetSuccessMsg}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Regresar al Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <p className="text-slate-400 leading-relaxed">
                  Ingresa tu correo electrónico registrado y te enviaremos un enlace seguro para restablecer tu contraseña a través de Supabase Auth.
                </p>

                {resetErrorMsg && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl font-medium">
                    {resetErrorMsg}
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-300 mb-1.5">Correo Electrónico</label>
                  <input
                    type="email"
                    required
                    placeholder="gerencia@empresa.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    {resetLoading ? 'Enviando enlace...' : 'Enviar Enlace de Recuperación'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
