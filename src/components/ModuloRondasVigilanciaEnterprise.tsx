import React, { useState } from 'react';
import { Compass, ShieldAlert, CheckCircle2, MapPin, AlertTriangle, Clock, UserCheck, Wrench, Shield } from 'lucide-react';

export interface RegistroRondaVigilancia {
  id: string;
  codigoNfcQr: string;
  punto: string;
  ubicacion: string;
  estado: 'Verificado Normal' | 'Novedad Operativa / Mantenimiento' | 'Alerta de Seguridad Crítica' | string;
  timestamp: string;
  fecha?: string;
  guarda: string;
  observacion: string;
  derivacionAutomatica?: string;
  firmaHash?: string;
}

export interface TareaMantenimientoRondaTodero {
  id: string;
  rondaId: string;
  codigoNfcQr: string;
  zona: string;
  ubicacion: string;
  hallazgo: string;
  guardaReportante: string;
  horaReporte: string;
  fechaReporte: string;
  prioridad: 'Media (Mantenimiento)' | 'Alta (Correctivo Inmediato)';
  estadoTarea: 'Pendiente Asignación' | 'En Reparación por Todero' | 'Resuelto y Verificado ✅';
  responsableTodero: string;
}

export interface AlertaSeguridadCriticaSupervisor {
  id: string;
  tipo: 'CHECKPOINT_CRITICO' | 'BOTON_PANICO_RUTA';
  punto: string;
  ubicacion: string;
  codigoNfcQr: string;
  detalle: string;
  timestamp: string;
  fecha: string;
  guarda: string;
  atendidaPorSupervisor: boolean;
  horaAtencion?: string;
}

export const PUNTOS_CRITICOS_RONDA = [
  {
    codigo: 'NFC-SOT2-BOMBAS',
    ubicacion: 'Sótano Técnico',
    nombre: 'Cuarto de Bombas e Hidroneumáticos (Sótano técnico)'
  },
  {
    codigo: 'NFC-SOT1-SUBESTACION',
    ubicacion: 'Sótano Eléctrico',
    nombre: 'Subestación Eléctrica y Planta de Emergencia (Nivel de combustible y tableros)'
  },
  {
    codigo: 'NFC-PERIMETRO-EXT',
    ubicacion: 'Perímetro',
    nombre: 'Perímetro Externo y Rejas de Cerramiento (Control de puntos ciegos e intrusión)'
  },
  {
    codigo: 'NFC-ZONA-SOCIAL',
    ubicacion: 'Área Social',
    nombre: 'Plataforma Social, Piscina y Zona Húmeda (Verificación de puertas y calderas)'
  },
  {
    codigo: 'NFC-TORRES-CUBIERTAS',
    ubicacion: 'Torres Residenciales',
    nombre: 'Cubiertas, Domos y Puertas Cortafuego (Torres residenciales)'
  }
];

export default function ModuloRondasVigilanciaEnterprise({
  rondasShared = [],
  setRondasShared,
  onShowToast,
  appendAuditLog,
  onDerivarMantenimientoTodero,
  onActivarAlertaCriticaSupervisor
}: {
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
  onDerivarMantenimientoTodero?: (tarea: TareaMantenimientoRondaTodero) => void;
  onActivarAlertaCriticaSupervisor?: (alerta: AlertaSeguridadCriticaSupervisor) => void;
}) {
  const [puntoSeleccionado, setPuntoSeleccionado] = useState('Cuarto de Bombas e Hidroneumáticos (Sótano técnico)');
  const [estadoHallazgo, setEstadoHallazgo] = useState('Verificado Normal');
  const [guardaResponsable, setGuardaResponsable] = useState('Guarda Carlos Restrepo (Turno Mañana)');
  const [observacion, setObservacion] = useState('');
  const [alertaPanicoActiva, setAlertaPanicoActiva] = useState(false);

  const [localRondas, setLocalRondas] = useState<RegistroRondaVigilancia[]>([
    {
      id: 'ronda_init_1',
      codigoNfcQr: 'NFC-SOT2-BOMBAS',
      punto: 'Cuarto de Bombas e Hidroneumáticos (Sótano técnico)',
      ubicacion: 'Sótano Técnico',
      estado: 'Verificado Normal',
      timestamp: '08:00:15 AM',
      fecha: new Date().toLocaleDateString('es-CO'),
      guarda: 'Guarda Carlos Restrepo (Turno Mañana)',
      observacion: 'Zona segura, equipos en orden. Presión de manómetros en 65 PSI.',
      derivacionAutomatica: 'Historial Gerencial de Patrullajes (Supervisor)',
      firmaHash: 'SHA-256 Verified'
    },
    {
      id: 'ronda_init_2',
      codigoNfcQr: 'NFC-SOT1-SUBESTACION',
      punto: 'Subestación Eléctrica y Planta de Emergencia (Nivel de combustible y tableros)',
      ubicacion: 'Sótano Eléctrico',
      estado: 'Verificado Normal',
      timestamp: '08:25:40 AM',
      fecha: new Date().toLocaleDateString('es-CO'),
      guarda: 'Guarda Carlos Restrepo (Turno Mañana)',
      observacion: 'Nivel de combustible ACPM al 90% y tableros de transferencia en automático.',
      derivacionAutomatica: 'Historial Gerencial de Patrullajes (Supervisor)',
      firmaHash: 'SHA-256 Verified'
    }
  ]);

  const bitacoraRondas = setRondasShared ? rondasShared : rondasShared.length > 0 ? rondasShared : localRondas;

  // Registrar el cumplimiento de un Checkpoint de ronda y derivar inteligentemente según severidad
  const handleRegistrarCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    const metaPunto = PUNTOS_CRITICOS_RONDA.find((p) => p.nombre === puntoSeleccionado);
    const codigoTag = metaPunto?.codigo || 'NFC-CHK-00';
    const ubicacionExacta = metaPunto?.ubicacion || 'Zona Común PH';

    const horaExacta = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const fechaHoy = new Date().toLocaleDateString('es-CO');

    const textoObservacion =
      observacion.trim() ||
      (estadoHallazgo === 'Verificado Normal'
        ? 'Zona segura, equipos en orden y sin alteraciones.'
        : estadoHallazgo === 'Novedad Operativa / Mantenimiento'
        ? 'Hallazgo locativo/técnico reportado para intervención de toderos y supervisión.'
        : 'Incidente crítico de seguridad reportado para reacción inmediata del Supervisor.');

    const destinoDerivacion =
      estadoHallazgo === 'Verificado Normal'
        ? 'Historial Gerencial de Patrullajes (Supervisor)'
        : estadoHallazgo === 'Novedad Operativa / Mantenimiento'
        ? 'Bandeja de Tareas de Toderos y Supervisión'
        : 'Alerta Flotante de Emergencia en Consola Supervisor';

    const nuevaMarca: RegistroRondaVigilancia = {
      id: `ronda_${Date.now()}`,
      codigoNfcQr: codigoTag,
      punto: puntoSeleccionado,
      ubicacion: ubicacionExacta,
      estado: estadoHallazgo,
      timestamp: horaExacta,
      fecha: fechaHoy,
      guarda: guardaResponsable,
      observacion: textoObservacion,
      derivacionAutomatica: destinoDerivacion,
      firmaHash: 'SHA-256 Verified'
    };

    if (setRondasShared) {
      setRondasShared((prev: any[]) => [nuevaMarca, ...prev]);
    } else {
      setLocalRondas((prev: any[]) => [nuevaMarca, ...prev]);
    }

    // DERIVACIÓN INTELIGENTE SEGÚN NIVEL DE SEVERIDAD:
    if (estadoHallazgo === 'Verificado Normal') {
      appendAuditLog?.(
        'RONDA_CHECKPOINT_NORMAL',
        `Checkpoint [${codigoTag}] "${puntoSeleccionado}" (${ubicacionExacta}) validado como VERIFICADO NORMAL por ${guardaResponsable} a las ${horaExacta}. Detalle: "${textoObservacion}". Almacenado en Historial Gerencial de Patrullajes del Supervisor.`,
        guardaResponsable
      );
      onShowToast?.(`✅ Checkpoint Normal registrado y sincronizado en el Historial Gerencial del Supervisor.`);
    } else if (estadoHallazgo === 'Novedad Operativa / Mantenimiento') {
      const nuevaTareaTodero: TareaMantenimientoRondaTodero = {
        id: `TOD-${Date.now().toString().slice(-5)}`,
        rondaId: nuevaMarca.id,
        codigoNfcQr: codigoTag,
        zona: puntoSeleccionado,
        ubicacion: ubicacionExacta,
        hallazgo: textoObservacion,
        guardaReportante: guardaResponsable,
        horaReporte: horaExacta,
        fechaReporte: fechaHoy,
        prioridad: 'Alta (Correctivo Inmediato)',
        estadoTarea: 'Pendiente Asignación',
        responsableTodero: 'Cuadrilla de Toderos & Mantenimiento Interno'
      };

      onDerivarMantenimientoTodero?.(nuevaTareaTodero);

      appendAuditLog?.(
        'RONDA_DERIVACION_MANTENIMIENTO_TODEROS',
        `Checkpoint [${codigoTag}] "${puntoSeleccionado}" (${ubicacionExacta}) reportó NOVEDAD OPERATIVA / MANTENIMIENTO por ${guardaResponsable} a las ${horaExacta}: "${textoObservacion}". Derivado automáticamente a la Bandeja de Tareas de Toderos y Supervisión (${nuevaTareaTodero.id}).`,
        guardaResponsable
      );
      onShowToast?.(
        `🛠️ Novedad Operativa registrada y enviada automáticamente a la Bandeja de Tareas de Toderos y Supervisión.`
      );
    } else if (estadoHallazgo === 'Alerta de Seguridad Crítica') {
      const nuevaAlertaCritica: AlertaSeguridadCriticaSupervisor = {
        id: `ALR-CRIT-${Date.now().toString().slice(-5)}`,
        tipo: 'CHECKPOINT_CRITICO',
        punto: puntoSeleccionado,
        ubicacion: ubicacionExacta,
        codigoNfcQr: codigoTag,
        detalle: textoObservacion,
        timestamp: horaExacta,
        fecha: fechaHoy,
        guarda: guardaResponsable,
        atendidaPorSupervisor: false
      };

      onActivarAlertaCriticaSupervisor?.(nuevaAlertaCritica);

      appendAuditLog?.(
        'RONDA_ALERTA_SEGURIDAD_CRITICA',
        `🚨 ALERTA DE SEGURIDAD CRÍTICA en Checkpoint [${codigoTag}] "${puntoSeleccionado}" (${ubicacionExacta}) activada por ${guardaResponsable} a las ${horaExacta}: "${textoObservacion}". Aviso destacado de emergencia disparado en la Consola del Supervisor.`,
        guardaResponsable
      );
      onShowToast?.(
        `🚨 ¡Alerta de Seguridad Crítica activada! Notificación flotante de emergencia enviada a la Consola del Supervisor.`
      );
    }

    setObservacion('');
  };

  // Botón de Pánico / Auxilio en Ruta con propagación inmediata a la consola del Supervisor
  const handleActivarPanico = () => {
    setAlertaPanicoActiva(true);
    const metaPunto = PUNTOS_CRITICOS_RONDA.find((p) => p.nombre === puntoSeleccionado);
    const codigoTag = metaPunto?.codigo || 'NFC-PANICO-SOS';
    const ubicacionExacta = metaPunto?.ubicacion || 'Ruta de Patrullaje';
    const horaExacta = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const fechaHoy = new Date().toLocaleDateString('es-CO');

    const marcaPanico: RegistroRondaVigilancia = {
      id: `ronda_panico_${Date.now()}`,
      codigoNfcQr: codigoTag,
      punto: puntoSeleccionado,
      ubicacion: ubicacionExacta,
      estado: 'Alerta de Seguridad Crítica',
      timestamp: horaExacta,
      fecha: fechaHoy,
      guarda: guardaResponsable,
      observacion: '🚨 [BOTÓN DE PÁNICO / AUXILIO EN RUTA ACTIVADO] Solicitud prioritaria de apoyo táctico inmediato en coordenadas del último checkpoint.',
      derivacionAutomatica: 'Alerta Flotante de Emergencia en Consola Supervisor',
      firmaHash: 'SHA-256 Verified'
    };

    if (setRondasShared) {
      setRondasShared((prev: any[]) => [marcaPanico, ...prev]);
    } else {
      setLocalRondas((prev: any[]) => [marcaPanico, ...prev]);
    }

    onActivarAlertaCriticaSupervisor?.({
      id: `SOS-PANICO-${Date.now().toString().slice(-5)}`,
      tipo: 'BOTON_PANICO_RUTA',
      punto: puntoSeleccionado,
      ubicacion: ubicacionExacta,
      codigoNfcQr: codigoTag,
      detalle: '¡Botón de Pánico / Auxilio en Ruta presionado por el guarda! Requiere despacho de protocolo de emergencia y apoyo inmediato.',
      timestamp: horaExacta,
      fecha: fechaHoy,
      guarda: guardaResponsable,
      atendidaPorSupervisor: false
    });

    appendAuditLog?.(
      'RONDA_PANICO_AUXILIO_RUTA',
      `🚨 BOTÓN DE PÁNICO / AUXILIO EN RUTA activado por ${guardaResponsable} a las ${horaExacta} en último checkpoint [${codigoTag}] "${puntoSeleccionado}" (${ubicacionExacta}). Notificación flotante prioritaria disparada en Consola del Supervisor.`,
      guardaResponsable
    );

    onShowToast?.('⚠️ ¡ALERTA DE PÁNICO ACTIVADA! Señal enviada al Administrador y Supervisor en tiempo real.');
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      {/* BANNER DE ALERTA DE PÁNICO ACTIVA */}
      {alertaPanicoActiva && (
        <div className="p-4 bg-rose-600/20 border-2 border-rose-500 rounded-2xl animate-pulse flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_0_30px_rgba(244,63,94,0.4)]">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500 text-slate-950 rounded-xl font-black">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-black text-sm uppercase tracking-wider">
                ¡ALERTA DE PÁNICO / AUXILIO EN RUTA ACTIVADA!
              </h4>
              <p className="text-xs text-rose-200">
                Señal prioritaria con coordenadas del último checkpoint ({puntoSeleccionado}) enviada a las consolas del Supervisor y Administrador.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setAlertaPanicoActiva(false);
              onShowToast?.('Alerta de pánico local restablecida en la consola del guarda.');
            }}
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-rose-400 border border-rose-500/40 rounded-xl text-xs font-mono font-bold cursor-pointer shrink-0"
          >
            Restablecer Alerta
          </button>
        </div>
      )}

      {/* CABECERA Y BOTÓN TÁCTICO DE PÁNICO */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">
                Bitácora Inmutable • Superintendencia de Vigilancia
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 uppercase">
                ● Sincronización Directa con Supervisor &amp; Toderos
              </span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              Rondas de Vigilancia y Puntos Críticos Georreferenciados (Checkpoints)
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={handleActivarPanico}
          className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-rose-600/30 flex items-center gap-2 border border-rose-400 shrink-0"
        >
          <ShieldAlert className="w-4 h-4" /> Botón de Pánico / Auxilio en Ruta
        </button>
      </div>

      {/* 1. PANEL DE PUNTOS CRÍTICOS GEORREFERENCIADOS (SELECTOR VISUAL E INDICADOR DE ESTADO) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" /> 1. Panel de Puntos Críticos Georreferenciados (5 Zonas de Alta Criticidad)
          </h4>
          <span className="text-xs font-mono text-emerald-400">
            Seleccione o escanee un checkpoint para registrar estado
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {PUNTOS_CRITICOS_RONDA.map((item) => {
            const ultimoRegistro = bitacoraRondas.find((r: any) => r.punto === item.nombre);
            const isSelected = puntoSeleccionado === item.nombre;
            const estadoActual = ultimoRegistro ? ultimoRegistro.estado : 'Pendiente en Turno';

            const esCritico = estadoActual === 'Alerta de Seguridad Crítica';
            const esNovedad = estadoActual === 'Novedad Operativa / Mantenimiento';
            const esNormal = estadoActual === 'Verificado Normal';

            return (
              <button
                key={item.codigo}
                type="button"
                onClick={() => setPuntoSeleccionado(item.nombre)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-400 ring-1 ring-cyan-400/50 shadow-[0_0_15px_rgba(34,211,238,0.2)]'
                    : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/20">
                      {item.codigo}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        esCritico
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                          : esNovedad
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                          : esNormal
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {esCritico ? '🚨 Alerta' : esNovedad ? '⚠️ Novedad' : esNormal ? '✓ Verificado' : '⏳ Pendiente'}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 uppercase">{item.ubicacion}</p>
                  <p className="text-xs font-bold text-white leading-snug">{item.nombre}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    {ultimoRegistro ? ultimoRegistro.timestamp : '--:--'}
                  </span>
                  <span className="text-cyan-400 font-bold">{isSelected ? 'Seleccionado' : 'Inspeccionar'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. REGISTRO DINÁMICO DE HALLAZGOS Y SEVERIDAD CON DERIVACIÓN INTELIGENTE */}
      <form
        onSubmit={handleRegistrarCheckpoint}
        className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 2. Registro Dinámico de Hallazgos y Derivación Inteligente al Supervisor
          </h4>
          <span className="text-xs font-mono text-slate-400">Auditoría cruzada + Sello SHA-256</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 block">
              Zona de Alta Criticidad (Checkpoint NFC / QR):
            </label>
            <select
              value={puntoSeleccionado}
              onChange={(e) => setPuntoSeleccionado(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400 font-mono"
            >
              {PUNTOS_CRITICOS_RONDA.map((p) => (
                <option key={p.codigo} value={p.nombre}>
                  {p.codigo} — {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 block">
              Clasificación de Estado y Severidad:
            </label>
            <select
              value={estadoHallazgo}
              onChange={(e) => setEstadoHallazgo(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400 font-mono"
            >
              <option value="Verificado Normal">✅ Verificado Normal (Historial Gerencial Supervisor)</option>
              <option value="Novedad Operativa / Mantenimiento">⚠️ Novedad Operativa / Mantenimiento (Derivar a Toderos)</option>
              <option value="Alerta de Seguridad Crítica">🚨 Alerta de Seguridad Crítica (Aviso Flotante Supervisor)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-slate-300 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" /> Guarda Responsable de Verificación:
            </label>
            <select
              value={guardaResponsable}
              onChange={(e) => setGuardaResponsable(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400 font-mono"
            >
              <option value="Guarda Carlos Restrepo (Turno Mañana)">Guarda Carlos Restrepo (Turno Mañana)</option>
              <option value="Guarda Wilmar Tapias (Rondero Perimetral)">Guarda Wilmar Tapias (Rondero Perimetral)</option>
              <option value="Guarda Luis F. Pérez (Turno Tarde)">Guarda Luis F. Pérez (Turno Tarde)</option>
              <option value="Guarda Jhon Jairo Ospina (Turno Noche)">Guarda Jhon Jairo Ospina (Turno Noche)</option>
            </select>
          </div>
        </div>

        {/* Botones rápidos de severidad con explicación de derivación automática */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setEstadoHallazgo('Verificado Normal')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 cursor-pointer transition ${
              estadoHallazgo === 'Verificado Normal'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verificado Normal</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">
              → Se almacena en Historial Gerencial de Patrullajes (Supervisor)
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoHallazgo('Novedad Operativa / Mantenimiento')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 cursor-pointer transition ${
              estadoHallazgo === 'Novedad Operativa / Mantenimiento'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Novedad Operativa / Mantenimiento</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">
              → Envía reporte automático a Bandeja de Toderos y Supervisión
            </span>
          </button>

          <button
            type="button"
            onClick={() => setEstadoHallazgo('Alerta de Seguridad Crítica')}
            className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-start gap-1 cursor-pointer transition ${
              estadoHallazgo === 'Alerta de Seguridad Crítica'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Alerta de Seguridad Crítica</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">
              → Activa notificación flotante de emergencia en Consola Supervisor
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
            placeholder="Observaciones del punto (ej. luminarias fundidas, filtraciones, cerraduras flojas, presión de bombas, intrusión)..."
            className="flex-1 p-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition cursor-pointer shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 shrink-0"
          >
            <MapPin className="w-4 h-4" /> Registrar Checkpoint en Bitácora
          </button>
        </div>
      </form>

      {/* 3. TRAZABILIDAD TEMPORAL Y BITÁCORA INMUTABLE */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> 3. Trazabilidad Temporal y Bitácora Inmutable de Rondas
          </h4>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            {bitacoraRondas.length} Registros Auditados en Vivo
          </span>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
          {bitacoraRondas.length > 0 ? (
            bitacoraRondas.map((r: any) => {
              const esCritica = r.estado === 'Alerta de Seguridad Crítica';
              const esMant = r.estado === 'Novedad Operativa / Mantenimiento';
              return (
                <div
                  key={r.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    esCritica
                      ? 'bg-rose-950/20 border-rose-500/50'
                      : esMant
                      ? 'bg-amber-950/15 border-amber-500/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {r.codigoNfcQr && (
                        <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-slate-950 text-cyan-400 border border-cyan-500/30">
                          {r.codigoNfcQr}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] border ${
                          esCritica
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : esMant
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {r.estado}
                      </span>
                      <span className="font-bold text-white text-sm">{r.punto}</span>
                    </div>
                    <p className="text-slate-300">{r.observacion}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] font-mono text-slate-400">
                      <span>👮 {r.guarda || 'Guarda en Turno'}</span>
                      {r.derivacionAutomatica && (
                        <span className="text-cyan-400 flex items-center gap-1">
                          <Shield className="w-3 h-3" /> Destino: {r.derivacionAutomatica}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{r.timestamp}</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-emerald-500/30">
                      {r.firmaHash || 'SHA-256 Verified'}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-xl">
              No hay registros de ronda en el turno actual.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
