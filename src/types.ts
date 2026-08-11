export type Role = 'user' | 'assistant';

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file';
  mimeType: string;
  dataUrl: string; // Base64 data URL
  size?: number;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  url: string;
  aspectRatio: string;
  style: string;
  seed: number;
  model: string;
  createdAt: number;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  generatedImages?: GeneratedImage[];
  reasoningText?: string;
  isReasoningOpen?: boolean;
  timestamp: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  pinned?: boolean;
  personaId?: string;
}

export type ThemeMode = 'cyber' | 'light' | 'aurora' | 'emerald';

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
  systemInstruction: string;
  suggestedPrompts: string[];
}

export interface AppSettings {
  theme: ThemeMode;
  personaId: string;
  deepThinking: boolean;
  speechVoice: string;
  speechRate: number;
  autoSpeak: boolean;
}

export interface ImageGenOptions {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '1:1' | '16:9' | '9:16' | '4:3' | '21:9';
  style: string;
  model: 'flux' | 'flux-realism' | 'turbo' | 'anime';
  seed?: number;
  enhancePrompt?: boolean;
}
