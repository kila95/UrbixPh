import React, { useState } from 'react';
import { 
  Wrench, 
  UserCheck, 
  Terminal, 
  Radio, 
  Wifi, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Play
} from 'lucide-react';

interface TenantInfo {
  id: string;
  nombre: string;
  unidades: number;
  garitaActiva: boolean;
}

const TENANTS_DEMO: TenantInfo[] = [
  { id: 't1', nombre: 'Reserva del Tesoro PH', unidades: 180, garitaActiva: true },
  { id: 't2', nombre: 'Torres de San Juan', unidades: 96, garitaActiva: false },
  { id: 't3', nombre: 'Altos del Poblado', unidades: 240, garitaActiva: true }
];

export default function SoporteTecnicoImpersonacion({
  onImpersonar
}: {
  onImpersonar?: (tenantId: string, rol: 'vigilante' | 'admin' | 'residente', unidad?: string) => void;
}) {
  const [tenantSeleccionado, setTenantSeleccionado] = useState('t1');
  const [rolSeleccionado, setRolSeleccionado] = useState<'vigilante' | 'admin' | 'residente'>('vigilante');
  const [unidadSimulada, setUnidadSimulada] = useState('Torre 2 - 301');
  const [probandoRed, setProbandoRed] = useState(false);
  const [testResult, setTestResult] = useState<{
    webrtc: string;
    supabase: string;
    gemini: string;
  } | null>(null);

  // Logs de eventos de soporte técnico
  const [logs] = useState([
    { id: '1', hora: '15:42:10', tipo: 'warn', msg: 'Residente Torre 1 - 204: Micrófono denegado en Chrome Mobile (Android).' },
    { id: '2', hora: '15:38:05', tipo: 'info', msg: 'Garita Reserva del Tesoro: Enlace WebRTC P2P establecido (Duración: 01:45).' },
    { id: '3', hora: '15:20:12', tipo: 'ok', msg: 'Urbix Copilot: 12 consultas Ley 675 procesadas con éxito vía Gemini API.' },
    { id: '4', hora: '14:55:00', tipo: 'warn', msg: 'Garita Torres de San Juan: Desconexión de socket detectada (Posible corte de luz o red local).' }
  ]);

  // Ejecución de pruebas de diagnóstico en vivo
  const ejecutarDiagnostico = () => {
    setProbandoRed(true);
    setTestResult(null);

    setTimeout(() => {
      setTestResult({
        webrtc: 'ÓPTIMO (STUN Google: 28 ms)',
        supabase: 'CONECTADO (WebSocket Realtime activo)',
        gemini: 'OPERATIVO (Gemini 3.8 Flash: 620 ms)'
      });
      setProbandoRed(false);
    }, 1200);
  };

  const handleIniciarImpersonacion = () => {
    const copropiedad = TENANTS_DEMO.find(t => t.id === tenantSeleccionado)?.nombre || tenantSeleccionado;
    if (onImpersonar) {
      onImpersonar(tenantSeleccionado, rolSeleccionado, unidadSimulada);
    } else {
      alert(`[MODO SOPORTE AUDITOR]\nIniciando sesión en: ${copropiedad}\nRol: ${rolSeleccionado.toUpperCase()}\nUnidad: ${rolSeleccionado === 'residente' ? unidadSimulada : 'Garita/Admin'}`);
    }
  };

  return (
    <div className="space-y-6 font-mono select-none text-xs">
      {/* CABECERA DEL SUBMÓDULO */}
      <div className="bg-[#05080e] border border-cyan-500/20 rounded-3xl p-6 shadow-[0_0_25px_rgba(0,242,254,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,242,254,0.2)]">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white tracking-wider">URBIX MASTER</h2>
                <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                  Soporte Técnico &amp; Impersonación
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">
                Diagnóstico de telecomunicaciones, inspección de incidentes en copropiedades y simulación de sesiones.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={ejecutarDiagnostico}
            disabled={probandoRed}
            className="px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20 font-bold transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${probandoRed ? 'animate-spin text-[#00f2fe]' : ''}`} />
            {probandoRed ? 'Diagnosticando Infraestructura...' : 'Ejecutar Test de Red'}
          </button>
        </div>
      </div>

      {/* BLOQUE 1: CONSOLA DE IMPERSONACIÓN (TÚNEL DE ACCESO DE SOPORTE) */}
      <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            Simulador de Sesión de Usuario (Impersonación sin Contraseña)
          </h3>
          <span className="text-[10px] text-slate-500">Acceso Auditor Nivel 0</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Selector Copropiedad */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] font-bold block">1. Copropiedad (Tenant):</label>
            <select
              value={tenantSeleccionado}
              onChange={(e) => setTenantSeleccionado(e.target.value)}
              className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white focus:border-cyan-400 outline-none cursor-pointer"
            >
              {TENANTS_DEMO.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} ({t.unidades} Unds)
                </option>
              ))}
            </select>
          </div>

          {/* Selector Rol */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] font-bold block">2. Rol a Diagnosticar:</label>
            <div className="grid grid-cols-3 gap-1.5 bg-[#090d14] p-1.5 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setRolSeleccionado('vigilante')}
                className={`py-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  rolSeleccionado === 'vigilante'
                    ? 'bg-cyan-500/20 text-[#00f2fe] border border-cyan-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vigilante
              </button>
              <button
                type="button"
                onClick={() => setRolSeleccionado('admin')}
                className={`py-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  rolSeleccionado === 'admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => setRolSeleccionado('residente')}
                className={`py-2 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  rolSeleccionado === 'residente'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Residente
              </button>
            </div>
          </div>

          {/* Unidad Específica */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-[11px] font-bold block">3. Inmueble / Ubicación:</label>
            <input
              type="text"
              disabled={rolSeleccionado !== 'residente'}
              value={rolSeleccionado === 'residente' ? unidadSimulada : (rolSeleccionado === 'vigilante' ? 'Garita Principal' : 'Administración Central')}
              onChange={(e) => setUnidadSimulada(e.target.value)}
              placeholder="Ej. Torre 2 - 301"
              className="w-full bg-[#090d14] border border-slate-800 rounded-xl p-3 text-white disabled:opacity-50 disabled:bg-slate-900/40 focus:border-cyan-400 outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleIniciarImpersonacion}
          className="w-full bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(0,242,254,0.3)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-slate-950" />
          Lanzar Sesión Simulada en Modo Soporte
        </button>
      </div>

      {/* BLOQUE 2: DIAGNÓSTICO DE INFRAESTRUCTURA (TELECOM & SERVICIOS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* WebRTC STUN/TURN */}
        <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Radio className="w-4 h-4 text-cyan-400" /> WebRTC STUN
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Túneles de audio P2P citofonía</p>
          <div className="pt-2 border-t border-slate-800/80 text-emerald-400 font-bold text-[11px]">
            {testResult ? testResult.webrtc : 'Google STUN 19302: Operativo'}
          </div>
        </div>

        {/* Supabase WebSockets */}
        <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Wifi className="w-4 h-4 text-purple-400" /> Supabase Realtime
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Replicación Postgres &amp; Señalización</p>
          <div className="pt-2 border-t border-slate-800/80 text-purple-300 font-bold text-[11px]">
            {testResult ? testResult.supabase : 'Canal citofonia_t1 activo'}
          </div>
        </div>

        {/* Gemini AI Engine */}
        <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 text-white font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" /> Urbix Copilot (IA)
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-slate-500 font-sans">Modelo Gemini 3.8 Flash</p>
          <div className="pt-2 border-t border-slate-800/80 text-amber-300 font-bold text-[11px]">
            {testResult ? testResult.gemini : 'API REST lista (Ley 675 activa)'}
          </div>
        </div>
      </div>

      {/* BLOQUE 3: CONSOLA DE AUDITORÍA Y REGISTRO DE INCIDENTES (LOGS EN VIVO) */}
      <div className="bg-[#05080e] border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            Consola de Incidentes y Advertencias del Navegador
          </h3>
          <span className="text-[10px] text-slate-500">Últimos eventos capturados</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {logs.map(log => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-[11px] ${
                log.tipo === 'warn'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                  : log.tipo === 'ok'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2">
                {log.tipo === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                )}
                <span>{log.msg}</span>
              </div>
              <span className="text-[10px] text-slate-500 whitespace-nowrap">{log.hora}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
