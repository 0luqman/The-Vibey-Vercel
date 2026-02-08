
import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

// The fetchDefinition function retrieves word definitions using the Gemini API.
export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  // Always initialize GoogleGenAI using the process.env.API_KEY directly.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide the definition for the word: "${word}".`,
      config: {
        systemInstruction: "You are a concise dictionary helper. Always return the output in JSON format containing the 'english' definition (short and clear) and the 'urdu' translation/meaning. Keep the English definition under 20 words.",
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

    // The simplest and most direct way to get the generated text content is by accessing the .text property.
    const text = response.text;
    if (!text) {
      throw new Error("Empty response from AI");
    }

    const data = JSON.parse(text) as DefinitionResponse;
    return data;
  } catch (error) {
    console.error("Error fetching definition:", error);
    throw error;
  }
};
