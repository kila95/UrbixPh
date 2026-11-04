import express from "express";
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Límite estándar JSON y forms (sin sobrecargas de 50MB)
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Bus de señalización en tiempo real para citofonía, asamblea y eventos de portería
  const porteriaSseClients = new Set<express.Response>();
  const peerSseClients = new Map<express.Response, string>();
  let llamadaCitofonoActivaCache: { payload: any; timestamp: number } | null = null;
  let asambleaConvocatoriaActivaCache: { payload: any; timestamp: number } | null = null;
  const asambleaParticipantesActivos = new Map<string, any>();

  app.get("/api/asamblea-state", (_req, res) => {
    const convocatoriaVigencia =
      asambleaConvocatoriaActivaCache &&
      Date.now() - asambleaConvocatoriaActivaCache.timestamp < 7200000
        ? asambleaConvocatoriaActivaCache.payload
        : null;
    res.json({
      convocatoriaActiva: convocatoriaVigencia,
      participantes: Array.from(asambleaParticipantesActivos.values())
    });
  });

  app.get("/api/asamblea-events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    porteriaSseClients.add(res);

    const queryPeerId = typeof req.query.peerId === "string" ? req.query.peerId : "";
    if (queryPeerId) {
      peerSseClients.set(res, queryPeerId);
    }

    if (llamadaCitofonoActivaCache && Date.now() - llamadaCitofonoActivaCache.timestamp < 90000) {
      res.write(`data: ${JSON.stringify({ event: "solicitar_llamada", payload: llamadaCitofonoActivaCache.payload })}\n\n`);
    }

    if (asambleaConvocatoriaActivaCache && Date.now() - asambleaConvocatoriaActivaCache.timestamp < 7200000) {
      res.write(`data: ${JSON.stringify({ event: "asamblea_convocatoria_abierta", payload: asambleaConvocatoriaActivaCache.payload })}\n\n`);
    }

    // Enviar participantes actualmente conectados en la sala de asamblea
    for (const participante of asambleaParticipantesActivos.values()) {
      res.write(`data: ${JSON.stringify({ event: "participante_listo", payload: participante })}\n\n`);
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
      porteriaSseClients.delete(res);
      const disconnectedPeerId = peerSseClients.get(res);
      peerSseClients.delete(res);

      if (disconnectedPeerId) {
        setTimeout(() => {
          const stillConnected = Array.from(peerSseClients.values()).includes(disconnectedPeerId);
          if (!stillConnected && asambleaParticipantesActivos.has(disconnectedPeerId)) {
            asambleaParticipantesActivos.delete(disconnectedPeerId);
            const packet = `data: ${JSON.stringify({
              event: "asamblea_peer_salio",
              payload: { peerId: disconnectedPeerId }
            })}\n\n`;
            for (const client of porteriaSseClients) {
              try {
                client.write(packet);
              } catch {
                porteriaSseClients.delete(client);
              }
            }
          }
        }, 2500);
      }
    });
  });

  app.post("/api/asamblea-signal", (req, res) => {
    const { event, payload } = req.body || {};
    if (!event) {
      res.status(400).json({ error: "Falta event" });
      return;
    }

    if (event === "solicitar_llamada") {
      llamadaCitofonoActivaCache = { payload, timestamp: Date.now() };
    } else if (event === "webrtc_answer" || event === "terminar_llamada") {
      llamadaCitofonoActivaCache = null;
    } else if (event === "asamblea_convocatoria_abierta") {
      asambleaConvocatoriaActivaCache = { payload, timestamp: Date.now() };
    } else if (event === "participante_listo" && payload?.peerId) {
      const prev = asambleaParticipantesActivos.get(payload.peerId) || {};
      asambleaParticipantesActivos.set(payload.peerId, {
        ...prev,
        ...payload,
        timestamp: Date.now()
      });
    } else if (event === "asamblea_estado_media" && payload?.peerId) {
      const prev = asambleaParticipantesActivos.get(payload.peerId);
      if (prev) {
        asambleaParticipantesActivos.set(payload.peerId, {
          ...prev,
          micActivo: payload.micActivo ?? prev.micActivo,
          camActiva: payload.camActiva ?? prev.camActiva
        });
      }
    } else if (event === "asamblea_unidad_actualizada" && payload?.peerId) {
      const prev = asambleaParticipantesActivos.get(payload.peerId);
      if (prev) {
        asambleaParticipantesActivos.set(payload.peerId, {
          ...prev,
          unidad: payload.unidad || prev.unidad,
          nombre: payload.nombre || prev.nombre,
          etiqueta: payload.etiqueta || prev.etiqueta
        });
      }
    } else if (event === "asamblea_peer_salio" && payload?.peerId) {
      asambleaParticipantesActivos.delete(payload.peerId);
    } else if (event === "asamblea_cerrada") {
      asambleaParticipantesActivos.clear();
      asambleaConvocatoriaActivaCache = null;
    }

    const packet = `data: ${JSON.stringify({ event, payload })}\n\n`;
    for (const client of porteriaSseClients) {
      try {
        client.write(packet);
      } catch {
        porteriaSseClients.delete(client);
      }
    }
    res.json({ ok: true });
  });

  // Copilot de consultas para residentes (Régimen Ley 675)
  app.post("/api/copilot-chat", async (req, res) => {
    const { prompt, residentContext, chatHistory } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "El mensaje es obligatorio." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY no configurada." });

    let userPromptWithContext = prompt;
    if (residentContext) {
      userPromptWithContext = `[DATOS RESIDENTE]: Inmueble: ${residentContext.unidad} | Propietario: ${residentContext.propietario} | Cuota: $${residentContext.cuotaMensual} | Saldo Mora: $${residentContext.saldoPendiente}\nConsulta: "${prompt}"`;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: userPromptWithContext,
        config: { systemInstruction: URBIX_COPILOT_SYSTEM_PROMPT }
      });
      return res.json({ reply: response.text || "" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Aprovisionamiento censo
  app.post("/api/aprovisionar-residentes-censo", async (req, res) => {
    try {
      const { unidadesCenso, tenantId } = req.body;
      const resultados = await aprovisionarResidentesCenso(unidadesCenso, tenantId);
      return res.json({ success: true, count: resultados.length, resultados });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // OCR e Inteligencia Artificial Multimodal para Planillas PILA / ARL
  app.post("/api/ocr-pila", async (req, res) => {
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

      const prompt = `Analiza este documento de seguridad social (Planilla PILA o Certificado ARL de Colombia).
Extrae con total precisión:
1. Razón social o nombre de la empresa / independiente.
2. NIT o número de identificación.
3. Nombre de la aseguradora ARL.
4. Fecha de fin de vigencia de la cobertura (formato YYYY-MM-DD).
5. Lista de todos los cotizantes / trabajadores encontrados con nombre completo, número de cédula y EPS.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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

  // Webhook backend para despacho de alertas por WhatsApp en Urbix PH
  app.post("/api/webhook/whatsapp-alert", async (req, res) => {
    try {
      const { eventType, record, tenantName, whatsappConfig } = req.body || {};
      
      if (!record) {
        return res.status(400).json({ error: "Faltan datos en el registro" });
      }

      // Validar si la copropiedad tiene activas las alertas
      if (whatsappConfig && !whatsappConfig.enabled) {
        return res.json({ success: false, message: "Notificaciones de WhatsApp desactivadas por la administración." });
      }

      let mensajeWhatsApp = "";
      let telefonoDestino = record.phone || "+573001234567"; // Teléfono del censo del residente

      if (eventType === "NEW_PACKAGE") {
        mensajeWhatsApp = `📦 *URBIX PH - Alerta de Encomienda*\n\nHola *${record.destinatario}*, tu paquete de *${record.empresa}* (Guía: ${record.guia}) ya está disponible en la portería de *${tenantName || 'la copropiedad'}*.\n\nRetira con tu PIN: *${record.pinRetiro}*.`;
      } 
      else if (eventType === "RESERVATION_APPROVED") {
        mensajeWhatsApp = `✅ *URBIX PH - Reserva Aprobada*\n\nHola *${record.resident}*, tu solicitud para el espacio *${record.amenity}* el día *${record.date}* ha sido *APROBADA* por la administración.`;
      }

      // Aquí se conecta con el token configurado por el administrador o el general del .env
      const tokenAPI = whatsappConfig?.token || process.env.WHATSAPP_API_TOKEN;

      if (tokenAPI && mensajeWhatsApp) {
        console.log(`[WhatsApp API Despachada] Copropiedad: ${tenantName} -> Destino: ${telefonoDestino}\n${mensajeWhatsApp}`);
        // Simulación de envío exitoso vía API
      }

      return res.json({ success: true, dispatchedTo: telefonoDestino });
    } catch (err: any) {
      console.error("Error en servidor al enviar WhatsApp:", err.message);
      return res.status(500).json({ error: err.message });
    }
  });

  // Servidor Vite / Estáticos
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
