
import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

/**
 * fetchDefinition - Retrieves definitions from Gemini API.
 * Prioritizes keys manually set by the user in the web UI.
 */
export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  // Check for a user-provided key in localStorage first
  const userKey = localStorage.getItem('vibey_user_api_key');
  const apiKey = userKey || process.env.API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
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
    if (error.message?.includes('401') || error.message?.includes('API_KEY_INVALID')) {
      throw new Error("INVALID_API_KEY");
    }
    throw error;
  }
};
