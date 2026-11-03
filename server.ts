import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { URBIX_COPILOT_SYSTEM_PROMPT } from "./src/urbixCopilotPrompt";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadBufferToGeminiFilesApi(
  audioBuffer: Buffer,
  mimeType: string,
  displayName: string,
  apiKey: string
): Promise<{ fileUri: string; googleFileName: string; mimeType: string } | null> {
  const resolvedMimeType = (mimeType || "audio/webm").split(";")[0].trim() || "audio/webm";
  const contentLength = String(audioBuffer.byteLength);

  const initUploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`;
  const initRes = await fetch(initUploadUrl, {
    method: "POST",
    headers: {
      "User-Agent": "aistudio-build",
      "X-Goog-Upload-Protocol": "resumable",
      "X-Goog-Upload-Command": "start",
      "X-Goog-Upload-Header-Content-Length": contentLength,
      "X-Goog-Upload-Header-Content-Type": resolvedMimeType,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file: {
        display_name: displayName,
        mime_type: resolvedMimeType,
      },
    }),
  });

  const uploadSessionUrl = initRes.headers.get("X-Goog-Upload-URL");
  if (!initRes.ok || !uploadSessionUrl) return null;

  const uploadRes = await fetch(uploadSessionUrl, {
    method: "PUT",
    headers: {
      "User-Agent": "aistudio-build",
      "Content-Length": contentLength,
      "X-Goog-Upload-Offset": "0",
      "X-Goog-Upload-Command": "upload, finalize",
    },
    body: new Uint8Array(audioBuffer),
  });

  if (!uploadRes.ok) return null;

  const fileInfo = (await uploadRes.json()) as {
    file: { uri: string; name: string; state: string };
  };

  let fileState = fileInfo.file.state;
  let attempts = 0;

  while (fileState === "PROCESSING" && attempts < 25) {
    await new Promise((r) => setTimeout(r, 1500));
    attempts++;

    const checkRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileInfo.file.name}?key=${apiKey}`,
      { headers: { "User-Agent": "aistudio-build" } }
    );
    if (checkRes.ok) {
      const checkData = (await checkRes.json()) as { state: string };
      fileState = checkData.state;
      console.log(`Intento ${attempts}/25 - Estado del archivo en Gemini Files API: ${fileState}`);
    }
  }

  if (fileState === "FAILED" || fileState !== "ACTIVE") {
    return null;
  }

  return {
    fileUri: fileInfo.file.uri,
    googleFileName: fileInfo.file.name,
    mimeType: resolvedMimeType,
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint de subida por fragmentos binarios (evita límite 413 en proxies y soporta archivos grandes)
  app.post(
    "/api/upload-audio-chunk",
    express.raw({ type: "application/octet-stream", limit: "15mb" }),
    (req, res) => {
      try {
        const uploadId = String(req.query.uploadId || "").replace(/[^a-zA-Z0-9_-]/g, "");
        const chunkIndex = Number(req.query.chunkIndex || 0);
        if (!uploadId || !Buffer.isBuffer(req.body)) {
          res.status(400).json({ error: "Parámetros de fragmento inválidos" });
          return;
        }
        const tempFilePath = path.join(os.tmpdir(), `urbix_audio_${uploadId}.bin`);
        if (chunkIndex === 0 && fs.existsSync(tempFilePath)) {
          fs.unlinkSync(tempFilePath);
        }
        fs.appendFileSync(tempFilePath, req.body);
        res.json({ ok: true, uploadId, chunkIndex, receivedBytes: req.body.byteLength });
      } catch (err: any) {
        res.status(500).json({ error: err?.message || "Error al guardar fragmento de audio" });
      }
    }
  );

  // Permitir payloads de audio en Base64 de hasta 50 MB
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Middleware para garantizar que cualquier error de body-parser (ej. PayloadTooLarge) devuelva JSON y nunca <!DOCTYPE html>
  app.use(
    (
      err: Error & { status?: number; type?: string },
      _req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      if (err) {
        res.status(err.status || 400).json({
          error: `Error al recibir los datos de audio: ${err.message || "Payload inválido"}`,
        });
        return;
      }
      next();
    }
  );

  // Bus de señalización en tiempo real en memoria (SSE + POST) para respaldar WebRTC multi-participante, control de palabra y Citofonía entre dispositivos
  const asambleaSseClients = new Set<express.Response>();
  let ultimaConvocatoriaCache: any = null;
  let ultimoControlPalabraCache: any = null;
  let llamadaCitofonoActivaCache: { payload: any; timestamp: number } | null = null;
  const participantesActivosCache = new Map<string, any>();

  app.get("/api/asamblea-events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    asambleaSseClients.add(res);

    // Si hay una convocatoria o estado de palabra activo, sincronizar al recién conectado
    if (ultimaConvocatoriaCache) {
      res.write(`data: ${JSON.stringify({ event: "asamblea_convocatoria_abierta", payload: ultimaConvocatoriaCache })}\n\n`);
    }
    if (ultimoControlPalabraCache) {
      res.write(`data: ${JSON.stringify({ event: "asamblea_control_palabra", payload: ultimoControlPalabraCache })}\n\n`);
    }
    // Si hay una llamada de citófono timbrando (menor a 90s), notificar de inmediato al vigilante o residente recién conectado
    if (llamadaCitofonoActivaCache && Date.now() - llamadaCitofonoActivaCache.timestamp < 90000) {
      res.write(`data: ${JSON.stringify({ event: "solicitar_llamada", payload: llamadaCitofonoActivaCache.payload })}\n\n`);
    }
    for (const partPayload of participantesActivosCache.values()) {
      res.write(`data: ${JSON.stringify({ event: "participante_listo", payload: partPayload })}\n\n`);
    }

    const keepAlive = setInterval(() => {
      try {
        res.write(`: ping\n\n`);
      } catch {
        clearInterval(keepAlive);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(keepAlive);
      asambleaSseClients.delete(res);
    });
  });

  app.post("/api/asamblea-signal", (req, res) => {
    const { event, payload } = req.body || {};
    if (!event) {
      res.status(400).json({ error: "Falta event" });
      return;
    }

    if (event === "asamblea_convocatoria_abierta") {
      ultimaConvocatoriaCache = payload;
    } else if (event === "asamblea_cerrada") {
      ultimaConvocatoriaCache = null;
      ultimoControlPalabraCache = null;
      participantesActivosCache.clear();
    } else if (event === "asamblea_control_palabra") {
      ultimoControlPalabraCache = payload;
    } else if (event === "solicitar_llamada") {
      llamadaCitofonoActivaCache = { payload, timestamp: Date.now() };
    } else if (event === "webrtc_answer" || event === "terminar_llamada") {
      llamadaCitofonoActivaCache = null;
    } else if (event === "participante_listo" && payload?.peerId) {
      participantesActivosCache.set(payload.peerId, payload);
    } else if (event === "asamblea_unidad_actualizada" && payload?.peerId) {
      const prev = participantesActivosCache.get(payload.peerId);
      if (prev) {
        participantesActivosCache.set(payload.peerId, {
          ...prev,
          unidad: payload.unidad || prev.unidad,
          etiqueta: payload.etiqueta || payload.unidad || prev.etiqueta
        });
      }
    } else if (event === "asamblea_peer_salio" && payload?.peerId) {
      participantesActivosCache.delete(payload.peerId);
    }

    const packet = `data: ${JSON.stringify({ event, payload })}\n\n`;
    for (const client of asambleaSseClients) {
      try {
        client.write(packet);
      } catch {
        asambleaSseClients.delete(client);
      }
    }

    res.json({ ok: true, peers: asambleaSseClients.size });
  });

  // Endpoint server-side compatible con las Edge Functions `process-meeting` y `process-meeting-audio` (soporta 1 o múltiples jornadas `audio_segments`)
  app.post(["/api/process-meeting-audio", "/api/process-meeting"], async (req, res) => {
    let tempUploadedFilePath: string | null = null;
    try {
      const {
        minuteId,
        minuteNumber,
        uploadId,
        base64Audio,
        mimeType = "audio/webm",
        audioPath,
        audioSegments,
        tenantId = "t1",
        tenantName = "Reserva del Tesoro",
        meetingType = "Consejo de Administración",
        meetingDate = new Date().toISOString().split("T")[0],
        contextNotes = "",
      } = req.body || {};

      const safeUploadId = uploadId ? String(uploadId).replace(/[^a-zA-Z0-9_-]/g, "") : "";
      if (safeUploadId) {
        const candidatePath = path.join(os.tmpdir(), `urbix_audio_${safeUploadId}.bin`);
        if (fs.existsSync(candidatePath)) {
          tempUploadedFilePath = candidatePath;
        }
      }

      console.log("--- INICIANDO PROCESAMIENTO DE ACTA ---", {
        audioPath,
        tenantId,
        meetingType,
        hasBase64Audio: Boolean(base64Audio),
        hasChunkedUpload: Boolean(tempUploadedFilePath),
      });

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "No se ha configurado la variable GEMINI_API_KEY en el servidor.",
        });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Si el cliente subió el audio por fragmentos (/api/upload-audio-chunk), lo leemos del disco temporal
      let uploadedBuffer: Buffer | null = null;
      let geminiUploadedFile: { fileUri: string; googleFileName: string; mimeType: string } | null = null;

      if (tempUploadedFilePath) {
        uploadedBuffer = fs.readFileSync(tempUploadedFilePath);
        const cleanMime = (mimeType || "audio/mp3").split(";")[0].trim() || "audio/mp3";
        // Si el archivo supera 12 MB, usamos Gemini Resumable Files API para máxima fidelidad
        if (uploadedBuffer.byteLength > 12 * 1024 * 1024) {
          try {
            geminiUploadedFile = await uploadBufferToGeminiFilesApi(
              uploadedBuffer,
              cleanMime,
              audioPath || `sesion_${Date.now()}`,
              apiKey
            );
          } catch (uploadErr) {
            console.warn("Aviso al subir a Gemini Files API, usando fragmento inline:", uploadErr);
          }
        }
      }

      const effectiveBase64Audio =
        base64Audio ||
        (!geminiUploadedFile && uploadedBuffer
          ? uploadedBuffer.subarray(0, Math.min(uploadedBuffer.byteLength, 14 * 1024 * 1024)).toString("base64")
          : undefined);

      const normalizedSegments: Array<{
        part: number;
        date: string;
        path: string;
        duration_sec?: number;
        base64Audio?: string;
        mimeType?: string;
      }> =
        Array.isArray(audioSegments) && audioSegments.length > 0
          ? audioSegments
          : [
              {
                part: 1,
                date: meetingDate,
                path: audioPath || `${tenantId}/acta_${Date.now()}_part1.webm`,
                duration_sec: 3600,
                base64Audio: effectiveBase64Audio,
                mimeType,
              },
            ];

      const defaultMinuteNumber =
        minuteNumber || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;

      const systemPrompt = `
Eres un secretario jurídico experto en la Ley 675 de 2001 (Propiedad Horizontal en Colombia).
Tu tarea es redactar el ACTA OFICIAL basándote EXCLUSIVAMENTE en las intervenciones, debates, nombres, cifras en pesos colombianos y votaciones REALES que escuches en el audio adjunto.

REGLAS OBLIGATORIAS DE REDACCIÓN:
1. CERO PLANTILLAS PREDEFINIDAS: Queda estrictamente prohibido usar textos genéricos como "mantenimiento general de áreas comunes" o "revisión de estados financieros" a menos que hayan sido discutidos explícitamente en la reunión.
2. FIDELIDAD NOMINAL Y ECONÓMICA: Extrae los nombres reales de los participantes, valores exactos en COP debatidos, cotizaciones mencionadas y resoluciones votadas.
3. CONSIGNACIÓN DE INTERVENCIONES: Detalla quién tomó la palabra, objeciones presentadas y sentido de los votos (nominal o por coeficiente).
4. SI UN DATO NO FUE MENCIONADO: Indica "No se debatió en la sesión" en lugar de inventar acuerdos.
`;

      const buildParts = (includeInlineAudio: boolean) => {
        const builtParts: Array<
          | { text: string }
          | { fileData: { mimeType: string; fileUri: string } }
          | { inlineData: { mimeType: string; data: string } }
        > = [
          {
            text: `${systemPrompt}\n\nDatos de encabezado de la sesión: Órgano: ${meetingType} | Copropiedad: ${tenantName} | Fecha: ${meetingDate} | Número de Acta sugerido: ${defaultMinuteNumber}.`,
          },
        ];

        for (const seg of normalizedSegments) {
          builtParts.push({
            text: `--- JORNADA #${seg.part} (Fecha: ${seg.date}, Archivo: ${seg.path}) ---`,
          });

          const segBase64 = (
            seg.base64Audio || (seg.part === 1 ? effectiveBase64Audio : undefined)
          )?.replace(/^data:[^;]+;base64,/, "");
          const rawMime = seg.mimeType || mimeType || "audio/webm";
          const segMime = rawMime.split(";")[0].trim() || "audio/webm";

          if (includeInlineAudio && geminiUploadedFile && seg.part === 1) {
            builtParts.push({
              fileData: {
                mimeType: geminiUploadedFile.mimeType,
                fileUri: geminiUploadedFile.fileUri,
              },
            });
          } else if (includeInlineAudio && segBase64) {
            builtParts.push({
              inlineData: {
                mimeType: segMime,
                data: segBase64,
              },
            });
          } else {
            builtParts.push({
              text: `[Sin audio binario adjunto para la Jornada #${seg.part} (${seg.path}). Basarse únicamente en las notas suministradas e indicar "No se debatió en la sesión" para cualquier dato no mencionado.]`,
            });
          }
        }

        if (contextNotes) {
          builtParts.push({
            text: `Notas adicionales del secretario / Contexto del archivo:\n${contextNotes}`,
          });
        }

        return builtParts;
      };

      const generateConfig = {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            minute_number: { type: Type.STRING },
            quorum_percentage: { type: Type.NUMBER },
            president_name: { type: Type.STRING },
            secretary_name: { type: Type.STRING },
            raw_transcript: { type: Type.STRING },
            summary: { type: Type.STRING },
            commitments: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  responsable: { type: Type.STRING },
                  tarea: { type: Type.STRING },
                  fecha_limite: { type: Type.STRING },
                },
                required: ["responsable", "tarea", "fecha_limite"],
              },
            },
          },
          required: [
            "minute_number",
            "quorum_percentage",
            "president_name",
            "secretary_name",
            "raw_transcript",
            "summary",
            "commitments",
          ],
        },
      };

      const callModelWithTimeout = async (
        modelName: string,
        partsToUse: ReturnType<typeof buildParts>,
        timeoutMs = 90000
      ) => {
        return await Promise.race([
          ai.models.generateContent({
            model: modelName,
            contents: { parts: partsToUse },
            config: generateConfig,
          }),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error(`Timeout (${timeoutMs}ms) en modelo ${modelName}`)),
              timeoutMs
            )
          ),
        ]);
      };

      const audioCandidateModels = [
        "gemini-3.5-transcribe",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];
      const textCandidateModels = [
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      let response: any = null;
      const hasAnyAudio =
        Boolean(geminiUploadedFile) ||
        normalizedSegments.some((s) =>
          Boolean(s.base64Audio || (s.part === 1 && effectiveBase64Audio))
        );

      // 1. Procesar el audio real con Gemini (hasta 90s por modelo para grabaciones extensas)
      if (hasAnyAudio) {
        const audioParts = buildParts(true);
        for (const candidateModel of audioCandidateModels) {
          try {
            response = await callModelWithTimeout(candidateModel, audioParts, 90000);
            if (response?.text) {
              console.log(`Acta generada con audio real usando ${candidateModel}`);
              break;
            }
          } catch (err) {
            console.warn(
              `Aviso en ${candidateModel} con audio real:`,
              err instanceof Error ? err.message : err
            );
          }
        }
      }

      // 2. Respaldo sólo si no se envió audio o si todos los modelos de audio fallaron
      if (!response?.text) {
        const metadataParts = buildParts(false);
        for (const candidateModel of textCandidateModels) {
          try {
            response = await callModelWithTimeout(candidateModel, metadataParts, 25000);
            if (response?.text) {
              console.log(`Acta generada en modo notas usando ${candidateModel}`);
              break;
            }
          } catch (err) {
            console.warn(
              `Aviso en ${candidateModel} modo notas:`,
              err instanceof Error ? err.message : err
            );
          }
        }
      }

      let structuredActa: {
        minute_number?: string;
        quorum_percentage?: number;
        president_name?: string;
        secretary_name?: string;
        raw_transcript?: string;
        summary?: string;
        commitments?: Array<{ responsable: string; tarea: string; fecha_limite: string }>;
      } | null = null;

      if (response?.text) {
        try {
          const cleanedJson = response.text
            .replace(/^```json\s*/i, "")
            .replace(/^```\s*/i, "")
            .replace(/\s*```$/, "")
            .trim();
          const firstBrace = cleanedJson.indexOf("{");
          const lastBrace = cleanedJson.lastIndexOf("}");
          const jsonSlice =
            firstBrace !== -1 && lastBrace !== -1
              ? cleanedJson.slice(firstBrace, lastBrace + 1)
              : cleanedJson;
          structuredActa = JSON.parse(jsonSlice);
        } catch (parseErr) {
          console.warn("Error parseando JSON de Gemini:", parseErr);
        }
      }

      if (!structuredActa) {
        structuredActa = {
          minute_number: defaultMinuteNumber,
          quorum_percentage: 0,
          president_name: "No se debatió en la sesión",
          secretary_name: "No se debatió en la sesión",
          raw_transcript: contextNotes || "No se debatió en la sesión",
          summary: contextNotes || "No se debatió en la sesión",
          commitments: [],
        };
      }

      const cleanSegments = normalizedSegments.map((s) => ({
        part: s.part,
        date: s.date,
        path: s.path,
        duration_sec: s.duration_sec || 3600,
      }));

      const consolidatedActa = {
        id: minuteId || `act-ai-${Date.now()}`,
        tenant_id: tenantId,
        minute_number:
          minuteNumber ||
          structuredActa.minute_number ||
          defaultMinuteNumber,
        meeting_type: meetingType || "Consejo de Administración",
        meeting_date: cleanSegments[0]?.date || meetingDate,
        start_time: "18:00:00",
        quorum_percentage: structuredActa.quorum_percentage ?? 92,
        president_name: structuredActa.president_name || "No se debatió en la sesión",
        secretary_name: structuredActa.secretary_name || "No se debatió en la sesión",
        summary: structuredActa.summary || "No se debatió en la sesión",
        commitments: structuredActa.commitments || [],
        raw_transcript:
          structuredActa.raw_transcript ||
          "No se debatió en la sesión",
        audio_url: cleanSegments[0]?.path || audioPath || "meeting-audios/sesion.webm",
        audio_segments: cleanSegments,
        status: "Borrador",
      };

      res.status(200).json({ success: true, acta: consolidatedActa });
    } catch (error: any) {
      console.error("Error en /api/process-meeting:", error);
      res.status(500).json({
        success: false,
        error: error?.message || "Error al transcribir el audio de la sesión",
      });
    } finally {
      if (tempUploadedFilePath && fs.existsSync(tempUploadedFilePath)) {
        try {
          fs.unlinkSync(tempUploadedFilePath);
        } catch {}
      }
    }
  });

  app.post("/api/copilot-chat", async (req, res) => {
    const { prompt, residentContext, chatHistory } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "El mensaje es obligatorio." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
    }

    let userPromptWithContext = prompt;
    if (residentContext) {
      userPromptWithContext = `[DATOS EN TIEMPO REAL DEL APARTAMENTO DEL RESIDENTE CONSULTANTE]:
- Unidad / Inmueble: ${residentContext.unidad || 'Torre 2 - 301'}
- Propietario / Residente: ${residentContext.propietario || 'Esteban Ochoa'}
- Valor Cuota Ordinaria Mensual: $${Number(residentContext.cuotaMensual || 450000).toLocaleString('es-CO')} COP
- Saldo Actual Pendiente de Pago: $${Number(residentContext.saldoPendiente || 0).toLocaleString('es-CO')} COP
- Estado de Cartera: ${residentContext.estadoCartera || 'Al día'}
- Fecha Próximo Vencimiento sin Recargo: ${residentContext.proximoVencimiento || '10 del mes en curso'}
- Días antes de incurrir en mora / recargo: ${residentContext.diasParaMora ?? 9} días
${residentContext.movimientos ? `- Historial de Movimientos Recientes: ${JSON.stringify(residentContext.movimientos)}` : ''}

[PREGUNTA O REQUERIMIENTO DEL RESIDENTE]:
"${prompt}"`;
    }

    // Convertir el historial previo al formato que espera Gemini SDK
    const formattedHistory = Array.isArray(chatHistory)
      ? chatHistory.map((msg: any) => ({
          role: msg.remitente === 'usuario' || msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: String(msg.texto || msg.parts?.[0]?.text || '') }]
        })).filter(item => Boolean(item.parts[0].text && !item.parts[0].text.startsWith('⏳') && !item.parts[0].text.startsWith('💬') && !item.parts[0].text.startsWith('👋') && !item.parts[0].text.startsWith('💳') && !item.parts[0].text.startsWith('🐕') && !item.parts[0].text.startsWith('🔊') && !item.parts[0].text.startsWith('👷') && !item.parts[0].text.startsWith('📦') && !item.parts[0].text.startsWith('⚖️') && !item.parts[0].text.startsWith('💭')))
      : [];

    const contents = [
      ...formattedHistory,
      {
        role: 'user',
        parts: [{ text: userPromptWithContext }]
      }
    ];

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: contents,
        config: {
          systemInstruction: URBIX_COPILOT_SYSTEM_PROMPT,
        },
      });

      return res.json({ reply: response.text || "" });
    } catch (err: any) {
      console.error("Error en /api/copilot-chat:", err);
      return res.status(500).json({ error: err.message || "Error al procesar consulta." });
    }
  });

  app.post("/api/copilot-chat-stream", async (req, res) => {
    const { prompt, residentContext } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "El mensaje es obligatorio." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
    }

    let fullPrompt = prompt;
    if (residentContext) {
      fullPrompt = `[DATOS EN TIEMPO REAL DEL APARTAMENTO DEL RESIDENTE CONSULTANTE]:
- Unidad / Inmueble: ${residentContext.unidad || 'Torre 2 - 301'}
- Propietario / Residente: ${residentContext.propietario || 'Esteban Ochoa'}
- Valor Cuota Ordinaria Mensual: $${Number(residentContext.cuotaMensual || 450000).toLocaleString('es-CO')} COP
- Saldo Actual Pendiente de Pago: $${Number(residentContext.saldoPendiente || 0).toLocaleString('es-CO')} COP
- Estado de Cartera: ${residentContext.estadoCartera || 'Al día'}
- Fecha Próximo Vencimiento sin Recargo: ${residentContext.proximoVencimiento || '10 del mes en curso'}
- Días antes de incurrir en mora / recargo: ${residentContext.diasParaMora ?? 9} días

[PREGUNTA O REQUERIMIENTO DEL RESIDENTE]:
"${prompt}"`;
    }

    try {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3.8-flash",
        contents: fullPrompt,
        config: {
          systemInstruction: URBIX_COPILOT_SYSTEM_PROMPT,
        },
      });

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (err: any) {
      console.error("Error en /api/copilot-chat-stream:", err);
      if (!res.headersSent) {
        return res.status(500).json({ error: err.message || "Error al procesar streaming." });
      }
      res.end();
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
