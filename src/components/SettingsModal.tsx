import React from 'react';
import { motion } from 'motion/react';
import { X, Settings, Brain, Volume2, Palette, Sparkles, Trash2, Check } from 'lucide-react';
import { AppSettings, ThemeMode, Persona } from '../types';
import { DEFAULT_PERSONAS } from '../lib/storage';
import { SpeechService } from '../lib/speech';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  onClearData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onClearData,
}) => {
  const voices = SpeechService.getVoices();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl glass-panel border border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="p-4 md:px-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-surface)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
              <Settings size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[var(--text-main)]">Nova Settings</h3>
              <p className="text-xs text-[var(--text-muted)] font-medium">Configure AI personas, voice, themes & reasoning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] scrollbar-thin">
          {/* Theme Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Palette size={14} className="text-purple-400" />
              <span>Theme Aesthetics</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cyber', label: '🌌 Deep Cyber', desc: 'Dark neon obsidian glass' },
                { id: 'light', label: '☀️ Studio Light', desc: 'Apple minimalist clean' },
                { id: 'aurora', label: '🟣 Aurora Wave', desc: 'Purple & magenta glow' },
                { id: 'emerald', label: '🌿 Emerald Slate', desc: 'Matrix green dark slate' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onUpdateSettings({ theme: t.id as ThemeMode })}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    settings.theme === t.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md font-semibold'
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-purple-500/30'
                  }`}
                >
                  <p className="text-xs font-bold text-[var(--text-main)]">{t.label}</p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Deep Thinking Reasoning Mode */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-600/20 text-purple-400">
                <Brain size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-main)]">Deep Thinking / Reasoning Mode</p>
                <p className="text-[11px] text-[var(--text-muted)]">Nova reveals step-by-step reasoning before answering</p>
              </div>
            </div>
            <button
              onClick={() => onUpdateSettings({ deepThinking: !settings.deepThinking })}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                settings.deepThinking ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.deepThinking ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Persona Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-400" />
              <span>Default AI Persona</span>
            </label>
            <div className="space-y-2">
              {DEFAULT_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => onUpdateSettings({ personaId: persona.id })}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    settings.personaId === persona.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-300 font-semibold'
                      : 'bg-[var(--bg-surface)] border-[var(--border-color)] text-[var(--text-muted)] hover:border-purple-500/30'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold text-[var(--text-main)]">{persona.name}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{persona.description}</p>
                  </div>
                  {settings.personaId === persona.id && <Check size={16} className="text-purple-400 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Speech Synthesis Settings */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
              <Volume2 size={14} className="text-purple-400" />
              <span>Text-to-Speech Voice Settings</span>
            </label>

            {voices.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] text-[var(--text-muted)] font-medium">Selected Voice</p>
                <select
                  value={settings.speechVoice}
                  onChange={(e) => onUpdateSettings({ speechVoice: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-xs text-[var(--text-main)] focus:outline-none"
                >
                  <option value="">Default System Voice</option>
                  {voices.map((v) => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speech Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Reading Speed</span>
                <span className="font-mono text-purple-400">{settings.speechRate.toFixed(1)}x</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.5"
                step="0.1"
                value={settings.speechRate}
                onChange={(e) => onUpdateSettings({ speechRate: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <button
              onClick={onClearData}
              className="w-full py-2.5 px-4 rounded-2xl border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-900/30 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 size={15} />
              <span>Clear All Chat History & Cache</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
