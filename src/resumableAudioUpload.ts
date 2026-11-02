import * as tus from 'tus-js-client';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from './supabaseClient';

export interface UploadLargeAudioOptions {
  onProgress?: (percentage: number, bytesUploaded: number, bytesTotal: number) => void;
  bucketName?: string;
}

export interface UploadLargeAudioResult {
  data: {
    path: string;
  } | null;
  error?: Error | null;
}

/**
 * Subida resiliente de audio a Supabase Storage:
 * - Si el archivo pesa menos de 20 MB, realiza subida directa estándar.
 * - Si pesa 20 MB o más (ej. 95 MB en asambleas extensas), utiliza el protocolo TUS
 *   resumible en fragmentos de 6 MB con reintentos automáticos ante parpadeos de red móvil.
 */
export async function uploadLargeAudio(
  file: File | Blob,
  filePath: string,
  options?: UploadLargeAudioOptions
): Promise<UploadLargeAudioResult> {
  const bucketName = options?.bucketName || 'meeting-audios';
  const contentType = (file.type || 'audio/webm').split(';')[0].trim() || 'audio/webm';

  // Si no hay Supabase real configurado en entorno demo, simulamos progreso visual de fragmentos
  if (!isSupabaseConfigured) {
    if (options?.onProgress) {
      options.onProgress(35, Math.floor(file.size * 0.35), file.size);
      await new Promise((r) => setTimeout(r, 150));
      options.onProgress(75, Math.floor(file.size * 0.75), file.size);
      await new Promise((r) => setTimeout(r, 150));
      options.onProgress(100, file.size, file.size);
    }
    return { data: { path: filePath }, error: null };
  }

  // Si el audio es menor a 20 MB, subida directa normal
  if (file.size < 20 * 1024 * 1024) {
    options?.onProgress?.(25, Math.floor(file.size * 0.25), file.size);
    const result = await supabase.storage.from(bucketName).upload(filePath, file, {
      contentType,
      upsert: true
    });
    if (!result.error) {
      options?.onProgress?.(100, file.size, file.size);
    }
    return {
      data: result.data ? { path: result.data.path } : { path: filePath },
      error: result.error as Error | null
    };
  }

  // Obtener token de sesión actual si existe, o usar SUPABASE_ANON_KEY como fallback
  let bearerToken = SUPABASE_ANON_KEY;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.access_token) {
      bearerToken = sessionData.session.access_token;
    }
  } catch {
    // Fallback a SUPABASE_ANON_KEY
  }

  // Si pesa más de 20 MB (como el caso de 95 MB), subida resumible en fragmentos de 6 MB
  return new Promise((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
      retryDelays: [0, 3000, 5000, 10000, 20000], // Reintenta automáticamente si parpadea la red
      headers: {
        authorization: `Bearer ${bearerToken}`,
        'x-upsert': 'true',
      },
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      metadata: {
        bucketName,
        objectName: filePath,
        contentType,
      },
      chunkSize: 6 * 1024 * 1024, // Fragmentos pequeños de 6 MB para redes móviles
      onError: (error) => {
        console.error('Fallo definitivo:', error);
        reject(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const numPercent = bytesTotal > 0 ? Number(((bytesUploaded / bytesTotal) * 100).toFixed(1)) : 0;
        console.log(`Subiendo audio pesado: ${numPercent.toFixed(1)}%`);
        // Actualizar barra de progreso visual para el administrador
        options?.onProgress?.(numPercent, bytesUploaded, bytesTotal);
      },
      onSuccess: () => {
        console.log('Audio pesado subido con éxito por fragmentos TUS (6 MB).');
        options?.onProgress?.(100, file.size, file.size);
        resolve({ data: { path: filePath }, error: null });
      },
    });

    upload.start();
  });
}
