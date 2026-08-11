import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Code, Copy, Check, RefreshCw } from 'lucide-react';

interface CodePreviewModalProps {
  code: string;
  language?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CodePreviewModal: React.FC<CodePreviewModalProps> = ({
  code,
  language = 'html',
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0);

  if (!isOpen) return null;

  // Format HTML preview document
  const getCombinedCode = () => {
    if (code.includes('<!DOCTYPE html>') || code.includes('<html')) {
      return code;
    }
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            body { background-color: #0f172a; color: #f8fafc; font-family: system-ui, sans-serif; padding: 1.5rem; }
          </style>
        </head>
        <body>
          ${code}
        </body>
      </html>
    `;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-5xl h-[85vh] glass-panel border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-3xl overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md">
              <Play size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-main)]">Live Code Sandbox</h3>
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase">
                Rendering {language} snippet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[var(--bg-primary)] p-1 rounded-xl border border-[var(--border-color)] text-xs font-medium">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'preview' ? 'bg-indigo-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  activeTab === 'code' ? 'bg-indigo-600 text-white shadow' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                View Code
              </button>
            </div>

            <button
              onClick={() => setKey(prev => prev + 1)}
              title="Refresh Preview"
              className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <RefreshCw size={16} />
            </button>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
              title="Copy Code"
            >
              {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-black/40 overflow-hidden relative">
          {activeTab === 'preview' ? (
            <iframe
              key={key}
              srcDoc={getCombinedCode()}
              title="Sandbox Runner"
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts"
            />
          ) : (
            <pre className="w-full h-full p-6 overflow-auto font-mono text-xs text-emerald-400 bg-slate-950 scrollbar-thin">
              <code>{code}</code>
            </pre>
          )}
        </div>
      </motion.div>
    </div>
  );
};
