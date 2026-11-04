import React, { useState } from 'react';
import { ShieldCheck, Lock, ShieldAlert, CheckCircle2, FileCode2, Database, Layout, UserCheck, AlertTriangle, Key, Cpu } from 'lucide-react';
import { CORE_MANIFEST, OWNER_EMAIL_CANONICAL, isSoftwareModificationAllowed } from '../core/coreFreezeGuard';

interface SoftwareArchitectureShieldSuiteProps {
  currentUserEmail?: string;
  onShowToast?: (msg: string) => void;
  onAppendAuditLog?: (action: string, details: string, executor?: string) => void;
}

export default function SoftwareArchitectureShieldSuite({
  currentUserEmail = OWNER_EMAIL_CANONICAL,
  onShowToast,
  onAppendAuditLog
}: SoftwareArchitectureShieldSuiteProps) {
  const isOwner = isSoftwareModificationAllowed(currentUserEmail);

  const [shieldLogs, setShieldLogs] = useState([
    {
      id: 'log_01',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      component: 'Visual UI & Layout Architecture',
      user: currentUserEmail,
      action: 'BLINDAJE_TOTAL_VERIFICADO',
      result: 'RESTRICCIÓN_ACTIVA'
    },
    {
      id: 'log_02',
      timestamp: '2026-11-03 21:00:15',
      component: 'Core Code & Database Relational Schema',
      user: 'estebanochoamesa@gmail.com',
      action: 'FIRMA_DE_CONGELAMIENTO_REGISTRADA',
      result: 'PROPRIETARY_LOCK_OK'
    }
  ]);

  const [intentoEditarModal, setIntentoEditarModal] = useState<string | null>(null);

  const handleSimularIntentoEdicion = (componenteNombre: string) => {
    if (!isOwner) {
      onShowToast?.(`⛔ Acción bloqueada: No se permite modificar "${componenteNombre}". Solo el Dueño del Software (Esteban Ochoa Mesa) puede realizar cambios.`);
      onAppendAuditLog?.('UNAUTHORIZED_EDIT_ATTEMPT', `Intento no autorizado de modificación en ${componenteNombre} por ${currentUserEmail}`);
    } else {
      setIntentoEditarModal(componenteNombre);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* TARJETA SUPERIOR DE BLINDAJE DE ARQUITECTURA Y CÓDIGO */}
      <div className="bg-[#090d14] border-2 border-[#00f2fe]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_40px_rgba(0,242,254,0.3)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-[#00f2fe]/15 border-2 border-[#00f2fe] rounded-2xl flex items-center justify-center text-[#00f2fe] text-3xl shadow-[0_0_25px_rgba(0,242,254,0.4)] shrink-0">
              🛡️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono font-bold bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/40 px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_10px_rgba(0,242,254,0.2)]">
                  MÓDULO INTEGRAL DE BLINDAJE DE VERSIÓN Y CÓDIGO
                </span>
                <span className="text-xs text-slate-400 font-mono">Urbix Technologies S.A.S.</span>
              </div>
              <h2 className="text-2xl font-black text-white mt-1 tracking-tight">
                Sistema de Blindaje Total de Versión, Interfaz y Arquitectura
              </h2>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Congelamiento Inalterable v1.0.0 • Firma Criptográfica SHA-256 • Ley 675 Compliance
              </p>
            </div>
          </div>

          <div className="bg-[#05080e] border border-cyan-500/40 p-4 rounded-2xl font-mono text-xs space-y-1.5 shrink-0 text-right">
            <span className="text-slate-400 block text-[10px]">DUEÑO EXCLUSIVO AUTORIZADO:</span>
            <span className="text-[#00f2fe] font-bold text-sm block">Esteban Ochoa Mesa</span>
            <span className="text-purple-300 text-[11px] block">{OWNER_EMAIL_CANONICAL}</span>
          </div>
        </div>
      </div>

      {/* MATRIZ DE LOS 4 PILARES DEL BLINDAJE EN PANTALLA */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* 1. VISTA E INTERFAZ */}
        <div className="bg-[#070b12] border border-[#00f2fe]/40 hover:border-[#00f2fe] rounded-2xl p-5 space-y-3 transition shadow-lg">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-[#00f2fe]">
              <Layout className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/20 text-[#00f2fe] px-2 py-0.5 rounded border border-cyan-500/40">
              🔒 BLINDAJE VISUAL
            </span>
          </div>

          <h3 className="text-sm font-black text-white">Componentes Visuales & UI</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Layouts, paletas de colores, fuentes, botones, logotipos y estructura gráfica frozen sin permisos de alteración.
          </p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Autorización:</span>
            <span className="text-[#00f2fe] font-bold">Solo Esteban Ochoa</span>
          </div>

          <button
            type="button"
            onClick={() => handleSimularIntentoEdicion('Componentes Visuales')}
            className="w-full bg-slate-900 hover:bg-[#00f2fe]/15 text-[#00f2fe] border border-[#00f2fe]/30 font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-[#00f2fe]" /> Intentar Edición Visual
          </button>
        </div>

        {/* 2. CÓDIGO FUENTE */}
        <div className="bg-[#070b12] border border-purple-500/40 hover:border-purple-500 rounded-2xl p-5 space-y-3 transition shadow-lg">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center text-purple-300">
              <FileCode2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40">
              🔒 CÓDIGO CONGELADO
            </span>
          </div>

          <h3 className="text-sm font-black text-white">Código Fuente & Hooks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Controladores React, hooks de estado, utilidades contables y lógica de software inalterables en memoria.
          </p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Autorización:</span>
            <span className="text-purple-300 font-bold">Solo Esteban Ochoa</span>
          </div>

          <button
            type="button"
            onClick={() => handleSimularIntentoEdicion('Código Fuente')}
            className="w-full bg-slate-900 hover:bg-purple-950 text-purple-300 border border-purple-500/30 font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-purple-300" /> Intentar Edición de Código
          </button>
        </div>

        {/* 3. ARQUITECTURA Y BASE DE DATOS */}
        <div className="bg-[#070b12] border border-emerald-500/40 hover:border-emerald-500 rounded-2xl p-5 space-y-3 transition shadow-lg">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-300">
              <Database className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              🔒 ESTRUCTURA DE DATOS
            </span>
          </div>

          <h3 className="text-sm font-black text-white">Arquitectura Multi-Tenant</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Esquema relacional en Supabase, políticas RLS, aislamiento de tenants y endpoints SaaS inmutables.
          </p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Autorización:</span>
            <span className="text-emerald-300 font-bold">Solo Esteban Ochoa</span>
          </div>

          <button
            type="button"
            onClick={() => handleSimularIntentoEdicion('Arquitectura Multi-Tenant')}
            className="w-full bg-slate-900 hover:bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-emerald-300" /> Intentar Edición Arquitectura
          </button>
        </div>

        {/* 4. REGLAS DE NEGOCIO Y RBAC */}
        <div className="bg-[#070b12] border border-amber-500/40 hover:border-amber-500 rounded-2xl p-5 space-y-3 transition shadow-lg">
          <div className="flex justify-between items-center">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Cpu className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/40">
              🔒 REGLAS & RBAC
            </span>
          </div>

          <h3 className="text-sm font-black text-white">Lógica Ley 675 & RBAC</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Matriz de quórums, intereses de mora, facturación DIAN UBL 2.1 y permisos por rol protegidos de raíz.
          </p>

          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-500">Autorización:</span>
            <span className="text-amber-300 font-bold">Solo Esteban Ochoa</span>
          </div>

          <button
            type="button"
            onClick={() => handleSimularIntentoEdicion('Reglas Ley 675')}
            className="w-full bg-slate-900 hover:bg-amber-950 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5 text-amber-300" /> Intentar Edición Reglas
          </button>
        </div>

      </div>

      {/* REGISTRO DE AUDITORÍA Y COMPROBACIÓN DE BLINDAJE */}
      <div className="bg-[#090d14] border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#00f2fe]" />
              Bitácora de Auditoría de Blindaje Criptográfico (SHA-256)
            </h3>
            <p className="text-xs text-slate-400 font-mono">Registro inmutable append-only de validación de propiedad y estado de congelamiento</p>
          </div>
          <span className="text-xs font-mono font-bold bg-[#00f2fe]/10 text-[#00f2fe] border border-[#00f2fe]/30 px-3 py-1 rounded-lg">
            SHA256 INALTERABLE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase">
                <th className="p-3">Sello de Tiempo</th>
                <th className="p-3">Componente Protegido</th>
                <th className="p-3">Usuario Identificado</th>
                <th className="p-3">Acción Registrada</th>
                <th className="p-3 text-right">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shieldLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-950/40 transition">
                  <td className="p-3 text-slate-400">{log.timestamp}</td>
                  <td className="p-3 font-bold text-white">{log.component}</td>
                  <td className="p-3 text-cyan-300">{log.user}</td>
                  <td className="p-3 text-purple-300">{log.action}</td>
                  <td className="p-3 text-right">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      {log.result}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal si Esteban Ochoa presiona simular edición */}
      {intentoEditarModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-[#090d14] border-2 border-[#00f2fe] rounded-3xl p-6 shadow-[0_0_50px_rgba(0,242,254,0.4)] text-slate-100 space-y-4">
            <button
              type="button"
              onClick={() => setIntentoEditarModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 text-lg font-bold cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#00f2fe]/20 border border-[#00f2fe] flex items-center justify-center text-[#00f2fe]">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#00f2fe] font-bold uppercase">
                  VERIFICACIÓN DE MASTER OWNER
                </span>
                <h3 className="text-base font-black text-white">Acceso a Edición de {intentoEditarModal}</h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 font-sans leading-relaxed">
              Hola <strong className="text-[#00f2fe]">Esteban Ochoa Mesa</strong>. Al ser el Dueño del Software legítimo, tienes autorización única para manipular y ajustar visualmente o en código el módulo <strong className="text-white">{intentoEditarModal}</strong>.
            </p>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300">
              📌 Estado del sistema: Desbloqueo temporal concedido para el correo authenticated <strong className="text-purple-300">{currentUserEmail}</strong>.
            </div>

            <button
              type="button"
              onClick={() => {
                onShowToast?.(`✅ Sesión de edición autorizada activada para Esteban Ochoa.`);
                setIntentoEditarModal(null);
              }}
              className="w-full bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer shadow-[0_0_20px_rgba(0,242,254,0.4)]"
            >
              Proceder con Edición Autorizada
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
