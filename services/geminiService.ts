
import { GoogleGenAI } from "@google/genai";

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Service to interact with Gemini API with Google Cloud Search Grounding.
 */
export const getWaterAdvice = async (prompt: string): Promise<AIResponse> => {
  if (!process.env.API_KEY || process.env.API_KEY.trim() === "") {
    return {
      text: "I am currently disconnected from my AI knowledge base. Please check back later.",
      sources: []
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are the "Punganur Aquaflow AI Assistant". Your job is to help the people of Punganur with their water quality and delivery needs.
          
          Knowledge Base for Punganur Aquaflow:
          - We provide purified RO water across Punganur.
          - 20L Cans cost ₹35 with a ₹10 delivery fee.
          - Morning (8-11AM), Afternoon (12-3PM), Evening (4-7PM) slots.
          - Orders before 10AM are same-day.
          
          If a user asks about delivery status:
          1. Remind them to check the "Orders" tab.
          2. Explain that the "Out for Delivery" status means the van is currently in their street.
          3. If their slot hasn't ended yet, tell them to wait. If it has, suggest contacting support.
          
          Behavioral Guidelines:
          - ALWAYS use Google Search if a user asks a question about health, TDS, or RO technology.
          - Keep answers brief and professional (under 60 words).
          - Be friendly and local to the Punganur community.
        `,
      },
    });

    const text = response.text || "I apologize, but I couldn't process that request right now. How else can I assist you with Punganur Aquaflow services?";
    
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
    console.error("Gemini Production Error:", error);
    return { 
      text: "I'm having trouble connecting to my knowledge cloud. Please try again in a few moments.", 
      sources: [] 
    };
  }
};
