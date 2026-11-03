import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
  app.use(express.json({ limit: "5mb" }));
  app.use(express.urlencoded({ limit: "5mb", extended: true }));

  // Bus de señalización en tiempo real para citofonía y eventos de portería
  const porteriaSseClients = new Set<express.Response>();
  let llamadaCitofonoActivaCache: { payload: any; timestamp: number } | null = null;

  app.get("/api/asamblea-events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();
    porteriaSseClients.add(res);

    if (llamadaCitofonoActivaCache && Date.now() - llamadaCitofonoActivaCache.timestamp < 90000) {
      res.write(`data: ${JSON.stringify({ event: "solicitar_llamada", payload: llamadaCitofonoActivaCache.payload })}\n\n`);
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
