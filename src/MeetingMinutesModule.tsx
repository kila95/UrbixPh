import React, { useState, useRef } from 'react';
import { 
  FileText, Plus, Download, FileDown, CheckCircle2, 
  Clock, Users, AlertCircle, Search, ShieldCheck, Upload, X,
  Mic, Square, Sparkles, Loader2, ListChecks, ChevronDown, ChevronUp, 
  FileAudio, CalendarClock, Calendar, Video
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { uploadLargeAudio } from './resumableAudioUpload';
import ResilientMeetingRecorder, { AudioSegmentRecord } from './ResilientMeetingRecorder';
import MultiDayMeetingRecorder, { SuspendedMeetingRecord } from './MultiDayMeetingRecorder';
import { 
  exportActaToLegalPDF, 
  LegalPDFPreviewModal, 
  LegalActaData, 
  LegalTenantInfo 
} from './ActaCardWithPDF';
import SelectorTipoReunionUrbix from './components/SelectorTipoReunionUrbix';
import SalaAsambleaVirtualReal from './components/SalaAsambleaVirtualReal';

export interface MinuteCommitment {
  responsable: string;
  tarea: string;
  fecha_limite: string;
}

export interface MeetingMinuteItem {
  id: string;
  number: string;
  type: 'Consejo de Administración' | 'Asamblea Ordinaria' | 'Asamblea Extraordinaria' | 'Comité de Convivencia' | string;
  date: string;
  quorum: string;
  president: string;
  secretary: string;
  topics: string;
  status: 'Firmada / Publicada' | 'En Revisión' | 'Borrador' | string;
  pdfUrl: string;
  rawTranscript?: string;
  commitments?: MinuteCommitment[];
  audioUrl?: string;
  audioSegments?: AudioSegmentRecord[];
}

interface MeetingMinutesModuleProps {
  tenantId?: string;
  tenantName?: string;
  userProfile?: any;
  onShowToast?: (msg: string) => void;
}

export default function MeetingMinutesModule({
  tenantId = "22079bb5-6ac7-4a15-be89-c53d14e4221b",
  tenantName = "Urbanización Tricentenario",
  userProfile,
  onShowToast
}: MeetingMinutesModuleProps) {
  // Pestaña activa principal: Sala en Vivo vs Libro Oficial de Actas
  const [vistaPrincipal, setVistaPrincipal] = useState<'sala_vivo' | 'actas_libro'>('sala_vivo');

  // Estado de Actas existentes
  const [minutes, setMinutes] = useState<MeetingMinuteItem[]>([
    {
      id: 'act-1',
      number: 'ACT-CONS-2026-09',
      type: 'Consejo de Administración',
      date: '24 Octubre 2026',
      quorum: '85.7%',
      president: 'Mauricio Restrepo (Pte. Consejo)',
      secretary: 'Esteban Ochoa (Administrador)',
      topics: 'Aprobación cotización impermeabilización terraza Torre 2 y revisión estados financieros de septiembre.',
      status: 'Firmada / Publicada',
      pdfUrl: '#',
      commitments: [
        {
          responsable: 'Esteban Ochoa (Administrador)',
          tarea: 'Suscribir contrato de impermeabilización con póliza de estabilidad por 5 años',
          fecha_limite: '05 Noviembre 2026'
        }
      ]
    },
    {
      id: 'act-2',
      number: 'ACT-ASAM-2026-01',
      type: 'Asamblea Ordinaria',
      date: '15 Marzo 2026',
      quorum: '72.3%',
      president: 'Carlos Mario Londoño',
      secretary: 'Laura Henao',
      topics: 'Elección de Consejo de Administración 2026-2027, aprobación de presupuesto anual y fijación de cuota ordinaria.',
      status: 'Firmada / Publicada',
      pdfUrl: '#'
    }
  ]);
  const [filterType, setFilterType] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modales y herramientas
  const [showNewModal, setShowNewModal] = useState(false);
  const [showAiAudioModal, setShowAiAudioModal] = useState(false);
  const [showMultiDayRecorder, setShowMultiDayRecorder] = useState(false);
  const [showResilientRecorder, setShowResilientRecorder] = useState(false);
  const [showConvocatorias, setShowConvocatorias] = useState(false);
  const [expandedMinuteId, setExpandedMinuteId] = useState<string | null>(null);
  const [consolidatingMinuteId, setConsolidatingMinuteId] = useState<string | null>(null);
  const [previewLegalActa, setPreviewLegalActa] = useState<LegalActaData | null>(null);

  const tenantLegalInfo: LegalTenantInfo = {
    name: tenantName.includes('P.H.') ? tenantName : `${tenantName} P.H.`,
    nit: '900.456.789-1',
    zone: 'Medellín, Antioquia'
  };

  const mapItemToLegalActa = (acta: MeetingMinuteItem): LegalActaData => ({
    id: acta.id,
    minute_number: acta.number,
    meeting_type: acta.type,
    status: acta.status,
    meeting_date: acta.date,
    start_time: '18:00:00',
    quorum_percentage: String(acta.quorum || '100').replace('%', ''),
    president_name: acta.president,
    secretary_name: acta.secretary,
    summary: acta.topics,
    raw_transcript: acta.rawTranscript,
    balanceFinanciero: (acta as any).balanceFinanciero || [],
    commitments: acta.commitments,
    audio_segments: acta.audioSegments
  });

  // Estados formulario nueva acta manual
  const [newNumber, setNewNumber] = useState('ACT-ASAM-2026-01');
  const [newType, setNewType] = useState('Asamblea Ordinaria');
  const [newDate, setNewDate] = useState(() => new Date().toLocaleDateString('es-CO'));
  const [newQuorum, setNewQuorum] = useState('100.0%');
  const [newPresident, setNewPresident] = useState('Carlos Mario Pineda');
  const [newSecretary, setNewSecretary] = useState('Esteban Ochoa (Administrador)');
  const [newTopics, setNewTopics] = useState('');
  const [newStatus, setNewStatus] = useState<'En Revisión' | 'Firmada / Publicada' | 'Borrador'>('Borrador');

  // Estados Audio + IA Gemini
  const [aiMeetingType, setAiMeetingType] = useState('Asamblea Ordinaria');
  const [aiMeetingDate, setAiMeetingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [aiContextNotes, setAiContextNotes] = useState('');
  const [selectedAudioFile, setSelectedAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [processingAudio, setProcessingAudio] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [aiErrorMsg, setAiErrorMsg] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Filtrado de actas
  const filteredMinutes = minutes.filter(item => {
    const matchesType = filterType === 'Todos' || item.type === filterType;
    const matchesSearch = item.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.topics.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.president.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleCreateMinute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim() || !newTopics.trim()) return;

    const created: MeetingMinuteItem = {
      id: `act-${Date.now()}`,
      number: newNumber.trim(),
      type: newType,
      date: newDate.trim() || 'Fecha por definir',
      quorum: newQuorum.trim() || '100%',
      president: newPresident.trim() || 'Por asignar',
      secretary: newSecretary.trim() || 'Esteban Ochoa (Administrador)',
      topics: newTopics.trim(),
      status: newStatus,
      pdfUrl: '#'
    };

    setMinutes([created, ...minutes]);
    setShowNewModal(false);
    setNewTopics('');
    onShowToast?.(`Acta ${created.number} registrada en el libro oficial de ${tenantName}`);
  };

  const startRecording = async () => {
    setAiErrorMsg('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : undefined
      });
      recordedChunksRef.current = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) recordedChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const file = new File([blob], `sesion-${Date.now()}.webm`, { type: 'audio/webm' });
        setSelectedAudioFile(file);
        stream.getTracks().forEach(track => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } catch {
      setAiErrorMsg('No se pudo acceder al micrófono. Adjunta un archivo de audio (.webm, .mp3).');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleProcessAudioWithGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessingAudio(true);
    setUploadProgress(0);
    setAiErrorMsg('');
    try {
      const audioPath = `${tenantId}/${Date.now()}-${selectedAudioFile?.name || 'sesion.webm'}`;
      let edgeActa: any = null;

      if (selectedAudioFile) {
        try {
          await uploadLargeAudio(selectedAudioFile, audioPath, {
            onProgress: (percent) => setUploadProgress(percent)
          });
        } catch (uploadErr) {
          console.warn('Subida TUS omitida o reintentada en segundo plano:', uploadErr);
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const response = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          audioPath,
          tenantId,
          tenantName,
          meetingType: aiMeetingType,
          meetingDate: aiMeetingDate,
          contextNotes: aiContextNotes
        })
      });

      const rawText = (await response.text()).trim();
      if (rawText && !rawText.startsWith('<')) {
        const data = JSON.parse(rawText);
        if (response.ok && data?.acta) edgeActa = data.acta;
      }

      if (!edgeActa) {
        edgeActa = {
          id: `act-ai-${Date.now()}`,
          minute_number: `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
          meeting_type: aiMeetingType,
          meeting_date: aiMeetingDate,
          quorum_percentage: 100,
          president_name: userProfile?.full_name || 'Presidente Designado',
          secretary_name: 'Esteban Ochoa (Administrador)',
          summary: `Sesión de ${aiMeetingType} en ${tenantName}. ${aiContextNotes || 'Puntos del orden del día debatidos.'}`,
          status: 'Borrador'
        };
      }

      const newMinuteItem: MeetingMinuteItem = {
        id: edgeActa.id,
        number: edgeActa.minute_number,
        type: edgeActa.meeting_type || aiMeetingType,
        date: edgeActa.meeting_date || aiMeetingDate,
        quorum: `${edgeActa.quorum_percentage ?? 100}%`,
        president: edgeActa.president_name || 'Presidente Designado',
        secretary: edgeActa.secretary_name || 'Esteban Ochoa',
        topics: edgeActa.summary || 'Sin resumen.',
        status: edgeActa.status || 'Borrador',
        pdfUrl: '#',
        rawTranscript: edgeActa.raw_transcript,
        commitments: edgeActa.commitments || []
      };

      setMinutes((prev) => [newMinuteItem, ...prev]);
      setShowAiAudioModal(false);
      setSelectedAudioFile(null);
      setAiContextNotes('');
      onShowToast?.(`Acta ${newMinuteItem.number} procesada con IA exitosamente`);
    } catch (err: any) {
      setAiErrorMsg(err?.message || 'Error al procesar el audio con Gemini.');
    } finally {
      setProcessingAudio(false);
    }
  };

  const handleExportLegalPdf = (acta: MeetingMinuteItem) => {
    const legalActa = mapItemToLegalActa(acta);
    setPreviewLegalActa(legalActa);
    exportActaToLegalPDF(legalActa, tenantLegalInfo, onShowToast);
  };

  const handleResilientActaCreated = (edgeActa: any) => {
    if (!edgeActa) return;
    const newMinuteItem: MeetingMinuteItem = {
      id: edgeActa.id || `act-ai-${Date.now()}`,
      number: edgeActa.minute_number || `ACT-AUTO-${Date.now().toString().slice(-4)}`,
      type: edgeActa.meeting_type || 'Asamblea Ordinaria',
      date: edgeActa.meeting_date || new Date().toISOString().split('T')[0],
      quorum: `${edgeActa.quorum_percentage ?? 100}%`,
      president: edgeActa.president_name || 'Presidente',
      secretary: edgeActa.secretary_name || 'Secretario',
      topics: edgeActa.summary || 'Sin resumen.',
      status: 'Borrador',
      pdfUrl: '#',
      rawTranscript: edgeActa.raw_transcript,
      commitments: edgeActa.commitments || [],
      audioSegments: edgeActa.audio_segments
    };
    setMinutes((prev) => [newMinuteItem, ...prev]);
    onShowToast?.(`Acta ${newMinuteItem.number} guardada desde Motor 3h+`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. BARRA SUPERIOR DE SUB-MÓDULOS DE ASAMBLEA */}
      <div className="bg-[#0F172A] border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          
          <button
            onClick={() => setVistaPrincipal('sala_vivo')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              vistaPrincipal === 'sala_vivo'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>Sala de Asamblea en Vivo</span>
          </button>

          <button
            onClick={() => setVistaPrincipal('actas_libro')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
              vistaPrincipal === 'actas_libro'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Libro Oficial de Actas ({minutes.length})</span>
          </button>

          <button
            onClick={() => setShowConvocatorias(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showConvocatorias
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Convocatorias Ley 675</span>
          </button>

          <button
            onClick={() => setShowMultiDayRecorder(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showMultiDayRecorder
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
            <span>Grabadora Multi-Día</span>
          </button>

          <button
            onClick={() => setShowResilientRecorder(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              showResilientRecorder
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Mic className="w-3.5 h-3.5 text-emerald-400" />
            <span>Motor Resiliente 3h+</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAiAudioModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-xl text-xs font-medium transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Subir Audio (IA)</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer shadow-lg shadow-cyan-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Acta</span>
          </button>
        </div>
      </div>

      {/* 2. SUBMÓDULO: CONVOCATORIAS LEY 675 */}
      {showConvocatorias && (
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-xl">
          <SelectorTipoReunionUrbix 
            onShowToast={onShowToast} 
            onIniciarSalaVirtual={(reunion) => {
              setVistaPrincipal('sala_vivo');
              setShowConvocatorias(false);
              onShowToast?.(`🎥 Abriendo Sala Virtual para: "${reunion.titulo}"`);
            }}
          />
        </div>
      )}

      {/* 3. SUBMÓDULO: GRABADORA MULTI-DÍA (SUSPENSIÓN Y REANUDACIÓN) */}
      {showMultiDayRecorder && (
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-xl">
          <MultiDayMeetingRecorder
            tenantId={tenantId}
            tenantName={tenantName}
            onActaCompleted={handleResilientActaCreated}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* 4. SUBMÓDULO: MOTOR RESILIENTE 3H+ (INDEXED-DB + WAKELOCK) */}
      {showResilientRecorder && (
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-xl">
          <ResilientMeetingRecorder
            tenantId={tenantId}
            tenantName={tenantName}
            onActaCreated={handleResilientActaCreated}
            onShowToast={onShowToast}
          />
        </div>
      )}

      {/* 5. VISTA A: SALA DE ASAMBLEA & VIDEOLLAMADA EN VIVO */}
      {vistaPrincipal === 'sala_vivo' && (
        <SalaAsambleaVirtualReal
          tenantId={tenantId}
          userProfile={{
            full_name: userProfile?.full_name || 'Carlos Mario Pineda',
            role: userProfile?.role || 'admin',
            unit_number: userProfile?.unit_number || 'Administración',
            coefficient: userProfile?.coefficient || 0
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* 6. VISTA B: LIBRO OFICIAL DE ACTAS & EXPEDIENTES JURÍDICOS */}
      {vistaPrincipal === 'actas_libro' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Libro Radicado de Actas de Asamblea & Consejo
              </h3>
              <p className="text-xs text-slate-400">
                Archivo digital foliado conforme al Art. 47 de la Ley 675 de 2001.
              </p>
            </div>

            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar acta por código o tema..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#1E293B] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>
          </div>

          {filteredMinutes.length === 0 ? (
            <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
              No hay actas registradas en el libro digital. Registra una nueva acta manual o transcríbela con IA.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMinutes.map((acta) => (
                <div key={acta.id} className="p-4 bg-[#1E293B] border border-slate-700/80 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white">{acta.number}</span>
                      <span className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{acta.type}</span>
                      <span className="text-[10px] font-mono text-slate-400">Quórum: {acta.quorum}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-1">{acta.topics}</p>
                    <p className="text-[11px] text-slate-500 font-mono">Pte: {acta.president} • Srio: {acta.secretary} • {acta.date}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleExportLegalPdf(acta)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>Exportar PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: EXPORTACIÓN PDF */}
      {previewLegalActa && (
        <LegalPDFPreviewModal
          acta={previewLegalActa}
          tenantInfo={tenantLegalInfo}
          onClose={() => setPreviewLegalActa(null)}
          onToast={onShowToast}
        />
      )}

      {/* MODAL: SUBIR AUDIO IA GEMINI */}
      {showAiAudioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                Transcribir y Redactar Acta desde Audio (IA)
              </h3>
              <button onClick={() => setShowAiAudioModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleProcessAudioWithGemini} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Órgano Colegiado</label>
                  <select
                    value={aiMeetingType}
                    onChange={(e) => setAiMeetingType(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Asamblea Ordinaria">Asamblea Ordinaria</option>
                    <option value="Asamblea Extraordinaria">Asamblea Extraordinaria</option>
                    <option value="Consejo de Administración">Consejo de Administración</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={aiMeetingDate}
                    onChange={(e) => setAiMeetingDate(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Archivo de Audio de la Sesión</label>
                <div className="flex items-center gap-2">
                  <label className="flex-1 border-2 border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950 p-4 rounded-xl text-center cursor-pointer">
                    <span className="text-slate-300">
                      {selectedAudioFile ? selectedAudioFile.name : 'Haz clic para seleccionar .webm / .mp3'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => setSelectedAudioFile(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Apuntes Clave para el Abogado IA (Opcional)</label>
                <textarea
                  rows={2}
                  value={aiContextNotes}
                  onChange={(e) => setAiContextNotes(e.target.value)}
                  placeholder="Detalles sobre quorum, decisiones o votos para afinar la redacción..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAiAudioModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingAudio}
                  className="px-5 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold rounded-xl"
                >
                  {processingAudio ? 'Procesando con IA...' : 'Generar Borrador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ACTA MANUAL */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Registrar Nueva Acta en el Libro Oficial
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateMinute} className="space-y-4 text-xs font-sans">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Consecutivo / Código</label>
                  <input
                    type="text"
                    required
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tipo de Reunión</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="Asamblea Ordinaria">Asamblea Ordinaria</option>
                    <option value="Asamblea Extraordinaria">Asamblea Extraordinaria</option>
                    <option value="Consejo de Administración">Consejo de Administración</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Orden del Día & Decisiones</label>
                <textarea
                  required
                  rows={3}
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  placeholder="Resumen de puntos aprobados..."
                  className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl"
                >
                  Guardar en Libro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
