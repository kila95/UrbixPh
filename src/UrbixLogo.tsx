import React from 'react';

interface UrbixLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

interface UrbixLogoMarkProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  onClick?: (e: React.MouseEvent<SVGSVGElement>) => void;
}

/**
 * ISOTIPO OFICIAL URBIX (VECTORIAL ESCALABLE EN SVG)
 * Sintetiza: Letra 'U' + Torres residenciales + Portal de acceso + Nodo superior
 */
export function UrbixIsotipoSvg({ className = 'w-full h-full', ...restProps }: UrbixLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Isotipo Oficial Urbix"
      {...restProps}
    >
      <defs>
        <linearGradient id="urbixCleanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="doorCleanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Base en arco / Letra U */}
      <path
        d="M18 24 V60 C18 76 32 88 50 88 C68 88 82 76 82 60 V24"
        stroke="url(#urbixCleanGrad)"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Torres estilizadas */}
      <path
        d="M32 68 V38 H44 V68"
        stroke="url(#urbixCleanGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 68 V22 H56 V68"
        stroke="url(#urbixCleanGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M56 68 V38 H68 V68"
        stroke="url(#urbixCleanGrad)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Portal de acceso */}
      <rect
        x="44"
        y="50"
        width="12"
        height="20"
        rx="6"
        fill="url(#doorCleanGlow)"
      />

      {/* Nodo de conexión superior */}
      <circle cx="50" cy="14" r="3.5" fill="#34D399" />
    </svg>
  );
}

/**
 * Icono de Marca Urbix con contenedor squircle oscuro para barra superior, favicons y tarjetas
 */
export function UrbixLogoMark({ className = 'w-10 h-10', onClick, ...restProps }: UrbixLogoMarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      onClick={onClick}
      aria-label="Urbix Logo Emblem"
      {...restProps}
    >
      <defs>
        <linearGradient id="urbixMarkBg" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <linearGradient id="urbixMarkGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="urbixMarkDoor" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Contenedor Squircle Oscuro */}
      <rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="24"
        fill="url(#urbixMarkBg)"
        stroke="#10B981"
        strokeOpacity="0.35"
        strokeWidth="2"
      />

      {/* Base en arco / Letra U tecnológica */}
      <path
        d="M22 28 V58 C22 72 34 82 50 82 C66 82 78 72 78 58 V28"
        stroke="url(#urbixMarkGrad)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Torres estilizadas */}
      <path
        d="M34 65 V40 H44 V65"
        stroke="url(#urbixMarkGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M44 65 V26 H56 V65"
        stroke="url(#urbixMarkGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M56 65 V40 H66 V65"
        stroke="url(#urbixMarkGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Portal / Entrada de acceso iluminada */}
      <rect
        x="44.5"
        y="49"
        width="11"
        height="18"
        rx="5.5"
        fill="url(#urbixMarkDoor)"
      />

      {/* Nodo de conexión de datos en el remate superior */}
      <circle cx="50" cy="18" r="3.2" fill="#34D399" />
    </svg>
  );
}

export function UrbixFullLogo({
  size = 'md',
  className = ''
}: UrbixLogoProps) {
  const sizeMap = {
    sm: { icon: 'w-8 h-8', title: 'text-xl', badge: 'text-[9px]' },
    md: { icon: 'w-11 h-11', title: 'text-2xl', badge: 'text-[10px]' },
    lg: { icon: 'w-16 h-16', title: 'text-4xl', badge: 'text-xs' },
    xl: { icon: 'w-24 h-24', title: 'text-5xl', badge: 'text-sm' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <UrbixLogoMark className={`${currentSize.icon} shrink-0 drop-shadow-md`} />
      <div className="flex flex-col">
        <div className="flex items-center gap-0.5">
          <span className={`font-black tracking-tight text-white leading-none ${currentSize.title}`}>
            Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 font-mono">
            Medellín
          </span>
          <span className="text-[9px] text-slate-400 font-medium hidden sm:inline">
            · Portería sin fricción
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * PROYECCIÓN HERO LIMPIA DE URBIX (PANTALLA COMPLETA CON RESPLANDOR RADIAL, SIN BOTONES NI ICONOS EXTRA)
 */
export function UrbixHeroClean({ onClick }: { onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-slate-950 overflow-hidden font-sans select-none"
    >
      {/* ========================================================
          RESPLANDOR VERDE RADIAL (Nube ambiental)
          Centrada en el núcleo del logotipo 'Urbix' y expandida
          gradualmente cubriendo toda la pantalla.
         ======================================================== */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_52%,rgba(16,185,129,0.22)_0%,rgba(5,150,105,0.10)_30%,rgba(15,23,42,0)_70%)]"
      />

      {/* Halo secundario difuso para dar profundidad orgánica */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-emerald-500/15 rounded-full blur-[140px] z-0" />

      {/* ========================================================
          CONTENIDO PRINCIPAL (SIN BOTONES NI ICONOS EXTRA)
         ======================================================== */}
      <div className="relative z-10 flex flex-col items-center text-center">
        
        {/* Isotipo Urbix */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900/90 border border-emerald-500/30 rounded-3xl flex items-center justify-center p-4 shadow-2xl backdrop-blur-xl mb-6">
          <UrbixIsotipoSvg className="w-full h-full drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]" />
        </div>

        {/* Logotipo tipográfico */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
          Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span>
        </h1>

        {/* Eslogan Oficial */}
        <p className="mt-3 text-xs sm:text-sm font-extrabold text-emerald-400 tracking-[0.22em] uppercase">
          Tu unidad inteligente, portería sin fricción
        </p>

        {/* Descriptor de contexto */}
        <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium">
          Plataforma Multi-Tenant para Propiedad Horizontal • Medellín
        </p>

      </div>
    </div>
  );
}

interface UrbixBrandHeaderProps {
  onOpenBrandKit?: () => void;
  compact?: boolean;
}

/**
 * BLOQUE DE MARCA LIMPIO URBIX (SIN BOTONES NI ICONOS EXTRA)
 */
export default function UrbixBrandHeader({
  onOpenBrandKit,
  compact = false
}: UrbixBrandHeaderProps) {
  return (
    <div
      onClick={onOpenBrandKit}
      className={`relative flex flex-col items-center text-center select-none ${onOpenBrandKit ? 'cursor-pointer group' : ''} ${compact ? 'py-2' : 'py-6'}`}
      title={onOpenBrandKit ? 'Haz clic para abrir la Proyección Visual y Kit de Marca Urbix' : undefined}
    >
      {/* Isotipo Urbix */}
      <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900/90 border border-emerald-500/30 rounded-3xl flex items-center justify-center p-4 shadow-2xl backdrop-blur-xl mb-5 group-hover:scale-105 transition duration-300">
        <UrbixIsotipoSvg className="w-full h-full drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]" />
      </div>

      {/* Logotipo tipográfico */}
      <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
        Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span>
      </h1>

      {/* Eslogan Oficial */}
      <p className="mt-3 text-xs sm:text-sm font-extrabold text-emerald-400 tracking-[0.22em] uppercase">
        Tu unidad inteligente, portería sin fricción
      </p>

      {/* Descriptor de contexto */}
      <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium">
        Plataforma Multi-Tenant para Propiedad Horizontal • Medellín
      </p>
    </div>
  );
}
