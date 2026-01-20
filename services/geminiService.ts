
import { GoogleGenAI } from "@google/genai";

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Service to interact with Gemini API with Google Cloud Search Grounding.
 */
export const getWaterAdvice = async (prompt: string): Promise<AIResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey.trim() === "") {
    return {
      text: "I am currently disconnected from my AI knowledge base. Please contact support or check back later.",
      sources: []
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Using gemini-3-flash-preview for efficiency + Google Search capabilities
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are the "PureFlow AI Assistant", an expert in water quality and community logistics.
          
          Context for PureFlow:
          - A 20L Water Can costs ₹35.
          - Delivery Fee is ₹10.
          - Weekly Subscriptions cost ₹250/month.
          - Daily Family Plans cost ₹900/month.
          
          Guidelines:
          - Use Google Search to answer health-related questions about RO water, TDS levels, and hydration.
          - Keep answers helpful, empathetic, and professional.
          - If asked about orders, remind the user to check the "Orders" tab.
          - Responses MUST be concise (max 3 sentences).
        `,
      },
    });

    const text = response.text || "I processed your request but couldn't generate a clear response. How else can I help?";
    
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
      text: "I'm having trouble accessing my cloud data. Please check your internet connection.", 
      sources: [] 
    };
  }
};
