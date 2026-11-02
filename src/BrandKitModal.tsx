import React, { useState } from 'react';
import { Sparkles, XCircle, Building2, Copy, Download, Maximize2 } from 'lucide-react';
import { UrbixIsotipoSvg, UrbixLogoMark, UrbixFullLogo, UrbixHeroClean } from './UrbixLogo';

interface BrandKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export default function BrandKitModal({ isOpen, onClose, onShowToast }: BrandKitModalProps) {
  const [isCleanFullscreen, setIsCleanFullscreen] = useState(false);

  if (!isOpen) return null;

  // Modo Proyección Hero Limpia a Pantalla Completa (Sin botones ni iconos extra)
  if (isCleanFullscreen) {
    return (
      <div className="fixed inset-0 z-[260] cursor-pointer" title="Haz clic en cualquier lugar para volver">
        <UrbixHeroClean onClick={() => setIsCleanFullscreen(false)} />
      </div>
    );
  }

  const svgRawString = `<svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="urbixCleanGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#059669" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>
    <linearGradient id="doorCleanGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
  </defs>
  <!-- Base en arco / Letra U -->
  <path d="M18 24 V60 C18 76 32 88 50 88 C68 88 82 76 82 60 V24" stroke="url(#urbixCleanGrad)" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Torres estilizadas -->
  <path d="M32 68 V38 H44 V68" stroke="url(#urbixCleanGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M44 68 V22 H56 V68" stroke="url(#urbixCleanGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M56 68 V38 H68 V68" stroke="url(#urbixCleanGrad)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
  <!-- Portal de acceso -->
  <rect x="44" y="50" width="12" height="20" rx="6" fill="url(#doorCleanGlow)" />
  <!-- Nodo de conexión superior -->
  <circle cx="50" cy="14" r="3.5" fill="#34D399" />
</svg>`;

  const handleCopySvg = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(svgRawString);
      onShowToast('📋 Código SVG oficial de Urbix copiado al portapapeles');
    }
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgRawString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urbix_isotipo_oficial.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('💾 Archivo urbix_isotipo_oficial.svg descargado con éxito');
  };

  return (
    <div 
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-slate-950 border border-emerald-500/50 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Identidad Visual & Logo Comercial Urbix</h3>
              <p className="text-xs text-emerald-400 font-medium">Isotipo Vectorial: Letra &lsquo;U&rsquo; + Torres Residenciales + Portal de Acceso</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCleanFullscreen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Ver proyección limpia a pantalla completa sin botones"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Pantalla Limpia</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-900 transition focus:outline-none cursor-pointer"
              aria-label="Cerrar modal de logo"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Showcase Central con Resplandor Verde Radial Limpio (UrbixHeroClean) */}
        <div className="relative bg-slate-950 border border-slate-800/80 rounded-2xl p-8 text-center shadow-inner overflow-hidden flex flex-col items-center justify-center">
          {/* Resplandor verde radial */}
          <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_52%,rgba(16,185,129,0.22)_0%,rgba(5,150,105,0.10)_30%,rgba(15,23,42,0)_70%)]" />
          {/* Halo secundario difuso */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[320px] bg-emerald-500/15 rounded-full blur-[100px] z-0" />

          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-slate-900/90 border border-emerald-500/30 rounded-3xl flex items-center justify-center p-4 shadow-2xl backdrop-blur-xl mb-6">
              <UrbixIsotipoSvg className="w-full h-full drop-shadow-[0_2px_10px_rgba(16,185,129,0.35)]" />
            </div>

            <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-none">
              Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span>
            </h2>

            <p className="mt-3 text-xs sm:text-sm font-extrabold text-emerald-400 tracking-[0.22em] uppercase">
              Tu unidad inteligente, portería sin fricción
            </p>

            <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium">
              Plataforma Multi-Tenant para Propiedad Horizontal • Medellín
            </p>
          </div>
        </div>

        {/* Variantes Comerciales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          {/* Variante Fondo Oscuro */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Variante 1: Versión Horizontal (Fondo Oscuro)
            </span>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-center">
              <UrbixFullLogo size="md" />
            </div>
          </div>

          {/* Variante Fondo Claro */}
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              Variante 2: Versión Horizontal (Fondo Claro)
            </span>
            <div className="p-3 bg-white rounded-xl flex items-center justify-center shadow-sm">
              <div className="flex items-center gap-3">
                <UrbixLogoMark className="w-10 h-10 shrink-0" />
                <div>
                  <div className="text-xl font-black text-slate-950 leading-none">
                    Urbi<span className="text-emerald-600">x</span>
                  </div>
                  <div className="text-[9px] font-bold text-emerald-700 tracking-wider uppercase mt-1">
                    Medellín SaaS
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Concepto del Diseño */}
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl space-y-2.5 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Concepto Arquitectónico y Racional Creativo</span>
          </h4>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            El isotipo vectorial sintetiza tres conceptos clave en una sola geometría limpia: un arco perimetral que conforma la letra <strong>&lsquo;U&rsquo;</strong> de Urbix, tres <strong>torres residenciales</strong> estilizadas con la torre central elevada, un <strong>portal de acceso iluminado</strong> en la base que representa la portería sin fricción, y un <strong>nodo superior de conexión de datos</strong> que simboliza la sincronización en la nube.
          </p>
        </div>

        {/* Acciones de Descarga y Copia */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleCopySvg}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Código SVG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar Logo Vectorial (.svg)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
