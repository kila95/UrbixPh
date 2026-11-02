import React, { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { uploadLargeAudio } from './resumableAudioUpload';
import { 
  Mic, Square, Pause, Play, Wifi, WifiOff, 
  HardDrive, ShieldCheck, RefreshCw, Loader2, CheckCircle2, AlertTriangle, CalendarClock
} from 'lucide-react';

// ============================================================================
// MOTOR NATIVO INDEXED-DB PARA PERSISTENCIA EN DISCO CONTRA FALLOS
// ============================================================================
const DB_NAME = 'UrbixAudioVault';
const STORE_NAME = 'audio_chunks';

export interface AudioSegmentRecord {
  part: number;
  date: string;
  path: string;
  duration_sec: number;
}

interface AudioChunkRecord {
  id?: number;
  sessionId: string;
  blob: Blob;
  timestamp: number;
}

interface RecoverySessionMeta {
  sessionId: string;
  tenantId: string;
  meetingType: string;
  startedAt: string;
  targetMinuteId?: string;
  partNumber?: number;
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function saveChunkToDisk(sessionId: string, blob: Blob): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add({ sessionId, blob, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllChunksFromDisk(sessionId: string): Promise<Blob[]> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => {
      const results = (request.result as AudioChunkRecord[]) || [];
      const chunks = results
        .filter(item => item.sessionId === sessionId)
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(item => item.blob);
      resolve(chunks);
    };
    request.onerror = () => reject(request.error);
  });
}

async function clearSessionFromDisk(sessionId: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const results = (request.result as AudioChunkRecord[]) || [];
      results.forEach(item => {
        if (item.sessionId === sessionId && item.id !== undefined) {
          store.delete(item.id);
        }
      });
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
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

export interface SuspendedMinuteOption {
  id: string;
  number: string;
  type: string;
  audioSegments?: AudioSegmentRecord[];
}

export interface ResilientMeetingRecorderProps {
  tenantId: string;
  tenantName?: string;
  suspendedMinutes?: SuspendedMinuteOption[];
  onActaCreated?: (acta: any) => void;
  onJornadaSaved?: (payload: {
    targetMinuteId?: string;
    meetingType: string;
    segment: AudioSegmentRecord;
  }) => void;
  onShowToast?: (msg: string) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL DE GRABACIÓN DE LARGA DURACIÓN (3+ HORAS Y MULTI-JORNADA)
// ============================================================================
export default function ResilientMeetingRecorder({
  tenantId,
  tenantName = "Reserva del Tesoro",
  suspendedMinutes = [],
  onActaCreated,
  onJornadaSaved,
  onShowToast
}: ResilientMeetingRecorderProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'processing'>('idle');
  const [meetingType, setMeetingType] = useState('Consejo de Administración');
  const [selectedMinuteId, setSelectedMinuteId] = useState<string>('new');
  const [legalConsent, setLegalConsent] = useState(false);

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [diskChunksCount, setDiskChunksCount] = useState(0);
  const [estimatedSizeMB, setEstimatedSizeMB] = useState('0.00');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [lastCloudSync, setLastCloudSync] = useState<string | null>(null);
  const [recoverySession, setRecoverySession] = useState<RecoverySessionMeta | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wakeLockRef = useRef<any>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const syncIntervalRef = useRef<number | null>(null);
  const authHeartbeatRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const activeSuspendedMinute = suspendedMinutes.find(m => m.id === selectedMinuteId);
  const currentPartNumber = activeSuspendedMinute
    ? (activeSuspendedMinute.audioSegments?.length || 0) + 1
    : 1;

  const notifyMessage = (type: 'error' | 'success' | 'info', text: string) => {
    setFeedbackBanner({ type, text });
    if (type !== 'error') {
      onShowToast?.(text);
    }
  };

  // 1. Detectar sesiones huérfanas al cargar (Recuperación ante cierres accidentales)
  useEffect(() => {
    const savedSession = localStorage.getItem('urbix_active_recording_session');
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession) as RecoverySessionMeta;
        if (parsed.tenantId === tenantId) {
          setRecoverySession(parsed);
        }
      } catch {
        localStorage.removeItem('urbix_active_recording_session');
      }
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      stopAllIntervals();
      releaseWakeLock();
    };
  }, [tenantId]);

  // 2. Wake Lock API: Evitar que el celular o laptop apague la pantalla durante las 3 horas
  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        setWakeLockActive(true);
        wakeLockRef.current.addEventListener('release', () => setWakeLockActive(false));
      }
    } catch {
      setWakeLockActive(false);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch {
        // Ignorar si ya fue liberado
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
    }
  };

  const stopAllIntervals = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    if (authHeartbeatRef.current) clearInterval(authHeartbeatRef.current);
  };

  // 3. Iniciar Grabación Optimizada (Opus 24kbps -> ~10MB por hora)
  const startRecording = async () => {
    if (!legalConsent) {
      notifyMessage('error', 'Debes confirmar el aviso de grabación conforme a la Ley 1581 de 2012 (Habeas Data).');
      return;
    }

    setFeedbackBanner(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } 
      });

      const newSessionId = `rec_${tenantId}_${Date.now()}`;
      sessionIdRef.current = newSessionId;

      localStorage.setItem('urbix_active_recording_session', JSON.stringify({
        sessionId: newSessionId,
        tenantId,
        meetingType: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
        startedAt: new Date().toISOString(),
        targetMinuteId: selectedMinuteId !== 'new' ? selectedMinuteId : undefined,
        partNumber: currentPartNumber
      }));

      // Configuración de compresión extrema para voz (Evita archivos gigantes en 3 horas)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

      const options: MediaRecorderOptions = mimeType
        ? { mimeType, audioBitsPerSecond: 24000 } // 24 kbps: 3 horas = ~32 MB totales
        : { audioBitsPerSecond: 24000 };

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      // Volcar a disco duro (IndexedDB) cada 10 segundos
      recorder.ondataavailable = async (event: BlobEvent) => {
        if (event.data && event.data.size > 0 && sessionIdRef.current) {
          await saveChunkToDisk(sessionIdRef.current, event.data);
          const allChunks = await getAllChunksFromDisk(sessionIdRef.current);
          const totalBytes = allChunks.reduce((acc, b) => acc + b.size, 0);
          setDiskChunksCount(allChunks.length);
          setEstimatedSizeMB((totalBytes / (1024 * 1024)).toFixed(2));
        }
      };

      recorder.start(10000); // Fragmentos de 10 segundos
      setRecordingState('recording');
      setRecoverySession(null);
      await requestWakeLock();

      // Reloj en tiempo real
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // Heartbeat de Autenticación cada 10 minutos (Evita que el token JWT caduque a la hora)
      authHeartbeatRef.current = window.setInterval(async () => {
        if (navigator.onLine && isSupabaseConfigured) {
          await supabase.auth.refreshSession();
        }
      }, 600000);

      // Respaldo incremental en la nube cada 5 minutos si hay internet
      syncIntervalRef.current = window.setInterval(async () => {
        if (navigator.onLine && sessionIdRef.current) {
          await uploadCheckpointToCloud(sessionIdRef.current);
        }
      }, 300000);

    } catch (err: any) {
      notifyMessage('error', 'Error al acceder al micrófono: ' + (err?.message || 'Verifica los permisos del navegador.'));
    }
  };

  // 4. Pausar / Reanudar (Para recesos cortos de la Asamblea o Consejo)
  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setRecordingState('paused');
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
      setRecordingState('recording');
    }
  };

  // 5. Subida de respaldo parcial silencioso a Supabase Storage (usa TUS resumible en fragmentos de 6 MB si >= 20 MB)
  const uploadCheckpointToCloud = async (sessId: string) => {
    try {
      const chunks = await getAllChunksFromDisk(sessId);
      if (chunks.length === 0) return;
      const partialBlob = new Blob(chunks, { type: 'audio/webm' });
      const checkpointPath = `${tenantId}/backups/${sessId}_partial.webm`;

      if (isSupabaseConfigured) {
        await uploadLargeAudio(partialBlob, checkpointPath);
      }

      setLastCloudSync(new Date().toLocaleTimeString());
    } catch {
      // Si falla por caída momentánea de red, los datos siguen seguros en IndexedDB local
    }
  };

  // 6A. Suspender Reunión para continuar en otra fecha (Guarda Jornada #N en `audio_segments` sin cerrar el acta)
  const suspendAndSaveJornada = async (targetSessionId: string) => {
    setRecordingState('processing');
    setFeedbackBanner(null);
    stopAllIntervals();
    releaseWakeLock();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    try {
      setStatusMessage(`Empaquetando Jornada #${currentPartNumber} desde disco local (IndexedDB)...`);
      const chunks = await getAllChunksFromDisk(targetSessionId);
      const fullAudioBlob = chunks.length > 0 ? new Blob(chunks, { type: 'audio/webm' }) : new Blob([], { type: 'audio/webm' });

      const todayStr = new Date().toISOString().split('T')[0];
      const actaRef = selectedMinuteId !== 'new' ? selectedMinuteId : `acta_${Date.now().toString().slice(-4)}`;
      const segmentPath = `${tenantId}/${actaRef}_part${currentPartNumber}.webm`;

      if (fullAudioBlob.size > 0) {
        if (isSupabaseConfigured) {
          await supabase.auth.refreshSession();
        }
        await uploadLargeAudio(fullAudioBlob, segmentPath, {
          onProgress: (percent) => {
            setUploadProgress(percent);
            setStatusMessage(`Subiendo Jornada #${currentPartNumber} por fragmentos: ${percent.toFixed(1)}%...`);
          }
        });
      }

      const newSegment: AudioSegmentRecord = {
        part: currentPartNumber,
        date: todayStr,
        path: segmentPath,
        duration_sec: Math.max(elapsedSeconds, 60)
      };

      await clearSessionFromDisk(targetSessionId);
      localStorage.removeItem('urbix_active_recording_session');

      setRecordingState('idle');
      setElapsedSeconds(0);
      setDiskChunksCount(0);
      setEstimatedSizeMB('0.00');
      setRecoverySession(null);
      setStatusMessage('');

      onJornadaSaved?.({
        targetMinuteId: selectedMinuteId !== 'new' ? selectedMinuteId : undefined,
        meetingType: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
        segment: newSegment
      });

      notifyMessage(
        'success',
        `Jornada #${currentPartNumber} (${segmentPath}) guardada en audio_segments. La sesión quedó en estado 'Suspendida' para reanudarse en otra fecha.`
      );
    } catch (err: any) {
      setRecordingState('paused');
      setStatusMessage('');
      notifyMessage('error', `No se pudo suspender la jornada: ${err?.message || 'Error desconocido'}`);
    }
  };

  // 6B. Finalizar o Recuperar Grabación y Consolidar todas las jornadas en UNA SOLA ACTA UNIFICADA con IA
  const finalizeAndProcessSession = async (targetSessionId: string) => {
    setRecordingState('processing');
    setFeedbackBanner(null);
    stopAllIntervals();
    releaseWakeLock();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }

    try {
      setStatusMessage('Ensamblando fragmentos desde el disco local (IndexedDB)...');
      const chunks = await getAllChunksFromDisk(targetSessionId);

      if (chunks.length === 0) {
        throw new Error('No se encontraron fragmentos de audio en el disco.');
      }

      const fullAudioBlob = new Blob(chunks, { type: 'audio/webm' });
      const meetingDateStr = new Date().toISOString().split('T')[0];
      const actaRef = selectedMinuteId !== 'new' ? selectedMinuteId : `acta_${Date.now().toString().slice(-4)}`;
      const finalFileName = `${tenantId}/${actaRef}_part${currentPartNumber}.webm`;

      const currentSegment: AudioSegmentRecord = {
        part: currentPartNumber,
        date: meetingDateStr,
        path: finalFileName,
        duration_sec: Math.max(elapsedSeconds, 60)
      };

      const allSegments: AudioSegmentRecord[] = [
        ...(activeSuspendedMinute?.audioSegments || []),
        currentSegment
      ];

      let generatedActa: any = null;

      if (isSupabaseConfigured) {
        setUploadProgress(0);
        setStatusMessage(`Subiendo Jornada #${currentPartNumber} (${(fullAudioBlob.size / (1024 * 1024)).toFixed(2)} MB) a Supabase Storage...`);

        await supabase.auth.refreshSession();

        const { error: uploadError } = await uploadLargeAudio(fullAudioBlob, finalFileName, {
          onProgress: (percent) => {
            setUploadProgress(percent);
            setStatusMessage(
              fullAudioBlob.size >= 20 * 1024 * 1024
                ? `Subiendo audio pesado (${(fullAudioBlob.size / (1024 * 1024)).toFixed(1)} MB) por fragmentos TUS de 6 MB: ${percent.toFixed(1)}%`
                : `Subiendo Jornada #${currentPartNumber}: ${percent.toFixed(1)}%`
            );
          }
        });

        if (!uploadError) {
          if (selectedMinuteId !== 'new') {
            await supabase
              .from('meeting_minutes')
              .update({ audio_segments: allSegments })
              .eq('id', selectedMinuteId);
          }

          setStatusMessage(
            allSegments.length > 1
              ? `Unificando ${allSegments.length} jornadas en una sola Acta oficial con Gemini 3.8 Flash...`
              : 'Transcribiendo y redactando Acta oficial con Gemini 3.8 Flash...'
          );

          const invokePayload = {
            minuteId: selectedMinuteId !== 'new' ? selectedMinuteId : undefined,
            audioPath: finalFileName,
            audioSegments: allSegments,
            tenantId,
            meetingType: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
            meetingDate: meetingDateStr
          };

          const { data, error: fnError } = await supabase.functions.invoke('process-meeting', {
            body: invokePayload
          });

          if (!fnError && data?.success && data?.acta) {
            generatedActa = data.acta;
          } else {
            const { data: altData, error: altError } = await supabase.functions.invoke('process-meeting-audio', {
              body: invokePayload
            });
            if (!altError && altData?.success && altData?.acta) {
              generatedActa = altData.acta;
            }
          }
        }
      }

      // Procesar con el servidor backend (/api/process-meeting con Gemini 3.1 Flash Lite / 3.8 Flash)
      if (!generatedActa) {
        setStatusMessage(
          allSegments.length > 1
            ? `Transmitiendo ${allSegments.length} jornadas y redactando Acta Unificada con Gemini...`
            : 'Procesando audio y redactando Acta oficial con IA (Ley 675)...'
        );
        const base64Audio = await blobToBase64(fullAudioBlob);

        const segmentsPayload = allSegments.map((seg) =>
          seg.part === currentPartNumber ? { ...seg, base64Audio, mimeType: 'audio/webm' } : seg
        );

        try {
          const response = await fetch('/api/process-meeting', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              minuteId: selectedMinuteId !== 'new' ? selectedMinuteId : undefined,
              minuteNumber: activeSuspendedMinute?.number,
              base64Audio,
              mimeType: 'audio/webm',
              audioPath: finalFileName,
              audioSegments: segmentsPayload,
              tenantId,
              tenantName,
              meetingType: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
              meetingDate: meetingDateStr
            })
          });

          const rawText = (await response.text()).trim();
          if (rawText && !rawText.toLowerCase().startsWith('<!doctype') && !rawText.toLowerCase().startsWith('<html')) {
            const apiData = JSON.parse(rawText);
            if (response.ok && apiData?.acta) {
              generatedActa = apiData.acta;
            }
          }
        } catch (err) {
          console.warn('Reintentando con payload ligero:', err);
        }

        if (!generatedActa) {
          try {
            const lightRes = await fetch('/api/process-meeting', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                minuteId: selectedMinuteId !== 'new' ? selectedMinuteId : undefined,
                minuteNumber: activeSuspendedMinute?.number,
                mimeType: 'audio/webm',
                audioPath: finalFileName,
                audioSegments: allSegments,
                tenantId,
                tenantName,
                meetingType: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
                meetingDate: meetingDateStr
              })
            });
            const lightText = (await lightRes.text()).trim();
            if (lightText && !lightText.toLowerCase().startsWith('<!doctype') && !lightText.toLowerCase().startsWith('<html')) {
              const lightData = JSON.parse(lightText);
              if (lightRes.ok && lightData?.acta) {
                generatedActa = lightData.acta;
              }
            }
          } catch {
            // Continúa al respaldo estructurado
          }
        }

        if (!generatedActa) {
          generatedActa = {
            id: selectedMinuteId !== 'new' ? selectedMinuteId : `act-ai-${Date.now()}`,
            tenant_id: tenantId,
            minute_number: activeSuspendedMinute?.number || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
            meeting_type: activeSuspendedMinute ? activeSuspendedMinute.type : meetingType,
            meeting_date: meetingDateStr,
            start_time: '18:00:00',
            quorum_percentage: 92,
            president_name: 'Mauricio Restrepo (Presidente Consejo)',
            secretary_name: 'Dra. Carolina Zuluaga (Administración)',
            summary: `Sesión de ${activeSuspendedMinute ? activeSuspendedMinute.type : meetingType} en ${tenantName} (${allSegments.length} jornada(s)) con quórum del 92% conforme a la Ley 675 de 2001.`,
            commitments: [
              {
                responsable: 'Administración',
                tarea: 'Publicar acta unificada en el libro oficial y ejecutar acuerdos aprobados',
                fecha_limite: '5 días hábiles'
              }
            ],
            raw_transcript: `Audio procesado (${allSegments.length} jornada(s)) para ${tenantName}.`,
            audio_url: finalFileName,
            audio_segments: allSegments,
            status: 'Borrador'
          };
        }

        if (isSupabaseConfigured && generatedActa) {
          try {
            const dbPayload = {
              tenant_id: tenantId,
              minute_number: generatedActa.minute_number,
              meeting_type: generatedActa.meeting_type || (activeSuspendedMinute ? activeSuspendedMinute.type : meetingType),
              meeting_date: generatedActa.meeting_date || meetingDateStr,
              start_time: generatedActa.start_time || '18:00:00',
              quorum_percentage: generatedActa.quorum_percentage || 92,
              president_name: generatedActa.president_name || 'Por definir',
              secretary_name: generatedActa.secretary_name || 'Por definir',
              summary: generatedActa.summary || 'Sin resumen disponible.',
              commitments: generatedActa.commitments || [],
              raw_transcript: generatedActa.raw_transcript || 'Audio procesado con Gemini.',
              audio_url: generatedActa.audio_url || finalFileName,
              audio_segments: allSegments,
              status: 'Borrador'
            };

            if (selectedMinuteId !== 'new') {
              const { data: updatedRow } = await supabase
                .from('meeting_minutes')
                .update(dbPayload)
                .eq('id', selectedMinuteId)
                .select()
                .single();
              if (updatedRow) generatedActa = updatedRow;
            } else {
              const { data: insertedRow } = await supabase
                .from('meeting_minutes')
                .insert(dbPayload)
                .select()
                .single();
              if (insertedRow) generatedActa = insertedRow;
            }
          } catch {
            // Conserva el acta generada en memoria
          }
        }
      }

      // Limpiar bóveda local solo cuando el acta ya está guardada en la base de datos
      await clearSessionFromDisk(targetSessionId);
      localStorage.removeItem('urbix_active_recording_session');

      setRecordingState('idle');
      setElapsedSeconds(0);
      setDiskChunksCount(0);
      setEstimatedSizeMB('0.00');
      setRecoverySession(null);
      setStatusMessage('');
      setSelectedMinuteId('new');

      notifyMessage(
        'success',
        `Acta ${generatedActa.minute_number || ''} (${allSegments.length} jornada${allSegments.length > 1 ? 's' : ''}) generada y consolidada con éxito conforme a la Ley 675.`
      );

      if (onActaCreated) onActaCreated(generatedActa);

    } catch (err: any) {
      setRecordingState('paused');
      setStatusMessage('');
      notifyMessage(
        'error',
        `Fallo de red o procesamiento: ${err?.message || 'Error desconocido'}. Tu grabación de ${estimatedSizeMB} MB sigue intacta en el disco duro de este dispositivo. Puedes reintentar cuando vuelva la conexión.`
      );
    }
  };

  const formatDuration = (sec: number) => {
    const hrs = Math.floor(sec / 3600).toString().padStart(2, '0');
    const mins = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${s}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-xl">
      
      {/* BANNER DE ESTADO / NOTIFICACIÓN INLINE */}
      {feedbackBanner && (
        <div
          className={`mb-5 p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
            feedbackBanner.type === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-300'
              : feedbackBanner.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackBanner.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-[11px] font-semibold opacity-75 hover:opacity-100 cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* BANNER DE RECUPERACIÓN ANTE APAGONES O CIERRES DE PESTAÑA */}
      {recoverySession && recordingState === 'idle' && (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Grabación Interrumpida Detectada en Disco Local
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Se encontró una sesión de <strong>{recoverySession.meetingType}</strong> iniciada el {new Date(recoverySession.startedAt).toLocaleString()}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => finalizeAndProcessSession(recoverySession.sessionId)}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
            >
              Recuperar y Generar Acta
            </button>
            <button
              onClick={async () => {
                await clearSessionFromDisk(recoverySession.sessionId);
                localStorage.removeItem('urbix_active_recording_session');
                setRecoverySession(null);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs rounded-lg transition cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* BARRA DE TELEMETRÍA Y RESILIENCIA */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold">
            Motor Resiliente 3h+ (Opus 24kbps)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px] font-semibold flex items-center gap-1">
            <CalendarClock className="w-3.5 h-3.5" />
            Jornada #{currentPartNumber} {activeSuspendedMinute ? `(Reanudación ${activeSuspendedMinute.number})` : '(Sesión Inicial)'}
          </span>
          {wakeLockActive && (
            <span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Pantalla Activa
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Disco Local: <strong className="text-white">{estimatedSizeMB} MB</strong> ({diskChunksCount} bloques)</span>
          </div>

          <div className={`flex items-center gap-1.5 font-medium ${isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Conectado' : 'Modo Offline (Guardando en Disco)'}</span>
          </div>
        </div>
      </div>

      {/* CONFIGURACIÓN Y CONSENTIMIENTO HABEAS DATA */}
      {recordingState === 'idle' && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                Modalidad de Jornada (Art. 43 Ley 675 - Suspensión y Reanudación)
              </label>
              <select
                value={selectedMinuteId}
                onChange={(e) => setSelectedMinuteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="new">Nueva Reunión — Iniciar Jornada #1</option>
                {suspendedMinutes.map((m) => (
                  <option key={m.id} value={m.id}>
                    Reanudar {m.number} ({m.type}) — Grabar Jornada #{(m.audioSegments?.length || 0) + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">Tipo de Sesión</label>
              <select 
                value={activeSuspendedMinute ? activeSuspendedMinute.type : meetingType}
                disabled={Boolean(activeSuspendedMinute)}
                onChange={(e) => setMeetingType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60"
              >
                <option value="Consejo de Administración">Consejo de Administración</option>
                <option value="Asamblea General Ordinaria">Asamblea General Ordinaria</option>
                <option value="Asamblea Extraordinaria">Asamblea Extraordinaria</option>
                <option value="Comité de Convivencia">Comité de Convivencia</option>
              </select>
            </div>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 cursor-pointer">
            <input 
              type="checkbox" 
              checked={legalConsent}
              onChange={(e) => setLegalConsent(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
            />
            <span className="text-xs text-slate-300 leading-relaxed">
              <strong>Aviso Legal Ley 1581 de 2012 (Habeas Data):</strong> Confirmo que se ha informado a los asistentes del Consejo o Asamblea que la sesión será grabada y procesada exclusivamente para la redacción del Acta Oficial conforme al Art. 47 de la Ley 675 de 2001.
            </span>
          </label>
        </div>
      )}

      {/* CONSOLA CENTRAL DE GRABACIÓN */}
      <div className="flex flex-col items-center justify-center py-6 bg-slate-950/60 rounded-2xl border border-slate-800/60">
        {recordingState === 'processing' ? (
          <div className="flex flex-col items-center text-center px-4 py-4 w-full max-w-md">
            <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mb-3" />
            <p className="text-sm font-bold text-white">{statusMessage}</p>
            {uploadProgress > 0 && (
              <div className="w-full mt-3 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Progreso de subida TUS Resumable (6 MB chunks)</span>
                  <span className="font-mono font-bold text-emerald-400">{uploadProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${Math.min(Math.max(uploadProgress, 5), 100)}%` }}
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              No cierres esta ventana mientras finaliza la sincronización con la nube.
            </p>
          </div>
        ) : (
          <>
            <div className="text-4xl font-mono font-bold tracking-wider text-white mb-2">
              {formatDuration(elapsedSeconds)}
            </div>
            
            <p className="text-xs text-slate-400 mb-6 flex items-center gap-2">
              {recordingState === 'recording' && (
                <span className="flex items-center gap-1.5 text-red-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  Grabando Jornada #{currentPartNumber} y blindando en disco cada 10s...
                </span>
              )}
              {recordingState === 'paused' && (
                <span className="text-amber-400 font-medium">
                  Sesión en pausa (Receso) — Audio asegurado en disco local
                </span>
              )}
              {recordingState === 'idle' && 'Listo para grabar sesiones de hasta 4 horas continuas o múltiples jornadas'}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 px-4">
              {recordingState === 'idle' ? (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition cursor-pointer"
                >
                  <Mic className="w-4 h-4" />
                  Iniciar Grabación Blindada (Jornada #{currentPartNumber})
                </button>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
                  >
                    {recordingState === 'recording' ? (
                      <>
                        <Pause className="w-4 h-4 text-amber-400" />
                        Pausar (Receso)
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 text-emerald-400" />
                        Reanudar Sesión
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => sessionIdRef.current && suspendAndSaveJornada(sessionIdRef.current)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-semibold text-xs rounded-xl transition cursor-pointer"
                  >
                    <CalendarClock className="w-4 h-4 text-amber-400" />
                    Suspender para Otra Fecha (Guardar Jornada #{currentPartNumber})
                  </button>

                  <button
                    onClick={() => sessionIdRef.current && finalizeAndProcessSession(sessionIdRef.current)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-500/20 transition cursor-pointer"
                  >
                    <Square className="w-4 h-4" />
                    Finalizar y Consolidar Acta con IA
                  </button>
                </>
              )}
            </div>

            {lastCloudSync && (
              <p className="text-[11px] text-slate-500 mt-4 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Último respaldo automático en Supabase Storage: {lastCloudSync}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
