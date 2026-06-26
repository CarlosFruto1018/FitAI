import { GoogleGenAI } from "@google/genai";

export type LLMProvider = "gemini" | "local";

const MODELS_TO_TRY = [
  "gemini-3.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
  "gemini-3.1-pro-preview",
];

export function getProvider(): LLMProvider {
  if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes("...")) {
    return "gemini";
  }
  return "local";
}

export async function llmComplete(system: string, user: string): Promise<string> {
  const provider = getProvider();
  if (provider !== "gemini") return "";

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY!,
    httpOptions: { headers: { "User-Agent": "aistudio-build" } },
  });

  let lastError: unknown = null;
  for (const modelName of MODELS_TO_TRY) {
    try {
      const res = await ai.models.generateContent({
        model: modelName,
        contents: user,
        config: { systemInstruction: system, temperature: 0.7 },
      });
      if (res?.text) return res.text;
    } catch (err) {
      console.warn(`Model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }
  throw lastError || new Error("No Gemini model could generate a response");
}
