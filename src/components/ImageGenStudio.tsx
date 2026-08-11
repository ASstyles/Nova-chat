import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Image as ImageIcon, Wand2, Download, Copy, RefreshCw, 
  X, Check, Sliders, Layers, Eye
} from 'lucide-react';
import { GeneratedImage, ImageGenOptions } from '../types';
import { generateImage, ASPECT_RATIOS, ART_STYLES } from '../lib/imageGen';

interface ImageGenStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onSendToChat?: (image: GeneratedImage) => void;
}

export const ImageGenStudio: React.FC<ImageGenStudioProps> = ({
  isOpen,
  onClose,
  onSendToChat,
}) => {
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '21:9'>('1:1');
  const [selectedStyle, setSelectedStyle] = useState('photorealistic');
  const [selectedModel, setSelectedModel] = useState<'flux' | 'flux-realism' | 'turbo' | 'anime'>('flux');
  const [enhancePrompt, setEnhancePrompt] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gallery, setGallery] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);

    try {
      const options: ImageGenOptions = {
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        aspectRatio,
        style: selectedStyle,
        model: selectedModel,
        enhancePrompt,
      };

      const result = await generateImage(options);
      setGallery(prev => [result, ...prev]);
      setActiveImage(result);
    } catch (err) {
      console.error("Failed to generate image:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyUrl = (img: GeneratedImage) => {
    navigator.clipboard.writeText(img.url);
    setCopiedId(img.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (img: GeneratedImage) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nova_art_${img.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(img.url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[90vh] glass-panel border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Modal Header */}
        <div className="p-4 md:px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 flex items-center justify-center text-white shadow-lg">
              <Wand2 size={22} />
            </div>
            <div>
              <h2 className="font-bold text-lg tracking-tight gradient-text">FLUX AI Image Studio</h2>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                Create stunning high-resolution AI artwork with instant generation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Controls Column (5 cols) */}
          <div className="lg:col-span-5 p-4 md:p-6 border-r border-[var(--border-color)] overflow-y-auto space-y-6 scrollbar-thin">
            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center justify-between">
                <span>Prompt Concept</span>
                <span className="text-[10px] text-purple-400 font-normal">FLUX.1 Engine</span>
              </label>
              <textarea
                rows={3}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your visual masterpiece (e.g. A glowing cybernetic dragon soaring through a crystal nebula)..."
                className="w-full p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500 transition-all resize-none font-medium"
              />
              
              {/* Magic Enhance Toggle */}
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setEnhancePrompt(!enhancePrompt)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-xl border transition-all ${
                    enhancePrompt
                      ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)]'
                  }`}
                >
                  <Sparkles size={14} className={enhancePrompt ? 'text-purple-400 animate-pulse' : ''} />
                  <span>✨ Magic Enhance Prompt</span>
                </button>
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-2">
                {Object.entries(ASPECT_RATIOS).map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAspectRatio(key as any)}
                    className={`py-2 px-1 rounded-xl text-center flex flex-col items-center gap-1 border transition-all ${
                      aspectRatio === key
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md font-semibold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-purple-500/30'
                    }`}
                  >
                    <span className="text-xs font-mono">{val.ratioText}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Art Style Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Artistic Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ART_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-2.5 rounded-xl text-left text-xs font-medium border transition-all truncate ${
                      selectedStyle === style.id
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border-purple-400 text-white shadow-md'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:border-purple-500/30'
                    }`}
                  >
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Model Engine */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                AI Generator Model
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'flux', name: 'FLUX.1 HQ' },
                  { id: 'flux-realism', name: 'FLUX Realism' },
                  { id: 'turbo', name: 'FLUX Turbo' },
                  { id: 'anime', name: 'Anime FLUX' }
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedModel(m.id as any)}
                    className={`p-2 rounded-xl text-center text-xs font-medium border transition-all ${
                      selectedModel === m.id
                        ? 'bg-purple-600/30 border-purple-400 text-purple-300 font-semibold'
                        : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)]'
                    }`}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleGenerate()}
              disabled={!prompt.trim() || isGenerating}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-xl transition-all duration-300 ${
                prompt.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/30 hover:scale-[1.02] active:scale-98'
                  : 'bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-50 cursor-not-allowed border border-[var(--border-color)]'
              }`}
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-white" />
                  <span>Synthesizing Artwork...</span>
                </>
              ) : (
                <>
                  <Wand2 size={18} />
                  <span>Generate Artwork</span>
                </>
              )}
            </button>
          </div>

          {/* Preview & Gallery Column (7 cols) */}
          <div className="lg:col-span-7 p-4 md:p-6 bg-[var(--bg-primary)] flex flex-col overflow-y-auto scrollbar-thin">
            {/* Active Display Stage */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[340px] bg-[var(--bg-secondary)] rounded-3xl border border-[var(--border-color)] p-4 relative overflow-hidden group">
              {isGenerating ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <Wand2 size={28} className="text-purple-400 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--text-main)]">Crafting AI Image</h4>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Rendering high resolution FLUX details...</p>
                  </div>
                </div>
              ) : activeImage ? (
                <div className="relative w-full h-full flex items-center justify-center group">
                  <img
                    src={activeImage.url}
                    alt={activeImage.prompt}
                    className="max-h-[420px] w-auto object-contain rounded-2xl shadow-2xl border border-[var(--border-color)]"
                  />
                  {/* Hover Overlay Toolbar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur-md p-2 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 shadow-2xl">
                    <button
                      onClick={() => handleDownload(activeImage)}
                      className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
                      title="Download Image"
                    >
                      <Download size={18} />
                    </button>
                    <button
                      onClick={() => handleCopyUrl(activeImage)}
                      className="p-2 text-white hover:bg-white/20 rounded-xl transition-colors"
                      title="Copy Image URL"
                    >
                      {copiedId === activeImage.id ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                    </button>
                    {onSendToChat && (
                      <button
                        onClick={() => {
                          onSendToChat(activeImage);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <ImageIcon size={14} />
                        <span>Send to Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--bg-surface)] flex items-center justify-center text-[var(--text-muted)] mx-auto">
                    <ImageIcon size={32} />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] font-medium max-w-xs">
                    Your generated visual creations will appear here. Enter a prompt on the left to start!
                  </p>
                </div>
              )}
            </div>

            {/* Recent Gallery Strip */}
            {gallery.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                  Session Gallery ({gallery.length})
                </p>
                <div className="flex gap-3 overflow-x-auto scrollbar-thin pb-2">
                  {gallery.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => setActiveImage(img)}
                      className={`relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                        activeImage?.id === img.id
                          ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
