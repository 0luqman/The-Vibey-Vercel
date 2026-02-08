
import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

/**
 * fetchDefinition - Retrieves definitions from Gemini API.
 * Uses process.env.API_KEY which must be set in your Vercel/Environment settings.
 */
export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  // Use the API_KEY environment variable name as required.
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.error("API_KEY is missing. Ensure it is set as 'API_KEY' in your environment.");
    throw new Error("MISSING_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Lookup the definition for: "${word}".`,
      config: {
        systemInstruction: `You are a concise bilingual dictionary. 
        - If the word is a valid English word, provide a definition (max 12 words) and a natural Urdu meaning.
        - If the word is nonsensical, keyboard mashing, or junk, return: {"english": "Hmm, I couldn't find a standard definition for that.", "urdu": "یہ کوئی باقاعدہ لفظ معلوم نہیں ہوتا۔"}
        - Always return valid JSON.`,
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
    if (!text) throw new Error("EMPTY_RESPONSE");

    return JSON.parse(text) as DefinitionResponse;
  } catch (error: any) {
    console.error("Dictionary API Error:", error);
    throw error;
  }
};
