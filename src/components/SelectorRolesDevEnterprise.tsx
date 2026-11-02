import React, { useState } from 'react';
import { Sparkles, Shield, UserCheck, Key, Lock } from 'lucide-react';

export default function SelectorRolesDevEnterprise({
  onSelectRole
}: {
  onSelectRole?: (role: string) => void;
}) {
  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 font-sans max-w-2xl mx-auto">
      
      {/* Cabecera */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
            Modo Dev Activo • Pruebas de Roles Urbix PH
          </span>
          <h3 className="text-base font-black text-white mt-1">Acceso Rápido de Prueba por Rol</h3>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
          Supabase Cloud Auth & RLS Activo
        </span>
      </div>

      {/* Botones de Selección Rápida */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* SaaS Master Owner */}
        <button
          type="button"
          onClick={() => onSelectRole?.('root')}
          className="sm:col-span-2 p-4 bg-purple-950/40 hover:bg-purple-900/40 border border-purple-500/30 rounded-2xl flex items-center justify-between text-left transition cursor-pointer shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👑</span>
            <div>
              <span className="font-bold text-purple-300 text-sm block">SaaS Master Owner (Root)</span>
              <span className="text-[11px] font-mono text-slate-400">estebanochoamesa@...</span>
            </div>
          </div>
          <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg border border-purple-500/20">Acceso Total</span>
        </button>

        {/* Administrador */}
        <button
          type="button"
          onClick={() => onSelectRole?.('admin')}
          className="p-4 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow"
        >
          <span className="text-lg">📊</span>
          <span className="font-bold text-white text-xs">Administrador</span>
        </button>

        {/* Supervisor */}
        <button
          type="button"
          onClick={() => onSelectRole?.('supervisor')}
          className="p-4 bg-emerald-950/30 hover:bg-emerald-900/30 border border-emerald-500/30 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow"
        >
          <span className="text-lg">📋</span>
          <span className="font-bold text-emerald-300 text-xs">Supervisor</span>
        </button>

        {/* Vigilante / Portería */}
        <button
          type="button"
          onClick={() => onSelectRole?.('vigilante')}
          className="p-4 bg-amber-950/30 hover:bg-amber-900/30 border border-amber-500/30 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow"
        >
          <span className="text-lg">🛡️</span>
          <span className="font-bold text-amber-300 text-xs">Vigilante / Portería</span>
        </button>

        {/* ASEO & SERVICIOS (NUEVO BOTÓN INTEGRADO) */}
        <button
          type="button"
          onClick={() => onSelectRole?.('aseo')}
          className="p-4 bg-teal-950/30 hover:bg-teal-900/30 border border-teal-500/30 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow animate-pulse"
        >
          <span className="text-lg">🧹</span>
          <span className="font-bold text-teal-300 text-xs">Aseo & Servicios</span>
        </button>

        {/* Residente */}
        <button
          type="button"
          onClick={() => onSelectRole?.('residente')}
          className="sm:col-span-2 p-4 bg-cyan-950/30 hover:bg-cyan-900/30 border border-cyan-500/30 rounded-2xl flex items-center gap-3 transition cursor-pointer shadow"
        >
          <span className="text-lg">🏡</span>
          <span className="font-bold text-cyan-300 text-xs">Residente (Torre 2 - 301)</span>
        </button>

      </div>

    </div>
  );
}
