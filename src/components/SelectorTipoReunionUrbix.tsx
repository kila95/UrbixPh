import React, { useState } from 'react';
import { 
  Video, Calendar, ShieldCheck, Users, FileText, CheckCircle2, 
  Clock, AlertTriangle, Link, Copy, Send, Sparkles, ChevronRight, Lock, Radio
} from 'lucide-react';

export interface ReunionProgramada {
  id: string;
  tipoId: string;
  tipoLabel: string;
  titulo: string;
  fecha: string;
  hora: string;
  modalidad: 'Virtual (Ley 675)' | 'Híbrida' | 'Presencial';
  quorumRequerido: string;
  leyReferencia: string;
  enlaceSala: string;
  pinAcceso: string;
  estado: 'Convocada Oficial' | 'En Vivo' | 'Finalizada' | 'Borrador';
  notificados: number;
}

export default function SelectorTipoReunionUrbix({ 
  onShowToast,
  onIniciarSalaVirtual
}: { 
  onShowToast?: (msg: string) => void;
  onIniciarSalaVirtual?: (reunion: ReunionProgramada) => void;
}) {
  const tiposDisponibles = [
    { 
      id: 'asamblea_ord', 
      label: 'Asamblea General Ordinaria (Ley 675)', 
      desc: 'Requiere quórum del 100% por coeficientes y mayoría simple/calificada.',
      minAnticipacion: '15 días calendario (Art. 39)',
      quorums: 'Mayoría Coeficientes (>50%) o 70% Calificada',
      badge: 'Art. 39 Ley 675'
    },
    { 
      id: 'asamblea_ext', 
      label: 'Asamblea General Extraordinaria', 
      desc: 'Convocada por urgencias, obras mayores o destitución (Art. 40 Ley 675).',
      minAnticipacion: '8 días calendario de antelación',
      quorums: 'Fijado según orden del día específico',
      badge: 'Art. 40 Ley 675'
    },
    { 
      id: 'consejo', 
      label: 'Consejo de Administración', 
      desc: 'Exclusivo para consejeros habilitados, revisión de cartera y multas.',
      minAnticipacion: '3 a 5 días hábiles',
      quorums: 'Mayoría de los miembros principales elegidos',
      badge: 'Art. 53 Ley 675'
    },
    { 
      id: 'convivencia', 
      label: 'Comité de Convivencia (Art. 58 Ley 675)', 
      desc: 'Conciliación de disputas entre residentes y mediación de PQRS.',
      minAnticipacion: '3 días hábiles',
      quorums: 'Quórum impar para conciliación amigable',
      badge: 'Art. 58 Ley 675'
    },
    { 
      id: 'tecnico', 
      label: 'Comité Técnico de Obras y Mantenimiento', 
      desc: 'Revisión de fachadas, ascensores, redes y contratistas con ARL/Póliza.',
      minAnticipacion: 'Convocatoria operativa libre',
      quorums: 'Supervisión técnica e interventoría',
      badge: 'SG-SST & Manto.'
    }
  ];

  const [tipoReunion, setTipoReunion] = useState('Asamblea General Ordinaria (Ley 675)');
  const [tituloReunion, setTituloReunion] = useState('');
  const [fechaReunion, setFechaReunion] = useState('');
  const [horaReunion, setHoraReunion] = useState('18:00');
  const [modalidad, setModalidad] = useState<'Virtual (Ley 675)' | 'Híbrida' | 'Presencial'>('Virtual (Ley 675)');

  // Lista de reuniones programadas con datos realistas
  const [reunionesProgramadas, setReunionesProgramadas] = useState<ReunionProgramada[]>([
    {
      id: 'reunion-1',
      tipoId: 'asamblea_ord',
      tipoLabel: 'Asamblea General Ordinaria (Ley 675)',
      titulo: 'Asamblea General Anual Presupuesto 2026 y Coeficientes',
      fecha: '2026-11-15',
      hora: '18:00',
      modalidad: 'Virtual (Ley 675)',
      quorumRequerido: 'Quórum inicial 50% + 1 coeficientes',
      leyReferencia: 'Art. 39 Ley 675 de 2001 (15 días de citación cumplidos)',
      enlaceSala: 'https://urbix.ph/meet/asamblea-ord-2026-tesoro',
      pinAcceso: 'URBIX-8821',
      estado: 'Convocada Oficial',
      notificados: 142
    },
    {
      id: 'reunion-2',
      tipoId: 'consejo',
      tipoLabel: 'Consejo de Administración',
      titulo: 'Sesión Ordinaria Consejo: Aprobación Mantenimiento Ascensores',
      fecha: '2026-11-05',
      hora: '19:30',
      modalidad: 'Virtual (Ley 675)',
      quorumRequerido: 'Mínimo 3 de 5 consejeros principales',
      leyReferencia: 'Art. 53-55 Ley 675 de 2001',
      enlaceSala: 'https://urbix.ph/meet/consejo-manto-nov2026',
      pinAcceso: 'CONS-4091',
      estado: 'Convocada Oficial',
      notificados: 5
    },
    {
      id: 'reunion-3',
      tipoId: 'convivencia',
      tipoLabel: 'Comité de Convivencia (Art. 58 Ley 675)',
      titulo: 'Mediación Conciliatoria: Infracción Ruido Torre 2 vs Torre 1',
      fecha: '2026-11-08',
      hora: '17:00',
      modalidad: 'Virtual (Ley 675)',
      quorumRequerido: 'Miembros de Convivencia + Residentes implicados',
      leyReferencia: 'Art. 58 Ley 675 (Mecanismo alternativo de solución)',
      enlaceSala: 'https://urbix.ph/meet/convivencia-caso-084',
      pinAcceso: 'CONV-1029',
      estado: 'Convocada Oficial',
      notificados: 4
    }
  ]);

  const tipoActual = tiposDisponibles.find(t => t.label === tipoReunion) || tiposDisponibles[0];

  const handleProgramarReunion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloReunion.trim() || !fechaReunion.trim()) {
      onShowToast?.('⚠️ Por favor completa el título y la fecha de la reunión.');
      return;
    }

    const nuevaReunion: ReunionProgramada = {
      id: `reunion-${Date.now()}`,
      tipoId: tipoActual.id,
      tipoLabel: tipoActual.label,
      titulo: tituloReunion.trim(),
      fecha: fechaReunion,
      hora: horaReunion,
      modalidad,
      quorumRequerido: tipoActual.quorums,
      leyReferencia: `${tipoActual.badge} • Convocatoria certificada digitalmente`,
      enlaceSala: `https://urbix.ph/meet/${tipoActual.id}-${Date.now().toString().slice(-4)}`,
      pinAcceso: `PH-${Math.floor(1000 + Math.random() * 9000)}`,
      estado: 'Convocada Oficial',
      notificados: tipoActual.id === 'consejo' ? 5 : tipoActual.id === 'convivencia' ? 3 : 142
    };

    setReunionesProgramadas([nuevaReunion, ...reunionesProgramadas]);
    setTituloReunion('');
    setFechaReunion('');
    onShowToast?.(`🏛️ ${tipoActual.label} programada y convocada formalmente bajo Ley 675.`);
  };

  const handleCopiarEnlace = (enlace: string, pin: string) => {
    navigator.clipboard?.writeText(`${enlace} (PIN: ${pin})`);
    onShowToast?.(`🔗 Enlace y PIN de acceso copiado al portapapeles.`);
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-4 sm:p-6 rounded-2xl sm:rounded-3xl space-y-6 shadow-2xl font-sans text-slate-100">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyan-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
            <span className="text-[10px] font-black tracking-widest uppercase font-mono text-cyan-400">
              URBIX PH • SISTEMA DE GOBERNANZA & CONVOCATORIAS
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            <Video className="w-5 h-5 text-cyan-400" /> Selector de Convocatorias y Reuniones (Ley 675)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Parametrización jurídica oficial para Asambleas, Consejos y Comités de Propiedad Horizontal en Colombia.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#07090e] border border-cyan-500/30 px-3.5 py-2 rounded-xl text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300">
            Validez Probatoria <strong className="text-emerald-400">Art. 39-44 Ley 675</strong>
          </span>
        </div>
      </div>

      {/* FORMULARIO DE PROGRAMACIÓN */}
      <form onSubmit={handleProgramarReunion} className="space-y-4">
        
        {/* SELECTOR DE TIPO CON TARJETAS / RADIO */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
            1. Seleccionar Naturaleza Jurídica de la Sesión:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tiposDisponibles.map((tipo) => {
              const seleccionado = tipo.label === tipoReunion;
              return (
                <div
                  key={tipo.id}
                  onClick={() => setTipoReunion(tipo.label)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                    seleccionado
                      ? 'bg-gradient-to-br from-cyan-950/40 via-cyan-900/20 to-transparent border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.25)]'
                      : 'bg-[#07090e]/80 border-slate-800 hover:border-slate-700 hover:bg-[#07090e]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                        seleccionado 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' 
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {tipo.badge}
                      </span>
                      {seleccionado && (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {tipo.label}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {tipo.desc}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>⏱ Citación: <strong className="text-slate-200">{tipo.minAnticipacion}</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DETALLES DE LA REUNIÓN */}
        <div className="bg-[#07090e] border border-slate-800/80 p-4 sm:p-5 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
            <Calendar className="w-4 h-4 text-cyan-400" /> 2. Orden del Día y Horario de la Citación
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Título Oficial / Asunto de la Convocatoria
              </label>
              <input
                type="text"
                required
                value={tituloReunion}
                onChange={(e) => setTituloReunion(e.target.value)}
                placeholder="Ej. Convocatoria a Asamblea General Extraordinaria de Propietarios..."
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Fecha de la Convocatoria
              </label>
              <input
                type="date"
                required
                value={fechaReunion}
                onChange={(e) => setFechaReunion(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Hora de Inicio
              </label>
              <input
                type="time"
                required
                value={horaReunion}
                onChange={(e) => setHoraReunion(e.target.value)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-cyan-400 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Modalidad de la Reunión
              </label>
              <select
                value={modalidad}
                onChange={(e) => setModalidad(e.target.value as any)}
                className="w-full bg-[#0b0f17] border border-slate-700 rounded-xl px-3 py-2 text-xs text-cyan-300 font-bold outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="Virtual (Ley 675)">Virtual (Ley 675 - Sala Digital Criptográfica)</option>
                <option value="Híbrida">Híbrida (Salón Comunal + Conexión Remota)</option>
                <option value="Presencial">Presencial (Sede P.H.)</option>
              </select>
            </div>

            <div className="md:col-span-2 flex flex-col justify-end">
              <div className="p-2.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
                <span>🛡️ Quórum Exigido: <strong>{tipoActual.quorums}</strong></span>
                <span className="text-slate-400">{tipoActual.minAnticipacion}</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black rounded-xl text-xs transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Emitir Convocatoria & Programar Sesión
            </button>
          </div>
        </div>
      </form>

      {/* LISTADO DE REUNIONES CONVOCADAS & ENLACES SEGUROS */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Sesiones Programadas & Convocatorias Activas ({reunionesProgramadas.length})
          </h3>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full">
            Trazabilidad Notarial Digital
          </span>
        </div>

        <div className="space-y-3">
          {reunionesProgramadas.map((reunion) => (
            <div
              key={reunion.id}
              className="bg-[#07090e] border border-slate-800 hover:border-cyan-500/40 rounded-2xl p-4 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {reunion.tipoLabel}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                      {reunion.modalidad}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      📅 {reunion.fecha} a las {reunion.hora}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white pt-1">
                    {reunion.titulo}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    ⚖️ {reunion.leyReferencia} • <strong className="text-slate-300">{reunion.quorumRequerido}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (onIniciarSalaVirtual) {
                        onIniciarSalaVirtual(reunion);
                      } else {
                        onShowToast?.(`🎥 Abriendo Sala Virtual para: "${reunion.titulo}"`);
                      }
                    }}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" /> Ingresar a Sala
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopiarEnlace(reunion.enlaceSala, reunion.pinAcceso)}
                    className="px-3 py-1.5 bg-[#0b0f17] hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-cyan-400" /> Copiar Link & PIN
                  </button>
                </div>
              </div>

              {/* BARRA DE ACCESO CON ENLACE Y PIN */}
              <div className="bg-[#0b0f17] border border-slate-800/80 rounded-xl px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                <div className="flex items-center gap-2 truncate text-slate-400">
                  <Link className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">{reunion.enlaceSala}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-400">PIN: <strong className="text-cyan-300">{reunion.pinAcceso}</strong></span>
                  <span className="text-emerald-400">👥 {reunion.notificados} Notificados</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
