import { ChatSession, AppSettings, Persona } from '../types';

const STORAGE_KEYS = {
  SESSIONS: 'nova_chat_sessions_v2',
  ACTIVE_SESSION: 'nova_chat_active_session_id',
  SETTINGS: 'nova_chat_settings_v2',
};

export const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'nova-default',
    name: 'Nova AI',
    description: 'Friendly, intelligent, clear, and balanced AI assistant.',
    icon: 'Sparkles',
    systemInstruction: 'You are Nova, an advanced, highly intelligent, friendly, and helpful AI assistant. Provide accurate, clear, engaging, and well-structured markdown answers. When answering code questions, format code blocks with clear language tags. When asked for image ideas, provide rich descriptive visual details.',
    suggestedPrompts: [
      '🎨 Generate an image of a futuristic neon cyber city at night',
      '💡 Explain quantum computing with an intuitive analogy',
      '💻 Build a responsive React component with Tailwind CSS',
      '✍️ Write a creative sci-fi story opening set on Mars'
    ]
  },
  {
    id: 'senior-architect',
    name: 'Senior Architect',
    description: 'Expert software engineer, systems architect & code optimization advisor.',
    icon: 'Code',
    systemInstruction: 'You are a Principal Software Architect and Systems Design Expert. Provide clean, production-ready, performant code with strict typing, best design patterns, edge-case handling, and architectural explanations. Keep code modern, concise, and clean.',
    suggestedPrompts: [
      '⚡ Optimize a high-concurrency Node.js event listener pattern',
      '🏗️ Design a scalable microservice architecture for real-time chat',
      '🛡️ Implement safe OAuth2 refresh token rotation in TypeScript',
      '🔍 Refactor this code snippet for clean architecture & performance'
    ]
  },
  {
    id: 'creative-artist',
    name: 'Visionary Artist',
    description: 'Creative visual designer, prompt engineer & aesthetic advisor.',
    icon: 'Palette',
    systemInstruction: 'You are a world-class Visual Artist, Art Director, and Master AI Prompt Engineer. When users ask for visual concepts or image prompts, craft ultra-detailed, evocative prompts covering lighting, atmosphere, art style, camera angles, color palette, and rendering engine details.',
    suggestedPrompts: [
      '🎨 Create 3 stunning image generation prompts for an album cover',
      '🌇 Describe a glassmorphic UI design system palette',
      '🐉 Design a mythical creature with detailed visual descriptions',
      '📸 Craft a photorealistic portrait prompt with studio lighting'
    ]
  },
  {
    id: 'business-strategist',
    name: 'Executive Strategist',
    description: 'Productivity analyst, business consultant & strategic execution expert.',
    icon: 'TrendingUp',
    systemInstruction: 'You are an Executive Business Strategist and Product Manager. Provide structured, actionable insights, bulleted frameworks, risk assessments, and executive summaries.',
    suggestedPrompts: [
      '📊 Create a 30-60-90 day product launch roadmap',
      '🚀 Write a compelling pitch deck outline for a new AI startup',
      '🎯 Analyze competitive positioning for a SaaS platform',
      '⏱️ Formulate a high-impact daily productivity workflow'
    ]
  },
  {
    id: 'socratic-mentor',
    name: 'Socratic Tutor',
    description: 'Patient teacher who breaks down complex concepts step-by-step.',
    icon: 'GraduationCap',
    systemInstruction: 'You are a Socratic Tutor and Educator. Explain difficult concepts with crystal-clear metaphors, step-by-step breakdowns, real-world examples, and thought-provoking follow-up questions.',
    suggestedPrompts: [
      '🧠 Explain how Neural Networks process image data step-by-step',
      '🌌 How does gravity warp time according to general relativity?',
      '🧬 Explain CRISPR gene editing like I am 12 years old',
      '📐 Walk me through Bayes theorem with a practical example'
    ]
  }
];

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'cyber',
  personaId: 'nova-default',
  deepThinking: false,
  speechVoice: '',
  speechRate: 1.0,
  autoSpeak: false,
};

export const createNewSession = (personaId: string = 'nova-default'): ChatSession => {
  const now = Date.now();
  return {
    id: `session_${now}_${Math.random().toString(36).substring(2, 7)}`,
    title: 'New Conversation',
    messages: [],
    createdAt: now,
    updatedAt: now,
    personaId,
  };
};

export const getSavedSessions = (): ChatSession[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load sessions:', e);
    return [];
  }
};

export const saveSessions = (sessions: ChatSession[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save sessions:', e);
  }
};

export const getActiveSessionId = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
};

export const saveActiveSessionId = (id: string) => {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, id);
};

export const getSavedSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = (settings: AppSettings) => {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};
