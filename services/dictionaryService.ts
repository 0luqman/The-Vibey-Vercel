import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

/**
 * fetchDefinition - Retrieves definitions from Gemini API.
 * The API_KEY must be set in the environment (Vercel Dashboard or .env file).
 */
export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  // Access the API key. 
  // Note: On Vercel static sites, this must be available at runtime or injected.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.error("API_KEY is missing or using placeholder. Please set API_KEY in your environment variables.");
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Define the English word: "${word}".`,
      config: {
        systemInstruction: "You are a concise dictionary assistant. Respond ONLY with a JSON object. Provide a short English definition and a natural Urdu translation. { \"english\": \"definition\", \"urdu\": \"translation\" }",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            english: { type: Type.STRING },
            urdu: { type: Type.STRING },
          },
          required: ["english", "urdu"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_AI_RESPONSE");

    return JSON.parse(text) as DefinitionResponse;
  } catch (error) {
    console.error("Dictionary Service Error:", error);
    throw error;
  }
};
