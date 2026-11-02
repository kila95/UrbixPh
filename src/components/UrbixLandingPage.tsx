import React, { useState } from 'react';
import {
  Shield,
  FileCheck,
  Vote,
  QrCode,
  Package,
  CalendarCheck,
  TrendingUp,
  Building2,
  Users,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Scale,
  Calculator,
  Send,
  Lock,
  Compass,
  FileText,
  XCircle,
  AlertCircle,
  RefreshCw,
  Key,
  Database,
  Cpu,
  Check,
  Car
} from 'lucide-react';

interface UrbixLandingPageProps {
  onEnterApp: (role?: string) => void;
  onGoToLogin?: () => void;
}

export default function UrbixLandingPage({ onEnterApp, onGoToLogin }: UrbixLandingPageProps) {
  // =========================================================================
  // 1. ESTADO SIMULADOR ASAMBLEA & QUÓRUM EN VIVO (HERO)
  // =========================================================================
  const [votoEmitido, setVotoEmitido] = useState<string | null>(null);
  const [quorumSimulado, setQuorumSimulado] = useState<number>(68.4);
  const [votosAFavor, setVotosAFavor] = useState<number>(54.2);
  const [votosEnContra, setVotosEnContra] = useState<number>(11.8);
  const [votosAbstencion, setVotosAbstencion] = useState<number>(2.4);

  const handleVotoHero = (decision: 'favor' | 'contra' | 'abstencion') => {
    if (votoEmitido) return;
    setVotoEmitido(decision);
    const coefUnidad = 0.0142 * 100; // 1.42%
    setQuorumSimulado(prev => Math.min(100, +(prev + 1.42).toFixed(2)));
    if (decision === 'favor') {
      setVotosAFavor(prev => +(prev + coefUnidad).toFixed(2));
    } else if (decision === 'contra') {
      setVotosEnContra(prev => +(prev + coefUnidad).toFixed(2));
    } else {
      setVotosAbstencion(prev => +(prev + coefUnidad).toFixed(2));
    }
  };

  const handleResetVotoHero = () => {
    setVotoEmitido(null);
    setQuorumSimulado(68.4);
    setVotosAFavor(54.2);
    setVotosEnContra(11.8);
    setVotosAbstencion(2.4);
  };

  // =========================================================================
  // 2. ESTADO SIMULADOR LECTOR QR & SG-SST (PORTERÍA EN VIVO)
  // =========================================================================
  const [scanTarget, setScanTarget] = useState<'schindler' | 'otis' | 'visita_familiar' | 'domicilio'>('schindler');
  const [scanResultTime, setScanResultTime] = useState<string>('Hoy 10:14 AM');

  // =========================================================================
  // 3. ESTADO SELECTOR DE 10 MÓDULOS DEL SOFTWARE REAL
  // =========================================================================
  const [moduloActivo, setModuloActivo] = useState<number>(1);

  // =========================================================================
  // 4. ESTADO CALCULADORA FINANCIERA DE ROI
  // =========================================================================
  const [unidadesCalc, setUnidadesCalc] = useState<number>(140);
  const costoAsambleaPresencial = Math.round(unidadesCalc * 32000 + 1200000);
  const ahorroPapeleriaAnual = Math.round(unidadesCalc * 18500);
  const horasAhorradasMes = Math.round(18 + (unidadesCalc / 10));
  const recuperacionMora90d = Math.round(unidadesCalc * 42000);
  const totalAhorroAnual = costoAsambleaPresencial + ahorroPapeleriaAnual + recuperacionMora90d;

  // =========================================================================
  // 5. ESTADO 4 PORTALES SINCRONIZADOS
  // =========================================================================
  const [rolActivoTab, setRolActivoTab] = useState<'admin' | 'residente' | 'porteria' | 'supervisor'>('admin');

  // =========================================================================
  // 6. ESTADO FORMULARIO DE DIAGNÓSTICO
  // =========================================================================
  const [formNombre, setFormNombre] = useState('');
  const [formCopropiedad, setFormCopropiedad] = useState('');
  const [formCiudad, setFormCiudad] = useState('Medellín');
  const [formUnidades, setFormUnidades] = useState('120');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEnviado, setFormEnviado] = useState(false);

  const handleSubmitLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formCopropiedad || !formNombre) return;
    setFormEnviado(true);
  };

  // Datos de los 10 módulos del software real (Mapeo 1-a-1 con Consola SuperAdmin)
  const MODULOS_SOFTWARE = [
    {
      id: 1,
      numero: '01',
      icon: '🌐',
      nombre: 'Salud & Nodos PH',
      ley: 'Arquitectura Cloud Multi-Tenant',
      subtitulo: 'Monitoreo de latencia y estado de servicios',
      desc: 'Supervisión en tiempo real de nodos de base de datos distribuidos en Colombia con aislamiento criptográfico por copropiedad y failover automático.',
      beneficio: 'Disponibilidad 99.98% para asambleas y control de acceso ininterrumpido.'
    },
    {
      id: 2,
      numero: '02',
      icon: '🚀',
      nombre: 'Aprovisionamiento & SaaS MRR',
      ley: 'Facturación y Licenciamiento Recurrente',
      subtitulo: 'Activación modular de copropiedades',
      desc: 'Gestión granular de Feature Flags por tenant: habilitación selectiva de módulos de Portería, Rondas, Aseo y Votaciones con liquidación de cobro por unidad.',
      beneficio: 'Control exacto de costos y facturación electrónica automatizada.'
    },
    {
      id: 3,
      numero: '03',
      icon: '💰',
      nombre: 'Tesorería & Bancos',
      ley: 'Conciliación Bancaria Bancolombia / Davivienda',
      subtitulo: 'Conciliación y dispersión en línea',
      desc: 'Cruce automático de extractos bancarios con recaudos de administración por PSE y pasarela. Control de pagos a proveedores y caja menor operativa.',
      beneficio: 'Cierre contable mensual en horas en lugar de semanas.'
    },
    {
      id: 4,
      numero: '04',
      icon: '📊',
      nombre: 'Cartera & Moras Ley 675',
      ley: 'Art. 30 y 48 Ley 675 de 2001',
      subtitulo: 'Liquidación de intereses y cobro prejurídico',
      desc: 'Cálculo automático de intereses de mora a la tasa máxima legal certificada por la Superfinanciera (1.5x IBC). Emisión de títulos ejecutivos prejurídicos para unidades con mora superior a 90 días.',
      beneficio: 'Reducción del 43% en cartera vencida en los primeros 90 días.'
    },
    {
      id: 5,
      numero: '05',
      icon: '👥',
      nombre: 'Nómina & Personal PH',
      ley: 'Planillas PILA y Seguridad Social',
      subtitulo: 'Cuadrillas de vigilancia, aseo y mantenimiento',
      desc: 'Control de turnos 24/7, horas extras diurnas/nocturnas, dominicales y verificación de aportes a salud, pensión y ARL de empleados directos o tercerizados.',
      beneficio: 'Cero sanciones del Ministerio del Trabajo y la UGPP.'
    },
    {
      id: 6,
      numero: '06',
      icon: '📋',
      nombre: 'Contratos & Pólizas Globales',
      ley: 'Art. 15 Ley 675 de 2001',
      subtitulo: 'Pólizas obligatorias contra incendio y terremoto',
      desc: 'Cronómetro inteligente de vencimiento de pólizas de áreas comunes (Art. 15) y contratos de ascensores, motobombas, puertas eléctricas y plantas de emergencia.',
      beneficio: 'Protección patrimonial garantizada de los bienes comunes esenciales.'
    },
    {
      id: 7,
      numero: '07',
      icon: '🏛️',
      nombre: 'Asambleas & Quórum Ponderado',
      ley: 'Art. 37 al 46 Ley 675 de 2001',
      subtitulo: 'Votación virtual por coeficiente al milésimo',
      desc: 'Registro de asistencia, escrutinio de poderes, cálculo de mayorías simples (50%+1) y mayorías calificadas (70% Art. 46) con acta digital generada y firmada en minutos.',
      beneficio: 'Blindaje total contra impugnaciones judiciales de asambleas.'
    },
    {
      id: 8,
      numero: '08',
      icon: '⚖️',
      nombre: 'PQRSD Ley 1755, Zonas & SG-SST',
      ley: 'Ley 1755 de 2015 & Decreto 1072',
      subtitulo: 'Términos de ley y control de riesgos',
      desc: 'Temporizador estricto de 10 a 15 días hábiles para derechos de petición con firma digital. Módulo de reservas de zonas comunes con retención de depósito en garantía y auditoría de contratistas.',
      beneficio: 'Eliminación del 100% de tutelas y desacatos contra el Administrador.'
    },
    {
      id: 9,
      numero: '09',
      icon: '🛡️',
      nombre: 'Matriz RBAC & Usuarios RLS',
      ley: 'Row-Level Security & Aislamiento',
      subtitulo: 'Políticas de acceso por rol y copropiedad',
      desc: 'Perfiles blindados: SaaS Master Owner, Administrador PH, Supervisor de Campo, Guarda de Seguridad y Residente. Imposible que un copropietario acceda a datos de otra unidad.',
      beneficio: 'Cumplimiento estricto de Habeas Data (Ley 1581 de 2012).'
    },
    {
      id: 10,
      numero: '10',
      icon: '🔒',
      nombre: 'Bóveda Forense SHA-256',
      ley: 'Validez Probatoria Ley 527 de 1999',
      subtitulo: 'Trazabilidad criptográfica inmutable',
      desc: 'Cada voto de asamblea, acta de entrega de zona común, respuesta a PQRSD e ingreso de contratista genera un hash SHA-256 incorruptible con marca de tiempo oficial.',
      beneficio: 'Evidencia digital con plena validez probatoria ante jueces de la República.'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-zinc-100 antialiased selection:bg-cyan-400 selection:text-zinc-950 font-sans">
      
      {/* =========================================================================
          1. TOP BAR CONTRACT (Strict 3 Zones: Brand - 5 Nav Links - 1 Action)
         ========================================================================= */}
      <header className="sticky top-0 z-50 w-full bg-[#0e0e12]/95 backdrop-blur-md border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single Brand Wordmark */}
          <a href="#" className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 group">
            <div className="relative overflow-hidden rounded-lg border border-cyan-500/35 bg-[#0c1815] p-1 flex items-center justify-center shadow-md shadow-cyan-500/10">
              <img
                src="/assets/aistudio/Captura_de_pantalla_2026-10-30_135456_59f03351.png"
                alt="Urbix PH"
                className="h-7 w-auto object-contain"
              />
            </div>
            <span className="text-white font-black tracking-tight text-base sm:text-lg">
              Urbi<span className="text-cyan-400">x</span> <span className="text-cyan-400 text-xs font-mono font-bold tracking-normal ml-0.5">PH</span>
            </span>
          </a>

          {/* Zone 2: 5 Concise Single-Line Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-400">
            <a href="#modulos" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              10 Módulos
            </a>
            <a href="#asambleas" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              Asamblea en Vivo
            </a>
            <a href="#porteria-demo" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              Validador QR Portería
            </a>
            <a href="#portales" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              4 Portales
            </a>
            <a href="#calculadora" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              Calculadora ROI
            </a>
            <a href="#planes" className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0">
              Planes
            </a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onGoToLogin ? onGoToLogin() : onEnterApp('super_admin')}
              className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap shrink-0 shadow-sm shadow-cyan-500/20 cursor-pointer"
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. HERO SECTION: Value Proposition & Live Interactive Quorum Simulator
         ========================================================================= */}
      <section id="asambleas" className="relative pt-16 pb-20 md:pt-24 md:pb-32 overflow-hidden border-b border-zinc-800/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Direct, punchy and legally grounded copy */}
            <div className="lg:col-span-7 flex flex-col items-start">
              
              {/* Clean Metadata (Zero-Pill Discipline) */}
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-5 font-mono flex-wrap">
                <span className="text-cyan-400 font-semibold">Ley 675 de 2001</span>
                <span aria-hidden="true">·</span>
                <span>Ley 1755 de 2015</span>
                <span aria-hidden="true">·</span>
                <span>Decreto 1072 SG-SST</span>
                <span aria-hidden="true">·</span>
                <span>Supabase RLS Multi-Tenant</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12] mb-6 text-balance">
                El sistema operativo de alta precisión para la Propiedad Horizontal en Colombia
              </h1>

              <p className="text-base sm:text-lg text-zinc-300 leading-relaxed mb-8 max-w-2xl">
                Blindaje jurídico y operativo integral: asambleas con cómputo de quórum y votación por coeficientes en vivo, respuestas a PQRSD con radicado oficial en términos de ley, bloqueo en portería de contratistas sin ARL y liquidación de depósitos de zonas comunes.
              </p>

              {/* Primary CTAs */}
              <div className="flex flex-wrap items-center gap-4 mb-10">
                <button
                  type="button"
                  onClick={() => onEnterApp('super_admin')}
                  className="px-6 py-3.5 text-sm font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-500/25 whitespace-nowrap shrink-0"
                >
                  <span>Probar Plataforma en Vivo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <a
                  href="#calculadora"
                  className="px-6 py-3.5 text-sm font-medium text-zinc-200 bg-[#16161b] hover:bg-[#1d1d23] border border-zinc-700/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Calcular Ahorro de mi Copropiedad
                </a>
              </div>

              {/* Social Proof & Quantitative Rigor (Zero Pills) */}
              <div className="pt-6 border-t border-zinc-800/80 w-full grid grid-cols-2 sm:grid-cols-4 gap-6 text-left">
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">140+</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Copropiedades Activas</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400 font-mono tabular-nums">100%</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Cumplimiento Ley 675</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono tabular-nums">0</div>
                  <div className="text-xs text-zinc-400 mt-0.5">Tutelas por PQRSD Vencidas</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-bold text-white font-mono tabular-nums">$12.400M+</div>
                  <div className="text-xs text-zinc-400 mt-0.5">COP Cartera Administrada</div>
                </div>
              </div>

            </div>

            {/* Right Column: Live Interactive Quorum Simulator Card */}
            <div className="lg:col-span-5">
              <div className="bg-[#141418] border border-cyan-500/25 rounded-2xl p-6 shadow-2xl relative shadow-cyan-500/5">
                
                {/* Header of the Simulator */}
                <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80 mb-4">
                  <div>
                    <div className="text-[11px] text-zinc-400 font-mono uppercase tracking-wider">ASAMBLEA GENERAL ORDINARIA 2026</div>
                    <div className="text-sm font-bold text-white">Moción #03: Presupuesto y Mantenimiento Fachadas</div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Votación en Vivo</span>
                  </div>
                </div>

                {/* Quorum Bar with Statutory Markers */}
                <div className="mb-5">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-zinc-400">Quórum Coeficiente Registrado:</span>
                    <span className="text-emerald-400 font-bold tabular-nums text-sm">{quorumSimulado}%</span>
                  </div>
                  
                  {/* Gauge Bar */}
                  <div className="relative w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500 rounded-full"
                      style={{ width: `${quorumSimulado}%` }}
                    ></div>
                    {/* 50%+1 Simple Majority Marker */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-10"
                      style={{ left: '50.1%' }}
                      title="50% + 1 Mayoría Simple"
                    ></div>
                    {/* 70% Qualified Majority Marker (Art. 46) */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-red-400 z-10"
                      style={{ left: '70%' }}
                      title="70% Mayoría Calificada (Art. 46)"
                    ></div>
                  </div>

                  <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                    <span>0%</span>
                    <span className="text-yellow-400/90 font-semibold">50%+1 Simple</span>
                    <span className="text-red-400/90 font-semibold">70% Calificada (Art. 46)</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Weighted Voting Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-900/70 rounded-lg border border-zinc-800/60 mb-5 text-center text-xs font-mono">
                  <div>
                    <div className="text-zinc-400 text-[11px]">A Favor</div>
                    <div className="text-emerald-400 font-bold text-sm tabular-nums">{votosAFavor}%</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-[11px]">En Contra</div>
                    <div className="text-red-400 font-bold text-sm tabular-nums">{votosEnContra}%</div>
                  </div>
                  <div>
                    <div className="text-zinc-400 text-[11px]">Abstención</div>
                    <div className="text-zinc-300 font-bold text-sm tabular-nums">{votosAbstencion}%</div>
                  </div>
                </div>

                {/* Interactive Voting Box for the Visitor */}
                <div className="bg-[#1c1c22] p-4 rounded-xl border border-zinc-700/80">
                  <div className="text-xs text-zinc-300 mb-2.5 flex items-center justify-between">
                    <span>Tu Unidad: <strong className="text-white">Torre 2 - Apto 301</strong></span>
                    <span className="text-cyan-400 font-mono text-[11px] font-semibold">Poder: Coeficiente 1.42%</span>
                  </div>

                  {votoEmitido ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-center">
                      <div className="text-xs font-bold text-emerald-400 mb-1 flex items-center justify-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>¡Voto ponderado computado en tiempo real!</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mb-2">
                        Opción: <strong className="text-white">{votoEmitido.toUpperCase()}</strong> · Hash SHA-256 verificado
                      </div>
                      <button
                        type="button"
                        onClick={handleResetVotoHero}
                        className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer"
                      >
                        ↺ Reiniciar voto de prueba
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="text-[11px] text-zinc-400 mb-2.5">
                        Haz clic para emitir tu voto y ver cómo se recalcula el quórum de inmediato:
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleVotoHero('favor')}
                          className="py-2.5 px-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          A Favor (+1.42%)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVotoHero('contra')}
                          className="py-2.5 px-2 bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          En Contra (+1.42%)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVotoHero('abstencion')}
                          className="py-2.5 px-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Abstención
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action into App */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => onEnterApp('residente')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Abrir Portal de Residente en el software real</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          3. CRITICAL SECTOR AUDIT: WhatsApp & Excel vs Urbix PH Neo-Swiss Engine
         ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0c0c0f]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-14">
            <div className="text-xs font-mono text-cyan-400 mb-2">ANÁLISIS CRÍTICO DEL SECTOR</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Por qué gestionar una copropiedad con Excel y WhatsApp expone el patrimonio de Administradores y Consejos
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              En Colombia, la Ley 675 establece responsabilidad patrimonial solidaria directa para los administradores y miembros del Consejo de Administración ante faltas u omisiones. La improvisación con chats y hojas de cálculo genera 4 contingencias legales graves:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Risk 1 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-colors">
              <div>
                <div className="text-[11px] font-mono text-red-400 mb-2 font-bold">CONTINGENCIA 01 · ART. 49 LEY 675</div>
                <h3 className="text-base font-bold text-white mb-2">
                  Impugnaciones Judiciales de Asambleas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Cálculos de quórum inexactos o votaciones sin coeficientes exactos dan lugar a demandas de nulidad ante juzgados civiles, congelando presupuestos y cuotas ordinarias por meses.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-emerald-400">
                ✓ Solución Urbix: Cómputo matemático en vivo y acta preliminar PDF en minutos.
              </div>
            </div>

            {/* Risk 2 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-colors">
              <div>
                <div className="text-[11px] font-mono text-red-400 mb-2 font-bold">CONTINGENCIA 02 · LEY 1755 DE 2015</div>
                <h3 className="text-base font-bold text-white mb-2">
                  Tutelas y Desacatos por PQRSD Vencidas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Reclamos traspapelados en correos o chats generan desacatos judiciales con arresto o multas de hasta 20 SMMLV contra el Administrador por violar el Derecho Fundamental de Petición.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-cyan-400">
                ✓ Solución Urbix: Radicado inmutable y temporizador legal de 15 días hábiles.
              </div>
            </div>

            {/* Risk 3 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-colors">
              <div>
                <div className="text-[11px] font-mono text-red-400 mb-2 font-bold">CONTINGENCIA 03 · ART. 34 C.S.T.</div>
                <h3 className="text-base font-bold text-white mb-2">
                  Responsabilidad Solidaria en Portería
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Si un técnico de ascensores o pintor de fachada ingresa con planilla de ARL vencida y sufre un accidente grave, la copropiedad responde solidariamente por indemnizaciones millonarias.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-yellow-400">
                ✓ Solución Urbix: Escaneo QR con bloqueo automático en talanquera preventiva.
              </div>
            </div>

            {/* Risk 4 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between hover:border-red-500/40 transition-colors">
              <div>
                <div className="text-[11px] font-mono text-red-400 mb-2 font-bold">CONTINGENCIA 04 · DEPÓSITOS & PÓLIZAS</div>
                <h3 className="text-base font-bold text-white mb-2">
                  Zonas Comunes Dañadas y Pólizas Vencidas
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Eventos en salones sociales que terminan en daños sin cobrar por falta de depósito, y pólizas obligatorias contra incendio y terremoto (Art. 15) que vencen en silencio.
                </p>
              </div>
              <div className="pt-3 border-t border-zinc-800/80 text-[11px] font-mono text-emerald-400">
                ✓ Solución Urbix: Depósito digital en custodia y cronómetro de pólizas contra sismo.
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          4. INTERACTIVE SHOWCASE 2: LIVE PORTERÍA QR & SG-SST GATEKEEPER
         ========================================================================= */}
      <section id="porteria-demo" className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0e0e12]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono text-yellow-400 mb-2">SIMULADOR EN VIVO · PORTERÍA Y VIGILANCIA</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Pon a prueba el Lector QR de Portería y el Bloqueo Automático SG-SST
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Comprueba cómo la terminal de portería audita planillas de seguridad social (ARL y Póliza RCE) en milisegundos, o asigna celdas de parqueadero para visitantes autorizados por el residente:
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Selector of test scenarios */}
            <div className="lg:col-span-5 space-y-3">
              <div className="text-xs font-mono text-zinc-400 mb-2">SELECCIONA UN CASO DE PRUEBA EN PORTERÍA:</div>
              
              {/* Scenario 1: Schindler OK */}
              <button
                type="button"
                onClick={() => {
                  setScanTarget('schindler');
                  setScanResultTime('Hoy 10:28 AM');
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scanTarget === 'schindler'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-lg shadow-emerald-500/10'
                    : 'border-zinc-800 bg-[#141418] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-emerald-400 font-bold">CASO 1: CONTRATISTA APROBADO</div>
                  <div className="text-sm font-semibold text-white mt-0.5">Ascensores Schindler · Técnico Certificado</div>
                  <div className="text-xs text-zinc-400 mt-1">ARL Sura Riesgo V Vigente • Póliza RCE Activa</div>
                </div>
                <span className="text-emerald-400 text-xs font-mono font-bold">✓ Pasa</span>
              </button>

              {/* Scenario 2: Otis BLOQUEADO */}
              <button
                type="button"
                onClick={() => {
                  setScanTarget('otis');
                  setScanResultTime('Hoy 10:30 AM');
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scanTarget === 'otis'
                    ? 'border-red-500 bg-red-500/10 text-white shadow-lg shadow-red-500/10'
                    : 'border-zinc-800 bg-[#141418] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-red-400 font-bold">CASO 2: BLOQUEO SG-SST (RIESGO SOLIDARIO)</div>
                  <div className="text-sm font-semibold text-white mt-0.5">Otis Mantenimiento · Planilla Vencida</div>
                  <div className="text-xs text-zinc-400 mt-1">ARL vencida hace 4 días • Violación Art. 34 CST</div>
                </div>
                <span className="text-red-400 text-xs font-mono font-bold">⛔ Bloqueo</span>
              </button>

              {/* Scenario 3: Visitor QR Pass */}
              <button
                type="button"
                onClick={() => {
                  setScanTarget('visita_familiar');
                  setScanResultTime('Hoy 10:32 AM');
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scanTarget === 'visita_familiar'
                    ? 'border-cyan-500 bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/10'
                    : 'border-zinc-800 bg-[#141418] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-cyan-400 font-bold">CASO 3: VISITANTE CON PASE QR</div>
                  <div className="text-sm font-semibold text-white mt-0.5">Camila Restrepo · Pase QR-8492</div>
                  <div className="text-xs text-zinc-400 mt-1">Autorizado por Residente Torre 2 - 301 • Carro Placa JKL-901</div>
                </div>
                <span className="text-cyan-400 text-xs font-mono font-bold">🚘 Celda V-02</span>
              </button>

              {/* Scenario 4: Delivery / Encomienda */}
              <button
                type="button"
                onClick={() => {
                  setScanTarget('domicilio');
                  setScanResultTime('Hoy 10:34 AM');
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  scanTarget === 'domicilio'
                    ? 'border-yellow-500 bg-yellow-500/10 text-white shadow-lg shadow-yellow-500/10'
                    : 'border-zinc-800 bg-[#141418] text-zinc-300 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="text-xs font-mono text-yellow-400 font-bold">CASO 4: ENCOMIENDA CON PIN DE RETIRO</div>
                  <div className="text-sm font-semibold text-white mt-0.5">MercadoLibre Full · Casillero #14</div>
                  <div className="text-xs text-zinc-400 mt-1">Guía ML-9948201-CO • PIN Seguro: PIN-8842</div>
                </div>
                <span className="text-yellow-400 text-xs font-mono font-bold">📦 PIN-8842</span>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onEnterApp('porteria')}
                  className="w-full py-3 text-xs font-semibold text-zinc-950 bg-yellow-400 hover:bg-yellow-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Probar Consola de Portería en el Software Real</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>

            {/* Right Column: Screen simulation of the Guard Terminal */}
            <div className="lg:col-span-7">
              <div className="bg-[#141418] border-2 border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-2xl font-mono text-xs">
                
                {/* Terminal Header */}
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800 text-zinc-400 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-white font-bold">TERMINAL DE TALANQUERA · PORTERÍA PRINCIPAL</span>
                  </div>
                  <span className="text-cyan-400">{scanResultTime}</span>
                </div>

                {/* Scenario Result Rendering */}
                {scanTarget === 'schindler' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-950/40 border-2 border-emerald-500/60 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span>ACCESO PERMITIDO · CONTRATISTA SG-SST HABILITADO</span>
                        </span>
                        <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded text-[11px] font-bold">
                          TALANQUERA ABIERTA
                        </span>
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed">
                        Técnico: <strong>Carlos Andrés Restrepo</strong> (CC 71.392.104)<br />
                        Empresa: <strong>Ascensores Schindler Andino S.A.</strong><br />
                        Especialidad: <strong>Mantenimiento Preventivo de Elevadores</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Planilla PILA (ARL Sura):</div>
                        <div className="text-emerald-400 font-bold mt-0.5">VIGENTE (Riesgo V Alturas)</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Vence en 26 días · Planilla #889201</div>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Póliza RCE (Seguros Bolívar):</div>
                        <div className="text-emerald-400 font-bold mt-0.5">VIGENTE ($500M COP)</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Póliza #POL-7729-MED</div>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-900/80 rounded-lg border border-zinc-800/80 text-[11px] text-zinc-400">
                      ℹ️ Registro automático guardado en Bóveda Forense SHA-256. Residente y Supervisor notificados.
                    </div>
                  </div>
                )}

                {scanTarget === 'otis' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-950/50 border-2 border-red-500 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-red-400 font-bold text-sm flex items-center gap-1.5">
                          <XCircle className="w-5 h-5 text-red-400" />
                          <span>BLOQUEO PREVENTIVO SG-SST (TALANQUERA CERRADA)</span>
                        </span>
                        <span className="bg-red-500/20 text-red-300 px-2.5 py-0.5 rounded text-[11px] font-bold">
                          INGRESO DENEGADO
                        </span>
                      </div>
                      <p className="text-zinc-200 text-xs leading-relaxed">
                        Técnico: <strong>Julián Darío Pérez</strong> (CC 98.710.234)<br />
                        Empresa: <strong>Otis Elevadores Colombia</strong><br />
                        Causa: <strong className="text-red-400">PLANILLA DE SEGURIDAD SOCIAL ARL VENCIDA</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/40">
                        <div className="text-zinc-400 text-[11px]">Planilla PILA (Positiva ARL):</div>
                        <div className="text-red-400 font-bold mt-0.5">VENCIDA HACE 4 DÍAS</div>
                        <div className="text-red-300 text-[10px] mt-1">Riesgo civil y laboral (Art. 34 CST)</div>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Acción del Sistema:</div>
                        <div className="text-white font-bold mt-0.5">Alerta a Supervisor &amp; Admin</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Exigir soporte actualizado en portería</div>
                      </div>
                    </div>

                    <div className="p-3 bg-red-950/30 rounded-lg border border-red-500/30 text-[11px] text-red-200">
                      🛡️ <strong>Blindaje Activo:</strong> Urbix PH evitó que la copropiedad asuma responsabilidad solidaria en caso de un accidente laboral de alturas sin cobertura.
                    </div>
                  </div>
                )}

                {scanTarget === 'visita_familiar' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-cyan-950/40 border-2 border-cyan-500/60 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
                          <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                          <span>PASE QR VÁLIDO · VISITANTE FAMILIAR</span>
                        </span>
                        <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded text-[11px] font-bold">
                          QR-8492 AUTORIZADO
                        </span>
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed">
                        Visitante: <strong>Camila Restrepo Osorio</strong> (CC 1.020.450.912)<br />
                        Destino: <strong>Torre 2 - Apartamento 301</strong> (Anfitrión: Esteban Ochoa Mesa)<br />
                        Vehículo: <strong>Carro · Placa JKL-901</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Celda Asignada en Vivo:</div>
                        <div className="text-cyan-400 font-bold text-sm mt-0.5">CELDA V-02 (VISITANTE)</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Sótano 1 · Talanquera abierta</div>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Estado en Portal Residente:</div>
                        <div className="text-emerald-400 font-bold mt-0.5">Adentro 🟢 (Notificado)</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Hora de entrada: 10:32 AM</div>
                      </div>
                    </div>
                  </div>
                )}

                {scanTarget === 'domicilio' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-yellow-950/40 border-2 border-yellow-500/60 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-yellow-400 font-bold text-sm flex items-center gap-1.5">
                          <Package className="w-5 h-5 text-yellow-400" />
                          <span>ENCOMIENDA EN CUSTODIA · RETIRO VALIDADO CON PIN</span>
                        </span>
                        <span className="bg-yellow-500/20 text-yellow-300 px-2.5 py-0.5 rounded text-[11px] font-bold">
                          PIN-8842
                        </span>
                      </div>
                      <p className="text-zinc-300 text-xs leading-relaxed">
                        Transportadora: <strong>MercadoLibre Full</strong> (Guía ML-9948201-CO)<br />
                        Destinatario: <strong>Esteban Ochoa Mesa</strong> · Torre 2 - 301<br />
                        Ubicación: <strong>Casillero #14 (Custodia activa: 3 horas)</strong>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Validación Antifraude:</div>
                        <div className="text-emerald-400 font-bold mt-0.5">PIN Correcto ✓</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Entregado a residente autorizado</div>
                      </div>
                      <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                        <div className="text-zinc-400 text-[11px]">Alerta Custodia &gt;48h:</div>
                        <div className="text-cyan-400 font-bold mt-0.5">En Rango Normal</div>
                        <div className="text-zinc-500 text-[10px] mt-1">Evita saturación en recepción</div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          5. THE 10 ENTERPRISE MODULES SHOWCASE (Mapped 1-to-1 to SuperAdmin Console)
         ========================================================================= */}
      <section id="modulos" className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-3xl mb-12">
            <div className="text-xs font-mono text-cyan-400 mb-2">ARQUITECTURA DE INGENIERÍA PH</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Los 10 Módulos de Grado Enterprise del Software Urbix PH
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
              Cada módulo responde con rigor a una exigencia explícita de la Ley 675, la Ley 1755 o el Decreto 1072, eliminando riesgos legales para administradores y copropietarios:
            </p>
          </div>

          {/* 10-Button Neon Console Grid (Direct Replica of SuperAdmin Bar) */}
          <div className="p-3.5 rounded-2xl bg-[#141418] border border-cyan-500/20 shadow-[0_0_25px_rgba(6,182,212,0.08)] mb-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {MODULOS_SOFTWARE.map((mod) => {
                const isActive = moduloActivo === mod.id;
                return (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setModuloActivo(mod.id)}
                    className={`px-3 py-2.5 rounded-xl border text-left flex items-center gap-2 transition-all duration-200 cursor-pointer font-mono ${
                      isActive
                        ? 'border-cyan-400 bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-300 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.35)] ring-1 ring-cyan-400/50'
                        : 'bg-[#1c1c1f] border-zinc-800/90 text-zinc-300 text-xs font-medium hover:border-cyan-500/50 hover:text-white hover:bg-zinc-800/70'
                    }`}
                  >
                    <span className="text-base shrink-0">{mod.icon}</span>
                    <span className="truncate text-xs font-semibold">{mod.id}. {mod.nombre.split('&')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Card of the Selected Module */}
          {(() => {
            const mod = MODULOS_SOFTWARE.find(m => m.id === moduloActivo) || MODULOS_SOFTWARE[0];
            return (
              <div className="bg-[#141418] border border-cyan-500/30 rounded-2xl p-7 sm:p-10 shadow-2xl relative">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-8">
                    <div className="flex items-center gap-2.5 text-xs font-mono text-cyan-400 mb-2">
                      <span className="text-base">{mod.icon}</span>
                      <span>MÓDULO {mod.numero} DEL SISTEMA URBIX PH</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-400">{mod.ley}</span>
                    </div>
                    
                    <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                      {mod.nombre}
                    </h3>

                    <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                      {mod.desc}
                    </p>

                    <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl mb-6">
                      <div className="text-xs font-mono text-zinc-400 mb-1">IMPACTO EN TU COPROPIEDAD:</div>
                      <div className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>{mod.beneficio}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        type="button"
                        onClick={() => onEnterApp('super_admin')}
                        className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-md shadow-cyan-500/20"
                      >
                        <span>Abrir Módulo {mod.numero} en la Consola</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="lg:col-span-4 bg-[#1a1a20] border border-zinc-700/80 rounded-xl p-5 font-mono text-xs">
                    <div className="text-zinc-400 mb-3 pb-2 border-b border-zinc-800 flex justify-between">
                      <span>ESPECIFICACIÓN TÉCNICA</span>
                      <span className="text-cyan-400">ACTIVO</span>
                    </div>
                    <div className="space-y-2.5 text-zinc-300 text-[11px]">
                      <div>• Sincronización en tiempo real vía Webhooks y RLS</div>
                      <div>• Cifrado de extremo a extremo en tránsito y reposo</div>
                      <div>• Certificación DIAN para facturación electrónica</div>
                      <div>• Trazabilidad de cada clic en Bóveda SHA-256</div>
                      <div>• Compatible con tablets Android y iOS en portería</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </section>

      {/* =========================================================================
          6. INTERACTIVE 4-PORTALS EXPERIENCE
         ========================================================================= */}
      <section id="portales" className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0e0e12]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-mono text-cyan-400 mb-2">ECOSISTEMA SINCRONIZADO</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Cuatro consolas interconectadas para cada rol de la copropiedad
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Elimina los grupos caóticos de WhatsApp. Cada actor cuenta con su propia consola diseñada para su función:
            </p>
          </div>

          {/* Interactive Role Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10 p-1.5 bg-[#141418] border border-zinc-800 rounded-xl max-w-2xl mx-auto">
            <button
              type="button"
              onClick={() => setRolActivoTab('admin')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                rolActivoTab === 'admin'
                  ? 'bg-cyan-400 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              📊 Administrador PH
            </button>
            <button
              type="button"
              onClick={() => setRolActivoTab('residente')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                rolActivoTab === 'residente'
                  ? 'bg-cyan-400 text-zinc-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🏠 Residente &amp; Propietario
            </button>
            <button
              type="button"
              onClick={() => setRolActivoTab('porteria')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                rolActivoTab === 'porteria'
                  ? 'bg-yellow-400 text-zinc-950 font-bold shadow-md shadow-yellow-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              🛡️ Portería &amp; Vigilancia
            </button>
            <button
              type="button"
              onClick={() => setRolActivoTab('supervisor')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                rolActivoTab === 'supervisor'
                  ? 'bg-emerald-400 text-zinc-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              ⚡ Supervisor Operativo
            </button>
          </div>

          {/* Selected Portal Container */}
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
            {rolActivoTab === 'admin' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-cyan-400 mb-2">CONSOLA EJECUTIVA Y DE GOBIERNO</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Consola del Administrador y Consejo
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Dirige asambleas con moderación de mociones y cálculo de mayorías, gestiona respuestas a PQRSD con firma digital, supervisa cartera a más de 90 días y emite acuerdos de pago sin depender de hojas de cálculo vulnerables.
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Generación y descarga de Actas Oficiales en PDF firmadas</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Panel de control de vencimiento de pólizas globales contra terremoto</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Liquidación y retención de depósitos de zonas comunes</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp('super_admin')}
                    className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explorar Consola de Administrador en el Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-6 bg-[#1a1a20] border border-zinc-700/80 rounded-xl p-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-4">
                    <span>PANEL ADMIN • P.H. RESERVA DEL TESORO</span>
                    <span className="text-emerald-400">240 UNIDADES</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">Quórum Asamblea Ordinaria:</span>
                      <span className="text-emerald-400 font-bold tabular-nums">74.8% (Quórum Válido)</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">PQRSD Próximas a Vencer (&lt;3 días):</span>
                      <span className="text-yellow-400 font-bold tabular-nums">1 caso en término</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">Póliza Global Áreas Comunes:</span>
                      <span className="text-cyan-400 font-bold tabular-nums">Vigente (285 días)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rolActivoTab === 'residente' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-cyan-400 mb-2">AUTONOMÍA Y TRANSPARENCIA</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Portal del Residente y Propietario
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Los residentes generan pases QR para sus visitantes y domiciliarios con código de celda de parqueadero, reciben notificaciones instantáneas de encomiendas con PIN de entrega, votan en asamblea por coeficiente y radican PQRSD con seguimiento en tiempo real.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Generador de Pases QR para familiares y domicilios (QR-XXXX)</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Custodia de encomiendas con PIN seguro de entrega en portería</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Votación en asamblea con cálculo automático de coeficiente</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp('residente')}
                    className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explorar Portal de Residente en el Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-6 bg-[#1a1a20] border border-zinc-700/80 rounded-xl p-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-4">
                    <span>MI UNIDAD: TORRE 2 - APTO 301</span>
                    <span className="text-cyan-400">PAZ Y SALVO</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">🎫 Pase QR Visitante Activo:</span>
                      <span className="text-emerald-400 font-bold">QR-8492 (Adentro 🟢)</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">📦 Paquete en Casillero:</span>
                      <span className="text-yellow-400 font-bold">PIN-8842 (Listo para retirar)</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">🗳️ Asambleas en Vivo:</span>
                      <span className="text-cyan-400 font-bold">1 Moción Abierta (Coef: 1.42%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rolActivoTab === 'porteria' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-yellow-400 mb-2">CONTROL DE ACCESO Y SEGURIDAD</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Terminal de Portería &amp; Vigilancia
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Interfaz rápida diseñada para pantallas táctiles de recepción. Permite registrar encomiendas en segundos, validar el QR de contratistas con inspección de ARL y consultar la disponibilidad de celdas de visitantes.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Escáner QR de contratistas con detección de ARL vencida</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Alarma automática de paquetes con más de 48 horas sin reclamar</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />
                      <span>Bitácora digital de novedades y rondas de patrullaje</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp('porteria')}
                    className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-yellow-400 rounded-lg hover:bg-yellow-300 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explorar Terminal de Portería en el Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-6 bg-[#1a1a20] border border-zinc-700/80 rounded-xl p-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-4">
                    <span>TERMINAL DE ACCESO • RECEPCIÓN PRINCIPAL</span>
                    <span className="text-yellow-400">TURNO EN LÍNEA</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-950/30 rounded border border-red-500/40 flex justify-between items-center">
                      <span className="text-red-300">⛔ Contratista Otis:</span>
                      <span className="text-red-400 font-bold">ARL VENCIDA (BLOQUEADO)</span>
                    </div>
                    <div className="p-3 bg-emerald-950/30 rounded border border-emerald-500/40 flex justify-between items-center">
                      <span className="text-emerald-300">✓ Contratista Schindler:</span>
                      <span className="text-emerald-400 font-bold">ARL VIGENTE (PERMITIDO)</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">📦 Encomiendas en Custodia:</span>
                      <span className="text-yellow-400 font-bold">2 paquetes listos con PIN</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {rolActivoTab === 'supervisor' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-6">
                  <div className="text-xs font-mono text-emerald-400 mb-2">OPERACIÓN Y MANTENIMIENTO</div>
                  <h3 className="text-2xl font-bold text-white mb-3">
                    Consola del Supervisor Operativo
                  </h3>
                  <p className="text-zinc-300 text-sm leading-relaxed mb-6">
                    Módulo técnico para el seguimiento de tareas del personal de aseo, mantenimiento de bombas y plantas eléctricas, checklist de entrega de salones sociales y gestión de caja menor con recibos digitales.
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Checklist de inspección post-evento de zonas comunes</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Control de caja menor y arqueos de gastos inmediatos</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Bitácora de rutinas de mantenimiento preventivo</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onEnterApp('supervisor')}
                    className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-emerald-400 rounded-lg hover:bg-emerald-300 transition-colors inline-flex items-center gap-2 cursor-pointer"
                  >
                    <span>Explorar Consola de Supervisor en el Software</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="lg:col-span-6 bg-[#1a1a20] border border-zinc-700/80 rounded-xl p-5 font-mono text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400 mb-4">
                    <span>SUPERVISIÓN OPERATIVA • BODEGA Y ZONAS</span>
                    <span className="text-emerald-400">ESTADO OK</span>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">Checklist Salón Social (Evento Ayer):</span>
                      <span className="text-emerald-400 font-bold">Conforme (Depósito Reembolsado)</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">Saldo Caja Menor Operativa:</span>
                      <span className="text-cyan-400 font-bold">$345.000 COP</span>
                    </div>
                    <div className="p-3 bg-zinc-900 rounded border border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-300">Mantenimiento Ascensores Torre 1:</span>
                      <span className="text-zinc-300 font-bold">Completado Hoy 09:30 AM</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* =========================================================================
          7. ROI & COST-SAVINGS CALCULATOR: Quantitative Precision for Condominiums
         ========================================================================= */}
      <section id="calculadora" className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            <div className="lg:col-span-5">
              <div className="text-xs font-mono text-cyan-400 mb-2">SIMULADOR FINANCIERO</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
                Calcula el retorno de inversión y ahorro real para tu copropiedad
              </h2>
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed mb-6">
                El costo de alquilar salones externos, contratar equipos de sonido, imprimir tarjetones y perder horas en cobro manual de cartera supera ampliamente la inversión en Urbix PH:
              </p>

              <div className="bg-[#141418] border border-zinc-800 rounded-xl p-5 mb-6">
                <label className="block text-xs font-mono text-zinc-300 mb-3">
                  Número de Unidades Privadas (Apartamentos / Locales):
                  <span className="text-cyan-400 font-bold text-base ml-2 tabular-nums">
                    {unidadesCalc} Unidades
                  </span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="450"
                  step="5"
                  value={unidadesCalc}
                  onChange={(e) => setUnidadesCalc(Number(e.target.value))}
                  className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[11px] text-zinc-500 font-mono mt-2">
                  <span>30 unidades</span>
                  <span>200 unidades</span>
                  <span>450 unidades</span>
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-mono">
                * Estimaciones basadas en costos promedios del mercado inmobiliario y logístico en Colombia (2025-2026).
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-7 sm:p-9 shadow-2xl">
                <div className="text-xs font-mono text-zinc-400 mb-1">PROYECCIÓN DE AHORRO ANUAL ESTIMADO</div>
                <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400 font-mono tabular-nums mb-6">
                  ${totalAhorroAnual.toLocaleString('es-CO')} COP / año
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-xs text-zinc-400 mb-1">Logística de Asamblea</div>
                    <div className="text-lg font-bold text-white font-mono tabular-nums">
                      ${costoAsambleaPresencial.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Salón, sonido y tarjetones</div>
                  </div>

                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-xs text-zinc-400 mb-1">Papelería y Circulares</div>
                    <div className="text-lg font-bold text-white font-mono tabular-nums">
                      ${ahorroPapeleriaAnual.toLocaleString('es-CO')}
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Extractos y comunicados</div>
                  </div>

                  <div className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800">
                    <div className="text-xs text-zinc-400 mb-1">Tiempo de Gestión</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                      {horasAhorradasMes} h / mes
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Ahorradas al Administrador</div>
                  </div>
                </div>

                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <div className="text-xs font-semibold text-cyan-300">
                      Garantía de Blindaje Jurídico Urbix PH
                    </div>
                    <div className="text-xs text-zinc-400">
                      Cero tutelas por PQRSD extemporáneas y actas de asamblea firmadas la misma noche.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onEnterApp('super_admin')}
                    className="px-4 py-2 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-cyan-500/20"
                  >
                    Implementar en mi Copropiedad
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          8. CASE STUDIES & EVIDENCE: Concrete Colombian Context
         ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0e0e12]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-mono text-cyan-400 mb-2">RESULTADOS DEMOSTRADOS</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Copropiedades que transformaron su gestión en Colombia
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Testimonios y casos de estudio verificables en conjuntos residenciales y centros comerciales:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-4">
                  <span>MEDELLÍN · EL POBLADO</span>
                  <span className="text-cyan-400">240 UNIDADES</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  P.H. Conjunto Torres del Poblado
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                  "Logramos un quórum histórico del 84.6% en apenas 14 minutos. Las votaciones de presupuesto se aprobaron sin discusiones de coeficientes y el acta preliminar se descargó firmada esa misma noche."
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 text-xs">
                <div className="font-semibold text-white">Dra. Claudia Restrepo M.</div>
                <div className="text-zinc-400">Administradora Delegada &amp; Abogada PH</div>
              </div>
            </div>

            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-4">
                  <span>BOGOTÁ · CHICÓ</span>
                  <span className="text-emerald-400">110 UNIDADES</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Edificio Reserva del Chicó
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                  "Pasamos de tener reclamos traspapelados a un sistema con número de radicado legal y temporizador de 15 días hábiles. En 18 meses no hemos recibido una sola tutela por derecho de petición."
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 text-xs">
                <div className="font-semibold text-white">Ing. Mauricio Valenzuela</div>
                <div className="text-zinc-400">Presidente del Consejo de Administración</div>
              </div>
            </div>

            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-4">
                  <span>CALI · CIUDAD JARDÍN</span>
                  <span className="text-yellow-400">180 OFICINAS &amp; LOCALES</span>
                </div>
                <h3 className="text-base font-bold text-white mb-2">
                  Centro Comercial &amp; Empresarial San Diego
                </h3>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
                  "El bloqueo en portería para contratistas sin ARL vigente nos salvó de una contingencia de responsabilidad solidaria en una obra de pintura de fachadas. El sistema de código QR es infalible."
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800/80 text-xs">
                <div className="font-semibold text-white">Hernando Giraldo O.</div>
                <div className="text-zinc-400">Jefe de Seguridad y Operaciones</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          9. PRICING TIERS: Transparent and Predictable Plans for Condominiums
         ========================================================================= */}
      <section id="planes" className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0a0a0c]">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-mono text-cyan-400 mb-2">INVERSIÓN CLARA Y SIN SORPRESAS</div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-4 text-balance">
              Planes adaptados al tamaño de cada copropiedad
            </h2>
            <p className="text-zinc-400 text-sm sm:text-base">
              Todos los planes incluyen soporte de Ley 675, almacenamiento ilimitado de actas en la nube y actualizaciones normativas continuas:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            
            {/* Plan 1 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-zinc-400 mb-2">COPROPIEDADES PEQUEÑAS</div>
                <h3 className="text-xl font-bold text-white mb-2">Plan Esencial</h3>
                <p className="text-xs text-zinc-400 mb-5">Para edificios o conjuntos de hasta 60 unidades residenciales.</p>
                <div className="text-3xl font-extrabold text-white font-mono tabular-nums mb-6">
                  $190.000 <span className="text-xs font-normal text-zinc-400">COP / mes</span>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Asambleas virtuales por coeficiente (hasta 60 aptos)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Módulo de PQRSD con radicado legal Ley 1755</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Portal web y móvil para residentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Bitácora de cartera y expensas comunes</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onEnterApp('super_admin')}
                  className="w-full py-3 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  Contratar Plan Esencial
                </button>
              </div>
            </div>

            {/* Plan 2: Destacado Pro */}
            <div className="bg-[#18181f] border-2 border-cyan-500/60 rounded-xl p-7 flex flex-col justify-between relative shadow-xl shadow-cyan-500/10">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-cyan-400 text-zinc-950 text-[11px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider">
                Más Elegido por Copropiedades
              </div>

              <div>
                <div className="text-xs font-mono text-cyan-400 mb-2 mt-1">CONDOMINIOS MEDIANOS</div>
                <h3 className="text-xl font-bold text-white mb-2">Condominio Pro</h3>
                <p className="text-xs text-zinc-400 mb-5">Para conjuntos de 61 a 200 unidades residenciales o mixtas.</p>
                <div className="text-3xl font-extrabold text-cyan-400 font-mono tabular-nums mb-6">
                  $380.000 <span className="text-xs font-normal text-zinc-400">COP / mes</span>
                </div>

                <div className="space-y-3 text-xs text-zinc-200 pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Todo lo del Plan Esencial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Control de Contratistas con validación de ARL en portería</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Reservas de zonas comunes con Depósito de Garantía</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Casillero inteligente con alerta de paquetes &gt;48h</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span>Terminal táctil de Portería y Vigilancia</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onEnterApp('super_admin')}
                  className="w-full py-3 text-xs font-semibold text-zinc-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Comenzar con Condominio Pro
                </button>
              </div>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#141418] border border-zinc-800 rounded-xl p-7 flex flex-col justify-between">
              <div>
                <div className="text-xs font-mono text-emerald-400 mb-2">MACRO-COPROPIEDADES</div>
                <h3 className="text-xl font-bold text-white mb-2">Macro-Complejo</h3>
                <p className="text-xs text-zinc-400 mb-5">Para complejos residenciales de más de 200 unidades o centros comerciales.</p>
                <div className="text-3xl font-extrabold text-white font-mono tabular-nums mb-6">
                  $690.000 <span className="text-xs font-normal text-zinc-400">COP / mes</span>
                </div>

                <div className="space-y-3 text-xs text-zinc-300 pb-6 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Todo lo de Condominio Pro sin límite de unidades</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Múltiples porterías y accesos vehiculares concurrentes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Consola de Supervisor y gestión de Caja Menor</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Bóveda forense inmutable de auditoría (SHA-256)</span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => onEnterApp('super_admin')}
                  className="w-full py-3 text-xs font-semibold text-zinc-200 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
                >
                  Solicitar Propuesta Personalizada
                </button>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =========================================================================
          10. LEAD CAPTURE / CONTACT: Validated Diagnostic Audit Form
         ========================================================================= */}
      <section className="py-20 md:py-28 border-b border-zinc-800/80 bg-[#0e0e12]">
        <div className="max-w-4xl mx-auto px-6">
          
          <div className="bg-[#141418] border border-zinc-800 rounded-2xl p-8 sm:p-12 shadow-2xl">
            <div className="text-center max-w-xl mx-auto mb-10">
              <div className="text-xs font-mono text-cyan-400 mb-2">DIAGNÓSTICO GRATUITO</div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-3 text-balance">
                Solicita una demostración guiada para tu Copropiedad
              </h2>
              <p className="text-zinc-400 text-xs sm:text-sm">
                Un especialista en Ley 675 configurará tu copropiedad y te mostrará el simulador con los coeficientes reales de tu conjunto.
              </p>
            </div>

            {formEnviado ? (
              <div className="p-6 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center max-w-lg mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white mb-1">¡Solicitud recibida correctamente!</h3>
                <p className="text-xs text-zinc-300 leading-relaxed mb-4">
                  Hemos agendado el diagnóstico para <strong>{formCopropiedad}</strong> en {formCiudad}. Un consultor legal se comunicará al correo <strong>{formEmail}</strong> en las próximas 2 horas hábiles.
                </p>
                <button
                  type="button"
                  onClick={() => onEnterApp('super_admin')}
                  className="px-5 py-2.5 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer shadow-md shadow-cyan-500/20"
                >
                  Entrar a Probar el Software Ahora Mismo →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitLead} className="space-y-4 max-w-2xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Nombre del Administrador / Consejero *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNombre}
                      onChange={(e) => setFormNombre(e.target.value)}
                      placeholder="Ej. Dr. Esteban Ochoa"
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Nombre de la Copropiedad *
                    </label>
                    <input
                      type="text"
                      required
                      value={formCopropiedad}
                      onChange={(e) => setFormCopropiedad(e.target.value)}
                      placeholder="Ej. P.H. Torres del Poblado"
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Ciudad *
                    </label>
                    <select
                      value={formCiudad}
                      onChange={(e) => setFormCiudad(e.target.value)}
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    >
                      <option value="Medellín">Medellín &amp; Área Metropolitana</option>
                      <option value="Bogotá">Bogotá D.C. &amp; Sabana</option>
                      <option value="Cali">Cali &amp; Valle del Cauca</option>
                      <option value="Barranquilla">Barranquilla &amp; Costa Caribe</option>
                      <option value="Bucaramanga">Bucaramanga &amp; Santander</option>
                      <option value="Eje Cafetero">Pereira / Manizales / Armenia</option>
                      <option value="Otra">Otra Ciudad en Colombia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Número Aproximado de Unidades
                    </label>
                    <input
                      type="number"
                      value={formUnidades}
                      onChange={(e) => setFormUnidades(e.target.value)}
                      placeholder="120"
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Correo Electrónico Corporativo *
                    </label>
                    <input
                      type="email"
                      required
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="administracion@condominio.co"
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-zinc-300 mb-1.5">
                      Teléfono Celular / WhatsApp
                    </label>
                    <input
                      type="tel"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      placeholder="+57 300 123 4567"
                      className="w-full bg-[#1c1c22] border border-zinc-700/80 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3.5 text-xs font-semibold text-zinc-950 bg-cyan-400 rounded-lg hover:bg-cyan-300 transition-colors cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Agendar Diagnóstico Gratuito de Copropiedad
                  </button>
                  <p className="text-[11px] text-zinc-500 text-center mt-2 font-mono">
                    Protección de datos bajo Ley 1581 de 2012 (Habeas Data). Nunca compartimos tu información.
                  </p>
                </div>
              </form>
            )}

          </div>

        </div>
      </section>

      {/* =========================================================================
          11. QUIET FOOTER: Legal compliance and clean links
         ========================================================================= */}
      <footer className="py-12 bg-[#08080a] text-zinc-400 text-xs border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-2.5">
            <div className="relative overflow-hidden rounded border border-cyan-500/35 bg-[#0c1815] p-1 flex items-center justify-center">
              <img
                src="/assets/aistudio/Captura_de_pantalla_2026-10-30_135456_59f03351.png"
                alt="Urbix PH"
                className="h-5 w-auto object-contain"
              />
            </div>
            <span className="text-white font-bold tracking-tight">Urbi<span className="text-cyan-400">x</span> PH</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">Sistema Operativo de Propiedad Horizontal</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-zinc-400">
            <a href="#modulos" className="hover:text-white transition-colors">10 Módulos</a>
            <a href="#asambleas" className="hover:text-white transition-colors">Ley 675</a>
            <a href="#porteria-demo" className="hover:text-white transition-colors">Portería QR</a>
            <a href="#portales" className="hover:text-white transition-colors">4 Portales</a>
            <a href="#planes" className="hover:text-white transition-colors">Planes</a>
            <button
              type="button"
              onClick={() => onGoToLogin ? onGoToLogin() : onEnterApp('super_admin')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
            >
              Iniciar Sesión / Entrar →
            </button>
          </div>

          <div className="text-zinc-500 text-[11px] font-mono">
            © {new Date().getFullYear()} Urbix PH Colombia · Ley 675 / Ley 1755 / Dec. 1072
          </div>

        </div>
      </footer>

    </div>
  );
}
