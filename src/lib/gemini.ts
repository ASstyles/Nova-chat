import { GoogleGenAI } from "@google/genai";
import { Message, Attachment } from "../types";

const apiKey = process.env.GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export interface ChatOptions {
  messages: Message[];
  systemInstruction?: string;
  deepThinking?: boolean;
}

export interface GeminiResponse {
  text: string;
  reasoningText?: string;
  isImageRequest?: boolean;
  imagePrompt?: string;
}

export async function chatWithGemini(options: ChatOptions): Promise<GeminiResponse> {
  const { messages, systemInstruction, deepThinking = false } = options;

  try {
    let finalSystemInstruction = systemInstruction || 
      "You are Nova, an intelligent, friendly, and helpful AI assistant. Provide concise, clear, and well-formatted markdown responses.";

    if (deepThinking) {
      finalSystemInstruction += "\n\nDEEP THINKING MODE IS ACTIVE: Before answering the user's prompt, explicitly think step-by-step. Place your internal reasoning inside <thinking>...</thinking> tags first, followed by your final well-crafted answer outside the tags.";
    }

    // Convert messages to Gemini API contents format
    const contents = messages.map(msg => {
      const parts: any[] = [{ text: msg.content }];

      // Attachments (e.g. Images)
      if (msg.attachments && msg.attachments.length > 0) {
        msg.attachments.forEach(att => {
          if (att.type === 'image' && att.dataUrl) {
            // Extract base64 data
            const base64Data = att.dataUrl.split(',')[1] || att.dataUrl;
            parts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/png',
                data: base64Data
              }
            });
          }
        });
      }

      return {
        role: msg.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents,
      config: {
        systemInstruction: finalSystemInstruction,
      }
    });

    const rawText = response.text || "I apologize, but I couldn't generate a response.";

    // Parse reasoning trace if present
    let reasoningText: string | undefined;
    let mainText = rawText;

    const thinkingMatch = rawText.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      reasoningText = thinkingMatch[1].trim();
      mainText = rawText.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    }

    return {
      text: mainText,
      reasoningText: reasoningText
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw new Error(error?.message || "Failed to communicate with Gemini AI.");
  }
}

export async function enhancePromptWithGemini(userPrompt: string): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Transform this brief image concept into an extremely detailed, high quality, evocative AI art prompt for FLUX / Midjourney. Expand on lighting, environment, materials, camera angle, atmospheric details, and aesthetic style. Output ONLY the final enhanced prompt text, with no introductory conversational filler.\n\nInput Concept: "${userPrompt}"`
    });

    return response.text?.trim() || userPrompt;
  } catch (e) {
    console.error("Failed to enhance prompt:", e);
    return userPrompt;
  }
}
