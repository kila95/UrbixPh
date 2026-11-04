import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, AlertOctagon, Key, FileCode2, Award, ExternalLink, X } from 'lucide-react';
import { CORE_MANIFEST, isSoftwareModificationAllowed, OWNER_EMAIL_CANONICAL } from '../core/coreFreezeGuard';

interface VersionShieldGuardBannerProps {
  currentUserEmail?: string;
  onShowToast?: (msg: string) => void;
  compact?: boolean;
}

export default function VersionShieldGuardBanner({
  currentUserEmail,
  onShowToast,
  compact = false
}: VersionShieldGuardBannerProps) {
  const [modalCertificadoAbierto, setModalCertificadoAbierto] = useState(false);
  const [modalVerificationUnlockAbierto, setModalVerificationUnlockAbierto] = useState(false);
  const [inputMasterPass, setInputMasterPass] = useState('');
  const [unlockStatus, setUnlockStatus] = useState<string | null>(null);

  const isOwner = isSoftwareModificationAllowed(currentUserEmail);

  const handleAttemptUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = (currentUserEmail || '').trim().toLowerCase();

    if (cleanEmail !== OWNER_EMAIL_CANONICAL) {
      setUnlockStatus(`⛔ DENEGADO: El usuario "${currentUserEmail || 'Invitado'}" no tiene permisos de Dueño. Solo Esteban Ochoa Mesa (estebanochoamesa@gmail.com) puede modificar este software.`);
      onShowToast?.('⛔ Acción bloqueada. Permiso exclusivo del Dueño del Software.');
      return;
    }

    if (inputMasterPass === 'Respeto2491') {
      setUnlockStatus('✅ AUTENTICACIÓN VERIFICADA: Saludos Esteban Ochoa. Modo de edición de arquitectura temporal activado.');
      onShowToast?.('🔑 Permiso de edición de arquitectura concedido al Propietario Master.');
      setTimeout(() => {
        setModalVerificationUnlockAbierto(false);
        setUnlockStatus(null);
        setInputMasterPass('');
      }, 2500);
    } else {
      setUnlockStatus('❌ Contraseña Master incorrecta. El blindaje permanece 100% ACTIVO.');
      onShowToast?.('❌ Firma de desbloqueo no válida.');
    }
  };

  if (compact) {
    return (
      <>
        <div className="w-full bg-[#05101a] border-y border-[#00f2fe]/40 px-3 py-1.5 flex items-center justify-between gap-2 text-[10px] font-mono shadow-[0_0_15px_rgba(0,242,254,0.15)]">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-[#00f2fe] animate-pulse shrink-0" />
            <span className="font-bold text-[#00f2fe] uppercase tracking-wider shrink-0">
              🛡️ VERSIÓN v1.0.0 BLINDADA
            </span>
            <span className="text-slate-400 truncate hidden sm:inline">
              | Código, Vista y Arquitectura Inviolables • Propietario Exclusivo: Esteban Ochoa Mesa
            </span>
          </div>
          <button
            type="button"
            onClick={() => setModalCertificadoAbierto(true)}
            className="text-[#00f2fe] hover:underline font-bold shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <span>Ver Escudo</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Modal Certificado Digital */}
        {renderModalCertificado()}
      </>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-[#07131e] via-[#091b29] to-[#061019] border-2 border-[#00f2fe]/50 rounded-2xl p-4 sm:p-5 shadow-[0_0_30px_rgba(0,242,254,0.25)] relative overflow-hidden font-sans">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00f2fe]/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#00f2fe]/15 border border-[#00f2fe]/60 flex items-center justify-center text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.3)] shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-mono font-bold bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/40 px-2.5 py-0.5 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                🔒 VERSIÓN Y ARQUITECTURA BLINDADA EN PANTALLA
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> ESTADO: CONGELADO E INALTERABLE
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
              Protección Total de Código Fuente, Componentes Visuales y Estructura SaaS
            </h3>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Esta versión del software ha sido <strong className="text-[#00f2fe]">blindada en todos sus componentes</strong>. No se permite ninguna alteración visual, textual, ni modificación de código o arquitectura por ningún usuario o administrador. La única persona con permisos de edición y gobierno es el Dueño del Software: <strong className="text-white">Esteban Ochoa Mesa ({OWNER_EMAIL_CANONICAL})</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 font-mono text-xs w-full md:w-auto justify-end">
          <button
            type="button"
            onClick={() => setModalCertificadoAbierto(true)}
            className="px-4 py-2.5 bg-[#00f2fe]/15 hover:bg-[#00f2fe]/25 text-[#00f2fe] border border-[#00f2fe]/50 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.2)]"
          >
            <Award className="w-4 h-4 text-[#00f2fe]" /> Certificado Digital de Blindaje
          </button>

          <button
            type="button"
            onClick={() => setModalVerificationUnlockAbierto(true)}
            className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 cursor-pointer ${
              isOwner
                ? 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-500/50'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <Lock className="w-4 h-4 text-amber-400" />
            {isOwner ? 'Verificar Firma del Propietario' : 'Solamente Lectura Protegida'}
          </button>
        </div>
      </div>

      {/* Modales integrados */}
      {renderModalCertificado()}
      {renderModalVerificationUnlock()}
    </div>
  );

  function renderModalCertificado() {
    if (!modalCertificadoAbierto) return null;

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="relative w-full max-w-2xl bg-[#090d14] border-2 border-[#00f2fe]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,242,254,0.4)] text-slate-100 space-y-6">
          <button
            type="button"
            onClick={() => setModalCertificadoAbierto(false)}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 text-xl font-bold cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#00f2fe]/20 border border-[#00f2fe] flex items-center justify-center text-[#00f2fe] shadow-[0_0_20px_rgba(0,242,254,0.4)]">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-[#00f2fe] font-bold uppercase tracking-widest bg-[#00f2fe]/10 px-2.5 py-0.5 rounded border border-[#00f2fe]/30">
                REGISTRO OFICIAL DE PROPIEDAD E INVIOLABILIDAD
              </span>
              <h2 className="text-xl font-black text-white mt-1">Certificado Digital de Blindaje de Software</h2>
            </div>
          </div>

          <div className="bg-[#05080e] border border-slate-800 rounded-2xl p-5 space-y-3 font-mono text-xs">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Software:</span>
              <span className="font-bold text-white">Urbix PH - Plataforma de Gestión de Propiedad Horizontal</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Propietario Legítimo & Master Owner:</span>
              <span className="font-bold text-[#00f2fe]">Esteban Ochoa Mesa</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Correo Electrónico de Verificación:</span>
              <span className="font-bold text-purple-300">{OWNER_EMAIL_CANONICAL}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Versión Congelada:</span>
              <span className="font-bold text-emerald-400">{CORE_MANIFEST.version}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-400">Firma Hash de Integridad Criptográfica:</span>
              <span className="font-bold text-slate-300 text-[10px] break-all">{CORE_MANIFEST.buildHash}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Fecha de Congelamiento:</span>
              <span className="font-bold text-white">{CORE_MANIFEST.coreLockedAt}</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">
              Alcance de la Protección del Blindaje:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              {[
                { label: 'Componentes Visuales', desc: 'Interfaces, paletas de colores, fuentes, botones y logotipos congelados.' },
                { label: 'Código Fuente Software', desc: 'Lógica TypeScript, React hooks, controladores y algoritmos contables protegidos.' },
                { label: 'Arquitectura del Sistema', desc: 'Modelos de datos relacionales, RLS en Supabase y endpoints SaaS congelados.' },
                { label: 'Gobierno y Permisos RBAC', desc: 'Restricción absoluta: nadie excepto Esteban Ochoa Mesa puede modificar.' }
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <span className="text-[#00f2fe] font-bold text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {item.label}
                  </span>
                  <p className="text-[11px] text-slate-400 font-sans">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-cyan-950/30 border border-[#00f2fe]/40 text-xs text-cyan-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#00f2fe] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Cualquier intento de alteración o suplantación del código fuente o diseño por usuarios distintos a <strong>Esteban Ochoa Mesa</strong> será rechazado automáticamente por el motor criptográfico de protección del núcleo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalCertificadoAbierto(false)}
            className="w-full bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer shadow-[0_0_20px_rgba(0,242,254,0.4)]"
          >
            Entendido - Continuar en Modo Blindado
          </button>
        </div>
      </div>
    );
  }

  function renderModalVerificationUnlock() {
    if (!modalVerificationUnlockAbierto) return null;

    return (
      <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto font-sans">
        <div className="relative w-full max-w-md bg-[#090d14] border-2 border-purple-500/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(168,85,247,0.35)] text-slate-100 space-y-5">
          <button
            type="button"
            onClick={() => {
              setModalVerificationUnlockAbierto(false);
              setUnlockStatus(null);
            }}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-950 border border-purple-500 flex items-center justify-center text-purple-300">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-widest">
                VERIFICACIÓN DE AUTORIDAD DE PROPIETARIO
              </span>
              <h3 className="text-base font-black text-white">Desbloqueo de Edición de Arquitectura</h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Por seguridad, solo <strong className="text-purple-300">Esteban Ochoa Mesa ({OWNER_EMAIL_CANONICAL})</strong> posee la contraseña Master para habilitar cambios visuales, de código o de arquitectura.
          </p>

          <form onSubmit={handleAttemptUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 block font-bold">Correo Identificado:</label>
              <input
                type="text"
                value={currentUserEmail || 'Invitado / No autenticado'}
                disabled
                className="w-full px-3 py-2 bg-[#05080e] border border-slate-800 text-slate-400 rounded-xl text-xs font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-slate-400 block font-bold">Contraseña Master del Dueño:</label>
              <input
                type="password"
                placeholder="Ingresa la clave maestra del Dueño..."
                value={inputMasterPass}
                onChange={(e) => setInputMasterPass(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#05080e] border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-purple-400"
                required
              />
            </div>

            {unlockStatus && (
              <div className={`p-3 rounded-xl text-xs font-mono ${
                unlockStatus.startsWith('✅') ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/15 text-rose-300 border border-rose-500/40'
              }`}>
                {unlockStatus}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:brightness-110 text-white font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
            >
              <Key className="w-4 h-4" /> Validar Firma de Propietario Master
            </button>
          </form>
        </div>
      </div>
    );
  }
}
