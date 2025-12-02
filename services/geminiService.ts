
import { GoogleGenAI, Chat } from "@google/genai";
import { BotConfig } from "../types";

let chatSession: Chat | null = null;
let currentConfig: BotConfig | null = null;

/**
 * Initializes or resets the chat session with the new system instruction (script) and API Key.
 */
export const initChatSession = (config: BotConfig) => {
  currentConfig = config;
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: config.systemInstruction,
        temperature: config.temperature,
      },
    });
  } catch (e) {
    console.error("Failed to initialize Gemini instance", e);
    chatSession = null;
  }
};

/**
 * Sends a message to the Gemini model and returns the response text.
 */
export const sendMessageToBot = async (message: string): Promise<string> => {
  if (!chatSession) {
    // Try to re-init if config exists but session is null (edge case)
    if (currentConfig) {
        initChatSession(currentConfig);
    }
    if (!chatSession) {
         return "Errore di inizializzazione. Verifica la configurazione e la chiave API.";
    }
  }

  try {
    const result = await chatSession.sendMessage({ message });
    return result.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Mi dispiace, si è verificato un errore con il servizio AI.";
  }
};
