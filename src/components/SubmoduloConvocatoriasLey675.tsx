import React, { useState } from 'react';
import { Calendar, Video, MapPin, CheckCircle2, ShieldCheck, Clock, Users, Building, Plus, CheckSquare } from 'lucide-react';

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
    apartamentosConvocados?: string[];
  }) => void;
}

const CATALOGO_APARTAMENTOS = [
  { unidad: 'Torre 1 - 101', propietario: 'Mateo Zuluaga', rol: 'Copropietario' },
  { unidad: 'Torre 1 - 102', propietario: 'Carolina Herrera', rol: 'Copropietaria' },
  { unidad: 'Torre 1 - 201', propietario: 'Andrés Gómez', rol: 'Consejero Suplente' },
  { unidad: 'Torre 1 - 302', propietario: 'Esteban Ochoa', rol: 'Consejero Principal' },
  { unidad: 'Torre 2 - 301', propietario: 'Dr. Mauricio Restrepo', rol: 'Presidente Consejo' },
  { unidad: 'Torre 2 - 402', propietario: 'Laura Restrepo', rol: 'Comité Convivencia' },
];

export default function SubmoduloConvocatoriasLey675({ 
  onShowToast,
  onConvocatoriaCreada
}: SubmoduloConvocatoriasLey675Props) {
  const [tipoReunion, setTipoReunion] = useState('Asamblea General Ordinaria (Ley 675)');
  const [modalidad, setModalidad] = useState<'virtual' | 'presencial' | 'mixta'>('virtual');
  const [lugarOSala, setLugarOSala] = useState('Sala Videoconferencia WebRTC Urbix PH');
  const [tituloReunion, setTituloReunion] = useState('');
  const [fechaReunion, setFechaReunion] = useState('');
  const [apartamentosSeleccionados, setApartamentosSeleccionados] = useState<string[]>([
    'Torre 1 - 201',
    'Torre 1 - 302',
    'Torre 2 - 301'
  ]);
  const [nuevoAptoInput, setNuevoAptoInput] = useState('');
  const [catalogoUnidades, setCatalogoUnidades] = useState(CATALOGO_APARTAMENTOS);

  const tiposDisponibles = [
    { 
      id: 'asamblea_ord', 
      label: 'Asamblea General Ordinaria (Ley 675)', 
      esGeneral: true,
      desc: 'Citación universal a TODOS los propietarios de la unidad. Requiere quórum reglamentario por coeficientes (Art. 39).',
      ant: '15 días calendario'
    },
    { 
      id: 'asamblea_ext', 
      label: 'Asamblea General Extraordinaria', 
      esGeneral: true,
      desc: 'Citación universal a TODOS los residentes/propietarios para necesidades imprevistas o cuotas extraordinarias (Art. 40).',
      ant: '8 días calendario'
    },
    { 
      id: 'consejo', 
      label: 'Consejo de Administración', 
      esGeneral: false,
      desc: 'Reunión exclusiva para los apartamentos o consejeros seleccionados por la Administración.',
      ant: 'Citación formal selectiva'
    },
    { 
      id: 'convivencia', 
      label: 'Comité de Convivencia (Art. 58 Ley 675)', 
      esGeneral: false,
      desc: 'Citación exclusiva a los apartamentos o partes involucradas seleccionadas por la Administración.',
      ant: 'Citación de partes'
    },
    { 
      id: 'tecnico', 
      label: 'Comité Técnico y de Obras', 
      esGeneral: false,
      desc: 'Inspección técnica con apartamentos delegados e interventoría.',
      ant: 'Informativa'
    }
  ];

  const tipoSeleccionado = tiposDisponibles.find(t => t.label === tipoReunion) || tiposDisponibles[0];

  const MAX_PERSONAS_MALLA_SEGURA = 10;

  const toggleApartamento = (unidad: string) => {
    setApartamentosSeleccionados(prev => {
      if (prev.includes(unidad)) {
        return prev.filter(u => u !== unidad);
      }
      if (prev.length >= MAX_PERSONAS_MALLA_SEGURA) {
        onShowToast?.(`🔒 Por seguridad de la Malla P2P Encriptada, las reuniones de Consejo/Comité permiten máximo ${MAX_PERSONAS_MALLA_SEGURA} personas.`);
        return prev;
      }
      return [...prev, unidad];
    });
  };

  const handleAgregarApto = () => {
    const limpio = nuevoAptoInput.trim();
    if (!limpio) return;
    if (apartamentosSeleccionados.length >= MAX_PERSONAS_MALLA_SEGURA && !apartamentosSeleccionados.includes(limpio)) {
      onShowToast?.(`🔒 Límite alcanzado: Máximo ${MAX_PERSONAS_MALLA_SEGURA} apartamentos en conexión segura de Consejo/Comité.`);
      return;
    }
    if (!catalogoUnidades.some(c => c.unidad.toLowerCase() === limpio.toLowerCase())) {
      setCatalogoUnidades(prev => [...prev, { unidad: limpio, propietario: 'Propietario Acreditado', rol: 'Invitado' }]);
    }
    if (!apartamentosSeleccionados.includes(limpio)) {
      setApartamentosSeleccionados(prev => [...prev, limpio]);
    }
    setNuevoAptoInput('');
  };

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

    if (!tipoSeleccionado.esGeneral && apartamentosSeleccionados.length === 0) {
      onShowToast?.('⚠️ Selecciona al menos un apartamento para citar al Consejo / Comité.');
      return;
    }

    const nuevaConvocatoria = {
      id: `conv-${Date.now()}`,
      tipo: tipoReunion,
      titulo: tituloReunion.trim(),
      fecha: fechaReunion,
      modalidad,
      lugarOSala,
      anticipacion: tipoSeleccionado.ant,
      estado: 'Convocada',
      apartamentosConvocados: tipoSeleccionado.esGeneral
        ? ['TODOS LOS APARTAMENTOS (100% UNIDAD)']
        : apartamentosSeleccionados
    };

    onConvocatoriaCreada?.(nuevaConvocatoria);
    onShowToast?.(
      `📅 Convocatoria programada: "${tituloReunion}" (${
        tipoSeleccionado.esGeneral
          ? 'Modo SFU 200+ residentes simultáneos'
          : `Malla Segura P2P: ${apartamentosSeleccionados.length}/10 apartamentos`
      }).`
    );
    setTituloReunion('');
    setFechaReunion('');
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-5 sm:p-6 rounded-3xl space-y-5 shadow-2xl font-sans text-slate-100">
      <div className="border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Ley 675 de 2001 Colombia
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Citación Oficial
            </span>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Sistema Notarial PH
          </span>
        </div>
        <h2 className="text-lg font-bold text-white mt-2 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" /> Programador de Convocatorias y Selección de Apartamentos
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Asamblea General activa el canal masivo SFU (100–200+ personas); Consejo y Comités operan en Malla P2P Encriptada (máx. 10 personas).
        </p>
      </div>

      <form onSubmit={handleProgramar} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Tipo de Órgano / Reunión
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
              ⏱ Término legal: <strong className="text-white">{tipoSeleccionado.ant}</strong> • Topología:{' '}
              <strong className="text-emerald-400">
                {tipoSeleccionado.esGeneral ? 'SFU Broadcast (100–200+ Simultáneos)' : 'Malla P2P Encriptada DTLS-SRTP (Máx. 10)'}
              </strong>
            </p>
          </div>
        </div>

        {/* Selección de Apartamentos cuando es Consejo o Comité */}
        {tipoSeleccionado.esGeneral ? (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white">Canal Masivo SFU: 100 a 200+ Residentes en Tiempo Real</p>
                <p className="text-[11px] text-emerald-300/90">
                  Exclusivo para Asamblea General. Visualización 1 a 1 inteligente (cambia automáticamente a quien toma la palabra).
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg shrink-0">
              200+ Simultáneos
            </span>
          </div>
        ) : (
          <div className="p-4 bg-[#07090e] border border-amber-500/40 rounded-2xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Malla Segura P2P Encriptada • Máximo 10 Personas
                </span>
                <h4 className="text-xs font-bold text-white mt-1">
                  Escoge los Apartamentos Citados ({apartamentosSeleccionados.length}/{MAX_PERSONAS_MALLA_SEGURA} seleccionados)
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setApartamentosSeleccionados(catalogoUnidades.slice(0, MAX_PERSONAS_MALLA_SEGURA).map(c => c.unidad))}
                  className="text-[10px] font-mono text-cyan-400 hover:underline cursor-pointer px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                >
                  Máx. 10
                </button>
                <button
                  type="button"
                  onClick={() => setApartamentosSeleccionados([])}
                  className="text-[10px] font-mono text-slate-400 hover:text-white cursor-pointer px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                >
                  Limpiar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {catalogoUnidades.map((item) => {
                const checked = apartamentosSeleccionados.includes(item.unidad);
                return (
                  <label
                    key={item.unidad}
                    onClick={() => toggleApartamento(item.unidad)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 cursor-pointer transition select-none ${
                      checked
                        ? 'bg-amber-500/15 border-amber-400 text-white'
                        : 'bg-[#0b0f17] border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="accent-amber-400 w-3.5 h-3.5 pointer-events-none"
                    />
                    <div className="truncate">
                      <p className="font-bold text-white leading-tight">{item.unidad}</p>
                      <p className="text-[10px] text-slate-400 truncate">{item.propietario} • {item.rol}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={nuevoAptoInput}
                onChange={(e) => setNuevoAptoInput(e.target.value)}
                placeholder="Agregar otro apto (ej. Torre 2 - 501)..."
                className="flex-1 bg-[#0b0f17] border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-amber-400 font-mono"
              />
              <button
                type="button"
                onClick={handleAgregarApto}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Incluir
              </button>
            </div>
          </div>
        )}

        {/* Modalidad */}
        <div className="grid grid-cols-3 gap-2">
          {(['virtual', 'presencial', 'mixta'] as const).map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => handleModalidadChange(mod)}
              className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                modalidad === mod
                  ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300'
                  : 'bg-[#07090e] border-slate-800 text-slate-400'
              }`}
            >
              {mod === 'virtual' ? '🎥 100% Virtual' : mod === 'presencial' ? '📍 Presencial' : '🌐 Mixta'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Título de la Reunión</label>
            <input
              type="text"
              placeholder="Ej. Sesión Consejo Presupuesto 2026"
              value={tituloReunion}
              onChange={(e) => setTituloReunion(e.target.value)}
              className="w-full mt-1 bg-[#07090e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase">Fecha y Hora</label>
            <input
              type="datetime-local"
              value={fechaReunion}
              onChange={(e) => setFechaReunion(e.target.value)}
              className="w-full mt-1 bg-[#07090e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:brightness-110 text-slate-950 font-black py-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckSquare className="w-4 h-4" /> Emitir Citación Formal y Notificar Apartamentos
        </button>
      </form>
    </div>
  );
}
