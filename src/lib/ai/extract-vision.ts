import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

const MODELS_TO_TRY = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

export const VisionExtractionSchema = z.object({
  image_type: z.enum([
    "gym_machine",
    "cardio_display",
    "smartwatch",
    "barbell_plates",
    "workout_sheet",
    "progress_selfie",
    "other",
  ]),
  exercises: z
    .array(
      z.object({
        canonical: z.string(),
        sets: z.array(
          z.object({
            reps: z.number().nullable(),
            weight_kg: z.number().nullable(),
            duration_sec: z.number().nullable(),
            distance_m: z.number().nullable(),
          })
        ),
      })
    )
    .default([]),
  session_metrics: z
    .object({
      duration_min: z.number().nullable(),
      calories: z.number().nullable(),
      heart_rate_avg: z.number().nullable(),
      heart_rate_max: z.number().nullable(),
      distance_m: z.number().nullable(),
      speed_kmh: z.number().nullable(),
    })
    .partial()
    .default({}),
  description: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type VisionExtraction = z.infer<typeof VisionExtractionSchema>;

export async function extractFromImage(
  imageBase64: string,
  mimeType: string
): Promise<VisionExtraction> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      image_type: "other",
      exercises: [],
      session_metrics: {},
      description: "API Key de Gemini no configurada",
      confidence: "low",
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  const parts = [
    { inlineData: { mimeType, data: imageBase64 } },
    {
      text: `Analiza esta imagen de entrenamiento físico y extrae información estructurada.
Identifica el tipo de imagen y extrae todos los datos visibles (pesos, series, repeticiones, tiempo, distancia, calorías, ritmo cardíaco, velocidad).
Si es una pantalla de máquina cardio, reloj inteligente o hoja de entrenamiento, lee todos los números visibles.
Si es una foto de discos/barras, estima el peso total si es posible.

Devuelve SOLO JSON válido con este esquema:
{
  "image_type": "gym_machine"|"cardio_display"|"smartwatch"|"barbell_plates"|"workout_sheet"|"progress_selfie"|"other",
  "exercises": [{"canonical": "snake_case_name", "sets": [{"reps":n|null,"weight_kg":n|null,"duration_sec":n|null,"distance_m":n|null}]}],
  "session_metrics": {"duration_min":n|null,"calories":n|null,"heart_rate_avg":n|null,"heart_rate_max":n|null,"distance_m":n|null,"speed_kmh":n|null},
  "description": "descripción breve de lo que se ve",
  "confidence": "high"|"medium"|"low"
}`,
    },
  ];

  let lastError: unknown = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: { parts },
        config: { temperature: 0.1 },
      });
      if (res?.text) {
        const jsonMatch = res.text.match(/```json\n?([\s\S]*?)\n?```/) ?? res.text.match(/(\{[\s\S]*\})/);
        const raw = jsonMatch ? jsonMatch[1] : res.text;
        return VisionExtractionSchema.parse(JSON.parse(raw));
      }
    } catch (err) {
      console.warn(`Model ${modelName} failed for vision, trying next...`, err);
      lastError = err;
    }
  }

  console.error("All Gemini models failed for vision extraction:", lastError);
  return {
    image_type: "other",
    exercises: [],
    session_metrics: {},
    description: "No se pudo extraer información estructurada",
    confidence: "low",
  };
}
