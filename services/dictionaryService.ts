
import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

/**
 * fetchDefinition - Retrieves definitions from Gemini API.
 * Follows strict guidelines to use process.env.API_KEY directly.
 */
export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  // Use process.env.API_KEY directly as required by the environment configuration.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

    // Access .text property directly (not a method).
    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");

    return JSON.parse(text) as DefinitionResponse;
  } catch (error: any) {
    console.error("Dictionary API Error:", error);
    // Handle unauthorized specifically to help user diagnose bad keys
    if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};
