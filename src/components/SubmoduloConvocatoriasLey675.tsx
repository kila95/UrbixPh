import React, { useState } from 'react';
import { Calendar, Video, MapPin, CheckCircle2, ShieldCheck, Clock, Users, Building, AlertCircle } from 'lucide-react';

export interface SubmoduloConvocatoriasLey675Props {
  onShowToast?: (msg: string) => void;
  onConvocatoriaCreada?: (convocatoria: {
    id: string;
    tipo: string;
    titulo: string;
    fecha: string;
    modalidad: 'virtual' | 'presencial' | 'mixta';
    lugarOSala: string;
    anticipacion: string;
    estado: string;
  }) => void;
}

export default function SubmoduloConvocatoriasLey675({ 
  onShowToast,
  onConvocatoriaCreada
}: SubmoduloConvocatoriasLey675Props) {
  const [tipoReunion, setTipoReunion] = useState('Asamblea General Ordinaria (Ley 675)');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial' | 'mixta'>('virtual');
  const [lugarOSala, setLugarOSala] = useState('Sala Videoconferencia WebRTC Urbix PH');
  const [tituloReunion, setTituloReunion] = useState('');
  const [fechaReunion, setFechaReunion] = useState('');

  const tiposDisponibles = [
    { 
      id: 'asamblea_ord', 
      label: 'Asamblea General Ordinaria (Ley 675)', 
      desc: 'Requiere quórum reglamentario por coeficientes. Convocatoria formal con al menos 15 días calendario de anticipación (Art. 39).',
      ant: '15 días calendario'
    },
    { 
      id: 'asamblea_ext', 
      label: 'Asamblea General Extraordinaria', 
      desc: 'Convocada para necesidades imprevistas, reformas o cuotas extraordinarias (Art. 40 Ley 675).',
      ant: '8 días calendario'
    },
    { 
      id: 'consejo', 
      label: 'Consejo de Administración', 
      desc: 'Reunión de consejeros principales y suplentes para ejecución presupuestal y directrices.',
      ant: 'Citación formal'
    },
    { 
      id: 'convivencia', 
      label: 'Comité de Convivencia (Art. 58 Ley 675)', 
      desc: 'Mecanismo voluntario para la solución de conflictos entre copropietarios o tenedores.',
      ant: 'Citación de partes'
    },
    { 
      id: 'tecnico', 
      label: 'Comité Técnico y de Obras', 
      desc: 'Inspección técnica de fachadas, motobombas, ascensores y pólizas contractuales.',
      ant: 'Informativa'
    }
  ];

  const handleModalidadChange = (nuevaModalidad: 'virtual' | 'presencial' | 'mixta') => {
    setModalidad(nuevaModalidad);
    if (nuevaModalidad === 'virtual') {
      setLugarOSala('Sala Videoconferencia WebRTC Urbix PH (Encriptada)');
    } else if (nuevaModalidad === 'presencial') {
      setLugarOSala('Salón Social Principal / Zona Común');
    } else {
      setLugarOSala('Salón Social + Enlace Virtual WebRTC');
    }
  };

  const handleProgramar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tituloReunion.trim() || !fechaReunion.trim()) {
      onShowToast?.('⚠️ Por favor completa el título y la fecha.');
      return;
    }

    const selectedTipoObj = tiposDisponibles.find(t => t.label === tipoReunion);

    const nuevaConvocatoria = {
      id: `conv-${Date.now()}`,
      tipo: tipoReunion,
      titulo: tituloReunion.trim(),
      fecha: fechaReunion,
      modalidad,
      lugarOSala,
      anticipacion: selectedTipoObj ? selectedTipoObj.ant : 'Conforme a Ley 675',
      estado: 'Convocada'
    };

    onConvocatoriaCreada?.(nuevaConvocatoria);
    onShowToast?.(`📅 Convocatoria [${modalidad.toUpperCase()}] programada: "${tituloReunion}". Notificaciones y circulares enviadas.`);
    setTituloReunion('');
    setFechaReunion('');
  };

  const tipoSeleccionado = tiposDisponibles.find(t => t.label === tipoReunion) || tiposDisponibles[0];

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-5 sm:p-6 rounded-3xl space-y-6 shadow-2xl font-sans text-slate-100 animate-fade-in">
      
      {/* Encabezado */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Ley 675 de 2001 Colombia
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Validez Jurídica
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Sistema Notarial PH
          </span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-white mt-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" /> Programador de Convocatorias y Órganos
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Cita formalmente a asambleas y comités cumpliendo los tiempos mínimos exigidos por ley y notificando a copropietarios.
        </p>
      </div>

      <form onSubmit={handleProgramar} className="space-y-5">
        {/* Selector de Órgano / Tipo de Reunión */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Tipo de Órgano Colegiado / Convocatoria
          </label>
          <select
            value={tipoReunion}
            onChange={(e) => setTipoReunion(e.target.value)}
            className="w-full bg-[#07090e] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
          >
            {tiposDisponibles.map(t => (
              <option key={t.id} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-1">
            <p className="text-slate-300 font-medium">{tipoSeleccionado.desc}</p>
            <p className="text-cyan-400 font-mono text-[11px]">
              ⏱ Término legal mínimo de citación: <strong className="text-white">{tipoSeleccionado.ant}</strong>
            </p>
          </div>
        </div>

        {/* Modalidad de la Reunión */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-cyan-400" /> Modalidad de Realización
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => handleModalidadChange('virtual')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                modalidad === 'virtual'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-[#07090e] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${modalidad === 'virtual' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Video className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">100% Virtual</p>
                <p className="text-[10px] text-slate-400">WebRTC + Coeficientes</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModalidadChange('presencial')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                modalidad === 'presencial'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-[#07090e] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${modalidad === 'presencial' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Presencial</p>
                <p className="text-[10px] text-slate-400">En Salón Social</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModalidadChange('mixta')}
              className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                modalidad === 'mixta'
                  ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                  : 'bg-[#07090e] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-xl ${modalidad === 'mixta' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold">Mixta / Híbrida</p>
                <p className="text-[10px] text-slate-400">Salón + Enlace Web</p>
              </div>
            </button>
          </div>
        </div>

        {/* Lugar o Enlace de la Reunión */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            {modalidad === 'presencial' ? (
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            ) : (
              <Video className="w-3.5 h-3.5 text-cyan-400" />
            )}
            {modalidad === 'presencial' ? 'Lugar Físico en la Copropiedad' : 'Sala o Enlace de Conexión'}
          </label>
          <input
            type="text"
            value={lugarOSala}
            onChange={(e) => setLugarOSala(e.target.value)}
            placeholder={modalidad === 'presencial' ? 'Ej. Salón Comunal Bloque B' : 'Ej. Sala Virtual Urbix PH Segura'}
            className="w-full bg-[#07090e] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
          />
        </div>

        {/* Campos de Título y Fecha */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Título Oficial de la Convocatoria
            </label>
            <input
              type="text"
              placeholder="Ej. Asamblea Ordinaria Vigencia 2026"
              value={tituloReunion}
              onChange={(e) => setTituloReunion(e.target.value)}
              className="w-full bg-[#07090e] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Fecha y Hora de Inicio
            </label>
            <input
              type="datetime-local"
              value={fechaReunion}
              onChange={(e) => setFechaReunion(e.target.value)}
              className="w-full bg-[#07090e] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-400 transition [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Resumen de Garantías Legales */}
        <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/20 rounded-2xl flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-cyan-300">Generación Automática de Documentos Conforme a Ley:</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Al emitir la convocatoria, se adjuntará el Orden del Día, los Estados Financieros dictaminados y el Formato de Poder Representativo con código de verificación.
            </p>
          </div>
        </div>

        {/* Botón de Emisión */}
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-bold text-sm rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
        >
          <Calendar className="w-4 h-4" /> Emitir Convocatoria y Notificar a Copropietarios
        </button>
      </form>
    </div>
  );
}
