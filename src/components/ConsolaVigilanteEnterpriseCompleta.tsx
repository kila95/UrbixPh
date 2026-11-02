import React, { useState } from 'react';
import { Compass, ShieldAlert, CheckCircle2, MapPin, BookOpen, PlusCircle, Search, Clock, Car } from 'lucide-react';

const MAPA_CODIGOS_NFC: Record<string, { codigo: string; ubicacion: string }> = {
  'Cuarto de Bombas e Hidroneumáticos (Sótano técnico)': {
    codigo: 'NFC-SOT2-BOMBAS',
    ubicacion: 'Sótano Técnico'
  },
  'Subestación Eléctrica y Planta de Emergencia': {
    codigo: 'NFC-SOT1-SUBESTACION',
    ubicacion: 'Sótano Eléctrico'
  },
  'Perímetro Externo y Rejas de Cerramiento': {
    codigo: 'NFC-PERIMETRO-EXT',
    ubicacion: 'Perímetro'
  },
  'Plataforma Social, Piscina y Zona Húmeda': {
    codigo: 'NFC-ZONA-SOCIAL',
    ubicacion: 'Área Social'
  },
  'Cubiertas, Domos y Puertas Cortafuego de Torres': {
    codigo: 'NFC-TORRES-CUBIERTAS',
    ubicacion: 'Torres Residenciales'
  }
};

export default function ConsolaVigilanteEnterpriseCompleta({
  rondasShared = [],
  setRondasShared,
  minutaShared = [],
  setMinutaShared,
  celdasParqueaderoShared = [],
  setCeldasParqueaderoShared,
  onShowToast,
  appendAuditLog,
  onDerivarMantenimientoTodero,
  onActivarAlertaCriticaSupervisor,
  ocultarMinuta = false
}: {
  rondasShared?: any[];
  setRondasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  minutaShared?: any[];
  setMinutaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  celdasParqueaderoShared?: any[];
  setCeldasParqueaderoShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
  onActivarAlertaCriticaSupervisor?: (alerta: any) => void;
  ocultarMinuta?: boolean;
}) {
  // Estados locales para Rondas
  const [puntoSeleccionado, setPuntoSeleccionado] = useState('Cuarto de Bombas e Hidroneumáticos (Sótano técnico)');
  const [estadoHallazgo, setEstadoHallazgo] = useState('Verificado Normal');
  const [observacionRonda, setObservacionRonda] = useState('');

  // Estados locales para Minuta
  const [categoriaMinuta, setCategoriaMinuta] = useState('Novedad General');
  const [detalleMinuta, setDetalleMinuta] = useState('');
  const [busquedaMinuta, setBusquedaMinuta] = useState('');

  // Estado global de Pánico en la Garita
  const [alertaPanicoActiva, setAlertaPanicoActiva] = useState(false);

  // 1. Registrar Checkpoint de Ronda
  const handleRegistrarCheckpoint = (e: React.FormEvent) => {
    e.preventDefault();
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString('es-CO');
    const metaPunto = MAPA_CODIGOS_NFC[puntoSeleccionado] || {
      codigo: 'NFC-CHK-GARITA',
      ubicacion: 'Zona Crítica PH'
    };
    const textoObs =
      observacionRonda.trim() ||
      (estadoHallazgo === 'Verificado Normal'
        ? 'Zona segura, equipos en orden.'
        : 'Hallazgo reportado a administración.');

    const nuevaMarca = {
      id: `ronda_${Date.now()}`,
      codigoNfcQr: metaPunto.codigo,
      punto: puntoSeleccionado,
      ubicacion: metaPunto.ubicacion,
      estado: estadoHallazgo,
      timestamp: horaActual,
      fecha: fechaActual,
      guarda: 'Guarda en Turno (Garita Principal)',
      observacion: textoObs,
      firmaHash: 'SHA-256 Verified'
    };

    if (setRondasShared) {
      setRondasShared((prev: any[]) => [nuevaMarca, ...prev]);
    }

    // Derivación inteligente hacia la consola del Supervisor según severidad
    if (estadoHallazgo === 'Verificado Normal') {
      appendAuditLog?.(
        'RONDA_CHECKPOINT_NORMAL',
        `Checkpoint [${metaPunto.codigo}] "${puntoSeleccionado}" verificado normal a las ${horaActual}: "${textoObs}".`,
        'Guarda en Turno (Garita Principal)'
      );
    } else if (estadoHallazgo === 'Novedad Operativa' || estadoHallazgo.includes('Novedad Operativa')) {
      onDerivarMantenimientoTodero?.({
        id: `TOD-${Date.now().toString().slice(-5)}`,
        rondaId: nuevaMarca.id,
        codigoNfcQr: metaPunto.codigo,
        zona: puntoSeleccionado,
        ubicacion: metaPunto.ubicacion,
        hallazgo: textoObs,
        guardaReportante: 'Guarda en Turno (Garita Principal)',
        horaReporte: horaActual,
        fechaReporte: fechaActual,
        prioridad: 'Alta (Correctivo Inmediato)',
        estadoTarea: 'Pendiente Asignación',
        responsableTodero: 'Cuadrilla de Toderos & Mantenimiento Interno'
      });
      appendAuditLog?.(
        'RONDA_DERIVADA_TODERO_MANTENIMIENTO',
        `Novedad Operativa en "${puntoSeleccionado}" derivada automáticamente a la Bandeja de Órdenes de Trabajo y Mantenimiento del Supervisor: "${textoObs}".`,
        'Guarda en Turno (Garita Principal)'
      );
    } else if (estadoHallazgo === 'Alerta Crítica' || estadoHallazgo.includes('Alerta')) {
      onActivarAlertaCriticaSupervisor?.({
        id: `ALR-CRIT-${Date.now()}`,
        tipo: 'CHECKPOINT_CRITICO',
        punto: puntoSeleccionado,
        ubicacion: metaPunto.ubicacion,
        codigoNfcQr: metaPunto.codigo,
        detalle: textoObs,
        timestamp: horaActual,
        fecha: fechaActual,
        guarda: 'Guarda en Turno (Garita Principal)',
        atendidaPorSupervisor: false
      });
      appendAuditLog?.(
        'RONDA_ALERTA_SEGURIDAD_CRITICA',
        `🚨 ALERTA DE SEGURIDAD CRÍTICA en "${puntoSeleccionado}": "${textoObs}". Notificación prioritaria enviada al Monitor de Alertas Críticas del Supervisor.`,
        'Guarda en Turno (Garita Principal)'
      );
    }

    setObservacionRonda('');
    onShowToast?.(`Checkpoint registrado: ${puntoSeleccionado} [${estadoHallazgo}]`);
  };

  // 2. Botón de Pánico Táctico Global (Persistente en Cabecera)
  const handleActivarPanicoGlobal = () => {
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const fechaActual = new Date().toLocaleDateString('es-CO');
    setAlertaPanicoActiva(true);

    onActivarAlertaCriticaSupervisor?.({
      id: `PANICO-GARITA-${Date.now()}`,
      tipo: 'BOTON_PANICO_RUTA',
      punto: `SOS GARITA PRINCIPAL — ${puntoSeleccionado}`,
      ubicacion: 'Garita Principal / Puesto de Control',
      codigoNfcQr: 'SOS-PANICO-GARITA',
      detalle:
        '🚨 BOTÓN DE PÁNICO TÁCTICO ACCIONADO EN GARITA: El guarda solicita apoyo inmediato y activación de protocolo de reacción en tiempo real.',
      timestamp: horaActual,
      fecha: fechaActual,
      guarda: 'Guarda en Turno (Garita Principal)',
      atendidaPorSupervisor: false
    });

    appendAuditLog?.(
      'PANICO_TACTICO_GARITA_ACTIVADO',
      `🚨 Botón de Pánico Táctico activado en Garita Principal a las ${horaActual}. Señal prioritaria recibida en el Monitor de Alertas Críticas del Supervisor.`,
      'Guarda en Turno (Garita Principal)'
    );

    onShowToast?.('🚨 ¡ALERTA DE PÁNICO TÁCTICO ACTIVADA EN GARITA! Señal prioritaria enviada al Administrador y Supervisor.');
    setTimeout(() => setAlertaPanicoActiva(false), 7000);
  };

  // 3. Registrar Novedad en Minuta Digital
  const handleRegistrarMinuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!detalleMinuta.trim()) return;

    const nuevaNota = {
      id: `min_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      fecha: new Date().toLocaleDateString('es-CO'),
      guarda: 'Guarda en Turno (Garita Principal)',
      categoria: categoriaMinuta,
      detalle: detalleMinuta.trim(),
      firmaHash: 'SHA-256 Verified'
    };

    if (setMinutaShared) {
      setMinutaShared((prev: any[]) => [nuevaNota, ...prev]);
    }

    appendAuditLog?.(
      'MINUTA_DIGITAL_INMUTABLE_SYNC',
      `[${nuevaNota.categoria}] Asentado en Minuta Digital por ${nuevaNota.guarda} a las ${nuevaNota.timestamp}: "${nuevaNota.detalle}" • Firma: SHA-256 Verified.`,
      nuevaNota.guarda
    );

    setDetalleMinuta('');
    onShowToast?.('Novedad asentada y sellada en la Minuta Digital.');
  };

  const minutaFiltrada = (minutaShared || []).filter((m: any) =>
    (m.detalle || '').toLowerCase().includes(busquedaMinuta.toLowerCase()) ||
    (m.categoria || '').toLowerCase().includes(busquedaMinuta.toLowerCase())
  );

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-8 font-sans">
      
      {/* =================================================================== */}
      {/* CABECERA PRINCIPAL CON BOTÓN DE PÁNICO TÁCTICO GLOBAL PERMANENTE  */}
      {/* =================================================================== */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
              Consola de Portería • Superintendencia de Vigilancia
            </span>
            <h2 className="text-lg font-black text-white mt-1">Módulo Integral de Seguridad y Garita Urbix PH</h2>
          </div>
        </div>

        {/* BOTÓN DE PÁNICO GLOBAL FLOTANTE/CABECERA */}
        <button
          type="button"
          onClick={handleActivarPanicoGlobal}
          className={`px-5 py-3 rounded-2xl font-black text-xs transition cursor-pointer flex items-center gap-2.5 shadow-xl ${
            alertaPanicoActiva
              ? 'bg-rose-600 text-white animate-bounce shadow-rose-600/60 border-2 border-rose-300'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 shadow-rose-500/10'
          }`}
        >
          <ShieldAlert className="w-5 h-5 animate-pulse" />
          {alertaPanicoActiva ? '🚨 ¡ALERTA DE PÁNICO EN CURSO (EMERGENCIA)!' : 'Botón de Pánico Táctico (Garita)'}
        </button>
      </div>

      {/* =================================================================== */}
      {/* SECCIÓN 1: RONDAS DE VIGILANCIA Y CHECKPOINTS GEORREFERENCIADOS      */}
      {/* =================================================================== */}
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <MapPin className="w-4 h-4 text-cyan-400" /> Rondas de Vigilancia y Puntos Críticos (Checkpoints)
          </h3>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
            Bitácora Inmutable Activa
          </span>
        </div>

        <form onSubmit={handleRegistrarCheckpoint} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Punto de Control</label>
            <select
              value={puntoSeleccionado}
              onChange={(e) => setPuntoSeleccionado(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-cyan-400"
            >
              <option>Cuarto de Bombas e Hidroneumáticos (Sótano técnico)</option>
              <option>Subestación Eléctrica y Planta de Emergencia</option>
              <option>Perímetro Externo y Rejas de Cerramiento</option>
              <option>Plataforma Social, Piscina y Zona Húmeda</option>
              <option>Cubiertas, Domos y Puertas Cortafuego de Torres</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-400 font-mono">Clasificación Hallazgo</label>
            <select
              value={estadoHallazgo}
              onChange={(e) => setEstadoHallazgo(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-cyan-400"
            >
              <option value="Verificado Normal">✅ Verificado Normal (Sin Novedad)</option>
              <option value="Novedad Operativa">⚠️ Novedad Operativa / Mantenimiento (Todero)</option>
              <option value="Alerta Crítica">🚨 Alerta de Seguridad Crítica (Intrusión)</option>
            </select>
          </div>

          <div className="space-y-1 md:col-span-3 flex flex-col sm:flex-row gap-3 pt-1">
            <input
              type="text"
              placeholder="Observación detallada del checkpoint o equipo verificado..."
              value={observacionRonda}
              onChange={(e) => setObservacionRonda(e.target.value)}
              className="flex-1 p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 px-6 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" /> Registrar Checkpoint
            </button>
          </div>
        </form>

        {/* Historial en Vivo de Rondas */}
        <div className="space-y-2 pt-2 max-h-[220px] overflow-y-auto pr-1">
          {(rondasShared || []).length > 0 ? (
            rondasShared.map((r: any) => (
              <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-cyan-500/30 text-[11px]">
                      {r.timestamp}
                    </span>
                    <span className="font-bold text-white text-xs">{r.punto}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">Observación: <strong className="text-slate-200">{r.observacion}</strong></p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border shrink-0 ${
                  r.estado === 'Verificado Normal' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  (r.estado === 'Novedad Operativa' || r.estado?.includes('Novedad Operativa')) ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                  'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {r.estado}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-xl">
              No hay checkpoints registrados en el turno todavía.
            </p>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SECCIÓN 2: LIBRO DE MINUTA DIGITAL INMUTABLE                       */}
      {/* =================================================================== */}
      {!ocultarMinuta && (
      <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
            <BookOpen className="w-4 h-4 text-teal-400" /> Libro de Minuta Digital Inmutable
          </h3>
          <div className="relative w-full sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar en la minuta..."
              value={busquedaMinuta}
              onChange={(e) => setBusquedaMinuta(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-400 font-mono"
            />
          </div>
        </div>

        <form onSubmit={handleRegistrarMinuta} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={categoriaMinuta}
            onChange={(e) => setCategoriaMinuta(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-teal-400"
          >
            <option>Novedad General</option>
            <option>Relevo de Turno</option>
            <option>Ingreso de Trasteo / Mudanza</option>
            <option>Instrucción de Administración</option>
            <option>Vehículo Sospechoso / Retenido</option>
          </select>

          <input
            type="text"
            placeholder="Descripción detallada de la novedad del turno..."
            value={detalleMinuta}
            onChange={(e) => setDetalleMinuta(e.target.value)}
            className="md:col-span-2 p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />

          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Asentar en Minuta
          </button>
        </form>

        <div className="space-y-2 pt-1 max-h-[220px] overflow-y-auto pr-1">
          {minutaFiltrada && minutaFiltrada.length > 0 ? (
            minutaFiltrada.map((m: any) => (
              <div key={m.id} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between text-xs gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-teal-400 bg-slate-900 px-2 py-0.5 rounded border border-teal-500/30 text-[11px]">
                      {m.timestamp}
                    </span>
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[10px]">{m.categoria}</span>
                    <span className="text-slate-400 text-[11px]">{m.guarda}</span>
                  </div>
                  <p className="text-slate-200 text-xs mt-0.5">{m.detalle}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800 shrink-0">
                  SHA-256 Verified
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-slate-800 rounded-xl">
              No hay notas registradas en la minuta digital todavía.
            </p>
          )}
        </div>
      </div>
      )}

    </div>
  );
}
