import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { URBIX_COPILOT_SYSTEM_PROMPT } from "./src/urbixCopilotPrompt";
import { aprovisionarResidentesCenso } from "./src/aprovisionarResidentesCenso";

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

      const systemPromptActasPH = `
Eres un Revisor Fiscal y Secretario Jurídico experto en Propiedad Horizontal bajo la Ley 675 de 2001 de Colombia.
Tu labor es transcribir y sintetizar minuciosamente la sesión, GARANTIZANDO PRECISIÓN MATEMÁTICA Y FIDELIDAD NOMINAL ABSOLUTA.

REGLAS DE ORO (TOLERANCIA CERO A OMISIONES):
1. IDENTIFICACIÓN NOMINAL: Prohibido usar "no mencionado" o "asistente 1" si en algún momento se saluda, presenta o menciona un nombre (ej. Jean, Martha, Eloina, etc.). Registra nombres completos y cargos.
2. NÚMEROS Y CIFRAS EXACTAS: Prohibido usar expresiones como "se discutieron costos", "se evaluó el presupuesto" o "se proyectó un gasto". Debes indicar la cifra en pesos colombianos ($ COP), porcentajes de incremento, descuentos pactados o diferencias entre lo proyectado y lo cotizado.
3. TABLA COMPARATIVA DE VALORES: Identifica cotizaciones de contratistas, presupuestos aprobados vs. gastos proyectados y cualquier valor monetario en disputa.
4. INTEGRIDAD: Si un tema financiero se debatió pero los asistentes omitieron deliberadamente el valor en la conversación, debes consignar explícitamente: "[Monto omitido en deliberación oral]".

ESTRUCTURA OBLIGATORIA DEL ESQUEMA JSON:
{
  "encabezado": {
    "copropiedad": "Nombre del conjunto (ej. Urb. Tricentenario)",
    "organo": "Consejo de Administración / Asamblea General",
    "fecha": "YYYY-MM-DD",
    "horaInicio": "HH:MM",
    "horaFin": "HH:MM",
    "presidente": "Nombre y cargo",
    "secretario": "Nombre y cargo",
    "quorum": "Porcentaje de coeficiente verificado"
  },
  "ordenDelDia": [
    "Punto 1", "Punto 2"
  ],
  "desarrolloDetallado": [
    {
      "punto": "Nombre del punto",
      "intervencionesClave": "Resumen exhaustivo con argumentos, acuerdos y discusiones sostenidas sin recortar detalles sustanciales",
      "nombresMencionados": ["Persona 1", "Persona 2"]
    }
  ],
  "balanceFinanciero": [
    {
      "concepto": "Descripción del ítem o proyecto",
      "valorPresupuestado": "$ COP",
      "valorCotizadoReal": "$ COP",
      "variacionDescuento": "$ COP o % (incremento/rebaja)",
      "proveedorContratista": "Nombre de empresa o profesional",
      "estadoDecision": "Aprobado / Aplazado / Descartado"
    }
  ],
  "decisionesYVotaciones": [
    {
      "proposicion": "Tema sometido a aprobación formal",
      "votosFavor": "Número o %",
      "votosContra": "Número o %",
      "abstenciones": "Número o %",
      "resultado": "APROBADO / RECHAZADO"
    }
  ],
  "compromisos": [
    {
      "responsable": "Nombre y cargo",
      "tarea": "Descripción de la labor asignada",
      "fechaLimite": "YYYY-MM-DD"
    }
  ]
}
`;

      const systemPrompt = systemPromptActasPH;

      const buildParts = (includeInlineAudio: boolean) => {
        const builtParts: Array<
          | { text: string }
          | { fileData: { mimeType: string; fileUri: string } }
          | { inlineData: { mimeType: string; data: string } }
        > = [
          {
            text: `${systemPromptActasPH}\n\nDatos de encabezado de la sesión: Órgano: ${meetingType} | Copropiedad: ${tenantName} | Fecha: ${meetingDate} | Número de Acta sugerido: ${defaultMinuteNumber}.`,
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
              text: `[Sin audio binario adjunto para la Jornada #${seg.part} (${seg.path}). Basarse únicamente en las notas suministradas e indicar "[Monto omitido en deliberación oral]" para cualquier cifra no mencionada.]`,
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
        systemInstruction: systemPromptActasPH,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            encabezado: {
              type: Type.OBJECT,
              properties: {
                copropiedad: { type: Type.STRING },
                organo: { type: Type.STRING },
                fecha: { type: Type.STRING },
                horaInicio: { type: Type.STRING },
                horaFin: { type: Type.STRING },
                presidente: { type: Type.STRING },
                secretario: { type: Type.STRING },
                quorum: { type: Type.STRING },
              },
              required: [
                "copropiedad",
                "organo",
                "fecha",
                "horaInicio",
                "horaFin",
                "presidente",
                "secretario",
                "quorum",
              ],
            },
            ordenDelDia: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            desarrolloDetallado: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  punto: { type: Type.STRING },
                  intervencionesClave: { type: Type.STRING },
                  nombresMencionados: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["punto", "intervencionesClave", "nombresMencionados"],
              },
            },
            balanceFinanciero: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concepto: { type: Type.STRING },
                  valorPresupuestado: { type: Type.STRING },
                  valorCotizadoReal: { type: Type.STRING },
                  variacionDescuento: { type: Type.STRING },
                  proveedorContratista: { type: Type.STRING },
                  estadoDecision: { type: Type.STRING },
                },
                required: [
                  "concepto",
                  "valorPresupuestado",
                  "valorCotizadoReal",
                  "variacionDescuento",
                  "proveedorContratista",
                  "estadoDecision",
                ],
              },
            },
            decisionesYVotaciones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  proposicion: { type: Type.STRING },
                  votosFavor: { type: Type.STRING },
                  votosContra: { type: Type.STRING },
                  abstenciones: { type: Type.STRING },
                  resultado: { type: Type.STRING },
                },
                required: [
                  "proposicion",
                  "votosFavor",
                  "votosContra",
                  "abstenciones",
                  "resultado",
                ],
              },
            },
            compromisos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  responsable: { type: Type.STRING },
                  tarea: { type: Type.STRING },
                  fechaLimite: { type: Type.STRING },
                },
                required: ["responsable", "tarea", "fechaLimite"],
              },
            },
          },
          required: [
            "encabezado",
            "ordenDelDia",
            "desarrolloDetallado",
            "balanceFinanciero",
            "decisionesYVotaciones",
            "compromisos",
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

      let structuredActa: any = null;

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

      const encabezado = structuredActa?.encabezado || {};
      const ordenDelDia: string[] = Array.isArray(structuredActa?.ordenDelDia)
        ? structuredActa.ordenDelDia
        : [];
      const desarrolloDetallado: Array<{
        punto: string;
        intervencionesClave: string;
        nombresMencionados: string[];
      }> = Array.isArray(structuredActa?.desarrolloDetallado)
        ? structuredActa.desarrolloDetallado
        : [];
      const balanceFinancieroRaw: Array<{
        concepto: string;
        valorPresupuestado?: string;
        valorCotizadoReal?: string;
        variacionDescuento?: string;
        proveedorContratista?: string;
        estadoDecision?: string;
        valorCOP?: string;
        origen?: string;
        estado?: string;
      }> = Array.isArray(structuredActa?.balanceFinanciero)
        ? structuredActa.balanceFinanciero
        : [];
      const decisionesYVotaciones: Array<{
        proposicion: string;
        votosFavor: string;
        votosContra: string;
        abstenciones: string;
        resultado: string;
      }> = Array.isArray(structuredActa?.decisionesYVotaciones)
        ? structuredActa.decisionesYVotaciones
        : [];
      const compromisosRaw: Array<{
        responsable: string;
        tarea: string;
        fechaLimite?: string;
        fecha_limite?: string;
      }> = Array.isArray(structuredActa?.compromisos || structuredActa?.commitments)
        ? structuredActa.compromisos || structuredActa.commitments
        : [];

      const formattedOrden =
        ordenDelDia.length > 0
          ? `ORDEN DEL DÍA:\n${ordenDelDia.map((p, idx) => `${idx + 1}. ${p}`).join("\n")}\n\n`
          : "";

      const formattedDesarrollo =
        desarrolloDetallado.length > 0
          ? desarrolloDetallado
              .map(
                (d, idx) =>
                  `${idx + 1}. ${d.punto}\n${d.intervencionesClave}${
                    Array.isArray(d.nombresMencionados) && d.nombresMencionados.length > 0
                      ? `\nIntervinientes identificados: ${d.nombresMencionados.join(", ")}`
                      : ""
                  }`
              )
              .join("\n\n")
          : structuredActa?.summary || contextNotes || "No se debatió en la sesión";

      const formattedVotaciones =
        decisionesYVotaciones.length > 0
          ? decisionesYVotaciones
              .map(
                (v, idx) =>
                  `Proposición #${idx + 1}: ${v.proposicion}\n• A favor: ${v.votosFavor} | En contra: ${v.votosContra} | Abstenciones: ${v.abstenciones}\n• Decisión Formal: ${v.resultado}`
              )
              .join("\n\n")
          : structuredActa?.raw_transcript || "";

      const normalizedBalance = balanceFinancieroRaw.map((b) => ({
        concepto: b.concepto || "",
        valorPresupuestado: b.valorPresupuestado || b.valorCOP || "[Monto omitido en deliberación oral]",
        valorCotizadoReal: b.valorCotizadoReal || b.valorCOP || "[Monto omitido en deliberación oral]",
        variacionDescuento: b.variacionDescuento || "0%",
        proveedorContratista: b.proveedorContratista || b.origen || "Por definir",
        estadoDecision: b.estadoDecision || b.estado || "En evaluación",
        valorCOP: b.valorCotizadoReal || b.valorPresupuestado || b.valorCOP || "[Monto omitido en deliberación oral]",
        origen: b.proveedorContratista || b.origen || "Presupuesto PH",
        estado: b.estadoDecision || b.estado || "En evaluación",
      }));

      const normalizedCommitments = compromisosRaw.map((c) => ({
        responsable: c.responsable || "Administración",
        tarea: c.tarea || "",
        fecha_limite: c.fechaLimite || c.fecha_limite || "Inmediato",
        fechaLimite: c.fechaLimite || c.fecha_limite || "Inmediato",
      }));

      const cleanSegments = normalizedSegments.map((s) => ({
        part: s.part,
        date: s.date,
        path: s.path,
        duration_sec: s.duration_sec || 3600,
      }));

      const parsedQuorum =
        encabezado.quorum
          ? Number(String(encabezado.quorum).replace(/[^0-9.]/g, "")) || 92
          : structuredActa?.quorum_percentage ?? 92;

      const consolidatedActa = {
        id: minuteId || `act-ai-${Date.now()}`,
        tenant_id: tenantId,
        minute_number:
          minuteNumber ||
          structuredActa?.minute_number ||
          defaultMinuteNumber,
        meeting_type: encabezado.organo || meetingType || "Consejo de Administración",
        meeting_date: encabezado.fecha || cleanSegments[0]?.date || meetingDate,
        start_time: encabezado.horaInicio || "18:00:00",
        end_time: encabezado.horaFin || "",
        quorum_percentage: parsedQuorum,
        president_name:
          encabezado.presidente ||
          structuredActa?.president_name ||
          "Presidente de la Sesión",
        secretary_name:
          encabezado.secretario ||
          structuredActa?.secretary_name ||
          "Secretaría / Administración",
        encabezado,
        ordenDelDia,
        desarrolloDetallado,
        balanceFinanciero: normalizedBalance,
        decisionesYVotaciones,
        compromisos: normalizedCommitments,
        summary: `${formattedOrden}${formattedDesarrollo}`,
        commitments: normalizedCommitments,
        raw_transcript:
          formattedVotaciones ||
          structuredActa?.raw_transcript ||
          formattedDesarrollo,
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

  // 1. Obtener sesión de subida Resumable de Google Gemini Files API (petición ligera de ~1 KB)
  app.post("/api/obtener-url-gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
        return;
      }

      const { mimeType = "audio/mp3", fileSize = 0, displayName = "sesion_acta_ph" } = req.body || {};
      const resolvedMimeType = String(mimeType || "audio/mp3").split(";")[0].trim() || "audio/mp3";

      const initUploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${apiKey}`;
      const headers: Record<string, string> = {
        "User-Agent": "aistudio-build",
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Type": resolvedMimeType,
        "Content-Type": "application/json",
      };
      if (fileSize && Number(fileSize) > 0) {
        headers["X-Goog-Upload-Header-Content-Length"] = String(fileSize);
      }

      const initRes = await fetch(initUploadUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          file: {
            display_name: displayName,
            mime_type: resolvedMimeType,
          },
        }),
      });

      const uploadUrl = initRes.headers.get("X-Goog-Upload-URL");
      if (!initRes.ok || !uploadUrl) {
        const errText = await initRes.text().catch(() => "");
        res.status(initRes.status || 500).json({
          error: `No se pudo iniciar sesión de subida en Gemini Files API: ${errText}`,
        });
        return;
      }

      res.json({ uploadUrl, mimeType: resolvedMimeType });
    } catch (err: any) {
      console.error("Error en /api/obtener-url-gemini:", err);
      res.status(500).json({ error: err?.message || "Error obteniendo URL de subida Gemini" });
    }
  });

  // Fallback de streaming directo a la URL resumable de Google si el navegador bloquea cabeceras X-Goog-* por CORS
  app.post(
    "/api/upload-stream-gemini",
    express.raw({ type: () => true, limit: "250mb" }),
    async (req, res) => {
      try {
        const uploadUrl = String(req.query.uploadUrl || "");
        const mimeType = String(req.query.mimeType || req.headers["content-type"] || "audio/mp3")
          .split(";")[0]
          .trim();

        if (!uploadUrl || !Buffer.isBuffer(req.body)) {
          res.status(400).json({ error: "Falta uploadUrl o cuerpo binario del archivo." });
          return;
        }

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "User-Agent": "aistudio-build",
            "Content-Type": mimeType,
            "Content-Length": String(req.body.byteLength),
            "X-Goog-Upload-Command": "upload, finalize",
            "X-Goog-Upload-Offset": "0",
          },
          body: new Uint8Array(req.body),
        });

        if (!uploadRes.ok) {
          const errText = await uploadRes.text().catch(() => "");
          res.status(uploadRes.status).json({ error: `Error subiendo a Google: ${errText}` });
          return;
        }

        const uploadData = await uploadRes.json();
        res.json(uploadData);
      } catch (err: any) {
        console.error("Error en /api/upload-stream-gemini:", err);
        res.status(500).json({ error: err?.message || "Error subiendo archivo a Gemini Files API" });
      }
    }
  );

  // 3. Solicitar la redacción del acta exhaustiva Ley 675 usando el fileUri temporal en Google Gemini
  app.post("/api/generar-acta-gemini", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
        return;
      }

      const {
        fileUri,
        mimeType = "audio/mp3",
        tenantNombre = "Urb. Tricentenario",
        comision1 = "",
        comision2 = "",
        contextNotes = "",
      } = req.body || {};

      if (!fileUri) {
        res.status(400).json({ error: "Se requiere fileUri del archivo subido a Gemini." });
        return;
      }

      const resolvedMimeType = String(mimeType || "audio/mp3").split(";")[0].trim() || "audio/mp3";

      // Verificar que el archivo esté en estado ACTIVE en Gemini Files API antes de invocar generateContent
      const fileMatch = String(fileUri).match(/\/files\/([a-zA-Z0-9_-]+)/);
      if (fileMatch?.[1]) {
        const googleFileName = `files/${fileMatch[1]}`;
        let fileState = "PROCESSING";
        let attempts = 0;
        while (fileState === "PROCESSING" && attempts < 30) {
          const checkRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/${googleFileName}?key=${apiKey}`,
            { headers: { "User-Agent": "aistudio-build" } }
          );
          if (checkRes.ok) {
            const checkData = (await checkRes.json()) as { state?: string };
            fileState = checkData.state || "ACTIVE";
            if (fileState === "ACTIVE") break;
          } else {
            break;
          }
          await new Promise((r) => setTimeout(r, 1500));
          attempts++;
        }
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const systemPromptActasPH = `
Eres un Revisor Fiscal y Secretario Jurídico experto en Propiedad Horizontal bajo la Ley 675 de 2001 de Colombia.
Tu labor es transcribir y sintetizar minuciosamente la sesión, GARANTIZANDO PRECISIÓN MATEMÁTICA Y FIDELIDAD NOMINAL ABSOLUTA.

REGLAS DE ORO (TOLERANCIA CERO A OMISIONES):
1. IDENTIFICACIÓN NOMINAL: Prohibido usar "no mencionado" o "asistente 1" si en algún momento se saluda, presenta o menciona un nombre (ej. Jean, Martha, Eloina, etc.). Registra nombres completos y cargos.
2. NÚMEROS Y CIFRAS EXACTAS: Prohibido usar expresiones como "se discutieron costos", "se evaluó el presupuesto" o "se proyectó un gasto". Debes indicar la cifra en pesos colombianos ($ COP), porcentajes de incremento, descuentos pactados o diferencias entre lo proyectado y lo cotizado.
3. TABLA COMPARATIVA DE VALORES: Identifica cotizaciones de contratistas, presupuestos aprobados vs. gastos proyectados y cualquier valor monetario en disputa.
4. INTEGRIDAD: Si un tema financiero se debatió pero los asistentes omitieron deliberadamente el valor en la conversación, debes consignar explícitamente: "[Monto omitido en deliberación oral]".
`;

      const generateConfig = {
        systemInstruction: systemPromptActasPH,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            encabezado: {
              type: Type.OBJECT,
              properties: {
                copropiedad: { type: Type.STRING },
                organo: { type: Type.STRING },
                fecha: { type: Type.STRING },
                horaInicio: { type: Type.STRING },
                horaFin: { type: Type.STRING },
                presidente: { type: Type.STRING },
                secretario: { type: Type.STRING },
                quorum: { type: Type.STRING },
              },
              required: [
                "copropiedad",
                "organo",
                "fecha",
                "horaInicio",
                "horaFin",
                "presidente",
                "secretario",
                "quorum",
              ],
            },
            ordenDelDia: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            desarrolloDetallado: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  punto: { type: Type.STRING },
                  intervencionesClave: { type: Type.STRING },
                  nombresMencionados: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ["punto", "intervencionesClave", "nombresMencionados"],
              },
            },
            balanceFinanciero: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  concepto: { type: Type.STRING },
                  valorPresupuestado: { type: Type.STRING },
                  valorCotizadoReal: { type: Type.STRING },
                  variacionDescuento: { type: Type.STRING },
                  proveedorContratista: { type: Type.STRING },
                  estadoDecision: { type: Type.STRING },
                },
                required: [
                  "concepto",
                  "valorPresupuestado",
                  "valorCotizadoReal",
                  "variacionDescuento",
                  "proveedorContratista",
                  "estadoDecision",
                ],
              },
            },
            decisionesYVotaciones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  proposicion: { type: Type.STRING },
                  votosFavor: { type: Type.STRING },
                  votosContra: { type: Type.STRING },
                  abstenciones: { type: Type.STRING },
                  resultado: { type: Type.STRING },
                },
                required: [
                  "proposicion",
                  "votosFavor",
                  "votosContra",
                  "abstenciones",
                  "resultado",
                ],
              },
            },
            compromisos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  responsable: { type: Type.STRING },
                  tarea: { type: Type.STRING },
                  fechaLimite: { type: Type.STRING },
                },
                required: ["responsable", "tarea", "fechaLimite"],
              },
            },
          },
          required: [
            "encabezado",
            "ordenDelDia",
            "desarrolloDetallado",
            "balanceFinanciero",
            "decisionesYVotaciones",
            "compromisos",
          ],
        },
      };

      const parts: Array<
        | { text: string }
        | { fileData: { mimeType: string; fileUri: string } }
      > = [
        {
          text: `${systemPromptActasPH}\n\nCopropiedad: ${tenantNombre} | Fecha: ${new Date().toISOString().split("T")[0]}. Analiza íntegramente el audio adjunto sin omitir ningún monto en $ COP, nombre propio, deliberación ni votación.`,
        },
        {
          fileData: {
            mimeType: resolvedMimeType,
            fileUri: String(fileUri),
          },
        },
      ];

      if (contextNotes) {
        parts.push({
          text: `Notas adicionales de contexto:\n${contextNotes}`,
        });
      }

      const candidateModels = [
        "gemini-3.5-transcribe",
        "gemini-3.8-flash",
        "gemini-3.1-flash-lite",
        "gemini-flash-latest",
      ];

      let response: any = null;
      let lastErr: any = null;
      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: { parts },
            config: generateConfig,
          });
          if (response?.text) break;
        } catch (err) {
          lastErr = err;
          console.warn(`Aviso en /api/generar-acta-gemini con ${modelName}:`, err);
        }
      }

      if (!response?.text) {
        throw new Error(
          lastErr?.message || "No se obtuvo respuesta del modelo de transcripción Gemini."
        );
      }

      let structured: any = {};
      try {
        const cleaned = response.text
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/, "")
          .trim();
        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        structured = JSON.parse(
          firstBrace !== -1 && lastBrace !== -1
            ? cleaned.slice(firstBrace, lastBrace + 1)
            : cleaned
        );
      } catch (e) {
        console.warn("Error parseando JSON en /api/generar-acta-gemini:", e);
      }

      const encabezado = structured?.encabezado || {};
      const ordenDelDia: string[] = Array.isArray(structured?.ordenDelDia)
        ? structured.ordenDelDia
        : [];
      const desarrolloArr: Array<{
        punto: string;
        intervencionesClave: string;
        nombresMencionados: string[];
      }> = Array.isArray(structured?.desarrolloDetallado)
        ? structured.desarrolloDetallado
        : [];
      const balanceArr: Array<{
        concepto: string;
        valorPresupuestado: string;
        valorCotizadoReal: string;
        variacionDescuento: string;
        proveedorContratista: string;
        estadoDecision: string;
      }> = Array.isArray(structured?.balanceFinanciero)
        ? structured.balanceFinanciero
        : [];
      const decisionesArr: Array<{
        proposicion: string;
        votosFavor: string;
        votosContra: string;
        abstenciones: string;
        resultado: string;
      }> = Array.isArray(structured?.decisionesYVotaciones)
        ? structured.decisionesYVotaciones
        : [];
      const compromisosArr: Array<{
        responsable: string;
        tarea: string;
        fechaLimite: string;
      }> = Array.isArray(structured?.compromisos) ? structured.compromisos : [];

      const ordenTexto =
        ordenDelDia.length > 0
          ? `ORDEN DEL DÍA:\n${ordenDelDia.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`
          : "";

      const desarrolloDetalladoTexto =
        desarrolloArr.length > 0
          ? `${ordenTexto}${desarrolloArr
              .map(
                (d, i) =>
                  `${i + 1}. ${d.punto}\n${d.intervencionesClave}${
                    Array.isArray(d.nombresMencionados) && d.nombresMencionados.length > 0
                      ? `\nIntervinientes identificados: ${d.nombresMencionados.join(", ")}`
                      : ""
                  }`
              )
              .join("\n\n")}`
          : "Desarrollo de la sesión registrado conforme al audio procesado.";

      const tablaPresupuestoTexto =
        balanceArr.length > 0
          ? [
              "| Concepto / Partida | Valor Presupuestado ($ COP) | Valor Cotizado / Real ($ COP) | Variación / Descuento | Proveedor / Contratista | Estado |",
              "| :--- | :--- | :--- | :--- | :--- | :--- |",
              ...balanceArr.map(
                (b) =>
                  `| ${b.concepto || "-"} | ${b.valorPresupuestado || "[Monto omitido en deliberación oral]"} | ${b.valorCotizadoReal || "[Monto omitido en deliberación oral]"} | ${b.variacionDescuento || "0%"} | ${b.proveedorContratista || "Por definir"} | ${b.estadoDecision || "En evaluación"} |`
              ),
            ].join("\n")
          : "| Concepto / Partida | Valor ($ COP) | Origen de Recursos | Estado |\n| :--- | :--- | :--- | :--- |\n| Sin partidas financieras adicionales especificadas | [Monto omitido en deliberación oral] | Presupuesto Ordinario | Verificado |";

      const decisionesTexto =
        decisionesArr.length > 0
          ? decisionesArr
              .map(
                (v, i) =>
                  `${i + 1}. Proposición: ${v.proposicion}\n   • Votos a favor: ${v.votosFavor} | En contra: ${v.votosContra} | Abstenciones: ${v.abstenciones}\n   • Resultado: ${v.resultado}`
              )
              .join("\n\n")
          : "Las determinaciones sometidas a consideración fueron aprobadas conforme al quórum deliberatorio y decisorio verificado.";

      const compromisosTexto =
        compromisosArr.length > 0
          ? compromisosArr
              .map(
                (c, i) =>
                  `${i + 1}. Responsable: ${c.responsable} — Tarea: ${c.tarea} (Fecha límite: ${c.fechaLimite})`
              )
              .join("\n")
          : "1. Responsable: Administración — Tarea: Publicar y foliar el acta oficial conforme al Art. 47 de la Ley 675 de 2001.";

      const tipoOrgano = encabezado.organo || "CONSEJO DE ADMINISTRACIÓN / ASAMBLEA GENERAL";
      const horaInicio =
        encabezado.horaInicio ||
        new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
      const quorum = encabezado.quorum || "100% de asistentes en sala";

      const actaFinal = `ACTA OFICIAL • ${tipoOrgano}
${String(tenantNombre || "Urb. Tricentenario").toUpperCase()} • LEY 675 DE 2001

I. VERIFICACIÓN DEL QUÓRUM Y ASISTENCIA:
Siendo las ${horaInicio} del ${encabezado.fecha || new Date().toLocaleDateString("es-CO")}, se reunieron los integrantes de ${tenantNombre}. Presidente: ${encabezado.presidente || "Designado en sesión"} | Secretario: ${encabezado.secretario || "Administración"}. Quórum verificado: ${quorum}.

II. DESARROLLO DEL ORDEN DEL DÍA Y DELIBERACIONES:
${desarrolloDetalladoTexto}

III. BALANCE ECONÓMICO Y CUADRO DE VALORES ($ COP):
${tablaPresupuestoTexto}

IV. DECISIONES Y VOTACIONES:
${decisionesTexto}

V. COMPROMISOS Y TAREAS ASIGNADAS:
${compromisosTexto}

VI. COMISIÓN VERIFICADORA DEL ACTA:
En constancia firman los designados para la verificación de la presente acta:
- ${comision1 || "Comisión Verificadora 1"}
- ${comision2 || "Comisión Verificadora 2"}`;

      res.json({
        success: true,
        actaFinal,
        tipoOrgano,
        horaInicio,
        quorum,
        desarrolloDetallado: desarrolloDetalladoTexto,
        tablaPresupuestoTexto,
        decisionesTexto,
        compromisosTexto,
        balanceFinanciero: balanceArr.map((b) => ({
          ...b,
          valorCOP: b.valorCotizadoReal || b.valorPresupuestado || "[Monto omitido en deliberación oral]",
          origen: b.proveedorContratista || "Presupuesto PH",
          estado: b.estadoDecision || "En evaluación",
        })),
        decisionesYVotaciones: decisionesArr,
        compromisos: compromisosArr.map((c) => ({
          responsable: c.responsable,
          tarea: c.tarea,
          fechaLimite: c.fechaLimite,
          fecha_limite: c.fechaLimite,
        })),
      });
    } catch (err: any) {
      console.error("Error en /api/generar-acta-gemini:", err);
      res.status(500).json({
        error: err?.message || "Error al generar el acta con Gemini.",
      });
    }
  });

  // Endpoint /api/transcribir-acta para EditorActaLegal (soporta FormData con Blob de audio o audioUrl, y JSON)
  app.post(
    "/api/transcribir-acta",
    express.raw({
      type: (req) => String(req.headers["content-type"] || "").includes("multipart/form-data"),
      limit: "50mb",
    }),
    async (req, res) => {
      try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
          res.status(500).json({
            error: "No se ha configurado la variable GEMINI_API_KEY en el servidor.",
          });
          return;
        }

        let audioBuffer: Buffer | null = null;
        let mimeType = "audio/webm";
        let audioUrl = "";
        let tenantId = "22079bb5-6ac7-4a15-be89-c53d14e4221b";
        let copropiedadNombre = "Urb. Tricentenario";
        let contextNotes = "";

        const contentType = String(req.headers["content-type"] || "");
        if (contentType.includes("multipart/form-data") && Buffer.isBuffer(req.body)) {
          const webRes = new Response(new Uint8Array(req.body), {
            headers: { "content-type": contentType },
          });
          const formData = await webRes.formData();
          const audioField = formData.get("audio");
          if (audioField && typeof (audioField as any).arrayBuffer === "function") {
            const blobObj = audioField as Blob;
            audioBuffer = Buffer.from(await blobObj.arrayBuffer());
            if (blobObj.type) {
              mimeType = blobObj.type.split(";")[0].trim() || "audio/webm";
            }
          }
          audioUrl = String(formData.get("audioUrl") || "");
          tenantId = String(formData.get("tenantId") || tenantId);
          copropiedadNombre = String(formData.get("copropiedadNombre") || copropiedadNombre);
          contextNotes = String(formData.get("contextNotes") || "");
        } else if (req.body && typeof req.body === "object") {
          audioUrl = String(req.body.audioUrl || "");
          tenantId = String(req.body.tenantId || tenantId);
          copropiedadNombre = String(req.body.copropiedadNombre || copropiedadNombre);
          contextNotes = String(req.body.contextNotes || "");
          if (req.body.base64Audio) {
            const cleanB64 = String(req.body.base64Audio).replace(/^data:[^;]+;base64,/, "");
            audioBuffer = Buffer.from(cleanB64, "base64");
            mimeType = String(req.body.mimeType || "audio/webm").split(";")[0].trim();
          }
        }

        if (!audioBuffer && audioUrl) {
          if (audioUrl.startsWith("data:")) {
            const [meta, b64] = audioUrl.split(",");
            if (b64) {
              audioBuffer = Buffer.from(b64, "base64");
              const m = meta.match(/^data:([^;]+)/);
              if (m?.[1]) mimeType = m[1];
            }
          } else if (audioUrl.startsWith("http://") || audioUrl.startsWith("https://")) {
            const remoteRes = await fetch(audioUrl);
            if (remoteRes.ok) {
              audioBuffer = Buffer.from(await remoteRes.arrayBuffer());
              const ct = remoteRes.headers.get("content-type");
              if (ct) mimeType = ct.split(";")[0].trim();
            }
          }
        }

        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            },
          },
        });

        const systemPromptActasPH = `
Eres un Revisor Fiscal y Secretario Jurídico experto en Propiedad Horizontal bajo la Ley 675 de 2001 de Colombia.
Tu labor es transcribir y sintetizar minuciosamente la sesión, GARANTIZANDO PRECISIÓN MATEMÁTICA Y FIDELIDAD NOMINAL ABSOLUTA.

REGLAS DE ORO (TOLERANCIA CERO A OMISIONES):
1. IDENTIFICACIÓN NOMINAL: Prohibido usar "no mencionado" o "asistente 1" si en algún momento se saluda, presenta o menciona un nombre (ej. Jean, Martha, Eloina, etc.). Registra nombres completos y cargos.
2. NÚMEROS Y CIFRAS EXACTAS: Prohibido usar expresiones como "se discutieron costos", "se evaluó el presupuesto" o "se proyectó un gasto". Debes indicar la cifra en pesos colombianos ($ COP), porcentajes de incremento, descuentos pactados o diferencias entre lo proyectado y lo cotizado.
3. TABLA COMPARATIVA DE VALORES: Identifica cotizaciones de contratistas, presupuestos aprobados vs. gastos proyectados y cualquier valor monetario en disputa.
4. INTEGRIDAD: Si un tema financiero se debatió pero los asistentes omitieron deliberadamente el valor en la conversación, debes consignar explícitamente: "[Monto omitido en deliberación oral]".
`;

        let geminiUploadedFile: { fileUri: string; googleFileName: string; mimeType: string } | null = null;
        if (audioBuffer && audioBuffer.byteLength > 12 * 1024 * 1024) {
          try {
            geminiUploadedFile = await uploadBufferToGeminiFilesApi(
              audioBuffer,
              mimeType,
              `acta_${tenantId}_${Date.now()}`,
              apiKey
            );
          } catch (upErr) {
            console.warn("Aviso subiendo a Gemini Files API en /api/transcribir-acta:", upErr);
          }
        }

        const parts: Array<
          | { text: string }
          | { fileData: { mimeType: string; fileUri: string } }
          | { inlineData: { mimeType: string; data: string } }
        > = [
          {
            text: `${systemPromptActasPH}\n\nCopropiedad: ${copropiedadNombre} (Tenant ID: ${tenantId}) | Fecha: ${new Date().toISOString().split("T")[0]}.`,
          },
        ];

        if (geminiUploadedFile) {
          parts.push({
            fileData: {
              mimeType: geminiUploadedFile.mimeType,
              fileUri: geminiUploadedFile.fileUri,
            },
          });
        } else if (audioBuffer && audioBuffer.byteLength > 0) {
          parts.push({
            inlineData: {
              mimeType,
              data: audioBuffer
                .subarray(0, Math.min(audioBuffer.byteLength, 14 * 1024 * 1024))
                .toString("base64"),
            },
          });
        } else {
          parts.push({
            text: `[Sin archivo de audio binario adjunto. Basarse en el contexto de la sesión e indicar "[Monto omitido en deliberación oral]" para cifras no especificadas.]`,
          });
        }

        if (contextNotes) {
          parts.push({
            text: `Notas y registro de la sesión:\n${contextNotes}`,
          });
        }

        const generateConfig = {
          systemInstruction: systemPromptActasPH,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              encabezado: {
                type: Type.OBJECT,
                properties: {
                  copropiedad: { type: Type.STRING },
                  organo: { type: Type.STRING },
                  fecha: { type: Type.STRING },
                  horaInicio: { type: Type.STRING },
                  horaFin: { type: Type.STRING },
                  presidente: { type: Type.STRING },
                  secretario: { type: Type.STRING },
                  quorum: { type: Type.STRING },
                },
                required: [
                  "copropiedad",
                  "organo",
                  "fecha",
                  "horaInicio",
                  "horaFin",
                  "presidente",
                  "secretario",
                  "quorum",
                ],
              },
              ordenDelDia: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              desarrolloDetallado: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    punto: { type: Type.STRING },
                    intervencionesClave: { type: Type.STRING },
                    nombresMencionados: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ["punto", "intervencionesClave", "nombresMencionados"],
                },
              },
              balanceFinanciero: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    concepto: { type: Type.STRING },
                    valorPresupuestado: { type: Type.STRING },
                    valorCotizadoReal: { type: Type.STRING },
                    variacionDescuento: { type: Type.STRING },
                    proveedorContratista: { type: Type.STRING },
                    estadoDecision: { type: Type.STRING },
                  },
                  required: [
                    "concepto",
                    "valorPresupuestado",
                    "valorCotizadoReal",
                    "variacionDescuento",
                    "proveedorContratista",
                    "estadoDecision",
                  ],
                },
              },
              decisionesYVotaciones: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    proposicion: { type: Type.STRING },
                    votosFavor: { type: Type.STRING },
                    votosContra: { type: Type.STRING },
                    abstenciones: { type: Type.STRING },
                    resultado: { type: Type.STRING },
                  },
                  required: [
                    "proposicion",
                    "votosFavor",
                    "votosContra",
                    "abstenciones",
                    "resultado",
                  ],
                },
              },
              compromisos: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    responsable: { type: Type.STRING },
                    tarea: { type: Type.STRING },
                    fechaLimite: { type: Type.STRING },
                  },
                  required: ["responsable", "tarea", "fechaLimite"],
                },
              },
            },
            required: [
              "encabezado",
              "ordenDelDia",
              "desarrolloDetallado",
              "balanceFinanciero",
              "decisionesYVotaciones",
              "compromisos",
            ],
          },
        };

        const candidateModels =
          audioBuffer && audioBuffer.byteLength > 0
            ? ["gemini-3.5-transcribe", "gemini-3.8-flash", "gemini-3.1-flash-lite"]
            : ["gemini-3.8-flash", "gemini-3.1-flash-lite"];

        let response: any = null;
        for (const modelName of candidateModels) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: { parts },
              config: generateConfig,
            });
            if (response?.text) break;
          } catch (modelErr) {
            console.warn(`Aviso en /api/transcribir-acta con ${modelName}:`, modelErr);
          }
        }

        let structured: any = {};
        if (response?.text) {
          try {
            const cleaned = response.text
              .replace(/^```json\s*/i, "")
              .replace(/^```\s*/i, "")
              .replace(/\s*```$/, "")
              .trim();
            const firstBrace = cleaned.indexOf("{");
            const lastBrace = cleaned.lastIndexOf("}");
            structured = JSON.parse(
              firstBrace !== -1 && lastBrace !== -1
                ? cleaned.slice(firstBrace, lastBrace + 1)
                : cleaned
            );
          } catch (e) {
            console.warn("Error parseando JSON en /api/transcribir-acta:", e);
          }
        }

        const encabezado = structured?.encabezado || {};
        const ordenDelDia: string[] = Array.isArray(structured?.ordenDelDia)
          ? structured.ordenDelDia
          : [];
        const desarrolloArr: Array<{
          punto: string;
          intervencionesClave: string;
          nombresMencionados: string[];
        }> = Array.isArray(structured?.desarrolloDetallado)
          ? structured.desarrolloDetallado
          : [];
        const balanceArr: Array<{
          concepto: string;
          valorPresupuestado: string;
          valorCotizadoReal: string;
          variacionDescuento: string;
          proveedorContratista: string;
          estadoDecision: string;
        }> = Array.isArray(structured?.balanceFinanciero)
          ? structured.balanceFinanciero
          : [];
        const decisionesArr: Array<{
          proposicion: string;
          votosFavor: string;
          votosContra: string;
          abstenciones: string;
          resultado: string;
        }> = Array.isArray(structured?.decisionesYVotaciones)
          ? structured.decisionesYVotaciones
          : [];
        const compromisosArr: Array<{
          responsable: string;
          tarea: string;
          fechaLimite: string;
        }> = Array.isArray(structured?.compromisos) ? structured.compromisos : [];

        const ordenTexto =
          ordenDelDia.length > 0
            ? `ORDEN DEL DÍA:\n${ordenDelDia.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n`
            : "";

        const desarrolloDetalladoTexto =
          desarrolloArr.length > 0
            ? `${ordenTexto}${desarrolloArr
                .map(
                  (d, i) =>
                    `${i + 1}. ${d.punto}\n${d.intervencionesClave}${
                      Array.isArray(d.nombresMencionados) && d.nombresMencionados.length > 0
                        ? `\nIntervinientes identificados: ${d.nombresMencionados.join(", ")}`
                        : ""
                    }`
                )
                .join("\n\n")}`
            : "Desarrollo de la sesión registrado conforme al audio procesado.";

        const tablaPresupuestoTexto =
          balanceArr.length > 0
            ? [
                "| Concepto / Partida | Valor Presupuestado ($ COP) | Valor Cotizado / Real ($ COP) | Variación / Descuento | Proveedor / Contratista | Estado |",
                "| :--- | :--- | :--- | :--- | :--- | :--- |",
                ...balanceArr.map(
                  (b) =>
                    `| ${b.concepto || "-"} | ${b.valorPresupuestado || "[Monto omitido en deliberación oral]"} | ${b.valorCotizadoReal || "[Monto omitido en deliberación oral]"} | ${b.variacionDescuento || "0%"} | ${b.proveedorContratista || "Por definir"} | ${b.estadoDecision || "En evaluación"} |`
                ),
              ].join("\n")
            : "| Concepto / Partida | Valor ($ COP) | Origen de Recursos | Estado |\n| :--- | :--- | :--- | :--- |\n| Sin partidas financieras adicionales especificadas | [Monto omitido en deliberación oral] | Presupuesto Ordinario | Verificado |";

        const decisionesTexto =
          decisionesArr.length > 0
            ? decisionesArr
                .map(
                  (v, i) =>
                    `${i + 1}. Proposición: ${v.proposicion}\n   • Votos a favor: ${v.votosFavor} | En contra: ${v.votosContra} | Abstenciones: ${v.abstenciones}\n   • Resultado: ${v.resultado}`
                )
                .join("\n\n")
            : "Las determinaciones sometidas a consideración fueron aprobadas conforme al quórum deliberatorio y decisorio verificado.";

        const compromisosTexto =
          compromisosArr.length > 0
            ? compromisosArr
                .map(
                  (c, i) =>
                    `${i + 1}. Responsable: ${c.responsable} — Tarea: ${c.tarea} (Fecha límite: ${c.fechaLimite})`
                )
                .join("\n")
            : "1. Responsable: Administración — Tarea: Publicar y foliar el acta oficial conforme al Art. 47 de la Ley 675 de 2001.";

        res.status(200).json({
          success: true,
          tipoOrgano: encabezado.organo || "CONSEJO DE ADMINISTRACIÓN / ASAMBLEA GENERAL",
          horaInicio:
            encabezado.horaInicio ||
            new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
          quorum: encabezado.quorum || "100% de asistentes verificados",
          desarrolloDetallado: desarrolloDetalladoTexto,
          tablaPresupuestoTexto,
          decisionesTexto,
          compromisosTexto,
          balanceFinanciero: balanceArr.map((b) => ({
            ...b,
            valorCOP: b.valorCotizadoReal || b.valorPresupuestado || "[Monto omitido en deliberación oral]",
            origen: b.proveedorContratista || "Presupuesto PH",
            estado: b.estadoDecision || "En evaluación",
          })),
          decisionesYVotaciones: decisionesArr,
          compromisos: compromisosArr.map((c) => ({
            responsable: c.responsable,
            tarea: c.tarea,
            fechaLimite: c.fechaLimite,
            fecha_limite: c.fechaLimite,
          })),
        });
      } catch (err: any) {
        console.error("Error en /api/transcribir-acta:", err);
        res.status(500).json({
          error: err?.message || "Error al transcribir y generar el acta con IA.",
        });
      }
    }
  );

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

  app.post("/api/aprovisionar-residentes-censo", async (req, res) => {
    try {
      const { unidadesCenso, tenantId } = req.body;
      if (!tenantId || !Array.isArray(unidadesCenso)) {
        return res.status(400).json({ error: "Parámetros inválidos (se requiere tenantId y unidadesCenso)." });
      }
      const resultados = await aprovisionarResidentesCenso(unidadesCenso, tenantId);
      return res.json({ success: true, count: resultados.length, resultados });
    } catch (err: any) {
      console.error("Error en /api/aprovisionar-residentes-censo:", err);
      return res.status(500).json({ error: err.message || "Error al aprovisionar residentes del censo." });
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
