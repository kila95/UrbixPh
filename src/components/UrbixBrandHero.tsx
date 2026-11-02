import React from 'react';

export default function UrbixBrandHero() {
  return (
    <div className="relative flex flex-col items-center justify-center py-2 select-none w-full">
      {/* Resplandor cibernético ambiental multinivel */}
      <div className="absolute -top-4 w-72 h-20 bg-gradient-to-r from-cyan-500/20 via-teal-400/25 to-blue-600/20 blur-3xl pointer-events-none rounded-full" />
      
      {/* LOGOTIPO VECTORIAL DE ALTA FIDELIDAD */}
      <div className="relative w-full max-w-[360px] sm:max-w-[420px] h-[78px] flex items-center justify-center">
        <svg
          viewBox="0 0 460 85"
          className="w-full h-full overflow-visible"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Degradado Metálico Titanio / Platino Cibernético para URBIX */}
            <linearGradient id="metalTitanium" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="28%" stopColor="#E2F7FD" />
              <stop offset="55%" stopColor="#A5E8F8" />
              <stop offset="78%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>

            {/* Borde Biselado Luz de Neón Superior */}
            <linearGradient id="strokeBisel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#22D3EE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#0284C7" stopOpacity="0.3" />
            </linearGradient>

            {/* Degradado Neón Eléctrico para PH */}
            <linearGradient id="neonPH" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67E8F9" />
              <stop offset="45%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#2563EB" />
            </linearGradient>

            {/* Filtro Resplandor Neón */}
            <filter id="cyberGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Sombra de Profundidad Frontal */}
            <filter id="dropDepth" x="-10%" y="-10%" width="130%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#000000" floodOpacity="0.95" />
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#22D3EE" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* SOMBRA BASE / EXTRUSIÓN CIBERNÉTICA */}
          <g filter="url(#dropDepth)">
            {/* Texto: URBIX */}
            <text
              x="18"
              y="60"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="60"
              fontWeight="900"
              letterSpacing="3"
              fill="url(#metalTitanium)"
              stroke="url(#strokeBisel)"
              strokeWidth="1.2"
            >
              URBIX
            </text>

            {/* Ícono Glifo Conector Divisional */}
            <path
              d="M260 22 L275 60"
              stroke="#22D3EE"
              strokeWidth="3.5"
              strokeLinecap="round"
              opacity="0.6"
            />

            {/* Badge Contenedor PH */}
            <rect
              x="290"
              y="15"
              width="115"
              height="48"
              rx="12"
              fill="#06121e"
              stroke="#0891b2"
              strokeWidth="1.8"
            />
            {/* Borde neón secundario en el badge */}
            <rect
              x="292"
              y="17"
              width="111"
              height="44"
              rx="10"
              fill="none"
              stroke="url(#neonPH)"
              strokeWidth="1.2"
              filter="url(#cyberGlow)"
              opacity="0.8"
            />

            {/* Texto: PH */}
            <text
              x="315"
              y="51"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontSize="34"
              fontWeight="900"
              letterSpacing="2.5"
              fill="#FFFFFF"
            >
              PH
            </text>
          </g>

          {/* Micro-detalles de interfaz táctica */}
          <circle cx="415" cy="22" r="2.5" fill="#22D3EE" filter="url(#cyberGlow)" />
          <line x1="290" y1="67" x2="330" y2="67" stroke="#22D3EE" strokeWidth="1.5" opacity="0.7" />
        </svg>
      </div>

      {/* ESLOGAN: HUD AEROSPACIAL CIBERNÉTICO */}
      <div className="relative mt-2 flex items-center gap-2 px-3 py-1 bg-[#050b14]/90 border-x border-cyan-500/40 rounded-sm shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        {/* Marcador táctico izquierdo */}
        <span className="w-1.5 h-1.5 bg-cyan-400 rotate-45 animate-pulse" />
        
        <p className="font-mono text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-200/90 whitespace-nowrap">
          CONSOLA EJECUTIVA <span className="text-cyan-500">•</span> PROPIEDAD HORIZONTAL
        </p>

        {/* Marcador táctico derecho */}
        <span className="w-1.5 h-1.5 bg-cyan-400 rotate-45 animate-pulse" />
      </div>
    </div>
  );
}
