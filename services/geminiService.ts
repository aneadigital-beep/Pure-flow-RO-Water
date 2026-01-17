
import { GoogleGenAI } from "@google/genai";

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Service to interact with Gemini API with Google Cloud Search Grounding.
 */
export const getWaterAdvice = async (prompt: string): Promise<AIResponse> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for efficiency + Google Search capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are the "Township PureFlow Assistant", a helpful AI powered by Google Cloud.
          
          Guidelines:
          - Use Google Search to provide up-to-date facts about water quality, health standards, and local weather/news if relevant.
          - Answer questions about RO water, delivery plans (Can: ₹35, Sub: ₹250/mo), and pricing.
          - Keep responses concise (max 3 sentences).
          - ALWAYS be accurate about scientific water standards.
        `,
      },
    });

    const text = response.text || "I couldn't process that. Please try again.";
    
    // Extract grounding chunks (the "Cloud" sources)
    const sources: { title: string; uri: string }[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({
            title: chunk.web.title,
            uri: chunk.web.uri
          });
        }
      });
    }

    return { text, sources };
  } catch (error) {
    console.error("Gemini API Error:", error);
    return { 
      text: "I'm having a bit of trouble connecting to my cloud knowledge. Please check your internet.", 
      sources: [] 
    };
  }
};
