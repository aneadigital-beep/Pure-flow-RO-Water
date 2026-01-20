
import { GoogleGenAI } from "@google/genai";

export interface AIResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Service to interact with Gemini API with Google Cloud Search Grounding.
 */
export const getWaterAdvice = async (prompt: string): Promise<AIResponse> => {
  // Using process.env.API_KEY directly for initialization as per coding guidelines
  if (!process.env.API_KEY || process.env.API_KEY.trim() === "") {
    return {
      text: "I am currently disconnected from my AI knowledge base. Please contact support or check back later.",
      sources: []
    };
  }

  try {
    // Correct initialization: always use new GoogleGenAI({apiKey: process.env.API_KEY});
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `
          You are the "PureFlow AI Assistant", an expert in water quality and community logistics.
          
          Context for PureFlow Delivery:
          - Deliveries are grouped into 3 slots: Morning (8-11AM), Afternoon (12-3PM), Evening (4-7PM).
          - Orders placed before 10 AM are same-day. After 10 AM are next-day.
          - 20L Water Can costs ₹35. Delivery Fee is ₹10.
          
          If a user asks why they haven't received their items:
          1. Be empathetic.
          2. Ask if their selected delivery window (Morning, Afternoon, or Evening) has passed yet.
          3. Remind them that high demand can sometimes cause slight delays.
          4. Suggest they check the "Orders" tab to see if the status has changed to "Out for Delivery".
          5. If they are still worried, tell them to use the "Support" tab to contact the dispatch team directly.
          
          Guidelines:
          - Use Google Search for health or RO water science questions.
          - Keep answers helpful and professional.
          - Responses MUST be concise (max 3 sentences).
        `,
      },
    });

    // Accessing .text property directly (correct per guidelines)
    const text = response.text || "I processed your request but couldn't generate a clear response. How else can I help?";
    
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
