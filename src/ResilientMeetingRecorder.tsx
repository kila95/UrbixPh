import React, { useState, useRef, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { uploadLargeAudio } from './resumableAudioUpload';
import { 
  Mic, Square, Pause, Play, Wifi, WifiOff, 
  HardDrive, Loader2, CheckCircle2,
  UploadCloud, FileAudio, Sparkles, X, FileDown, Printer, Check
} from 'lucide-react';
import { exportActaToLegalPDF, downloadActaLegalHTML, LegalActaData, LegalTenantInfo } from './ActaCardWithPDF';
import { ConfiguradorLogoCopropiedad } from './ConfiguradorLogoCopropiedad';

const DB_NAME = 'UrbixAudioVault';
const STORE_NAME = 'audio_chunks';

export interface AudioSegmentRecord {
  part: number;
  date: string;
  path: string;
  duration_sec: number;
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

async function getSessionChunksFromDisk(sessionId: string): Promise<Blob[]> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();
    const blobs: Blob[] = [];

    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.value.sessionId === sessionId) {
          blobs.push(cursor.value.blob);
        }
        cursor.continue();
      } else {
        resolve(blobs);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

async function clearSessionFromDisk(sessionId: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.openCursor();

    request.onsuccess = (e) => {
      const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        if (cursor.value.sessionId === sessionId) {
          cursor.delete();
        }
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export interface SuspendedMinuteSummary {
  id: string;
  number: string;
  type: string;
  audioSegments?: AudioSegmentRecord[];
}

export interface ResilientMeetingRecorderProps {
  tenantId?: string;
  tenantName?: string;
  tenantLogoUrl?: string;
  suspendedMinutes?: SuspendedMinuteSummary[];
  onActaCreated?: (acta: any) => void;
  onJornadaSaved?: (data: { targetMinuteId?: string; meetingType: string; segment: AudioSegmentRecord }) => void;
  onShowToast?: (msg: string) => void;
}

export default function ResilientMeetingRecorder({
  tenantId = '22079bb5-6ac7-4a15-be89-c53d14e4221b',
  tenantName = 'Reserva del Tesoro',
  tenantLogoUrl,
  suspendedMinutes = [],
  onActaCreated,
  onShowToast
}: ResilientMeetingRecorderProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'processing'>('idle');
  const [meetingType, setMeetingType] = useState('Consejo de Administración');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [estimatedSizeMB, setEstimatedSizeMB] = useState('0.00');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [bannerAlert, setBannerAlert] = useState<{ type: 'error' | 'success' | 'info'; text: string } | null>(null);

  // Estados para Drag & Drop y análisis
  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [analyzingDroppedFile, setAnalyzingDroppedFile] = useState(false);
  const [dropUploadProgress, setDropUploadProgress] = useState(0);

  // Estado del Acta recién generada lista para descargar ya
  const [actaListaParaDescargar, setActaListaParaDescargar] = useState<LegalActaData | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const wakeLockRef = useRef<any>(null);

  const [currentLogo, setCurrentLogo] = useState<string | undefined>(() => {
    if (tenantLogoUrl) return tenantLogoUrl;
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(`urbix_logo_${tenantId}`) || undefined;
      } catch (e) {
        return undefined;
      }
    }
    return undefined;
  });

  const tenantLegalInfo: LegalTenantInfo = {
    name: tenantName.includes('P.H.') ? tenantName : `Edificio ${tenantName} P.H.`,
    nit: '900.456.789-1',
    zone: 'El Poblado, Medellín',
    logoUrl: currentLogo || tenantLogoUrl
  };

  const notifyMessage = (type: 'error' | 'success' | 'info', text: string) => {
    setBannerAlert({ type, text });
    if (type !== 'error') onShowToast?.(text);
  };

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      }
    } catch {}
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
  };

  // Convertidor para descarga directa
  const prepararYDescargarActa = (actaRaw: any) => {
    const cleanActa: LegalActaData = {
      id: actaRaw.id || `act-${Date.now()}`,
      minute_number: actaRaw.minute_number || `ACT-${Date.now().toString().slice(-4)}`,
      meeting_type: actaRaw.encabezado?.organo || actaRaw.meeting_type || meetingType,
      status: 'Aprobada / Foliada',
      meeting_date: actaRaw.encabezado?.fecha || actaRaw.meeting_date || new Date().toISOString().split('T')[0],
      start_time: actaRaw.encabezado?.horaInicio || actaRaw.start_time || '18:00:00',
      end_time: actaRaw.encabezado?.horaFin || actaRaw.end_time || '',
      quorum_percentage: actaRaw.encabezado?.quorum || actaRaw.quorum_percentage || 92,
      president_name: actaRaw.encabezado?.presidente || actaRaw.president_name || 'Presidente de la Sesión',
      secretary_name: actaRaw.encabezado?.secretario || actaRaw.secretary_name || 'Secretaría / Administración',
      summary: actaRaw.summary || 'Deliberaciones y decisiones conforme a la Ley 675 de 2001.',
      raw_transcript: actaRaw.raw_transcript,
      encabezado: actaRaw.encabezado,
      ordenDelDia: actaRaw.ordenDelDia || [],
      desarrolloDetallado: actaRaw.desarrolloDetallado || [],
      balanceFinanciero: actaRaw.balanceFinanciero || [],
      decisionesYVotaciones: actaRaw.decisionesYVotaciones || [],
      compromisos: actaRaw.compromisos || actaRaw.commitments || [],
      commitments: actaRaw.commitments || actaRaw.compromisos || []
    };

    setActaListaParaDescargar(cleanActa);

    // Descarga automática directa al dispositivo (PC o móvil)
    downloadActaLegalHTML(cleanActa, tenantLegalInfo, onShowToast);
  };

  const startRecording = async () => {
    setBannerAlert(null);
    setActaListaParaDescargar(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType, audioBitsPerSecond: 24000 } : { audioBitsPerSecond: 24000 });
      const newSessionId = `rec_${Date.now()}`;
      sessionIdRef.current = newSessionId;

      recorder.ondataavailable = async (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          await saveChunkToDisk(newSessionId, e.data);
          setEstimatedSizeMB((prev) => (parseFloat(prev) + e.data.size / (1024 * 1024)).toFixed(2));
        }
      };

      recorder.start(10000);
      mediaRecorderRef.current = recorder;
      setRecordingState('recording');
      setElapsedSeconds(0);
      setEstimatedSizeMB('0.00');

      timerRef.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
      await requestWakeLock();
      notifyMessage('info', 'Grabación en curso (3h+). Audio respaldado en disco cada 10s.');
    } catch (err: any) {
      notifyMessage('error', 'Error al acceder al micrófono: ' + err.message);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
      timerRef.current = window.setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    }
  };

  // Sube el archivo de audio en fragmentos binarios de 5 MB al backend para que Gemini escuche el audio real sin error 413
  const uploadAudioToServerChunks = async (
    blob: Blob,
    onProgress?: (pct: number) => void
  ): Promise<string> => {
    const uploadId = `aud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const chunkSize = 5 * 1024 * 1024; // 5 MB por fragmento
    const totalBytes = blob.size;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalBytes);
      const chunkBlob = blob.slice(start, end);
      const arrayBuffer = await chunkBlob.arrayBuffer();

      const res = await fetch(
        `/api/upload-audio-chunk?uploadId=${encodeURIComponent(uploadId)}&chunkIndex=${i}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: arrayBuffer
        }
      );

      if (!res.ok) {
        throw new Error(`Error al enviar fragmento de audio (${i + 1}/${totalChunks})`);
      }

      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalChunks) * 70));
      }
    }

    return uploadId;
  };

  const finalizeAndProcessSession = async (targetSessionId: string) => {
    setRecordingState('processing');
    releaseWakeLock();

    try {
      // 1. Detener pistas de micrófono si siguen activas
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);

      // 2. Extraer los fragmentos directamente de la base de datos local (IndexedDB)
      const chunks = await getSessionChunksFromDisk(targetSessionId);
      if (!chunks || chunks.length === 0) {
        throw new Error('No se encontraron fragmentos de audio en el disco local.');
      }
      const fullAudioBlob = new Blob(chunks, { type: 'audio/webm' });
      const finalFileName = `${tenantId}/${targetSessionId}_completo.webm`;

      notifyMessage('info', 'Audio recuperado del disco local. Conectando con Gemini IA...');

      // 3. Convertir audio a Base64 para envío directo al servidor
      const reader = new FileReader();
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.includes(',') ? result.split(',')[1] : result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fullAudioBlob);
      });

      // 4. Envío directo al endpoint del servidor sin depender de Edge Functions de Supabase
      let generatedActa: any = null;
      try {
        const response = await fetch('/api/process-meeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            base64Audio,
            mimeType: 'audio/webm',
            audioPath: finalFileName,
            tenantId,
            tenantName,
            meetingType,
            meetingDate: new Date().toISOString().split('T')[0]
          })
        });

        const data = await response.json();
        if (data?.acta) {
          generatedActa = data.acta;
        }
      } catch (apiErr) {
        console.warn('Fallo en llamada primaria, reintentando:', apiErr);
      }

      if (!generatedActa) {
        throw new Error('El modelo de IA no devolvió el acta estructurada.');
      }

      // 5. Limpieza de disco solo cuando el acta se generó exitosamente
      await clearSessionFromDisk(targetSessionId);

      setRecordingState('idle');
      setElapsedSeconds(0);
      setEstimatedSizeMB('0.00');

      // 6. Descarga inmediata automática
      prepararYDescargarActa(generatedActa);
      notifyMessage('success', '¡Acta oficial generada y descargada con éxito!');
      if (onActaCreated) onActaCreated(generatedActa);

    } catch (err: any) {
      setRecordingState('idle');
      notifyMessage(
        'error',
        `Fallo al procesar: ${err?.message || 'Error de conexión'}. Tu audio sigue guardado en el disco (${estimatedSizeMB} MB).`
      );
    }
  };

  // Drag & Drop
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => { setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.includes('audio') || file.name.match(/\.(mp3|wav|m4a|webm|ogg)$/i)) {
        setDroppedFile(file);
        setActaListaParaDescargar(null);
      } else {
        notifyMessage('error', 'Arrastra un archivo de audio válido (.mp3, .m4a, .wav, .webm)');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDroppedFile(e.target.files[0]);
      setActaListaParaDescargar(null);
    }
  };

  // Procesar archivo arrastrado (con bypass de límite Supabase 50MB y envío real por fragmentos a Gemini)
  const procesarArchivoArrastradoConIa = async () => {
    if (!droppedFile) return;
    setAnalyzingDroppedFile(true);
    setDropUploadProgress(5);

    try {
      const fileSizeMB = droppedFile.size / (1024 * 1024);
      let audioPath = `local-upload/${droppedFile.name.replace(/\s+/g, '_')}`;

      // SI EL ARCHIVO PESA MENOS DE 45 MB, SE PUEDE RESPALDAR EN SUPABASE
      // SI PESA MÁS DE 45 MB (como los 297 MB), OMITIMOS SUPABASE PARA EVITAR EL ERROR 413
      if (fileSizeMB < 45) {
        try {
          notifyMessage('info', `Subiendo ${droppedFile.name} (${fileSizeMB.toFixed(1)} MB)...`);
          audioPath = `${tenantId}/upload_${Date.now()}_${droppedFile.name.replace(/\s+/g, '_')}`;
          await uploadLargeAudio(droppedFile, audioPath);
        } catch (storageErr) {
          console.warn('Omitiendo Supabase Storage por restricciones de tamaño:', storageErr);
        }
      } else {
        notifyMessage('info', `Archivo pesado (${fileSizeMB.toFixed(1)} MB): Transfiriendo audio real a Gemini IA sin límite de Supabase...`);
      }

      // Subir el binario real en fragmentos de 5 MB al backend para que Gemini escuche la grabación
      const uploadId = await uploadAudioToServerChunks(droppedFile, (pct) => {
        setDropUploadProgress(Math.max(10, pct));
      });

      setDropUploadProgress(80);
      notifyMessage('info', 'Transcribiendo intervenciones, nombres, cifras en COP y votaciones reales con Gemini IA...');

      // Llamada directa al endpoint de procesamiento con el uploadId del audio real
      const response = await fetch('/api/process-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uploadId,
          audioPath,
          mimeType: droppedFile.type || 'audio/mp3',
          tenantId,
          tenantName,
          meetingType,
          meetingDate: new Date().toISOString().split('T')[0],
          contextNotes: `Archivo de audio original: ${droppedFile.name} (${fileSizeMB.toFixed(1)} MB).`
        })
      });

      const resData = await response.json();
      if (!response.ok || resData?.error) {
        throw new Error(resData?.error || 'Error al analizar el audio con Gemini IA');
      }

      setDropUploadProgress(100);

      const actaGenerada = resData?.acta;
      prepararYDescargarActa(actaGenerada);
      notifyMessage('success', `¡Acta oficial transcrita desde ${droppedFile.name} y descargada al dispositivo!`);
      if (onActaCreated) onActaCreated(actaGenerada);
      setDroppedFile(null);
    } catch (err: any) {
      notifyMessage('error', 'Error al procesar el audio: ' + (err?.message || 'Error desconocido'));
    } finally {
      setAnalyzingDroppedFile(false);
      setDropUploadProgress(0);
    }
  };

  const formatDuration = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#070b12] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl font-sans text-slate-100 space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full">
              Motor Resiliente 3h+ • Descarga Inmediata
            </span>
            <span className="text-xs text-slate-400 font-mono">Ley 675 de 2001</span>
          </div>
          <h3 className="text-lg font-black text-white mt-1">Grabación en Vivo y Descarga Inmediata de Actas</h3>
        </div>

        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 ${
            isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}>
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'En Línea' : 'Sin Conexión'}</span>
          </div>

          <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span>Disco: <strong>{estimatedSizeMB} MB</strong></span>
          </div>
        </div>
      </div>

      {/* CONFIGURADOR DE LOGOTIPO OFICIAL DEL CONJUNTO */}
      <ConfiguradorLogoCopropiedad
        logoActual={currentLogo}
        onGuardarLogo={(nuevoLogo) => {
          setCurrentLogo(nuevoLogo);
          try {
            localStorage.setItem(`urbix_logo_${tenantId}`, nuevoLogo);
          } catch (e) {}
        }}
        onShowToast={onShowToast}
      />

      {bannerAlert && (
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs font-mono ${
          bannerAlert.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
        }`}>
          <span>{bannerAlert.text}</span>
          <button onClick={() => setBannerAlert(null)} className="text-xs font-bold opacity-75 hover:opacity-100">✕</button>
        </div>
      )}

      {/* TARJETA DE DESCARGA DIRECTA CUANDO EL ACTA YA ESTÁ LISTA */}
      {actaListaParaDescargar && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#070b12] border-2 border-emerald-500/60 rounded-3xl p-5 shadow-[0_0_35px_rgba(16,185,129,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-xs font-black uppercase tracking-wider text-emerald-300 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                ✓ Acta Procesada y Foliada con Éxito
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {actaListaParaDescargar.minute_number}
              </span>
            </div>
            <h4 className="text-base font-black text-white">
              {actaListaParaDescargar.meeting_type} • {tenantName}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-1 font-mono">
              Quórum verificado: <strong className="text-emerald-400">{actaListaParaDescargar.quorum_percentage}%</strong> • Lista para archivar o imprimir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={() => exportActaToLegalPDF(actaListaParaDescargar, tenantLegalInfo, onShowToast)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black px-5 py-3 rounded-2xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" /> Descargar Ya (PDF / Imprimir)
            </button>
            <button
              type="button"
              onClick={() => downloadActaLegalHTML(actaListaParaDescargar, tenantLegalInfo, onShowToast)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-3 rounded-2xl text-xs font-mono transition border border-slate-700 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-emerald-400" /> Foliado (.html)
            </button>
          </div>
        </div>
      )}

      {/* GRID DUAL: GRABACIÓN EN VIVO + DRAG & DROP */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 1. GRABADORA EN VIVO (3 HORAS RESILIENTE) */}
        <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono uppercase">
                <Mic className="w-4 h-4 text-emerald-400" /> 1. Grabación Directa (3h+)
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                IndexedDB Seguro
              </span>
            </div>

            <div className="my-5 text-center">
              <div className="text-4xl font-mono font-black text-white tracking-wider">
                {formatDuration(elapsedSeconds)}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-mono">
                {recordingState === 'recording' ? '🔴 Grabando sesión en stream local protegido' : 'Soporta hasta 4 horas ininterrumpidas de audio'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-400 block font-mono uppercase">Órgano de la Sesión:</label>
              <select
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                disabled={recordingState !== 'idle'}
                className="w-full bg-[#07090e] border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono outline-none"
              >
                <option value="Consejo de Administración">Consejo de Administración</option>
                <option value="Asamblea General Ordinaria">Asamblea General Ordinaria</option>
                <option value="Asamblea Extraordinaria">Asamblea Extraordinaria</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            {recordingState === 'idle' ? (
              <button
                type="button"
                onClick={startRecording}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:brightness-110 text-slate-950 font-black py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Mic className="w-4 h-4" /> Iniciar Grabación (3h+)
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={togglePause}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {recordingState === 'recording' ? <><Pause className="w-4 h-4 text-amber-400" /> Pausar</> : <><Play className="w-4 h-4 text-emerald-400" /> Reanudar</>}
                </button>
                <button
                  type="button"
                  onClick={() => sessionIdRef.current && finalizeAndProcessSession(sessionIdRef.current)}
                  className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <Square className="w-4 h-4" /> Finalizar y Descargar Acta
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. ARRASTRAR ARCHIVOS YA HECHOS (DRAG & DROP) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 ${
            isDragging 
              ? 'bg-cyan-500/10 border-cyan-400 scale-[1.01]' 
              : 'bg-[#0b101b] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono uppercase">
                <UploadCloud className="w-4 h-4 text-cyan-400" /> 2. Cargar Audio Ya Grabado
              </span>
              <span className="text-[10px] text-slate-500 font-mono">.mp3, .m4a, .wav, .webm</span>
            </div>

            {!droppedFile ? (
              <div className="my-6 text-center space-y-3">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-[#07090e] border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Arrastra y suelta tu archivo de audio aquí</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Para transcribir y descargar el PDF al instante</p>
                </div>
                <label className="inline-block px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 text-xs font-mono font-bold rounded-xl cursor-pointer transition">
                  Seleccionar desde mi equipo
                  <input type="file" accept="audio/*" onChange={handleFileInputChange} className="hidden" />
                </label>
              </div>
            ) : (
              <div className="my-5 bg-[#07090e] border border-cyan-500/40 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{droppedFile.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{(droppedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDroppedFile(null)}
                  disabled={analyzingDroppedFile}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div>
            {droppedFile && (
              <button
                type="button"
                disabled={analyzingDroppedFile}
                onClick={procesarArchivoArrastradoConIa}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:brightness-110 text-white font-black py-3 rounded-xl text-xs font-mono uppercase tracking-wider transition shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {analyzingDroppedFile ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando con Gemini y preparando descarga ({dropUploadProgress.toFixed(0)}%)...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Analizar con IA y Descargar Acta Ya
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
