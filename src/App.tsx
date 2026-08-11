import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, User, Sparkles, MessageSquare, Menu, Plus, Image as ImageIcon, 
  Paperclip, Mic, MicOff, Volume2, VolumeX, Wand2, Brain, Settings, 
  Code, Play, Copy, Check, Download, Trash2, X, Eye, FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { 
  ChatSession, Message, Attachment, GeneratedImage, AppSettings, Persona, ThemeMode 
} from './types';
import { 
  getSavedSessions, saveSessions, getActiveSessionId, saveActiveSessionId, 
  getSavedSettings, saveSettings, DEFAULT_PERSONAS, DEFAULT_SETTINGS, createNewSession 
} from './lib/storage';
import { chatWithGemini } from './lib/gemini';
import { generateImage } from './lib/imageGen';
import { SpeechService } from './lib/speech';

import { Sidebar } from './components/Sidebar';
import { ImageGenStudio } from './components/ImageGenStudio';
import { LightboxModal } from './components/LightboxModal';
import { CodePreviewModal } from './components/CodePreviewModal';
import { SettingsModal } from './components/SettingsModal';
import { ThinkingAccordion } from './components/ThinkingAccordion';

export default function App() {
  // State Initialization
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // UI Modals & Drawers
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isImageStudioOpen, setIsImageStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<GeneratedImage | null>(null);
  const [codeSandboxData, setCodeSandboxData] = useState<{ code: string; language: string } | null>(null);

  // Speech Dictation & Audio
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Sessions & Settings on Mount
  useEffect(() => {
    const loadedSettings = getSavedSettings();
    setSettings(loadedSettings);
    document.documentElement.setAttribute('data-theme', loadedSettings.theme);

    const savedSessions = getSavedSessions();
    if (savedSessions.length > 0) {
      setSessions(savedSessions);
      const savedActiveId = getActiveSessionId();
      if (savedActiveId && savedSessions.some(s => s.id === savedActiveId)) {
        setActiveSessionId(savedActiveId);
      } else {
        setActiveSessionId(savedSessions[0].id);
      }
    } else {
      const initialSession = createNewSession(loadedSettings.personaId);
      setSessions([initialSession]);
      setActiveSessionId(initialSession.id);
      saveSessions([initialSession]);
      saveActiveSessionId(initialSession.id);
    }
  }, []);

  // Save Sessions whenever updated
  useEffect(() => {
    if (sessions.length > 0) {
      saveSessions(sessions);
    }
  }, [sessions]);

  // Update Theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  // Auto-scroll message feed
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isGeneratingImage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Session Handlers
  const handleNewSession = (personaId?: string) => {
    const newSess = createNewSession(personaId || settings.personaId);
    setSessions(prev => [newSess, ...prev]);
    setActiveSessionId(newSess.id);
    saveActiveSessionId(newSess.id);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    saveActiveSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    if (updated.length === 0) {
      const fresh = createNewSession(settings.personaId);
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      saveActiveSessionId(fresh.id);
    } else {
      setSessions(updated);
      if (activeSessionId === id) {
        setActiveSessionId(updated[0].id);
        saveActiveSessionId(updated[0].id);
      }
    }
  };

  const handleTogglePinSession = (id: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions(prev =>
      prev.map(s => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleSelectPersona = (personaId: string) => {
    setSettings(prev => {
      const updated = { ...prev, personaId };
      saveSettings(updated);
      return updated;
    });
  };

  const handleSelectTheme = (theme: ThemeMode) => {
    setSettings(prev => {
      const updated = { ...prev, theme };
      saveSettings(updated);
      return updated;
    });
  };

  // Attachment Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      reader.onload = () => {
        const newAttachment: Attachment = {
          id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: isImage ? 'image' : 'file',
          mimeType: file.type || 'text/plain',
          dataUrl: reader.result as string,
          size: file.size,
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Speech Recognition (Voice Dictation)
  const toggleSpeechRecognition = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const rec = SpeechService.initRecognition(
      (text) => {
        setInput(text);
      },
      () => {
        setIsListening(false);
      },
      (err) => {
        console.error('Speech recognition error:', err);
        setIsListening(false);
      }
    );

    if (rec) {
      setIsListening(true);
      rec.start();
    }
  };

  // Text-to-Speech Playback
  const toggleSpeakMessage = (msg: Message) => {
    if (speakingMsgId === msg.id) {
      SpeechService.stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      setSpeakingMsgId(msg.id);
      SpeechService.speak(
        msg.content,
        settings.speechVoice,
        settings.speechRate,
        () => setSpeakingMsgId(msg.id),
        () => setSpeakingMsgId(null)
      );
    }
  };

  // Export Conversation
  const handleExportSession = (session: ChatSession, format: 'json' | 'md') => {
    let content = '';
    let mimeType = 'text/plain';
    let ext = 'txt';

    if (format === 'json') {
      content = JSON.stringify(session, null, 2);
      mimeType = 'application/json';
      ext = 'json';
    } else {
      content = `# ${session.title}\n\nDate: ${new Date(session.createdAt).toLocaleString()}\n\n`;
      session.messages.forEach(m => {
        content += `### ${m.role === 'user' ? 'User' : 'Nova'}\n${m.content}\n\n`;
      });
      mimeType = 'text/markdown';
      ext = 'md';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Core Submit Handler (Chat or Inline Image Gen)
  const handleSubmit = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const messageText = (customInput || input).trim();
    if ((!messageText && attachments.length === 0) || isLoading || isGeneratingImage) return;

    // Check if user is asking to generate an image inline (e.g., "generate image...", "draw a...", "/image ...")
    const isImageIntent = /^(generate image|create image|draw|make an image|\/image)/i.test(messageText);

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: 'user',
      content: messageText,
      attachments: attachments.length > 0 ? [...attachments] : undefined,
      timestamp: Date.now(),
    };

    // Update session title if first message
    const currentTitle = activeSession.title === 'New Conversation' ? messageText.slice(0, 30) || 'Image Generation' : activeSession.title;

    const updatedMessages = [...messages, userMessage];
    
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? { ...s, title: currentTitle, messages: updatedMessages, updatedAt: Date.now() }
          : s
      )
    );

    setInput('');
    setAttachments([]);

    // If explicit image generation intent
    if (isImageIntent) {
      setIsGeneratingImage(true);
      const cleanPrompt = messageText.replace(/^(generate image|create image|draw|make an image|\/image)\s*/i, '').trim() || 'A futuristic cosmic landscape';

      try {
        const generatedImg = await generateImage({
          prompt: cleanPrompt,
          aspectRatio: '1:1',
          style: 'photorealistic',
          model: 'flux',
          enhancePrompt: true,
        });

        const assistantMsg: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: `Here is your generated image for: **"${cleanPrompt}"**`,
          generatedImages: [generatedImg],
          timestamp: Date.now(),
        };

        setSessions(prev =>
          prev.map(s =>
            s.id === activeSession.id
              ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }
              : s
          )
        );
      } catch (err) {
        const errorMsg: Message = {
          id: `msg_${Date.now()}_err`,
          role: 'assistant',
          content: "I ran into an error generating that image. Please try again!",
          timestamp: Date.now(),
        };
        setSessions(prev =>
          prev.map(s =>
            s.id === activeSession.id
              ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }
              : s
          )
        );
      } finally {
        setIsGeneratingImage(false);
      }
      return;
    }

    // Normal Chat Flow with Gemini
    setIsLoading(true);
    const personaObj = DEFAULT_PERSONAS.find(p => p.id === settings.personaId) || DEFAULT_PERSONAS[0];

    try {
      const response = await chatWithGemini({
        messages: updatedMessages,
        systemInstruction: personaObj.systemInstruction,
        deepThinking: settings.deepThinking,
      });

      const assistantMsg: Message = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.text,
        reasoningText: response.reasoningText,
        timestamp: Date.now(),
      };

      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }
            : s
        )
      );

      if (settings.autoSpeak) {
        toggleSpeakMessage(assistantMsg);
      }
    } catch (error) {
      const errorMsg: Message = {
        id: `msg_${Date.now()}_err`,
        role: 'assistant',
        content: "I couldn't process that request right now. Please check your connection or try again.",
        timestamp: Date.now(),
      };
      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, messages: [...s.messages, errorMsg], updatedAt: Date.now() }
            : s
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const currentPersona = DEFAULT_PERSONAS.find(p => p.id === settings.personaId) || DEFAULT_PERSONAS[0];

  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-[var(--bg-primary)] text-[var(--text-main)] font-sans antialiased">
      {/* Background Animated Glowing Canvas */}
      <div className="ambient-glow">
        <div className="ambient-blob-1" />
        <div className="ambient-blob-2" />
      </div>

      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewSession={() => handleNewSession()}
        onDeleteSession={handleDeleteSession}
        onTogglePinSession={handleTogglePinSession}
        onRenameSession={handleRenameSession}
        activePersonaId={settings.personaId}
        onSelectPersona={handleSelectPersona}
        currentTheme={settings.theme}
        onSelectTheme={handleSelectTheme}
        onOpenImageStudio={() => setIsImageStudioOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportSession={handleExportSession}
      />

      {/* Main Workspace Container */}
      <div className="relative z-10 flex flex-col flex-1 h-full max-w-5xl mx-auto w-full px-4 md:px-8 py-4">
        {/* Top Navbar */}
        <header className="flex items-center justify-between py-3 border-b border-[var(--border-color)] mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl glass-card text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-all"
              title="Open Navigation"
            >
              <Menu size={20} />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={18} />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight gradient-text flex items-center gap-2">
                  Nova Studio
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold uppercase tracking-wider border border-purple-500/30">
                    {currentPersona.name}
                  </span>
                </h1>
              </div>
            </div>
          </div>

          {/* Header Action Tools */}
          <div className="flex items-center gap-2">
            {/* Deep Thinking Badge Toggle */}
            <button
              onClick={() => {
                const updated = { ...settings, deepThinking: !settings.deepThinking };
                setSettings(updated);
                saveSettings(updated);
              }}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                settings.deepThinking
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-sm'
                  : 'glass-card border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Brain size={14} className={settings.deepThinking ? 'animate-pulse text-purple-400' : ''} />
              <span>Deep Thinking</span>
            </button>

            {/* Image Studio Button */}
            <button
              onClick={() => setIsImageStudioOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-purple-500/20 transition-all active:scale-95"
            >
              <Wand2 size={14} />
              <span>Image Studio</span>
            </button>

            {/* New Chat Button */}
            <button
              onClick={() => handleNewSession()}
              className="p-2 rounded-xl glass-card text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-all"
              title="New Chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </header>

        {/* Message Feed Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-6 pb-36"
        >
          <AnimatePresence initial={false}>
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center min-h-[60vh] text-center py-12 px-4"
              >
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl mb-6 glow-effect">
                  <Sparkles size={38} />
                </div>
                <h2 className="text-2xl font-bold mb-2 tracking-tight">
                  Welcome to <span className="gradient-text">Nova Studio</span>
                </h2>
                <p className="text-[var(--text-muted)] max-w-md text-xs sm:text-sm font-medium leading-relaxed mb-8">
                  Your intelligent AI assistant powered by Gemini 3 & FLUX Image Generator. Ask questions, analyze documents, or craft artwork.
                </p>

                {/* Prompt Suggestions Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
                  {currentPersona.suggestedPrompts.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleSubmit(undefined, suggestion)}
                      className="p-3.5 text-xs font-medium text-left glass-card hover:border-purple-500/50 hover:bg-purple-950/20 rounded-2xl transition-all duration-200 text-[var(--text-main)] group"
                    >
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex w-full ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex gap-3 max-w-[92%] sm:max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center shadow-md mt-1 ${
                      message.role === 'user'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white'
                    }`}
                  >
                    {message.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}
                  </div>

                  {/* Message Content Container */}
                  <div className={`space-y-1.5 ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1">
                      {message.role === 'user' ? 'You' : 'Nova'}
                    </p>

                    <div
                      className={`px-5 py-4 rounded-3xl text-xs sm:text-sm leading-relaxed transition-all ${
                        message.role === 'user'
                          ? 'bg-[var(--chat-user-bg)] text-white rounded-tr-sm shadow-md font-medium'
                          : 'bg-[var(--chat-ai-bg)] border border-[var(--border-color)] text-[var(--text-main)] rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {/* Deep Thinking Reasoning Accordion */}
                      {message.role === 'assistant' && message.reasoningText && (
                        <ThinkingAccordion reasoningText={message.reasoningText} />
                      )}

                      {/* Attachments Display */}
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {message.attachments.map(att => (
                            <div key={att.id} className="relative rounded-xl overflow-hidden border border-white/20">
                              {att.type === 'image' ? (
                                <img src={att.dataUrl} alt={att.name} className="w-32 h-32 object-cover rounded-xl" />
                              ) : (
                                <div className="p-3 bg-black/40 flex items-center gap-2 text-xs font-mono">
                                  <FileText size={16} />
                                  <span className="truncate max-w-[120px]">{att.name}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Markdown Text */}
                      <div className="prose prose-invert max-w-none text-xs sm:text-sm prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl">
                        <ReactMarkdown
                          components={{
                            code({ node, inline, className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');

                              if (!inline && match) {
                                const lang = match[1];
                                const isHtmlOrJs = ['html', 'javascript', 'js', 'jsx', 'tsx', 'css'].includes(lang.toLowerCase());

                                return (
                                  <div className="my-3 rounded-2xl overflow-hidden border border-[var(--border-color)] bg-slate-950 text-slate-100 font-mono text-xs shadow-xl">
                                    <div className="px-4 py-2 bg-slate-900/80 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                                      <span className="font-semibold uppercase tracking-wider text-purple-400">{lang}</span>
                                      <div className="flex items-center gap-2">
                                        {isHtmlOrJs && (
                                          <button
                                            onClick={() => setCodeSandboxData({ code: codeString, language: lang })}
                                            className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1 transition-colors"
                                          >
                                            <Play size={12} />
                                            <span>Run Sandbox</span>
                                          </button>
                                        )}
                                        <button
                                          onClick={() => {
                                            navigator.clipboard.writeText(codeString);
                                            setCopiedMsgId(`${message.id}_code`);
                                            setTimeout(() => setCopiedMsgId(null), 2000);
                                          }}
                                          className="p-1 hover:text-white transition-colors"
                                          title="Copy Code"
                                        >
                                          {copiedMsgId === `${message.id}_code` ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                                        </button>
                                      </div>
                                    </div>
                                    <pre className="p-4 overflow-x-auto scrollbar-thin">
                                      <code>{children}</code>
                                    </pre>
                                  </div>
                                );
                              }
                              return <code className="bg-purple-950/40 text-purple-300 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>{children}</code>;
                            }
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Generated Images Grid inside Message */}
                      {message.generatedImages && message.generatedImages.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {message.generatedImages.map((img) => (
                            <div
                              key={img.id}
                              onClick={() => setActiveLightboxImage(img)}
                              className="group relative rounded-2xl overflow-hidden cursor-pointer border border-[var(--border-color)] bg-black/40 hover:border-purple-500/50 transition-all shadow-xl"
                            >
                              <img
                                src={img.url}
                                alt={img.prompt}
                                className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-end">
                                <p className="text-[11px] text-white font-medium line-clamp-2">{img.prompt}</p>
                                <span className="text-[10px] text-purple-300 font-semibold mt-1 flex items-center gap-1">
                                  <Eye size={12} /> Click to expand
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Bar under Assistant Message */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 px-2 pt-0.5 text-[var(--text-muted)]">
                        <button
                          onClick={() => toggleSpeakMessage(message)}
                          className={`p-1 rounded-lg hover:text-[var(--text-main)] transition-colors ${
                            speakingMsgId === message.id ? 'text-purple-400 animate-pulse' : ''
                          }`}
                          title="Read Aloud"
                        >
                          {speakingMsgId === message.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </button>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(message.content);
                            setCopiedMsgId(message.id);
                            setTimeout(() => setCopiedMsgId(null), 2000);
                          }}
                          className="p-1 rounded-lg hover:text-[var(--text-main)] transition-colors"
                          title="Copy Message"
                        >
                          {copiedMsgId === message.id ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Loading Skeleton */}
            {(isLoading || isGeneratingImage) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-start pl-1"
              >
                <div className="flex gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg animate-pulse">
                    <Sparkles size={16} />
                  </div>
                  <div className="glass-card px-5 py-4 rounded-3xl rounded-tl-sm flex items-center gap-2 border border-[var(--border-color)]">
                    {isGeneratingImage ? (
                      <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                        <Wand2 size={16} className="animate-spin text-purple-400" />
                        <span>Rendering FLUX AI Image...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            animate={{ y: [0, -5, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                            className="w-2 h-2 rounded-full bg-purple-400"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floating Input Dock Bar */}
        <div className="fixed bottom-0 left-0 right-0 py-5 px-4 md:px-8 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pointer-events-none z-30">
          <div className="max-w-4xl mx-auto pointer-events-auto">
            {/* Attachment Previews */}
            {attachments.length > 0 && (
              <div className="mb-2 flex gap-2 overflow-x-auto p-2 bg-[var(--bg-surface)] border border-[var(--border-color)] rounded-2xl backdrop-blur-md">
                {attachments.map((att) => (
                  <div key={att.id} className="relative group shrink-0">
                    {att.type === 'image' ? (
                      <img src={att.dataUrl} alt={att.name} className="w-14 h-14 object-cover rounded-xl border border-white/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-slate-900 flex flex-col items-center justify-center p-1 text-[10px] font-mono text-slate-300">
                        <FileText size={16} />
                        <span className="truncate w-full text-center">{att.name}</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeAttachment(att.id)}
                      className="absolute -top-1 -right-1 p-0.5 rounded-full bg-red-600 text-white shadow"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={handleSubmit}
              className="glass-panel rounded-3xl p-2 pl-4 md:pl-5 flex items-end gap-2 border border-[var(--border-color)] shadow-2xl focus-within:border-purple-500/50 transition-all duration-300"
            >
              {/* File Attachment Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                multiple
                accept="image/*,text/*,.js,.ts,.json,.md"
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-2xl hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                title="Attach Images or Files"
              >
                <Paperclip size={18} />
              </button>

              {/* Voice Speech-to-Text Button */}
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`p-2.5 rounded-2xl transition-colors ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
                title={isListening ? 'Stop Listening' : 'Dictate with Voice'}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Text Input */}
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask Nova anything or type 'generate image of...'..."
                className="flex-1 py-2.5 bg-transparent border-none focus:ring-0 resize-none max-h-40 font-medium text-xs sm:text-sm placeholder:[var(--text-muted)] text-[var(--text-main)] focus:outline-none"
              />

              {/* Submit Button */}
              <button
                type="submit"
                disabled={(!input.trim() && attachments.length === 0) || isLoading || isGeneratingImage}
                className={`p-3 rounded-2xl transition-all duration-200 flex items-center justify-center shrink-0 ${
                  (input.trim() || attachments.length > 0) && !isLoading && !isGeneratingImage
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25 scale-100 hover:scale-105 active:scale-95'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-40 cursor-not-allowed'
                }`}
              >
                <Send size={18} className={isLoading || isGeneratingImage ? 'animate-pulse' : ''} />
              </button>
            </form>

            <div className="mt-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] opacity-60 px-3">
              <span>Powered by Gemini 3 & FLUX AI</span>
              <span>Press Shift + Enter for newline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modals & Dialogs */}
      <ImageGenStudio
        isOpen={isImageStudioOpen}
        onClose={() => setIsImageStudioOpen(false)}
        onSendToChat={(generatedImg) => {
          const assistantMsg: Message = {
            id: `msg_${Date.now()}_assistant`,
            role: 'assistant',
            content: `Here is your generated image: **"${generatedImg.prompt}"**`,
            generatedImages: [generatedImg],
            timestamp: Date.now(),
          };
          setSessions(prev =>
            prev.map(s =>
              s.id === activeSession.id
                ? { ...s, messages: [...s.messages, assistantMsg], updatedAt: Date.now() }
                : s
            )
          );
        }}
      />

      <LightboxModal
        image={activeLightboxImage}
        onClose={() => setActiveLightboxImage(null)}
      />

      {codeSandboxData && (
        <CodePreviewModal
          code={codeSandboxData.code}
          language={codeSandboxData.language}
          isOpen={!!codeSandboxData}
          onClose={() => setCodeSandboxData(null)}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSt) => {
          setSettings(prev => {
            const updated = { ...prev, ...newSt };
            saveSettings(updated);
            return updated;
          });
        }}
        onClearData={() => {
          localStorage.clear();
          window.location.reload();
        }}
      />
    </div>
  );
}
