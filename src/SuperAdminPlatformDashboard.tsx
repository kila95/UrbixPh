import React, { useState } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Database, 
  Terminal, Power, AlertTriangle, CheckCircle2, 
  RefreshCw, LogOut, Lock, Key, Bell, Users, 
  Search, Shield, Check, X, Server, Layers, Building2, Crown, ShieldCheck, UserCheck
} from 'lucide-react';
import SuperAdminMasterHub from './SuperAdminMasterHub';
import { UrbixLogoMark } from './UrbixLogo';

export interface ServiceHealthItem {
  id: string;
  name: string;
  category: string;
  status: 'Operativo' | 'Degradado' | 'Caído';
  latency: string;
  connections: string;
  healthPercent: number;
}

export interface ErrorLogItem {
  id: string;
  timestamp: string;
  tenant: string;
  module: string;
  message: string;
  severity: 'Crítico' | 'Advertencia' | 'Info';
  status: 'Pendiente' | 'Resuelto';
  stackTrace?: string;
}

export interface ActiveSessionItem {
  id: string;
  user: string;
  role: string;
  company: string;
  ip: string;
  device: string;
  lastActive: string;
}

export interface SystemConfigState {
  maintenanceMode: boolean;
  globalBannerActive: boolean;
  globalBannerText: string;
  defaultAiModel: string;
  allowNewRegistrations: boolean;
  maxAudioUploadSizeMb: number;
}

export interface SuperAdminPlatformDashboardProps {
  onLogout?: () => void;
  user?: {
    name: string;
    role: string;
    email?: string;
  };
  onSwitchRole?: (role: 'superadmin' | 'administrador' | 'supervisor' | 'vigilante') => void;
  onStartInspection?: (targetRole: 'administrador' | 'supervisor' | 'vigilante', companyName: string, buildingName: string) => void;
}

export default function SuperAdminPlatformDashboard({
  onLogout,
  user = { name: 'Esteban SuperAdmin', role: 'superadmin' },
  onSwitchRole,
  onStartInspection
}: SuperAdminPlatformDashboardProps) {
  // Pestañas técnicas + acceso directo a Gobierno Comercial B2B
  const [activeTab, setActiveTab] = useState<'health' | 'errors' | 'flags' | 'security' | 'b2b'>('health');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isRefreshingMetrics, setIsRefreshingMetrics] = useState(false);
  const [selectedErrorTrace, setSelectedErrorTrace] = useState<ErrorLogItem | null>(null);
  const [confirmKillAllModal, setConfirmKillAllModal] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // 1. ESTADO: SALUD DE INFRAESTRUCTURA Y SERVICIOS EXTERNOS
  const [servicesHealth, setServicesHealth] = useState<ServiceHealthItem[]>([
    {
      id: 'supabase-db',
      name: 'Supabase PostgreSQL (Pooler)',
      category: 'Base de Datos',
      status: 'Operativo',
      latency: '24ms',
      connections: '42 / 120 (35%)',
      healthPercent: 99.98
    },
    {
      id: 'supabase-storage',
      name: 'Supabase S3 Storage (Audios)',
      category: 'Almacenamiento',
      status: 'Operativo',
      latency: '45ms',
      connections: '14.2 GB usados',
      healthPercent: 99.95
    },
    {
      id: 'edge-functions',
      name: 'Edge Functions (Deno Runtime)',
      category: 'Backend Serverless',
      status: 'Operativo',
      latency: '82ms',
      connections: '99.2% Tasa Éxito',
      healthPercent: 99.80
    },
    {
      id: 'gemini-api',
      name: 'Google Gemini 3.8 Flash API',
      category: 'Motor Inteligencia Artificial',
      status: 'Operativo',
      latency: '1.2s (Promedio)',
      connections: '68.5 hrs procesadas',
      healthPercent: 99.90
    }
  ]);

  // 2. ESTADO: LOGS DE ERRORES E INCIDENTES TÉCNICOS (SENTRY INTERNO)
  const [errorLogs, setErrorLogs] = useState<ErrorLogItem[]>([
    {
      id: 'ERR-904',
      timestamp: 'Hoy, 10:14 AM',
      tenant: 'Bosques de la Castellana P.H.',
      module: 'Edge Function: process-meeting',
      message: 'Timeout en subida de audio (Archivo de 95 MB superó límite de espera en red móvil).',
      severity: 'Advertencia',
      status: 'Pendiente',
      stackTrace: `Error: UploadStreamTimeoutError: Stream stalled after 45000ms at chunk #48/60
    at ResumableUploader.uploadChunk (supabase/functions/process-meeting/index.ts:142:15)
    at eventLoopTick (ext:core/01_core.js:183:11)
    at async Server.<anonymous> (supabase/functions/process-meeting/index.ts:219:9)
Context: { tenant: "Bosques de la Castellana P.H.", fileSizeMb: 95.4, network: "LTE-Movistar" }`
    },
    {
      id: 'ERR-903',
      timestamp: 'Ayer, 06:40 PM',
      tenant: 'Reserva del Tesoro',
      module: 'Auth / RLS Policy',
      message: 'Intento de acceso denegado a tabla financial_vouchers desde rol Vigilante.',
      severity: 'Info',
      status: 'Resuelto',
      stackTrace: `PostgrestError [42501]: new row violates row-level security policy for table "financial_vouchers"
    at verifyRoleHierarchy (src/security/rlsPolicyGuard.ts:88:11)
    at SupervisorOpsHub.submitVoucher (src/SupervisorOpsHub.tsx:114:7)
Context: { role: "vigilante", attemptedAction: "SELECT/UPDATE financial_vouchers", blockedBy: "RLS_STRICT_HIERARCHY" }`
    },
    {
      id: 'ERR-902',
      timestamp: '28 Oct 2026, 11:20 AM',
      tenant: 'Pino Alto P.H.',
      module: 'Gemini API Integration',
      message: '429 Too Many Requests: Pico de 8 asambleas simultáneas procesando actas.',
      severity: 'Crítico',
      status: 'Resuelto',
      stackTrace: `GoogleGenerativeAIError [429]: Resource has been exhausted (e.g. check quota).
    at generateLegalMinutesWithFallback (server.ts:98:19)
    at processMeetingHandler (server.ts:210:24)
Failover Triggered: Automatic fallback to models/gemini-3.1-flash-lite-preview succeeded in 1420ms.`
    }
  ]);

  // 3. ESTADO: INTERRUPTORES GLOBALES (FEATURE FLAGS & MANTENIMIENTO)
  const [systemConfig, setSystemConfig] = useState<SystemConfigState>({
    maintenanceMode: false,
    globalBannerActive: true,
    globalBannerText: '🚀 Actualización v2.5: Nuevo grabador resiliente de asambleas contra caídas de batería disponible.',
    defaultAiModel: 'gemini-3.8-flash',
    allowNewRegistrations: false,
    maxAudioUploadSizeMb: 150
  });

  // 4. ESTADO: SESIONES ACTIVAS Y AUDITORÍA DE ACCESOS
  const [activeSessions, setActiveSessions] = useState<ActiveSessionItem[]>([
    {
      id: 'SES-01',
      user: 'Carlos Mario Duque',
      role: 'Administrador Titular',
      company: 'Mundo Horizontal S.A.S.',
      ip: '181.54.22.109 (Medellín)',
      device: 'Chrome / macOS',
      lastActive: 'Hace 2 min'
    },
    {
      id: 'SES-02',
      user: 'Laura Gómez',
      role: 'Supervisor de Operaciones',
      company: 'Mundo Horizontal S.A.S.',
      ip: '190.24.11.88 (Envigado)',
      device: 'Safari / iPhone 15',
      lastActive: 'Hace 8 min'
    },
    {
      id: 'SES-03',
      user: 'Portería Turno Día',
      role: 'Vigilante / Portería',
      company: 'Reserva del Tesoro',
      ip: '186.80.14.201 (Medellín)',
      device: 'Chrome / Windows 11',
      lastActive: 'Activo ahora'
    }
  ]);

  // Función para refrescar telemetría en vivo
  const handleRefreshTelemetry = () => {
    setIsRefreshingMetrics(true);
    setTimeout(() => {
      setServicesHealth(prev =>
        prev.map(s => {
          if (s.id === 'supabase-db') {
            const ms = 20 + Math.floor(Math.random() * 9);
            return { ...s, latency: `${ms}ms` };
          }
          if (s.id === 'edge-functions') {
            const ms = 74 + Math.floor(Math.random() * 15);
            return { ...s, latency: `${ms}ms` };
          }
          return s;
        })
      );
      setIsRefreshingMetrics(false);
      showToast('Telemetría de infraestructura sincronizada en tiempo real.');
    }, 500);
  };

  // Función para marcar un error como resuelto
  const handleResolveError = (id: string) => {
    setErrorLogs(errorLogs.map(err => err.id === id ? { ...err, status: 'Resuelto' } : err));
    showToast(`Incidente ${id} marcado como Resuelto en el registro central.`);
  };

  // Función para revocar sesión en vivo
  const handleRevokeSession = (id: string, userName: string) => {
    setActiveSessions(activeSessions.filter(s => s.id !== id));
    showToast(`Token JWT revocado para la sesión de ${userName} (${id}).`);
  };

  // Función para revocar todas las sesiones
  const handleKillAllSessions = () => {
    setActiveSessions([]);
    setConfirmKillAllModal(false);
    showToast('Se han invalidado todos los tokens JWT activos de la plataforma.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* BANNER GLOBAL DE MANTENIMIENTO SI ESTÁ ACTIVO */}
      {systemConfig.maintenanceMode && (
        <div className="bg-amber-500 text-slate-950 px-6 py-2.5 text-xs font-black flex items-center justify-center gap-2 shadow-lg">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          MODO MANTENIMIENTO GLOBAL ACTIVO: Las copropiedades se encuentran en modo solo-lectura mientras se aplican parches en la nube.
        </div>
      )}

      {/* BANNER INFORMATIVO GLOBAL SI ESTÁ ACTIVO */}
      {!systemConfig.maintenanceMode && systemConfig.globalBannerActive && systemConfig.globalBannerText && (
        <div className="bg-indigo-600/20 border-b border-indigo-500/30 text-indigo-200 px-6 py-2 text-xs font-medium flex items-center justify-center gap-2">
          <Bell className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>{systemConfig.globalBannerText}</span>
        </div>
      )}

      {/* TOPBAR EXCLUSIVA DE INGENIERÍA Y PLATAFORMA */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <UrbixLogoMark className="w-11 h-11 shrink-0 drop-shadow-md" />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-black tracking-tight text-white uppercase">
                Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span> Platform Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40">
                SuperAdmin Ops
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Panel Maestro de Infraestructura, Seguridad y Telemetría
            </p>
          </div>
        </div>

        {/* Simulador Rápido de Jerarquía */}
        {onSwitchRole && (
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold px-2 uppercase tracking-wider">
              Simular Rol:
            </span>
            <button
              type="button"
              onClick={() => onSwitchRole('superadmin')}
              className="px-2.5 py-1 rounded-xl text-xs font-black bg-purple-600 text-white shadow-sm flex items-center gap-1 cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" /> SuperAdmin
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('administrador')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Admin Titular
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('supervisor')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-amber-400 hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-400" /> Supervisor
            </button>
            <button
              type="button"
              onClick={() => onSwitchRole('vigilante')}
              className="px-2.5 py-1 rounded-xl text-xs font-bold text-slate-400 hover:text-cyan-400 hover:bg-slate-900 transition flex items-center gap-1 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400" /> Vigilancia
            </button>
          </div>
        )}

        <div className="flex items-center gap-4">
          {/* Indicador Global de Estado del Sistema */}
          <div className={`px-3.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs font-bold ${
            systemConfig.maintenanceMode 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${
              systemConfig.maintenanceMode ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
            {systemConfig.maintenanceMode ? 'MODO MANTENIMIENTO ACTIVO' : 'TODOS LOS SISTEMAS OPERATIVOS'}
          </div>

          <button 
            onClick={() => {
              if (onLogout) {
                onLogout();
              } else {
                showToast(`Sesión de ${user.name} verificada y protegida con MFA.`);
              }
            }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>
      </header>

      {/* TOAST DE RETROALIMENTACIÓN */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-indigo-500/15 border border-indigo-500/30 text-indigo-200 px-4 py-3 rounded-2xl text-xs font-bold flex items-center justify-between shadow-lg">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              {toastMessage}
            </span>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* NAVEGACIÓN DE PESTAÑAS TÉCNICAS */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('health')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'health'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Activity className="w-4 h-4" /> Salud de Nube (Supabase & IA)
            </button>

            <button
              onClick={() => setActiveTab('errors')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'errors'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Error Tracker
              {errorLogs.filter(e => e.status === 'Pendiente').length > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white font-black">
                  {errorLogs.filter(e => e.status === 'Pendiente').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('flags')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'flags'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Power className="w-4 h-4" /> Mantenimiento & Flags
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'security'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" /> Sesiones & Seguridad ({activeSessions.length})
            </button>

            <button
              onClick={() => setActiveTab('b2b')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'b2b'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'bg-slate-900 text-purple-300 hover:text-white border border-purple-500/30'
              }`}
            >
              <Building2 className="w-4 h-4" /> Gobierno Comercial B2B
            </button>
          </div>

          <button 
            onClick={handleRefreshTelemetry}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMetrics ? 'animate-spin text-indigo-400' : ''}`} /> Refrescar Métricas
          </button>
        </div>

        {/* =================================================================
            PESTAÑA 1: SALUD DE INFRAESTRUCTURA Y SERVICIOS (SUPABASE / GEMINI)
           ================================================================= */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-white">Monitoreo de Servicios y Latencia en Vivo</h2>
              <p className="text-xs text-slate-400">Estado de conexión con los motores de base de datos, almacenamiento y modelos LLM</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicesHealth.map((srv) => (
                <div key={srv.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4 hover:border-slate-700 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        {srv.id.includes('db') ? <Database className="w-5 h-5" /> :
                         srv.id.includes('gemini') ? <Cpu className="w-5 h-5" /> :
                         <Server className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{srv.category}</span>
                        <h3 className="text-sm font-black text-white">{srv.name}</h3>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {srv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">Latencia Media</span>
                      <span className="font-mono font-bold text-slate-200">{srv.latency}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Carga / Uso</span>
                      <span className="font-mono font-bold text-slate-200">{srv.connections}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">Uptime (30d)</span>
                      <span className="font-mono font-bold text-emerald-400">{srv.healthPercent}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            PESTAÑA 2: ERROR TRACKER & LOGS DE CONSOLA
           ================================================================= */}
        {activeTab === 'errors' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-white">Registro Central de Excepciones de Software</h2>
                <p className="text-xs text-slate-400">Captura automática de errores en Edge Functions, políticas RLS y llamadas a la API de IA</p>
              </div>
            </div>

            <div className="space-y-3">
              {errorLogs.map((err) => (
                <div 
                  key={err.id} 
                  className={`p-5 rounded-2xl border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    err.status === 'Pendiente' 
                      ? 'bg-slate-900 border-rose-500/30' 
                      : 'bg-slate-900/50 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-xs font-black text-slate-400">{err.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        err.severity === 'Crítico' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        err.severity === 'Advertencia' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {err.severity}
                      </span>
                      <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                        {err.module}
                      </span>
                      <span className="text-xs text-slate-400">Edificio: <strong className="text-slate-200">{err.tenant}</strong></span>
                      <span className="text-[11px] text-slate-500">• {err.timestamp}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-200 font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                      {err.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {err.status === 'Pendiente' ? (
                      <button
                        onClick={() => handleResolveError(err.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Marcar Resuelto
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Solucionado
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedErrorTrace(err)}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
                    >
                      Ver Stack Trace
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =================================================================
            PESTAÑA 3: INTERRUPTORES GLOBALES (FEATURE FLAGS & MANTENIMIENTO)
           ================================================================= */}
        {activeTab === 'flags' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Controles de Operación Crítica */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Power className="w-5 h-5 text-indigo-400" /> Control de Operación Global
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Cambios aplicados en tiempo real sobre todas las copropiedades conectadas
                </p>
              </div>

              <div className="space-y-4">
                {/* Modo Mantenimiento */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="pr-4">
                    <div className="text-sm font-bold text-white">Modo Mantenimiento Global</div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Bloquea temporalmente el acceso a administradores y residentes mientras realizas despliegues en Supabase.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const nextMode = !systemConfig.maintenanceMode;
                      setSystemConfig({ ...systemConfig, maintenanceMode: nextMode });
                      showToast(
                        nextMode
                          ? 'Modo Mantenimiento Global ACTIVADO.'
                          : 'Modo Mantenimiento desactivado. Todos los servicios en línea.'
                      );
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                      systemConfig.maintenanceMode 
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' 
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {systemConfig.maintenanceMode ? 'ACTIVO (APAGAR)' : 'INACTIVO (ACTIVAR)'}
                  </button>
                </div>

                {/* Banner Global de Anuncios */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">Banner Global del Sistema</div>
                      <p className="text-xs text-slate-400">Muestra un aviso en la parte superior a todos los usuarios.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={systemConfig.globalBannerActive}
                      onChange={(e) => {
                        setSystemConfig({ ...systemConfig, globalBannerActive: e.target.checked });
                        showToast(e.target.checked ? 'Banner global activado.' : 'Banner global ocultado.');
                      }}
                      className="w-4 h-4 accent-indigo-500 cursor-pointer"
                    />
                  </div>
                  <input 
                    type="text"
                    value={systemConfig.globalBannerText}
                    onChange={(e) => setSystemConfig({ ...systemConfig, globalBannerText: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Parámetros del Motor de IA */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" /> Parámetros Globales de Inteligencia Artificial
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Configura qué modelo procesa las actas por defecto para controlar costos de API
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Motor IA por Defecto en la Nube
                  </label>
                  <select 
                    value={systemConfig.defaultAiModel}
                    onChange={(e) => {
                      setSystemConfig({ ...systemConfig, defaultAiModel: e.target.value });
                      showToast(`Motor global actualizado a: ${e.target.value}`);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Recomendado - Más rápido y económico)</option>
                    <option value="gemini-3.5-transcribe">Google Gemini 3.5 Transcribe (Especializado en Audio Extenso)</option>
                    <option value="gemini-3.1-flash-lite-preview">Google Gemini 3.1 Flash Lite (Contingencia / Alta Velocidad)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Tamaño Máximo de Archivo de Audio por Asamblea (MB)
                  </label>
                  <input 
                    type="number"
                    value={systemConfig.maxAudioUploadSizeMb}
                    onChange={(e) => setSystemConfig({ ...systemConfig, maxAudioUploadSizeMb: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* =================================================================
            PESTAÑA 4: SESIONES ACTIVAS Y SEGURIDAD
           ================================================================= */}
        {activeTab === 'security' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-white">Sesiones Activas de la Plataforma</h3>
                <p className="text-xs text-slate-400">Auditoría de dispositivos conectados y revocación inmediata de tokens JWT</p>
              </div>
              <button 
                onClick={() => setConfirmKillAllModal(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition cursor-pointer"
              >
                Cerrar Todas las Sesiones (Emergencia)
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-3.5 px-5">Usuario / Rol</th>
                    <th className="py-3.5 px-5">Empresa / Edificio</th>
                    <th className="py-3.5 px-5">Dirección IP & Ubicación</th>
                    <th className="py-3.5 px-5">Dispositivo</th>
                    <th className="py-3.5 px-5">Actividad</th>
                    <th className="py-3.5 px-5 text-right">Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-xs">
                  {activeSessions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No hay sesiones activas en este momento. Todos los tokens JWT fueron revocados.
                      </td>
                    </tr>
                  ) : (
                    activeSessions.map((ses) => (
                      <tr key={ses.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-4 px-5">
                          <div className="font-bold text-white">{ses.user}</div>
                          <div className="text-[11px] text-indigo-400">{ses.role}</div>
                        </td>
                        <td className="py-4 px-5 text-slate-300 font-medium">{ses.company}</td>
                        <td className="py-4 px-5 font-mono text-slate-400">{ses.ip}</td>
                        <td className="py-4 px-5 text-slate-300">{ses.device}</td>
                        <td className="py-4 px-5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                            {ses.lastActive}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <button
                            onClick={() => handleRevokeSession(ses.id, ses.user)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 font-bold text-[11px] transition cursor-pointer"
                          >
                            Revocar Acceso
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =================================================================
            PESTAÑA 5: GOBIERNO COMERCIAL B2B (FIRMAS GESTORAS & FACTURACIÓN)
           ================================================================= */}
        {activeTab === 'b2b' && (
          <div className="rounded-3xl overflow-hidden border border-slate-800">
            <SuperAdminMasterHub
              user={user}
              onSwitchRole={onSwitchRole}
              onImpersonateCompany={() => {
                onSwitchRole?.('administrador');
              }}
            />
          </div>
        )}

      </main>

      {/* MODAL DE STACK TRACE DETALLADO */}
      {selectedErrorTrace && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Terminal className="w-5 h-5 text-rose-400" />
                <div>
                  <h3 className="text-sm font-black text-white">
                    Stack Trace de Excepción • {selectedErrorTrace.id}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {selectedErrorTrace.module} — {selectedErrorTrace.tenant}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedErrorTrace(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-rose-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {selectedErrorTrace.stackTrace || selectedErrorTrace.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-500">
                Capturado por Urbix Sentry Engine • {selectedErrorTrace.timestamp}
              </span>
              <div className="flex items-center gap-2">
                {selectedErrorTrace.status === 'Pendiente' && (
                  <button
                    onClick={() => {
                      handleResolveError(selectedErrorTrace.id);
                      setSelectedErrorTrace(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition cursor-pointer"
                  >
                    Marcar como Resuelto
                  </button>
                )}
                <button
                  onClick={() => setSelectedErrorTrace(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE EMERGENCIA: CERRAR TODAS LAS SESIONES */}
      {confirmKillAllModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-black text-white">¿Revocar Todas las Sesiones Activas?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta acción de emergencia invalidará inmediatamente todos los tokens JWT activos en Supabase Auth. Todos los administradores, supervisores y porterías deberán iniciar sesión nuevamente.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setConfirmKillAllModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleKillAllSessions}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Sí, Revocar Todos los Accesos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
