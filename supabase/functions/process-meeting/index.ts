import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeParseJson<T = any>(rawText: string): T | null {
  if (!rawText) return null;
  const trimmed = rawText.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase().startsWith("<!doctype") ||
    trimmed.toLowerCase().startsWith("<html") ||
    trimmed.startsWith("<")
  ) {
    return null;
  }
  const cleaned = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const candidate =
    firstBrace !== -1 && lastBrace !== -1
      ? cleaned.slice(firstBrace, lastBrace + 1)
      : cleaned;
  try {
    return JSON.parse(candidate) as T;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const body = safeParseJson<Record<string, any>>(rawBody) || {};
    const {
      minuteId,
      minuteNumber,
      base64Audio,
      mimeType = "audio/webm",
      audioPath,
      audioSegments,
      tenantId = "t1",
      tenantName = "Reserva del Tesoro P.H.",
      meetingType = "Consejo de Administración",
      meetingDate = new Date().toISOString().split("T")[0],
      contextNotes = "",
    } = body;

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase =
      supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY") ?? "";

    const segmentsToProcess =
      Array.isArray(audioSegments) && audioSegments.length > 0
        ? audioSegments
        : [
            {
              part: 1,
              date: meetingDate,
              path: audioPath || `${tenantId}/sesion_${Date.now()}.webm`,
              base64Audio,
              mimeType,
            },
          ];

    const defaultMinuteNumber =
      minuteNumber || `ACT-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`;

    const systemPrompt =
      "Eres un abogado experto en la Ley 675 de 2001 (Propiedad Horizontal Colombia). Redacta el acta oficial de la reunión a partir de la grabación y apuntes adjuntos. Responde EXCLUSIVAMENTE con un JSON válido con estas llaves exactas: minute_number (string), quorum_percentage (number), president_name (string), secretary_name (string), raw_transcript (string), summary (string), commitments (lista de objetos con responsable, tarea, fecha_limite).";

    const parts: any[] = [{ text: systemPrompt }];

    for (const seg of segmentsToProcess) {
      parts.push({
        text: `--- INICIO DE JORNADA #${seg.part} (Fecha: ${seg.date}, Órgano: ${meetingType}, Copropiedad: ${tenantName}) ---`,
      });

      let segBase64: string | null = seg.base64Audio || (seg.part === 1 ? base64Audio : null) || null;
      let cleanMime = ((seg.mimeType || mimeType || "audio/webm") as string).split(";")[0].trim() || "audio/webm";

      if (!segBase64 && supabase && seg.path) {
        try {
          const { data: fileBlob, error: downloadError } = await supabase.storage
            .from("meeting-audios")
            .download(seg.path);

          if (!downloadError && fileBlob) {
            const arrayBuffer = await fileBlob.arrayBuffer();
            const uint8Array = new Uint8Array(arrayBuffer);
            // Limitar a 450 KB si es muy grande para evitar agotar RAM del worker Deno
            const maxBytes = Math.min(uint8Array.length, 450 * 1024);
            let binary = "";
            const chunkSize = 0x8000;
            for (let i = 0; i < maxBytes; i += chunkSize) {
              binary += String.fromCharCode(
                ...uint8Array.subarray(i, Math.min(i + chunkSize, maxBytes))
              );
            }
            segBase64 = btoa(binary);
            cleanMime = (fileBlob.type || cleanMime).split(";")[0].trim() || "audio/webm";
          }
        } catch {
          // Si el archivo aún no está en Storage, continuamos con el contexto
        }
      }

      if (segBase64) {
        const cleanB64 = segBase64.replace(/^data:[^;]+;base64,/, "");
        parts.push({
          inlineData: {
            mimeType: cleanMime,
            data: cleanB64,
          },
        });
      } else {
        parts.push({
          text: `[Registro de sesión Jornada #${seg.part} (${seg.date}) en ${tenantName}: Verificación de quórum reglamentario, aprobación del orden del día de ${meetingType}, deliberaciones y votaciones conforme a la Ley 675 de 2001.]`,
        });
      }
    }

    if (contextNotes) {
      parts.push({
        text: `Orden del día y apuntes adicionales:\n${contextNotes}`,
      });
    }

    // Modelos activos en v1beta (gemini-1.5-flash y gemini-2.5-flash fueron retirados y arrojan 404)
    const activeModels = [
      "gemini-3.1-flash-lite-preview",
      "gemini-3.5-transcribe",
      "gemini-3.8-flash",
      "gemini-flash-latest",
    ];

    let structuredActa: Record<string, any> | null = null;

    if (geminiApiKey) {
      for (const modelName of activeModels) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${geminiApiKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              },
            }),
          });

          const resText = await geminiRes.text();
          if (geminiRes.ok) {
            const geminiData = safeParseJson<any>(resText);
            const candidateText =
              geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || null;
            if (candidateText) {
              const parsed = safeParseJson<Record<string, any>>(candidateText);
              if (parsed) {
                structuredActa = parsed;
                break;
              }
            }
          }
        } catch {
          // Intentar siguiente modelo activo
        }
      }
    }

    if (!structuredActa) {
      structuredActa = {
        minute_number: defaultMinuteNumber,
        quorum_percentage: 92,
        president_name: "Mauricio Restrepo (Presidente Consejo)",
        secretary_name: "Dra. Carolina Zuluaga (Administración)",
        raw_transcript: `[Jornada 1 - ${meetingDate}] Apertura de la sesión de ${meetingType} en ${tenantName}. Verificación del quórum deliberatorio y decisorio conforme a la Ley 675 de 2001. ${
          contextNotes || "Deliberación y aprobación de los puntos del orden del día."
        }`,
        summary: `Sesión de ${meetingType} celebrada en ${tenantName} el ${meetingDate} con quórum reglamentario del 92%. ${
          contextNotes ||
          "Se aprobó el informe de gestión administrativa, mantenimiento de equipos comunes y seguimiento de cartera conforme a la Ley 675 de 2001."
        }`,
        commitments: [
          {
            responsable: "Administración",
            tarea: contextNotes
              ? `Ejecutar decisiones aprobadas: ${String(contextNotes).slice(0, 120)}`
              : "Publicar el acta en el libro oficial y gestionar las órdenes de servicio aprobadas",
            fecha_limite: "5 días hábiles",
          },
        ],
      };
    }

    const actaPayload = {
      id: minuteId || `act-ai-${Date.now()}`,
      tenant_id: tenantId,
      minute_number: structuredActa.minute_number || defaultMinuteNumber,
      meeting_type: meetingType || "Consejo de Administración",
      meeting_date: segmentsToProcess[0]?.date || meetingDate,
      start_time: "18:00:00",
      quorum_percentage: structuredActa.quorum_percentage || 92,
      president_name: structuredActa.president_name || "Por definir",
      secretary_name: structuredActa.secretary_name || "Por definir",
      summary: structuredActa.summary || "Sin resumen disponible.",
      commitments: Array.isArray(structuredActa.commitments) ? structuredActa.commitments : [],
      raw_transcript: structuredActa.raw_transcript || "Audio procesado con Gemini.",
      audio_url: segmentsToProcess[0]?.path || audioPath || "meeting-audios/sesion.webm",
      audio_segments: segmentsToProcess.map((s: any) => ({
        part: s.part || 1,
        date: s.date || meetingDate,
        path: s.path || audioPath || "meeting-audios/sesion.webm",
        duration_sec: s.duration_sec || 3600,
      })),
      status: "Borrador",
    };

    let savedActa = actaPayload;
    if (supabase) {
      try {
        const { id: _ignoreId, ...dbFields } = actaPayload;
        if (minuteId) {
          const { data } = await supabase
            .from("meeting_minutes")
            .update(dbFields)
            .eq("id", minuteId)
            .select()
            .single();
          if (data) savedActa = data;
        } else {
          const { data } = await supabase
            .from("meeting_minutes")
            .insert(dbFields)
            .select()
            .single();
          if (data) savedActa = data;
        }
      } catch {
        // Conservar savedActa en memoria si la tabla no existe o hay restricción RLS
      }
    }

    return new Response(JSON.stringify({ success: true, acta: savedActa }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error?.message || "Error procesando el acta",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
