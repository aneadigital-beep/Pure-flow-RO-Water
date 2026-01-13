
// Implement the Gemini service using the @google/genai SDK.
import { GoogleGenAI } from "@google/genai";

/**
 * Service to interact with Gemini API for water-related advice and customer support.
 * @param prompt The user's question or message.
 * @returns A promise that resolves to the AI-generated string response.
 */
export const getWaterAdvice = async (prompt: string): Promise<string> => {
  try {
    // Always initialize the client with the API key from process.env.API_KEY.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Using gemini-3-flash-preview for efficient text-based conversational tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: `
          You are the "Township PureFlow Assistant", a helpful AI customer support representative for an RO water delivery service.
          
          Our Business (Township PureFlow):
          - We deliver premium 20L RO purified water cans.
          - Single 20L Can: ₹35.
          - Weekly Subscription: ₹250 per month (2 cans delivered every week).
          - Daily Family Plan: ₹900 per month (1 can delivered daily).
          - Manual Hand Pump: ₹150 (food-grade).
          - Automatic Dispenser: ₹450 (rechargeable).
          
          Guidelines:
          - Provide hydration tips and benefits of RO water.
          - Answer questions about our delivery plans and pricing.
          - Keep responses professional, friendly, and very concise (maximum 3 sentences).
          - If asked about non-water topics, politely stay on the subject of water and health.
        `,
      },
    });

    // Directly access the .text property from the GenerateContentResponse.
    return response.text || "I'm sorry, I couldn't generate a response. Please try again later.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! I'm having a bit of trouble connecting to my water wisdom right now. Please try again in a moment.";
  }
};
