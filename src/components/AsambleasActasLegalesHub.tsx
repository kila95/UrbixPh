import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Radio, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  ShieldCheck, 
  FileDown, 
  Sparkles, 
  Settings, 
  Maximize2,
  Clock,
  Volume2
} from 'lucide-react';

export default function AsambleasActasLegalesHub({
  onShowToast,
  copropiedadNombre = 'P.H. Reserva del Tesoro'
}: {
  onShowToast?: (msg: string) => void;
  copropiedadNombre?: string;
}) {
  const [tabActiva, setTabActiva] = useState<1 | 2 | 3>(1);

  // --- ESTADOS DE LA SALA DE VIDEOLLAMADA & ASAMBLEA VIRTUAL ---
  const [enTransmision, setEnTransmision] = useState(true);
  const [microfonoActivo, setMicrofonoActivo] = useState(true);
  const [camaraActiva, setCamaraActiva] = useState(true);
  const [segundosTranscurridos, setSegundosTranscurridos] = useState(1420);
  const [participanteHablando, setParticipanteHablando] = useState('Dr. Mauricio Restrepo (Presidente)');

  // Quórum ponderado por coeficientes (Ley 675)
  const [quorumActual, setQuorumActual] = useState(78.4);

  // Mociones en vivo
  const [mociones, setMociones] = useState([
    { id: 1, titulo: 'Aprobación Presupuesto Ordinario 2026', tipo: 'Mayoría Simple (50% + 1)', estado: 'Activa', favor: 62.5, contra: 8.4 },
    { id: 2, titulo: 'Cuota Extraordinaria: Fachadas y Ascensores', tipo: 'Calificada (70% Ley 675)', estado: 'Pendiente', favor: 0, contra: 0 }
  ]);
  const [nuevaMocionInput, setNuevaMocionInput] = useState('');

  // Estados del Transcriptor y Acta IA
  const [procesandoIa, setProcesandoIa] = useState(false);
  const [resumenGenerado, setResumenGenerado] = useState(
    'Sesión de Asamblea General instalada con verificación de quórum del 78.4% del coeficiente total. Deliberación activa sobre presupuesto 2026 y mantenimiento de áreas comunes conforme a la Ley 675 de 2001.'
  );

  // Cronómetro de la sala en vivo
  useEffect(() => {
    let intervalo: any;
    if (enTransmision) {
      intervalo = setInterval(() => {
        setSegundosTranscurridos(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(intervalo);
  }, [enTransmision]);

  const formatearTiempo = (seg: number) => {
    const horas = Math.floor(seg / 3600);
    const minutos = Math.floor((seg % 3600) / 60);
    const segundos = seg % 60;
    return `${horas > 0 ? `${horas}:` : ''}${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
  };

  const handleLanzarMocion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaMocionInput.trim()) return;
    setMociones(prev => [
      { id: Date.now(), titulo: nuevaMocionInput.trim(), tipo: 'Mayoría Simple (50% + 1)', estado: 'Activa', favor: 0, contra: 0 },
      ...prev
    ]);
    setNuevaMocionInput('');
    onShowToast?.('📢 Moción lanzada en vivo a los tarjetones de votación.');
  };

  const handleVotarEnVivo = (id: number, sentido: 'favor' | 'contra') => {
    setMociones(prev => prev.map(m => {
      if (m.id !== id) return m;
      const incremento = 18.5; // Coeficiente de la unidad actual
      return {
        ...m,
        favor: sentido === 'favor' ? Number((m.favor + incremento).toFixed(1)) : m.favor,
        contra: sentido === 'contra' ? Number((m.contra + incremento).toFixed(1)) : m.contra
      };
    }));
    onShowToast?.(`✅ Voto ponderado (${sentido.toUpperCase()}) registrado en la asamblea.`);
  };

  const handleProcesarGrabacionIa = () => {
    setProcesandoIa(true);
    onShowToast?.('🎙️ Conectando con Gemini API para estructurar acta oficial...');
    setTimeout(() => {
      setProcesandoIa(false);
      setResumenGenerado(
        'Acta consolidada: Con quórum reglamentario del 78.4%, se aprobó la moción de presupuesto ordinario 2026. Se levantó constancia de compromisos para el Consejo y la Administración conforme al Art. 47 de la Ley 675.'
      );
      setTabActiva(3);
      onShowToast?.('✨ ¡Acta estructurada y lista para firma digital!');
    }, 2200);
  };

  return (
    <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-4 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA CON PESTAÑAS */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-4 sm:p-5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
              Hub Unificado • {copropiedadNombre}
            </span>
            <h3 className="text-base font-black text-white mt-1">Sala de Asamblea Virtual &amp; Actas Legales</h3>
          </div>
        </div>

        {/* NAVEGACIÓN ENTRE FASES */}
        <div className="flex items-center gap-2 bg-[#07090e] p-1.5 rounded-2xl border border-slate-800 overflow-x-auto w-full lg:w-auto">
          <button
            onClick={() => setTabActiva(1)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              tabActiva === 1
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" /> 1. Videollamada &amp; Votación
          </button>

          <button
            onClick={() => setTabActiva(2)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              tabActiva === 2
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-3.5 h-3.5" /> 2. Transcriptor &amp; Minuta IA
          </button>

          <button
            onClick={() => setTabActiva(3)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              tabActiva === 3
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> 3. Bóveda &amp; PDF Foliado
          </button>
        </div>
      </div>

      {/* =========================================================================
          FASE 1: SALA DE VIDEOLLAMADA WEBRTC EN VIVO + ESCRUTINIO EN TIEMPO REAL
          ========================================================================= */}
      {tabActiva === 1 && (
        <div className="space-y-6">
          
          {/* CUADRÍCULA DE TRANSMISIÓN EN VIVO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LIENZO PRINCIPAL DE VIDEOLLAMADA */}
            <div className="lg:col-span-2 bg-[#0b0f17] border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between space-y-4 relative min-h-[380px] shadow-inner overflow-hidden">
              
              {/* Barra superior del video */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-bold text-white">EN VIVO</span>
                  <span className="text-slate-400 ml-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" /> {formatearTiempo(segundosTranscurridos)}
                  </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
                  <span className="text-slate-400">Quórum Activo:</span>
                  <strong className="text-emerald-400">{quorumActual}%</strong>
                </div>
              </div>

              {/* Pantalla central del orador */}
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#07090e]/70 border border-slate-800/80 rounded-2xl relative my-2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.25)] mb-3">
                  <Users className="w-9 h-9" />
                </div>
                <h4 className="text-sm sm:text-base font-black text-white">{participanteHablando}</h4>
                <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-1.5 justify-center">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" /> Canal de audio WebRTC HD en transmisión
                </p>

                {/* Sub-cámaras de participantes */}
                <div className="grid grid-cols-3 gap-2 mt-5 w-full max-w-sm">
                  <div className="bg-[#0b0f17] border border-slate-800 p-2 rounded-xl text-center">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold mx-auto flex items-center justify-center">T1</div>
                    <span className="text-[10px] text-slate-400 mt-1 block truncate">Torre 1 - 202</span>
                  </div>
                  <div className="bg-[#0b0f17] border border-cyan-500/30 p-2 rounded-xl text-center">
                    <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-bold mx-auto flex items-center justify-center">T2</div>
                    <span className="text-[10px] text-cyan-300 mt-1 block truncate">Torre 2 - 301 (Tú)</span>
                  </div>
                  <div className="bg-[#0b0f17] border border-slate-800 p-2 rounded-xl text-center">
                    <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold mx-auto flex items-center justify-center">T2</div>
                    <span className="text-[10px] text-slate-400 mt-1 block truncate">Torre 2 - 404</span>
                  </div>
                </div>
              </div>

              {/* Barra inferior de controles multimedia */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 z-10">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMicrofonoActivo(!microfonoActivo)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      microfonoActivo 
                        ? 'bg-slate-800 text-white border-slate-700' 
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {microfonoActivo ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">{microfonoActivo ? 'Mute' : 'Silenciado'}</span>
                  </button>

                  <button
                    onClick={() => setCamaraActiva(!camaraActiva)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      camaraActiva 
                        ? 'bg-slate-800 text-white border-slate-700' 
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                    }`}
                  >
                    {camaraActiva ? <Video className="w-4 h-4 text-cyan-400" /> : <VideoOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">{camaraActiva ? 'Cámara' : 'Apagada'}</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTabActiva(2)}
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.25)] flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Procesar Acta con IA
                  </button>

                  <button
                    onClick={() => setEnTransmision(false)}
                    className="bg-rose-600 hover:bg-rose-500 text-white p-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Finalizar sesión"
                  >
                    <PhoneOff className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* PANEL LATERAL: VOTACIÓN EN VIVO & QUÓRUM LEY 675 */}
            <div className="bg-[#0b0f17] border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Escrutinio por Coeficiente
                  </h4>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    Art. 45 Ley 675
                  </span>
                </div>

                <form onSubmit={handleLanzarMocion} className="space-y-2 mb-4">
                  <input
                    type="text"
                    placeholder="Nueva moción a votar..."
                    value={nuevaMocionInput}
                    onChange={(e) => setNuevaMocionInput(e.target.value)}
                    className="w-full p-2.5 text-xs bg-[#07090e] border border-slate-700 text-white rounded-xl outline-none focus:border-cyan-400 font-sans"
                    required
                  />
                  <button
                    type="submit"
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                  >
                    + Abrir Votación
                  </button>
                </form>

                <div className="space-y-3">
                  {mociones.map((moc) => (
                    <div key={moc.id} className="bg-[#07090e] border border-slate-800 p-3.5 rounded-2xl space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-xs">{moc.titulo}</strong>
                        <span className="text-[9px] font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded">
                          {moc.tipo}
                        </span>
                      </div>

                      <div className="flex justify-between text-[11px] font-mono text-slate-400">
                        <span>A Favor: <strong className="text-emerald-400">{moc.favor}%</strong></span>
                        <span>En Contra: <strong className="text-rose-400">{moc.contra}%</strong></span>
                      </div>

                      {moc.estado === 'Activa' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleVotarEnVivo(moc.id, 'favor')}
                            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Votar Sí (+18.5%)
                          </button>
                          <button
                            onClick={() => handleVotarEnVivo(moc.id, 'contra')}
                            className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer"
                          >
                            Votar No
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-[#07090e] p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono">
                Quórum deliberatorio: <strong>{quorumActual}%</strong> (&gt;50% habilitado)
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          FASE 2: TRANSCRIPTOR DE AUDIO & SÍNTESIS INTELIGENTE (LEY 675)
          ========================================================================= */}
      {tabActiva === 2 && (
        <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Transcriptor de Sesión &amp; Estructuración de Acta</h4>
              <p className="text-xs text-slate-400 mt-0.5">Procesa el flujo de audio y acuerdos tomados para generar el borrador legal unificado.</p>
            </div>
            <button
              onClick={handleProcesarGrabacionIa}
              disabled={procesandoIa}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.25)] disabled:opacity-50"
            >
              {procesandoIa ? 'Estructurando con IA...' : '✨ Procesar Acta Definitiva'}
            </button>
          </div>

          <div className="bg-[#07090e] border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
              Síntesis Cronológica y Quórum Verificado
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">{resumenGenerado}</p>
          </div>
        </div>
      )}

      {/* =========================================================================
          FASE 3: BÓVEDA DOCUMENTAL, COMPROMISOS & EXPORTACIÓN PDF
          ========================================================================= */}
      {tabActiva === 3 && (
        <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-white">Bóveda de Actas, Compromisos &amp; Firmas</h4>
              <p className="text-xs text-slate-400 mt-0.5">Expediente legal foliado listo para descarga oficial bajo el Art. 47 de la Ley 675.</p>
            </div>
            <button
              onClick={() => onShowToast?.('📄 Acta foliada generada y descargada en PDF con firmas electrónicas.')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <FileDown className="w-4 h-4" /> Exportar Acta en PDF
            </button>
          </div>

          <div className="space-y-3">
            <div className="bg-[#07090e] border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs">
              <div>
                <strong className="text-white block">Administración:</strong>
                <span className="text-slate-300">Publicar el acta firmada en el repositorio digital de la copropiedad.</span>
              </div>
              <span className="font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
                Plazo: 5 días hábiles
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
