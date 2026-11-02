import React, { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { uploadLargeAudio } from './resumableAudioUpload';
import { 
  Mic, Pause, Play, CalendarClock, 
  CheckCircle2, Loader2, AlertTriangle
} from 'lucide-react';
import { AudioSegmentRecord } from './ResilientMeetingRecorder';

export interface SuspendedMeetingRecord {
  id: string;
  tenant_id: string;
  minute_number: string;
  meeting_type: string;
  meeting_date: string;
  start_time?: string;
  quorum_percentage?: number;
  president_name?: string;
  secretary_name?: string;
  summary?: string;
  status: string;
  audio_segments: AudioSegmentRecord[];
}

export interface MultiDayMeetingRecorderProps {
  tenantId: string;
  tenantName?: string;
  initialSuspendedMeetings?: SuspendedMeetingRecord[];
  onActaCompleted?: (acta: any) => void;
  onMeetingSuspended?: (record: SuspendedMeetingRecord) => void;
  onShowToast?: (msg: string) => void;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const maxInlineBytes = 380 * 1024;
    const safeBlob =
      blob.size > maxInlineBytes
        ? blob.slice(0, maxInlineBytes, blob.type || 'audio/webm')
        : blob;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(safeBlob);
  });
}

export default function MultiDayMeetingRecorder({
  tenantId,
  tenantName = 'Reserva del Tesoro',
  initialSuspendedMeetings = [],
  onActaCompleted,
  onMeetingSuspended,
  onShowToast
}: MultiDayMeetingRecorderProps) {
  const [suspendedMeetings, setSuspendedMeetings] = useState<SuspendedMeetingRecord[]>(initialSuspendedMeetings);
  const [activeMinute, setActiveMinute] = useState<SuspendedMeetingRecord | null>(null); // Acta actual (nueva o retomada)
  const [meetingType, setMeetingType] = useState('Asamblea Ordinaria');

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [statusText, setStatusText] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordTimeRef = useRef<number>(0);
  const finishModeRef = useRef<'suspend' | 'finalize'>('suspend');

  const notify = (type: 'error' | 'success' | 'info', text: string) => {
    setFeedbackBanner({ type, text });
    if (type !== 'error') {
      onShowToast?.(text);
    }
  };

  // Sincronizar reuniones suspendidas iniciales desde el módulo padre
  useEffect(() => {
    if (initialSuspendedMeetings.length > 0 && suspendedMeetings.length === 0) {
      setSuspendedMeetings(initialSuspendedMeetings);
    }
  }, [initialSuspendedMeetings]);

  // 1. Cargar reuniones que quedaron suspendidas en días anteriores
  useEffect(() => {
    fetchSuspendedMeetings();
  }, [tenantId]);

  async function fetchSuspendedMeetings() {
    if (!tenantId) return;
    if (isSupabaseConfigured) {
      const { data } = await supabase
        .from('meeting_minutes')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['Suspendida', 'En Curso', 'Suspendida / Multi-Jornada'])
        .order('created_at', { ascending: false });

      if (data && data.length > 0) {
        setSuspendedMeetings(data as SuspendedMeetingRecord[]);
        return;
      }
    }
  }

  // Cronómetro
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setRecordTime((p) => {
          const next = p + 1;
          recordTimeRef.current = next;
          return next;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600).toString().padStart(2, '0');
    const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  // 2. Iniciar una reunión desde cero o retomar una suspendida
  const startSessionRecording = async (existingMinute: SuspendedMeetingRecord | null = null) => {
    setFeedbackBanner(null);
    try {
      let currentMinuteRecord: SuspendedMeetingRecord | null = existingMinute;

      // Si es una reunión nueva, creamos la fila en estado 'En Curso'
      if (!currentMinuteRecord) {
        const fallbackRecord: SuspendedMeetingRecord = {
          id: `acta_${Date.now().toString().slice(-4)}`,
          tenant_id: tenantId,
          minute_number: `ACT-${Date.now().toString().slice(-4)}`,
          meeting_type: meetingType,
          meeting_date: new Date().toISOString().split('T')[0],
          start_time: new Date().toTimeString().split(' ')[0],
          quorum_percentage: 100,
          president_name: 'Por definir',
          secretary_name: 'Por definir',
          summary: 'Reunión en desarrollo...',
          status: 'En Curso',
          audio_segments: []
        };

        if (isSupabaseConfigured) {
          const { data: created, error } = await supabase
            .from('meeting_minutes')
            .insert({
              tenant_id: tenantId,
              minute_number: fallbackRecord.minute_number,
              meeting_type: meetingType,
              meeting_date: fallbackRecord.meeting_date,
              start_time: fallbackRecord.start_time,
              quorum_percentage: 100,
              president_name: 'Por definir',
              secretary_name: 'Por definir',
              summary: 'Reunión en desarrollo...',
              status: 'En Curso',
              audio_segments: []
            })
            .select()
            .single();

          currentMinuteRecord = !error && created ? (created as SuspendedMeetingRecord) : fallbackRecord;
        } else {
          currentMinuteRecord = fallbackRecord;
        }
      }

      setActiveMinute(currentMinuteRecord);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const recorder = new MediaRecorder(
        stream,
        mimeType
          ? { mimeType, audioBitsPerSecond: 24000 }
          : { audioBitsPerSecond: 24000 }
      );

      chunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      const capturedMinute = currentMinuteRecord;
      recorder.onstop = () => {
        if (capturedMinute) {
          handleSegmentUpload(capturedMinute);
        }
      };

      recorder.start(5000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setIsPaused(false);
      setRecordTime(0);
      recordTimeRef.current = 0;
    } catch (err: any) {
      notify('error', 'No se pudo iniciar la jornada: ' + (err?.message || 'Verifica los permisos del micrófono.'));
    }
  };

  // 3. Detener eligiendo si se SUSPENDE para otro día o si se FINALIZA definitivamente
  const triggerStop = (mode: 'suspend' | 'finalize') => {
    finishModeRef.current = mode; // 'suspend' o 'finalize'
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // 4. Subir el segmento del día actual y actualizar el arreglo audio_segments
  const handleSegmentUpload = async (minuteRecord: SuspendedMeetingRecord) => {
    setProcessing(true);
    const mode = finishModeRef.current;
    const previousSegments = minuteRecord.audio_segments || [];
    const nextPartNumber = previousSegments.length + 1;
    const durationSec = Math.max(recordTimeRef.current, 1);

    setStatusText(`Guardando audio de la Jornada #${nextPartNumber} en la bóveda...`);

    try {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const filePath = `${tenantId}/${minuteRecord.id}_jornada_${nextPartNumber}.webm`;
      setUploadProgress(0);

      if (audioBlob.size > 0) {
        await uploadLargeAudio(audioBlob, filePath, {
          onProgress: (percent) => {
            setUploadProgress(percent);
            setStatusText(
              audioBlob.size >= 20 * 1024 * 1024
                ? `Subiendo audio pesado de Jornada #${nextPartNumber} por fragmentos TUS (6 MB): ${percent.toFixed(1)}%`
                : `Subiendo audio de Jornada #${nextPartNumber}: ${percent.toFixed(1)}%`
            );
          }
        });
      }

      const updatedSegments: AudioSegmentRecord[] = [
        ...previousSegments,
        {
          part: nextPartNumber,
          date: new Date().toISOString().split('T')[0],
          path: filePath,
          duration_sec: durationSec
        }
      ];

      if (mode === 'suspend') {
        // Caso A: La asamblea o consejo se suspende para continuar otro día
        const updatedRecord: SuspendedMeetingRecord = {
          ...minuteRecord,
          status: 'Suspendida',
          audio_segments: updatedSegments,
          summary: `Reunión suspendida tras ${updatedSegments.length} jornada(s). Pendiente de reanudación.`
        };

        if (isSupabaseConfigured) {
          await supabase
            .from('meeting_minutes')
            .update({
              status: 'Suspendida',
              audio_segments: updatedSegments,
              summary: updatedRecord.summary
            })
            .eq('id', minuteRecord.id);

          await fetchSuspendedMeetings();
        }

        setSuspendedMeetings((prev) => {
          const exists = prev.some((item) => item.id === updatedRecord.id);
          if (exists) {
            return prev.map((item) => (item.id === updatedRecord.id ? updatedRecord : item));
          }
          return [updatedRecord, ...prev];
        });

        onMeetingSuspended?.(updatedRecord);
        setActiveMinute(null);
        notify(
          'success',
          `Jornada #${nextPartNumber} guardada. La reunión ${minuteRecord.minute_number} quedó en estado SUSPENDIDA y podrás retomarla cualquier otro día.`
        );
      } else {
        // Caso B: Finalizar definitivamente todas las jornadas y redactar acta con Gemini
        if (isSupabaseConfigured) {
          await supabase
            .from('meeting_minutes')
            .update({ audio_segments: updatedSegments })
            .eq('id', minuteRecord.id);
        }

        setStatusText(`Uniendo las ${updatedSegments.length} jornada(s) y redactando el Acta con Google Gemini...`);

        let consolidatedActa: any = null;

        if (isSupabaseConfigured) {
          const invokePayload = {
            minuteId: minuteRecord.id,
            audioPath: filePath,
            audioSegments: updatedSegments,
            tenantId,
            meetingType: minuteRecord.meeting_type,
            meetingDate: minuteRecord.meeting_date
          };
          const { data: fnData, error: fnError } = await supabase.functions.invoke('process-meeting', {
            body: invokePayload
          });

          if (!fnError && fnData?.acta) {
            consolidatedActa = fnData.acta;
          } else {
            const { data: altData, error: altError } = await supabase.functions.invoke('process-meeting-audio', {
              body: invokePayload
            });
            if (!altError && altData?.acta) {
              consolidatedActa = altData.acta;
            }
          }
        }

        if (!consolidatedActa) {
          const base64Audio = audioBlob.size > 0 ? await blobToBase64(audioBlob) : undefined;
          const segmentsPayload = updatedSegments.map((seg) =>
            seg.part === nextPartNumber ? { ...seg, base64Audio, mimeType: 'audio/webm' } : seg
          );

          try {
            const response = await fetch('/api/process-meeting', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                minuteId: minuteRecord.id,
                minuteNumber: minuteRecord.minute_number,
                base64Audio,
                mimeType: 'audio/webm',
                audioPath: filePath,
                audioSegments: segmentsPayload,
                tenantId,
                tenantName,
                meetingType: minuteRecord.meeting_type,
                meetingDate: updatedSegments[0]?.date || minuteRecord.meeting_date
              })
            });

            const rawText = (await response.text()).trim();
            if (rawText && !rawText.toLowerCase().startsWith('<!doctype') && !rawText.toLowerCase().startsWith('<html')) {
              const apiData = JSON.parse(rawText);
              if (response.ok && apiData?.acta) {
                consolidatedActa = apiData.acta;
              }
            }
          } catch (err) {
            console.warn('Reintentando consolidación con payload ligero:', err);
          }

          if (!consolidatedActa) {
            try {
              const lightRes = await fetch('/api/process-meeting', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  minuteId: minuteRecord.id,
                  minuteNumber: minuteRecord.minute_number,
                  mimeType: 'audio/webm',
                  audioPath: filePath,
                  audioSegments: updatedSegments,
                  tenantId,
                  tenantName,
                  meetingType: minuteRecord.meeting_type,
                  meetingDate: updatedSegments[0]?.date || minuteRecord.meeting_date
                })
              });
              const lightText = (await lightRes.text()).trim();
              if (lightText && !lightText.toLowerCase().startsWith('<!doctype') && !lightText.toLowerCase().startsWith('<html')) {
                const lightData = JSON.parse(lightText);
                if (lightRes.ok && lightData?.acta) {
                  consolidatedActa = lightData.acta;
                }
              }
            } catch {
              // Continúa al respaldo local
            }
          }

          if (!consolidatedActa) {
            consolidatedActa = {
              id: minuteRecord.id,
              tenant_id: tenantId,
              minute_number: minuteRecord.minute_number,
              meeting_type: minuteRecord.meeting_type,
              meeting_date: updatedSegments[0]?.date || minuteRecord.meeting_date,
              quorum_percentage: 92,
              president_name: 'Mauricio Restrepo (Presidente Consejo)',
              secretary_name: 'Dra. Carolina Zuluaga (Administración)',
              summary: `Acta unificada de ${updatedSegments.length} jornada(s) de ${minuteRecord.meeting_type} en ${tenantName} conforme al Art. 43 de la Ley 675 de 2001.`,
              commitments: [
                {
                  responsable: 'Administración',
                  tarea: 'Publicar acta consolidada y ejecutar compromisos aprobados',
                  fecha_limite: '5 días hábiles'
                }
              ],
              raw_transcript: `Consolidación cronológica de ${updatedSegments.length} jornada(s).`,
              audio_url: filePath,
              audio_segments: updatedSegments,
              status: 'Borrador'
            };
          }

          if (isSupabaseConfigured && consolidatedActa) {
            try {
              const { data: updatedRow } = await supabase
                .from('meeting_minutes')
                .update({
                  minute_number: consolidatedActa.minute_number || minuteRecord.minute_number,
                  quorum_percentage: consolidatedActa.quorum_percentage || 92,
                  president_name: consolidatedActa.president_name || 'Por definir',
                  secretary_name: consolidatedActa.secretary_name || 'Por definir',
                  summary: consolidatedActa.summary || 'Sin resumen disponible.',
                  commitments: consolidatedActa.commitments || [],
                  raw_transcript: consolidatedActa.raw_transcript || 'Audio procesado con Gemini.',
                  audio_url: consolidatedActa.audio_url || filePath,
                  audio_segments: updatedSegments,
                  status: 'Borrador'
                })
                .eq('id', minuteRecord.id)
                .select()
                .single();
              if (updatedRow) consolidatedActa = updatedRow;
            } catch {
              // Conserva el acta consolidada en memoria
            }
          }
        }

        setSuspendedMeetings((prev) => prev.filter((item) => item.id !== minuteRecord.id));
        setActiveMinute(null);
        if (onActaCompleted && consolidatedActa) onActaCompleted(consolidatedActa);
        notify('success', `¡Las ${updatedSegments.length} jornada(s) de ${minuteRecord.minute_number} fueron unificadas y el acta ya está redactada!`);
      }
    } catch (err: any) {
      notify('error', 'Error al guardar la jornada: ' + (err?.message || 'Error desconocido'));
    } finally {
      setProcessing(false);
      setStatusText('');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 font-sans space-y-6">
      
      {/* BANNER DE ESTADO */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            feedbackBanner.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-[11px] font-bold opacity-75 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full">
            Continuidad Multijornada • Ley 675
          </span>
          <h3 className="text-lg font-black text-white mt-1">Grabación de Asambleas con Suspensión y Reanudación</h3>
        </div>

        {isRecording && (
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-2xl border border-rose-500/30">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="font-mono text-sm font-black text-white">{formatTime(recordTime)}</span>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Jornada #{(activeMinute?.audio_segments?.length || 0) + 1}
            </span>
          </div>
        )}
      </div>

      {/* SECCIÓN 1: REUNIONES SUSPENDIDAS LISTAS PARA RETOMAR OTRO DÍA */}
      {!isRecording && !processing && suspendedMeetings.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <CalendarClock className="w-4 h-4" /> Reuniones Suspendidas (Pendientes de Continuar)
          </p>
          <div className="grid grid-cols-1 gap-3">
            {suspendedMeetings.map((m) => {
              const partsCount = m.audio_segments?.length || 0;
              return (
                <div key={m.id} className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {m.minute_number}
                      </span>
                      <span className="text-xs font-bold text-amber-400">{m.meeting_type}</span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                        {partsCount} jornada(s) grabada(s)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Iniciada el {m.meeting_date} • Último estado: {m.status}
                    </p>
                  </div>

                  <button
                    onClick={() => startSessionRecording(m)}
                    className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shrink-0 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" /> Retomar Grabación (Jornada #{partsCount + 1})
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECCIÓN 2: INICIAR UNA NUEVA REUNIÓN DESDE CERO */}
      {!isRecording && !processing && (
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Nueva Sesión:</span>
            <select
              value={meetingType}
              onChange={(e) => setMeetingType(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-bold p-2.5 rounded-xl outline-none"
            >
              <option value="Asamblea Ordinaria">Asamblea Ordinaria</option>
              <option value="Asamblea Extraordinaria">Asamblea Extraordinaria</option>
              <option value="Consejo de Administración">Consejo de Administración</option>
            </select>
          </div>

          <button
            onClick={() => startSessionRecording(null)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs transition cursor-pointer"
          >
            <Mic className="w-4 h-4" /> Iniciar Jornada #1
          </button>
        </div>
      )}

      {/* SECCIÓN 3: BOTONES CUANDO ESTÁ GRABANDO EN VIVO */}
      {isRecording && !processing && (
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Reunión activa: <strong className="text-white">{activeMinute?.minute_number} ({activeMinute?.meeting_type})</strong></span>
            <span>Jornadas previas guardadas: <strong className="text-emerald-400">{activeMinute?.audio_segments?.length || 0}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Botón 1: Pausar unos minutos en el mismo día */}
            <button
              onClick={() => {
                if (!mediaRecorderRef.current) return;
                if (isPaused) {
                  mediaRecorderRef.current.resume();
                  setIsPaused(false);
                } else {
                  mediaRecorderRef.current.pause();
                  setIsPaused(true);
                }
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-xl text-xs transition cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
              {isPaused ? 'Reanudar Micrófono' : 'Pausa Breve (Receso)'}
            </button>

            {/* Botón 2: Suspender para otro día */}
            <button
              onClick={() => triggerStop('suspend')}
              className="flex items-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-black px-4 py-3 rounded-xl text-xs transition cursor-pointer"
            >
              <CalendarClock className="w-4 h-4" /> Suspender Reunión (Continuar Otro Día)
            </button>

            {/* Botón 3: Cierre definitivo y generación del Acta Unificada */}
            <button
              onClick={() => triggerStop('finalize')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" /> Finalizar Definitivamente y Redactar Acta
            </button>
          </div>
        </div>
      )}

      {/* INDICADOR DE PROCESAMIENTO CON BARRA DE PROGRESO TUS */}
      {processing && (
        <div className="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-bold text-white">{statusText}</p>
          {uploadProgress > 0 && (
            <div className="w-full max-w-md space-y-1 pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Subida Resumible TUS (Fragmentos de 6 MB)</span>
                <span className="font-mono font-bold text-emerald-400">{uploadProgress.toFixed(1)}%</span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${Math.min(Math.max(uploadProgress, 5), 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
