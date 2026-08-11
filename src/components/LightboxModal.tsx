import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, Check, ExternalLink, Sparkles } from 'lucide-react';
import { GeneratedImage } from '../types';

interface LightboxModalProps {
  image: GeneratedImage | null;
  onClose: () => void;
  onRegenerate?: (prompt: string) => void;
}

export const LightboxModal: React.FC<LightboxModalProps> = ({
  image,
  onClose,
  onRegenerate,
}) => {
  const [copied, setCopied] = useState(false);

  if (!image) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(image.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(image.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nova_art_${image.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      window.open(image.url, '_blank');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-lg">
        {/* Backdrop Close */}
        <div className="absolute inset-0" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10 max-w-4xl w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 text-xs font-semibold uppercase tracking-wider">
                {image.aspectRatio} • FLUX AI
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-purple-600 text-[var(--text-main)] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-3"
              >
                <Download size={15} />
                <span>Download</span>
              </button>
              <button
                onClick={handleCopyUrl}
                className="p-2 rounded-xl bg-[var(--bg-primary)] hover:bg-purple-600 text-[var(--text-main)] hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-3"
              >
                {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
                <span>{copied ? 'Copied!' : 'Copy Link'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Image Display */}
          <div className="flex-1 flex items-center justify-center p-6 bg-black/40 overflow-hidden">
            <img
              src={image.url}
              alt={image.prompt}
              className="max-h-[60vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />
          </div>

          {/* Details Bar */}
          <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
            <p className="text-xs text-[var(--text-main)] font-medium leading-relaxed">
              <span className="text-[var(--text-muted)] font-bold uppercase tracking-wider text-[10px] block mb-0.5">Prompt</span>
              {image.prompt}
            </p>
            {image.enhancedPrompt && (
              <p className="text-xs text-purple-300 font-medium leading-relaxed bg-purple-950/30 p-2.5 rounded-xl border border-purple-500/20">
                <span className="text-purple-400 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1 mb-0.5">
                  <Sparkles size={11} /> Enhanced Prompt
                </span>
                {image.enhancedPrompt}
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
