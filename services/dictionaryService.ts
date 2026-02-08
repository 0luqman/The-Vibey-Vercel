import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionResponse } from "../types";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const fetchDefinition = async (word: string): Promise<DefinitionResponse> => {
  const ai = getClient();
  if (!ai) {
    throw new Error("API Key configuration error");
  }

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
