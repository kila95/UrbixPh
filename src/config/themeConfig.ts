/**
 * CONFIGURACIÓN VISUAL Y PERSONALIZACIÓN DE DISEÑO (URBIX PH)
 * Permite cambiar colores, tipografías, posiciones de tarjetas y logos
 * SIN alterar las bases de datos ni el código fuente funcional.
 */

export type ThemePalette = 'emerald_slate' | 'cobalt_dark' | 'amethyst_purple' | 'amber_gold' | 'high_contrast';
export type FontFamilyOption = 'Inter' | 'Monospace' | 'Roboto' | 'System Sans' | 'Compact';

export interface UIThemeConfig {
  themeName: ThemePalette;
  fontFamily: FontFamilyOption;
  primaryColor: string; // Ej: #34d399
  accentColor: string;  // Ej: #22d3ee
  bgSlateColor: string; // Ej: #020617
  cardBgColor: string;  // Ej: #0f172a
  brandName: string;
  logoUrl: string;
  bannerNotice: string;
  layoutOrder: {
    admin: string[];
    supervisor: string[];
    porteria: string[];
    aseo: string[];
  };
}

export const DEFAULT_THEME_CONFIG: UIThemeConfig = {
  themeName: 'emerald_slate',
  fontFamily: 'Inter',
  primaryColor: '#34d399',
  accentColor: '#22d3ee',
  bgSlateColor: '#020617',
  cardBgColor: '#0f172a',
  brandName: 'Urbix PH - Medellín',
  logoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=150&auto=format&fit=crop&q=80',
  bannerNotice: '⚡ Módulo de Seguridad y Operaciones Activo - Ley 675 de 2001',
  layoutOrder: {
    admin: ['cartera', 'caja_menor', 'actas', 'equipos', 'mudanzas', 'sanciones', 'bodega'],
    supervisor: ['rondas', 'equipos', 'mudanzas', 'sanciones', 'caja_menor', 'bodega'],
    porteria: ['minuta', 'accesos', 'parqueaderos', 'correspondencia', 'rondas_qr'],
    aseo: ['rutas_limpieza', 'insumos', 'novedades_locativas', 'checklists']
  }
};

/**
 * Obtiene la paleta CSS en base al tema seleccionado
 */
export function getThemeStyles(config: UIThemeConfig) {
  switch (config.themeName) {
    case 'cobalt_dark':
      return {
        bgMain: 'bg-slate-950',
        cardBg: 'bg-slate-900 border-blue-900/40',
        primaryText: 'text-blue-400',
        accentText: 'text-cyan-400',
        primaryBtn: 'bg-blue-600 hover:bg-blue-500 text-white'
      };
    case 'amethyst_purple':
      return {
        bgMain: 'bg-neutral-950',
        cardBg: 'bg-neutral-900 border-purple-900/40',
        primaryText: 'text-purple-400',
        accentText: 'text-fuchsia-400',
        primaryBtn: 'bg-purple-600 hover:bg-purple-500 text-white'
      };
    case 'amber_gold':
      return {
        bgMain: 'bg-slate-950',
        cardBg: 'bg-slate-900 border-amber-900/40',
        primaryText: 'text-amber-400',
        accentText: 'text-yellow-400',
        primaryBtn: 'bg-amber-600 hover:bg-amber-500 text-slate-950'
      };
    case 'high_contrast':
      return {
        bgMain: 'bg-black',
        cardBg: 'bg-zinc-900 border-zinc-700',
        primaryText: 'text-white',
        accentText: 'text-yellow-300',
        primaryBtn: 'bg-white text-black font-bold'
      };
    case 'emerald_slate':
    default:
      return {
        bgMain: 'bg-slate-950',
        cardBg: 'bg-slate-900 border-slate-800',
        primaryText: 'text-emerald-400',
        accentText: 'text-cyan-400',
        primaryBtn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
      };
  }
}
