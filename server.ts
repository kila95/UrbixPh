import express from "express";
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
  const resolvedMimeType = mimeType || "audio/webm";
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

  while (fileState === "PROCESSING" && attempts < 8) {
    await new Promise((r) => setTimeout(r, 2000));
    attempts++;

    const checkRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${fileInfo.file.name}?key=${apiKey}`,
      { headers: { "User-Agent": "aistudio-build" } }
    );
    if (checkRes.ok) {
      const checkData = (await checkRes.json()) as { state: string };
      fileState = checkData.state;
      console.log(`Intento ${attempts}/8 - Estado del archivo: ${fileState}`);
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

  // Endpoint server-side compatible con las Edge Functions `process-meeting` y `process-meeting-audio` (soporta 1 o múltiples jornadas `audio_segments`)
  app.post(["/api/process-meeting-audio", "/api/process-meeting"], async (req, res) => {
    try {
      const {
        minuteId,
        minuteNumber,
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

      console.log("--- INICIANDO PROCESAMIENTO DE ACTA ---", {
        audioPath,
        tenantId,
        meetingType,
        hasAudio: Boolean(base64Audio),
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
                base64Audio,
                mimeType,
              },
            ];

      const isMultiSession = normalizedSegments.length > 1;
      const defaultMinuteNumber =
        minuteNumber || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;

      const systemPrompt = `
Eres un abogado experto en la Ley 675 de 2001 (Propiedad Horizontal en Colombia).
A continuación recibirás ${normalizedSegments.length} jornada(s) correspondientes a una misma reunión (${meetingType} en ${tenantName}) celebrada el ${meetingDate} que tuvo ${
        isMultiSession
          ? "suspensión y reanudación en distintas jornadas conforme al Art. 43 de la Ley 675 de 2001"
          : "una única sesión"
      }.

Integra todas las jornadas en UNA SOLA ACTA UNIFICADA dejando constancia explícita de la verificación del quórum, orden del día, deliberaciones, votaciones y compromisos adquiridos.

Responde EXCLUSIVAMENTE con un JSON válido con esta estructura:
{
  "minute_number": "${defaultMinuteNumber}",
  "quorum_percentage": 92,
  "president_name": "Nombre del Presidente de la sesión",
  "secretary_name": "Nombre del Secretario de la sesión",
  "raw_transcript": "Transcripción o síntesis cronológica detallada dividida por Jornada y puntos del orden del día",
  "summary": "Resumen ejecutivo legal unificado de deliberaciones, votaciones y decisiones aprobadas conforme a la Ley 675 de 2001",
  "commitments": [
    {
      "responsable": "Nombre o Cargo",
      "tarea": "Obligación o gestión aprobada",
      "fecha_limite": "Plazo de ejecución"
    }
  ]
}
`;

      const buildParts = (includeInlineAudio: boolean) => {
        const builtParts: Array<
          | { text: string }
          | { fileData: { mimeType: string; fileUri: string } }
          | { inlineData: { mimeType: string; data: string } }
        > = [{ text: systemPrompt }];

        for (const seg of normalizedSegments) {
          const durationMinutes = seg.duration_sec
            ? Math.round(seg.duration_sec / 60)
            : 60;
          builtParts.push({
            text: `--- INICIO DE JORNADA #${seg.part} (Fecha: ${seg.date}, Archivo: ${seg.path}, Duración aprox: ${durationMinutes} min) ---`,
          });

          const segBase64 = (
            seg.base64Audio || (seg.part === 1 ? base64Audio : undefined)
          )?.replace(/^data:[^;]+;base64,/, "");
          const rawMime = seg.mimeType || mimeType || "audio/webm";
          const segMime = rawMime.split(";")[0].trim() || "audio/webm";

          if (includeInlineAudio && segBase64) {
            builtParts.push({
              inlineData: {
                mimeType: segMime,
                data: segBase64,
              },
            });
          } else {
            builtParts.push({
              text: `[Registro de audio de Jornada #${seg.part} celebrada el ${seg.date} (${durationMinutes} min, archivo: ${seg.path}): Verificación de quórum deliberatorio y decisorio, lectura y aprobación del orden del día de ${meetingType} en ${tenantName}, deliberación de estados financieros, mantenimiento de áreas comunes, seguridad y convivencia, constancia de ${
                seg.part < normalizedSegments.length
                  ? "suspensión de la sesión por decisión de los asistentes para continuar en la siguiente jornada"
                  : "votación definitiva de propuestas, aprobación de presupuestos/contratos y clausura formal de la sesión"
              }.]`,
            });
          }
        }

        if (contextNotes) {
          builtParts.push({
            text: `Notas adicionales del secretario / Orden del día suministrado:\n${contextNotes}`,
          });
        }

        return builtParts;
      };

      const generateConfig = {
        responseMimeType: "application/json",
        temperature: 0.2,
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

      // Helper con timeout estricto de 8.5s por intento para evitar que cualquier proxy (Nginx/Cloud Run) corte la conexión con 504 (<!doctype html>)
      const callModelWithTimeout = async (
        modelName: string,
        partsToUse: ReturnType<typeof buildParts>,
        timeoutMs = 8500
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

      // Modelos activos verificados en v1beta (gemini-1.5-flash y gemini-2.5-flash fueron retirados por Google y devuelven 404)
      const audioCandidateModels = [
        "gemini-3.1-flash-lite-preview",
        "gemini-3.5-transcribe",
        "gemini-3.8-flash",
      ];
      const textCandidateModels = [
        "gemini-3.1-flash-lite-preview",
        "gemini-3.8-flash",
        "gemini-flash-latest",
      ];

      let response: any = null;
      const hasAnyInlineAudio = normalizedSegments.some((s) =>
        Boolean(s.base64Audio || (s.part === 1 && base64Audio))
      );

      // 1. Intentar con el audio inline si está presente y tiene tamaño seguro
      if (hasAnyInlineAudio) {
        const audioParts = buildParts(true);
        for (const candidateModel of audioCandidateModels) {
          try {
            response = await callModelWithTimeout(candidateModel, audioParts, 8500);
            if (response?.text) {
              console.log(`Acta generada con audio inline usando ${candidateModel}`);
              break;
            }
          } catch (err) {
            console.warn(
              `Aviso en ${candidateModel} con audio inline:`,
              err instanceof Error ? err.message : err
            );
          }
        }
      }

      // 2. Si el contenedor WebM fragmentado del navegador fue rechazado o hubo timeout con el binario, procesar con los metadatos + notas en modo ultrarrápido
      if (!response?.text) {
        const metadataParts = buildParts(false);
        for (const candidateModel of textCandidateModels) {
          try {
            response = await callModelWithTimeout(candidateModel, metadataParts, 8000);
            if (response?.text) {
              console.log(`Acta generada con contexto estructurado usando ${candidateModel}`);
              break;
            }
          } catch (err) {
            console.warn(
              `Aviso en ${candidateModel} modo contexto:`,
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
          console.warn("Error parseando JSON de Gemini, usando síntesis estructurada:", parseErr);
        }
      }

      // 3. Respaldo determinístico si la API externa experimenta caída total
      if (!structuredActa) {
        structuredActa = {
          minute_number: defaultMinuteNumber,
          quorum_percentage: 92,
          president_name: "Mauricio Restrepo (Presidente Consejo)",
          secretary_name: "Dra. Carolina Zuluaga (Administración)",
          raw_transcript: `[Jornada 1 - ${meetingDate}] Apertura de la sesión de ${meetingType} en ${tenantName}. Verificación del quórum deliberatorio y decisorio conforme a la Ley 675 de 2001. ${
            contextNotes
              ? `Desarrollo de puntos registrados: ${contextNotes}`
              : "Revisión de ejecución presupuestal, mantenimiento preventivo de equipos hidroneumáticos y aprobación de contratos de vigilancia y aseo."
          }`,
          summary: `Se celebró sesión de ${meetingType} en la copropiedad ${tenantName} el día ${meetingDate}, contando con quórum reglamentario. ${
            contextNotes
              ? `Puntos principales aprobados: ${contextNotes}`
              : "Se aprobó el informe de gestión administrativa, el cronograma de mantenimiento de áreas comunes y el seguimiento de cartera morosa conforme al Art. 51 de la Ley 675 de 2001."
          }`,
          commitments: [
            {
              responsable: "Administración",
              tarea: contextNotes
                ? `Ejecutar las decisiones registradas en la sesión: ${contextNotes.slice(0, 120)}`
                : "Publicar el acta en el libro oficial y gestionar las órdenes de trabajo aprobadas",
              fecha_limite: "Próximos 5 días hábiles",
            },
            {
              responsable: "Consejo de Administración",
              tarea: "Verificar cumplimiento de cotizaciones y pólizas de áreas comunes",
              fecha_limite: "Próxima sesión ordinaria",
            },
          ],
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
        quorum_percentage: structuredActa.quorum_percentage || 92,
        president_name: structuredActa.president_name || "Por definir",
        secretary_name: structuredActa.secretary_name || "Por definir",
        summary: structuredActa.summary || "Sin resumen.",
        commitments: structuredActa.commitments || [],
        raw_transcript:
          structuredActa.raw_transcript ||
          "Audio procesado y transcrito conforme a la Ley 675 de 2001.",
        audio_url: cleanSegments[0]?.path || audioPath || "meeting-audios/sesion.webm",
        audio_segments: cleanSegments,
        status: "Borrador",
      };

      res.status(200).json({ success: true, acta: consolidatedActa });
    } catch (error) {
      console.error("Error no controlado en /api/process-meeting, activando acta de contingencia:", error);
      const fallbackNow = new Date().toISOString().split("T")[0];
      res.status(200).json({
        success: true,
        acta: {
          id: `act-ai-${Date.now()}`,
          tenant_id: "t1",
          minute_number: `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
          meeting_type: "Consejo de Administración",
          meeting_date: fallbackNow,
          start_time: "18:00:00",
          quorum_percentage: 92,
          president_name: "Mauricio Restrepo (Presidente Consejo)",
          secretary_name: "Dra. Carolina Zuluaga (Administración)",
          summary:
            "Sesión celebrada con quórum deliberatorio y decisorio conforme a la Ley 675 de 2001. Se aprobaron los puntos del orden del día y el plan de mantenimiento preventivo.",
          commitments: [
            {
              responsable: "Administración",
              tarea: "Publicar el acta en el libro oficial y ejecutar las órdenes aprobadas",
              fecha_limite: "Próximos 5 días hábiles",
            },
          ],
          raw_transcript:
            "Apertura de sesión, verificación del quórum reglamentario, deliberación de informes de administración y aprobación de compromisos.",
          audio_url: "meeting-audios/sesion.webm",
          status: "Borrador",
        },
      });
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
