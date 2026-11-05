import React from 'react';
import { UrbixIsotipoSvg, UrbixLogoMark, UrbixFullLogo } from '../UrbixLogo';

export { UrbixIsotipoSvg, UrbixLogoMark, UrbixFullLogo };

interface LogoUrbixProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  rolBadge?: string;
}

export default function LogoUrbix({
  size = 'md',
  showText = true,
  rolBadge
}: LogoUrbixProps) {
  const dimensions = {
    sm: 'w-11 h-11',    // Para la barra superior al lado del nombre en cada rol
    md: 'w-14 h-14',    // Para cabeceras de módulos
    lg: 'w-20 h-20',    // Para pantallas de inicio o login
  };

  return (
    <div className="flex items-center gap-3.5 select-none">
      {/* Isotipo Oficial Urbix */}
      <div className={`relative flex items-center justify-center shrink-0 ${dimensions[size]}`}>
        <div className="absolute inset-0 bg-[#00f2fe]/20 blur-[8px] rounded-xl animate-pulse" />
        <div className="relative w-full h-full rounded-xl p-1 bg-slate-950/80 border border-[#00f2fe]/40 drop-shadow-[0_2px_10px_rgba(0,242,254,0.4)] flex items-center justify-center">
          <UrbixIsotipoSvg className="w-full h-full" />
        </div>
      </div>

      {/* Nombre y Rol */}
      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-sans font-black tracking-wider text-sm text-white">URBIX</span>
            <span className="font-sans font-black tracking-wider text-sm text-[#00f2fe]">PH</span>
          </div>
          {rolBadge && (
            <span className={`text-[8px] font-bold tracking-widest px-1.5 py-0.5 rounded font-mono border uppercase self-start mt-0.5 ${
              rolBadge === 'ADMIN' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
              rolBadge === 'PORTERO' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
              rolBadge === 'SUPERVISOR' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
              rolBadge === 'MASTER' ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' :
              'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' // RESIDENTE
            }`}>
              {rolBadge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
