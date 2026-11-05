import express from "express";
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

  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ limit: "20mb", extended: true }));

  // Verificación de estado de sesión
  app.get("/api/auth/verify", requireAuth, (req, res) => {
    res.json({ valid: true, user: (req as any).user });
  });

  // Copilot de consultas para residentes (Régimen Ley 675)
  app.post("/api/copilot-chat", async (req, res) => {
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

  // Procesamiento y Generación de Actas de Asamblea / Consejo con IA (Ley 675)
  app.post("/api/process-meeting", requireAuth, async (req, res) => {
    try {
      const {
        meetingType = 'Asamblea General Ordinaria',
        meetingDate = new Date().toISOString().split('T')[0],
        contextNotes = '',
        tenantName = 'Copropiedad PH',
        quorumPercentage = 100
      } = req.body || {};

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY no configurada en el servidor." });
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptActa = `Eres un asesor legal experto en Propiedad Horizontal en Colombia (Ley 675 de 2001). Genera el contenido oficial para un Acta de ${meetingType} para la copropiedad "${tenantName}". Fecha: ${meetingDate}. Quórum: ${quorumPercentage}%. Contexto y mociones: "${contextNotes || 'Sesión ordinaria con quórum verificado y mociones aprobadas.'}" Redacta: 1. Resumen ejecutivo formal (summary) 2. Lista de compromisos (commitments) 3. Número consecutivo de acta (minute_number) 4. Presidente y secretario designados.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptActa,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              minute_number: { type: Type.STRING },
              summary: { type: Type.STRING },
              commitments: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              president_name: { type: Type.STRING },
              secretary_name: { type: Type.STRING }
            },
            required: ['minute_number', 'summary']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      const acta = {
        id: `act-${Date.now()}`,
        minute_number: parsed.minute_number || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
        meeting_type: meetingType,
        meeting_date: meetingDate,
        quorum_percentage: quorumPercentage,
        president_name: parsed.president_name || (req as any).user?.email?.split('@')[0] || 'Presidente Designado',
        secretary_name: parsed.secretary_name || 'Secretario Designado',
        summary: parsed.summary || 'Acta generada conforme a la Ley 675.',
        commitments: parsed.commitments || [],
        status: 'Borrador'
      };

      return res.json({ success: true, acta });
    } catch (err: any) {
      console.error('Error generando acta en /api/process-meeting:', err);
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
