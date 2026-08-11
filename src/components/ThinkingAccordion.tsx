import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, ChevronDown, Sparkles } from 'lucide-react';

interface ThinkingAccordionProps {
  reasoningText: string;
}

export const ThinkingAccordion: React.FC<ThinkingAccordionProps> = ({ reasoningText }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!reasoningText) return null;

  return (
    <div className="mb-3 rounded-2xl border border-purple-500/20 bg-purple-950/20 overflow-hidden transition-all">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-2.5 px-3 flex items-center justify-between text-xs font-medium text-purple-300 hover:bg-purple-900/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
            <Brain size={14} className="animate-pulse" />
          </div>
          <span className="font-semibold text-[11px] uppercase tracking-wider">
            Thought Process ({reasoningText.split(' ').length} words)
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 text-purple-400 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-purple-500/10 p-3 bg-black/30 font-mono text-[11px] text-purple-200/80 leading-relaxed whitespace-pre-wrap scrollbar-thin max-h-48 overflow-y-auto"
          >
            {reasoningText}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
