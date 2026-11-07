import express from "express";
import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { URBIX_COPILOT_SYSTEM_PROMPT } from "./src/urbixCopilotPrompt";
import { aprovisionarResidentesCenso } from "./src/aprovisionarResidentesCenso";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GEMINI_MODEL_CANDIDATES = [
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite"
];

async function generateContentWithFallback(
  ai: GoogleGenAI,
  params: { contents: any; config?: any }
) {
  let lastError: any = null;
  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      return await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: params.config
      });
    } catch (err: any) {
      lastError = err;
      console.warn(`[Gemini Fallback] Modelo ${modelName} no disponible (${err?.status || err?.message}), probando siguiente...`);
    }
  }
  throw lastError || new Error("No se pudo conectar con los modelos de Gemini.");
}

function normalizeAudioMimeType(rawMime?: string, fileName?: string): string {
  const lowerMime = String(rawMime || "").toLowerCase();
  const lowerName = String(fileName || "").toLowerCase();
  if (lowerMime.includes("mp3") || lowerMime.includes("mpeg") || lowerName.endsWith(".mp3")) {
    return "audio/mp3";
  }
  if (lowerMime.includes("wav") || lowerName.endsWith(".wav")) {
    return "audio/wav";
  }
  if (lowerMime.includes("m4a") || lowerMime.includes("mp4") || lowerName.endsWith(".m4a")) {
    return "audio/mp4";
  }
  if (lowerMime.includes("ogg") || lowerName.endsWith(".ogg")) {
    return "audio/ogg";
  }
  return "audio/webm";
}

function alignMp3SyncOffset(buf: Buffer): Buffer {
  for (let i = 0; i < Math.min(buf.length - 2, 8192); i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) {
      return buf.subarray(i);
    }
  }
  return buf;
}

function extractAudioPartsFromDisk(filePath: string, mimeType: string): Array<{ inlineData: { mimeType: string; data: string } }> {
  const stat = fs.statSync(filePath);
  const totalBytes = stat.size;
  if (totalBytes === 0) return [];

  const MAX_DIRECT_BYTES = 7 * 1024 * 1024; // 7 MB directo
  if (totalBytes <= MAX_DIRECT_BYTES) {
    const fullBuf = fs.readFileSync(filePath);
    return [
      {
        inlineData: {
          mimeType,
          data: fullBuf.toString("base64")
        }
      }
    ];
  }

  const fd = fs.openSync(filePath, "r");
  try {
    if (mimeType === "audio/mp3" || mimeType === "audio/mpeg") {
      // Extraer 3 ventanas estratégicas de 2 MB cada una (Inicio/Instalación, Mitad/Deliberación, Cierre/Votaciones)
      const windowSize = 2 * 1024 * 1024;
      const offsets = [
        0,
        Math.max(0, Math.floor(totalBytes * 0.45)),
        Math.max(0, totalBytes - windowSize)
      ];
      const parts: Array<{ inlineData: { mimeType: string; data: string } }> = [];

      offsets.forEach((offset, idx) => {
        const readLen = Math.min(windowSize, totalBytes - offset);
        if (readLen <= 0) return;
        const rawBuf = Buffer.allocUnsafe(readLen);
        fs.readSync(fd, rawBuf, 0, readLen, offset);
        const cleanBuf = idx === 0 ? rawBuf : alignMp3SyncOffset(rawBuf);
        parts.push({
          inlineData: {
            mimeType: "audio/mp3",
            data: cleanBuf.toString("base64")
          }
        });
      });

      return parts;
    } else {
      // Para contenedores WebM/WAV/M4A enviamos los primeros 6 MB desde el byte 0 para preservar la cabecera
      const readLen = Math.min(6 * 1024 * 1024, totalBytes);
      const rawBuf = Buffer.allocUnsafe(readLen);
      fs.readSync(fd, rawBuf, 0, readLen, 0);
      return [
        {
          inlineData: {
            mimeType,
            data: rawBuf.toString("base64")
          }
        }
      ];
    }
  } finally {
    fs.closeSync(fd);
  }
}

export const supabaseAuthVerifier = createClient(
  process.env.VITE_SUPABASE_URL || "https://bhowrovxddvaykffwbbz.supabase.co",
  process.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_z3h_VaPJ1Gl7dPD9PkIPfw_MhVUQBpZ"
);

// Middleware de verificación de token JWT para endpoints protegidos
export async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Acceso no autorizado: Token de sesión requerido." });
  }

  const token = authHeader.split(" ")[1];
  const { data: { user }, error } = await supabaseAuthVerifier.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ error: "Sesión inválida o expirada en el sistema." });
  }

  (req as any).user = user;
  next();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Verificación de estado de sesión
  app.get("/api/auth/verify", requireAuth, (req, res) => {
    res.json({ valid: true, user: (req as any).user });
  });

  // Metadatos de archivos de audio subidos por fragmentos en disco (/tmp)
  const audioUploadMetaByUploadId = new Map<
    string,
    { filePath: string; mimeType: string; totalBytes: number; chunksReceived: number }
  >();

  // Copilot de consultas para residentes (Régimen Ley 675)
  app.post("/api/copilot-chat", requireAuth, async (req, res) => {
    const { prompt, residentContext } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "El mensaje es obligatorio." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY no configurada." });

    let userPromptWithContext = prompt;
    if (residentContext) {
      userPromptWithContext = `[DATOS RESIDENTE]: Inmueble: ${residentContext.unidad} | Propietario: ${residentContext.propietario} | Cuota: $${residentContext.cuotaMensual} | Saldo Mora: $${residentContext.saldoPendiente}\nConsulta: "${prompt}"`;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await generateContentWithFallback(ai, {
        contents: userPromptWithContext,
        config: { systemInstruction: URBIX_COPILOT_SYSTEM_PROMPT }
      });
      return res.json({ reply: response.text || "" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Aprovisionamiento de censo masivo
  app.post("/api/aprovisionar-residentes-censo", requireAuth, async (req, res) => {
    try {
      const { unidadesCenso, tenantId } = req.body;
      const resultados = await aprovisionarResidentesCenso(unidadesCenso, tenantId);
      return res.json({ success: true, count: resultados.length, resultados });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Procesamiento y Generación Exhaustiva de Actas de Asamblea / Consejo con IA (Ley 675)
  app.post("/api/process-meeting", async (req, res) => {
    let tempFilePathToClean: string | null = null;
    try {
      const {
        uploadId,
        base64Audio,
        audioPath = "",
        mimeType = "audio/webm",
        meetingType = "Asamblea General Ordinaria",
        meetingDate = new Date().toISOString().split("T")[0],
        contextNotes = "",
        tenantName = "Copropiedad PH",
        quorumPercentage = 100
      } = req.body || {};

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const safeUploadId = uploadId ? String(uploadId).replace(/[^a-zA-Z0-9_-]/g, "") : "";
      const meta = safeUploadId ? audioUploadMetaByUploadId.get(safeUploadId) : undefined;
      const candidatePath = meta?.filePath || (safeUploadId ? path.join(os.tmpdir(), `urbix_upload_${safeUploadId}.bin`) : "");

      const resolvedMime = normalizeAudioMimeType(meta?.mimeType || mimeType, audioPath || contextNotes);
      let audioParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
      let totalFileSizeMB = 0;

      if (candidatePath && fs.existsSync(candidatePath)) {
        tempFilePathToClean = candidatePath;
        const stat = fs.statSync(candidatePath);
        totalFileSizeMB = stat.size / (1024 * 1024);
        audioParts = extractAudioPartsFromDisk(candidatePath, resolvedMime);
      } else if (base64Audio) {
        const cleanBase64 = String(base64Audio).replace(/^data:audio\/[^;]+;base64,/, "");
        const rawBuf = Buffer.from(cleanBase64, "base64");
        totalFileSizeMB = rawBuf.length / (1024 * 1024);
        const maxInline = 6 * 1024 * 1024;
        const finalBuf = rawBuf.length > maxInline ? rawBuf.subarray(0, maxInline) : rawBuf;
        audioParts = [
          {
            inlineData: {
              mimeType: resolvedMime,
              data: finalBuf.toString("base64")
            }
          }
        ];
      }

      const promptActa = `Eres un Secretario Jurídico y Redactor Oficial experto en Propiedad Horizontal en Colombia (Ley 675 de 2001, Art. 47).
Tu misión es generar un ACTA OFICIAL EXHAUSTIVA, COMPLETA Y ALTAMENTE DETALLADA CON TODOS LOS PUNTOS tratados en la sesión de "${meetingType}" de la copropiedad "${tenantName}".
Fecha de la sesión: ${meetingDate}.
Quórum verificado: ${quorumPercentage}%.
Información y contexto adicional de la sesión: "${contextNotes || "Sesión oficial con verificación de quórum, informes de gestión, estados financieros, presupuesto, proposiciones y compromisos."}"
${totalFileSizeMB > 0 ? `Tamaño del archivo de grabación procesado: ${totalFileSizeMB.toFixed(2)} MB.` : ""}

INSTRUCCIONES OBLIGATORIAS PARA ENTREGAR EL ACTA BIEN DETALLADA CON TODOS LOS PUNTOS:
1. "ordenDelDia": Incluye TODOS los puntos del orden del día (mínimo 7 a 10 puntos numerados claros: 1. Llamado a lista y verificación del quórum, 2. Instalación de la sesión y elección de Presidente y Secretario, 3. Lectura y aprobación del Orden del Día, 4. Designación de la Comisión Verificadora del Acta, 5. Informe de Gestión de la Administración y del Consejo, 6. Presentación y dictamen de Estados Financieros y Ejecución Presupuestal, 7. Estudio y aprobación del Presupuesto de Ingresos, Gastos e Inversiones, 8. Mantenimiento, Contratos, Seguridad y Convivencia, 9. Proposiciones, Varios y Deliberaciones de los Copropietarios, 10. Resumen de Compromisos, Votaciones y Cierre de la Sesión, adaptándolos fielmente a lo escuchado en el audio).
2. "desarrolloDetallado": Desarrolla CADA UNO de los puntos del orden del día de forma extensa, minuciosa y profesional. En "intervencionesClave" redacta varios párrafos detallados por cada punto (explicando los argumentos expuestos, cifras mencionadas, inquietudes de los asistentes, aclaraciones técnicas/jurídicas/financieras y conclusiones de ese punto). NO resumas en una sola frase; entrega una narrativa completa punto por punto.
3. "summary": Redacta una Síntesis Ejecutiva y Constancia Legal amplia (mínimo 3 párrafos detallados) que resuma la instalación, el desarrollo integral de la reunión y el cumplimiento del Art. 47 de la Ley 675 de 2001.
4. "balanceFinanciero": Extrae o estructura todas las partidas económicas, contratos, presupuestos o cotizaciones discutidas en Pesos Colombianos ($ COP) con su estado de decisión.
5. "decisionesYVotaciones": Registra cada proposición o moción sometida a decisión del órgano colegiado con sus votos a favor, en contra, abstenciones y resultado formal.
6. "compromisos": Lista detallada de todas las tareas, gestiones y obligaciones asignadas, indicando responsable, descripción clara de la tarea y fecha límite.`;

      const actaResponseSchema = {
        type: Type.OBJECT,
        properties: {
          minute_number: { type: Type.STRING },
          president_name: { type: Type.STRING },
          secretary_name: { type: Type.STRING },
          start_time: { type: Type.STRING },
          end_time: { type: Type.STRING },
          quorum_percentage: { type: Type.STRING },
          summary: { type: Type.STRING },
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
              quorum: { type: Type.STRING }
            }
          },
          ordenDelDia: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
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
                  items: { type: Type.STRING }
                }
              },
              required: ["punto", "intervencionesClave"]
            }
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
                estadoDecision: { type: Type.STRING }
              },
              required: ["concepto"]
            }
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
                resultado: { type: Type.STRING }
              },
              required: ["proposicion", "resultado"]
            }
          },
          compromisos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                responsable: { type: Type.STRING },
                tarea: { type: Type.STRING },
                fechaLimite: { type: Type.STRING }
              },
              required: ["responsable", "tarea"]
            }
          }
        },
        required: [
          "minute_number",
          "summary",
          "ordenDelDia",
          "desarrolloDetallado",
          "balanceFinanciero",
          "decisionesYVotaciones",
          "compromisos"
        ]
      };

      let response;
      if (audioParts.length > 0) {
        try {
          response = await generateContentWithFallback(ai, {
            contents: [
              {
                role: "user",
                parts: [...audioParts, { text: promptActa }]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema: actaResponseSchema
            }
          });
        } catch (audioErr: any) {
          console.warn("[/api/process-meeting] Reintentando en modo estructurado tras error con adjunto binario:", audioErr?.message);
          response = await generateContentWithFallback(ai, {
            contents: promptActa,
            config: {
              responseMimeType: "application/json",
              responseSchema: actaResponseSchema
            }
          });
        }
      } else {
        response = await generateContentWithFallback(ai, {
          contents: promptActa,
          config: {
            responseMimeType: "application/json",
            responseSchema: actaResponseSchema
          }
        });
      }

      const parsed = JSON.parse(response.text || "{}");
      const compromisosNormalizados = Array.isArray(parsed.compromisos)
        ? parsed.compromisos.map((c: any) =>
            typeof c === "string"
              ? { responsable: "Administración / Consejo", tarea: c, fechaLimite: "Próxima sesión" }
              : {
                  responsable: c.responsable || "Administración",
                  tarea: c.tarea || "",
                  fechaLimite: c.fechaLimite || c.fecha_limite || "Próxima sesión"
                }
          )
        : [];

      const acta = {
        id: `act-${Date.now()}`,
        minute_number: parsed.minute_number || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
        meeting_type: parsed.encabezado?.organo || meetingType,
        meeting_date: parsed.encabezado?.fecha || meetingDate,
        start_time: parsed.encabezado?.horaInicio || parsed.start_time || "18:00",
        end_time: parsed.encabezado?.horaFin || parsed.end_time || "21:00",
        quorum_percentage: parsed.encabezado?.quorum || parsed.quorum_percentage || quorumPercentage,
        president_name:
          parsed.encabezado?.presidente ||
          parsed.president_name ||
          (req as any).user?.email?.split("@")[0] ||
          "Presidente de la Sesión",
        secretary_name:
          parsed.encabezado?.secretario ||
          parsed.secretary_name ||
          "Secretaría / Administración",
        summary: parsed.summary || "Acta generada conforme al Artículo 47 de la Ley 675 de 2001.",
        encabezado: parsed.encabezado || {
          copropiedad: tenantName,
          organo: meetingType,
          fecha: meetingDate,
          horaInicio: parsed.start_time || "18:00",
          horaFin: parsed.end_time || "21:00",
          presidente: parsed.president_name || "Presidente de la Sesión",
          secretario: parsed.secretary_name || "Secretaría / Administración",
          quorum: `${quorumPercentage}%`
        },
        ordenDelDia: Array.isArray(parsed.ordenDelDia) ? parsed.ordenDelDia : [],
        desarrolloDetallado: Array.isArray(parsed.desarrolloDetallado) ? parsed.desarrolloDetallado : [],
        balanceFinanciero: Array.isArray(parsed.balanceFinanciero) ? parsed.balanceFinanciero : [],
        decisionesYVotaciones: Array.isArray(parsed.decisionesYVotaciones) ? parsed.decisionesYVotaciones : [],
        compromisos: compromisosNormalizados,
        commitments: compromisosNormalizados,
        status: "Aprobada / Foliada"
      };

      if (safeUploadId) {
        audioUploadMetaByUploadId.delete(safeUploadId);
      }

      return res.json({ success: true, acta });
    } catch (err: any) {
      console.error("Error generando acta en /api/process-meeting:", err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (tempFilePathToClean && fs.existsSync(tempFilePathToClean)) {
        try {
          fs.unlinkSync(tempFilePathToClean);
        } catch {}
      }
    }
  });

  // Endpoint de alta velocidad para recibir fragmentos binarios de archivos grandes (300MB+) sin límites ni bloqueos
  app.post("/api/upload-audio-chunk", requireAuth, async (req, res) => {
    try {
      const rawUploadId = req.query.uploadId || req.body?.uploadId || `aud_${Date.now()}`;
      const safeUploadId = String(rawUploadId).replace(/[^a-zA-Z0-9_-]/g, "");
      const chunkIndex = Number(req.query.chunkIndex ?? req.body?.chunkIndex ?? 0);
      const mimeType = String(req.query.mimeType || req.body?.mimeType || "audio/mp3");

      let buffer: Buffer;

      // Si express.json() ya parseó un cuerpo JSON (por ejemplo, audioBase64)
      if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body) && Object.keys(req.body).length > 0) {
        const b64 = String(req.body.audioBase64 || req.body.base64Data || req.body.chunkData || "").replace(
          /^data:audio\/[^;]+;base64,/,
          ""
        );
        buffer = b64 ? Buffer.from(b64, "base64") : Buffer.alloc(0);
      } else {
        // Capturar el stream binario directamente en crudo (application/octet-stream)
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        buffer = Buffer.concat(chunks);
      }

      if (!buffer || buffer.length === 0) {
        return res.status(400).json({ error: "No se recibió un fragmento de audio válido." });
      }

      const tempFilePath = path.join(os.tmpdir(), `urbix_upload_${safeUploadId}.bin`);
      if (chunkIndex === 0 && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch {}
      }

      fs.appendFileSync(tempFilePath, buffer);

      const prevMeta = audioUploadMetaByUploadId.get(safeUploadId);
      audioUploadMetaByUploadId.set(safeUploadId, {
        filePath: tempFilePath,
        mimeType,
        totalBytes: (prevMeta?.totalBytes || 0) + buffer.length,
        chunksReceived: (prevMeta?.chunksReceived || 0) + 1
      });

      return res.json({
        success: true,
        uploadId: safeUploadId,
        chunkIndex,
        bytesStored: buffer.length
      });
    } catch (err: any) {
      console.error("Error almacenando fragmento de audio en /api/upload-audio-chunk:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // OCR e Inteligencia Artificial Multimodal para Planillas PILA / ARL
  app.post("/api/ocr-pila", requireAuth, async (req, res) => {
    try {
      let base64Data = req.body?.base64Data;
      let mimeType = req.body?.mimeType || 'application/pdf';

      if (!base64Data && req.is('multipart/form-data')) {
        const chunks: Buffer[] = [];
        for await (const chunk of req) {
          chunks.push(chunk);
        }
        const fullBuffer = Buffer.concat(chunks);
        const headerEnd = fullBuffer.indexOf('\r\n\r\n');
        if (headerEnd !== -1) {
          const bodyBuffer = fullBuffer.subarray(headerEnd + 4);
          const footerStart = bodyBuffer.lastIndexOf('\r\n--');
          const cleanBuffer = footerStart !== -1 ? bodyBuffer.subarray(0, footerStart) : bodyBuffer;
          base64Data = cleanBuffer.toString('base64');
        } else {
          base64Data = fullBuffer.toString('base64');
        }
      }

      if (!base64Data) {
        return res.status(400).json({ error: "No se envió ningún archivo" });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor" });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analiza este documento de seguridad social (Planilla PILA o Certificado ARL de Colombia). Extrae con total precisión: 1. Razón social o nombre de la empresa / independiente. 2. NIT o número de identificación. 3. Nombre de la aseguradora ARL. 4. Fecha de fin de vigencia de la cobertura (formato YYYY-MM-DD). 5. Lista de todos los cotizantes / trabajadores encontrados con nombre completo, número de cédula y EPS.`;

      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'application/pdf',
                  data: base64Data
                }
              },
              { text: prompt }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              company_name: { type: Type.STRING },
              nit: { type: Type.STRING },
              arl_provider: { type: Type.STRING },
              pila_coverage_expires: { type: Type.STRING },
              workers: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    full_name: { type: Type.STRING },
                    document_id: { type: Type.STRING },
                    eps_name: { type: Type.STRING }
                  },
                  required: ['full_name', 'document_id']
                }
              }
            },
            required: ['company_name', 'pila_coverage_expires', 'workers']
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{}');
      return res.json(parsedData);
    } catch (error: any) {
      console.error('Error procesando PILA con IA:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // OCR Financiero y Tesorería
  app.post("/api/ocr-tesoreria-pago", requireAuth, async (req, res) => {
    try {
      const { base64Data, mimeType = 'application/pdf' } = req.body || {};

      if (!base64Data) {
        return res.status(400).json({ error: "No se proporcionó el archivo del comprobante." });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptTesoreria = `Analiza este comprobante de pago de cuota de administración o extracto bancario para copropiedad en Colombia (Ley 675). Extrae con precisión: 1. Nombre del pagador o residente. 2. Documento de identidad o NIT. 3. Apartamento o inmueble. 4. Valor exacto pagado en Pesos Colombianos ($ COP). 5. Fecha de la transacción (YYYY-MM-DD). 6. Número de referencia o comprobante.`;

      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'application/pdf',
                  data: base64Data
                }
              },
              { text: promptTesoreria }
            ]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              payer_name: { type: Type.STRING },
              document_id: { type: Type.STRING },
              unit_reference: { type: Type.STRING },
              amount_paid_cop: { type: Type.NUMBER },
              transaction_date: { type: Type.STRING },
              reference_number: { type: Type.STRING },
              payment_status: { type: Type.STRING }
            },
            required: ['payer_name', 'amount_paid_cop', 'unit_reference']
          }
        }
      });

      const parsedData = JSON.parse(response.text || '{}');
      return res.json({ success: true, paymentData: parsedData });
    } catch (error: any) {
      console.error('Error procesando OCR financiero:', error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Meta Cloud API oficial para alertas de WhatsApp
  app.post("/api/webhook/whatsapp-alert", requireAuth, async (req, res) => {
    try {
      const { eventType, record, tenantName, whatsappConfig } = req.body || {};

      if (!record) {
        return res.status(400).json({ error: "Faltan datos en el registro a notificar" });
      }

      if (whatsappConfig && !whatsappConfig.enabled) {
        return res.json({ success: false, message: "Notificaciones de WhatsApp desactivadas por la administración." });
      }

      // Normalización de número telefónico (Prefijo Colombia +57 si no lo tiene)
      let rawPhone = String(record.phone || "").replace(/\D/g, "");
      if (rawPhone.length === 10 && rawPhone.startsWith("3")) {
        rawPhone = `57${rawPhone}`;
      }

      if (!rawPhone || rawPhone.length < 10) {
        return res.status(400).json({ error: "Número de teléfono inválido para entrega de WhatsApp" });
      }

      let mensajeTexto = "";
      if (eventType === "NEW_PACKAGE") {
        mensajeTexto = `📦 *URBIX PH - Encomienda en Portería*\n\nEstimado(a) *${record.destinatario}*, tienes una entrega de *${record.empresa || "Mensajería"}* (Guía: ${record.guia || "S/N"}).\n\nPreséntate en portería con tu PIN de retiro: *${record.pinRetiro}*.`;
      } else if (eventType === "COBRO_NOTIFICACION") {
        mensajeTexto = record.mensajeDirecto;
      } else if (eventType === "RESERVATION_APPROVED") {
        mensajeTexto = `✅ *URBIX PH - Reserva Aprobada*\n\nHola *${record.resident}*, tu solicitud para el espacio *${record.amenity}* el día *${record.date}* ha sido *APROBADA*.`;
      } else {
        mensajeTexto = record.mensajeDirecto || `Aviso oficial de la administración - ${tenantName}`;
      }

      const metaToken = whatsappConfig?.token || process.env.WHATSAPP_API_TOKEN;
      const phoneId = whatsappConfig?.phoneId || process.env.WHATSAPP_PHONE_ID;

      // Si las variables de Meta están configuradas, despachar llamada HTTP directa a Graph API v21.0
      if (metaToken && phoneId) {
        const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: rawPhone,
            type: "text",
            text: { preview_url: false, body: mensajeTexto }
          })
        });

        const metaData = await metaResponse.json();
        if (!metaResponse.ok) {
          throw new Error(`Error en Meta Cloud API: ${JSON.stringify(metaData)}`);
        }

        return res.json({ success: true, dispatchedTo: rawPhone, messageId: metaData.messages?.[0]?.id });
      }

      return res.status(500).json({ error: "WHATSAPP_API_TOKEN o WHATSAPP_PHONE_ID no configurados en el servidor." });
    } catch (err: any) {
      console.error("Error despachando WhatsApp:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Servidor Vite / Estáticos en producción
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
    console.log(`Servidor Urbix PH operativo en http://localhost:${PORT}`);
  });
}

startServer();
