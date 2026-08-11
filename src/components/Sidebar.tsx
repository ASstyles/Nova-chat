import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, MessageSquare, Search, Trash2, Pin, Download, Sparkles, 
  Settings, Image as ImageIcon, Code, Palette, TrendingUp, GraduationCap,
  X, Check, Edit2
} from 'lucide-react';
import { ChatSession, ThemeMode, Persona } from '../types';
import { DEFAULT_PERSONAS } from '../lib/storage';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onTogglePinSession: (id: string) => void;
  onRenameSession: (id: string, newTitle: string) => void;
  activePersonaId: string;
  onSelectPersona: (id: string) => void;
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  onOpenImageStudio: () => void;
  onOpenSettings: () => void;
  onExportSession: (session: ChatSession, format: 'json' | 'md') => void;
}

const PERSONA_ICONS: Record<string, any> = {
  Sparkles: Sparkles,
  Code: Code,
  Palette: Palette,
  TrendingUp: TrendingUp,
  GraduationCap: GraduationCap,
};

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onTogglePinSession,
  onRenameSession,
  activePersonaId,
  onSelectPersona,
  currentTheme,
  onSelectTheme,
  onOpenImageStudio,
  onOpenSettings,
  onExportSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(session => 
    session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pinnedSessions = filteredSessions.filter(s => s.pinned);
  const unpinnedSessions = filteredSessions.filter(s => !s.pinned);

  const startEditing = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const saveEditing = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (editTitle.trim()) {
      onRenameSession(id, editTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <motion.aside
        initial={{ x: -320 }}
        animate={{ x: isOpen ? 0 : -320 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className={`fixed top-0 left-0 bottom-0 w-80 z-50 flex flex-col glass-panel border-r border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl`}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="font-bold text-base tracking-tight gradient-text">Nova AI</h2>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[var(--text-muted)]">
                Next-Gen Studio
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-muted)] md:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 space-y-2">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all duration-200 active:scale-98"
          >
            <Plus size={18} />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => {
              onOpenImageStudio();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[var(--bg-surface)] hover:bg-purple-950/30 border border-purple-500/20 text-purple-300 font-medium text-sm flex items-center justify-center gap-2 transition-all"
          >
            <ImageIcon size={17} className="text-purple-400" />
            <span>🎨 Image Studio</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 py-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {/* Personas Quick Selector */}
        <div className="px-4 py-3 border-b border-[var(--border-color)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
            Active AI Persona
          </p>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-1">
            {DEFAULT_PERSONAS.map((persona) => {
              const IconComp = PERSONA_ICONS[persona.icon] || Sparkles;
              const isSelected = activePersonaId === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => onSelectPersona(persona.id)}
                  title={persona.description}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all ${
                    isSelected
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)]'
                  }`}
                >
                  <IconComp size={13} />
                  <span>{persona.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400 px-2 mb-1 flex items-center gap-1">
                <Pin size={11} /> Pinned
              </p>
              <div className="space-y-1">
                {pinnedSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    editingId={editingId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                    }}
                    onStartEdit={(e) => startEditing(session, e)}
                    onSaveEdit={(e) => saveEditing(session.id, e)}
                    onExport={(e, fmt) => {
                      e.stopPropagation();
                      onExportSession(session, fmt);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent Section */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-2 mb-1">
              Conversations
            </p>
            {unpinnedSessions.length === 0 && pinnedSessions.length === 0 ? (
              <div className="text-center py-8 text-xs text-[var(--text-muted)]">
                No chats found.
              </div>
            ) : (
              <div className="space-y-1">
                {unpinnedSessions.map((session) => (
                  <SessionItem
                    key={session.id}
                    session={session}
                    isActive={session.id === activeSessionId}
                    editingId={editingId}
                    editTitle={editTitle}
                    setEditTitle={setEditTitle}
                    onSelect={() => {
                      onSelectSession(session.id);
                      if (window.innerWidth < 768) onClose();
                    }}
                    onDelete={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    onTogglePin={(e) => {
                      e.stopPropagation();
                      onTogglePinSession(session.id);
                    }}
                    onStartEdit={(e) => startEditing(session, e)}
                    onSaveEdit={(e) => saveEditing(session.id, e)}
                    onExport={(e, fmt) => {
                      e.stopPropagation();
                      onExportSession(session, fmt);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Settings & Themes */}
        <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-surface)] space-y-2">
          {/* Theme Quick Selector */}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider">Theme</span>
            <div className="flex gap-1.5">
              {[
                { id: 'cyber', label: '🌌 Cyber' },
                { id: 'light', label: '☀️ Light' },
                { id: 'aurora', label: '🟣 Aurora' },
                { id: 'emerald', label: '🌿 Emerald' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => onSelectTheme(t.id as ThemeMode)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                    currentTheme === t.id
                      ? 'bg-purple-600 text-white font-semibold shadow'
                      : 'hover:text-[var(--text-main)]'
                  }`}
                >
                  {t.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onOpenSettings}
            className="w-full py-2 px-3 rounded-lg text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-primary)] flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Settings size={15} />
              <span>Settings & Preferences</span>
            </div>
          </button>
        </div>
      </motion.aside>
    </>
  );
};

interface SessionItemProps {
  session: ChatSession;
  isActive: boolean;
  editingId: string | null;
  editTitle: string;
  setEditTitle: (val: string) => void;
  onSelect: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onStartEdit: (e: React.MouseEvent) => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onExport: (e: React.MouseEvent, fmt: 'json' | 'md') => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  editingId,
  editTitle,
  setEditTitle,
  onSelect,
  onDelete,
  onTogglePin,
  onStartEdit,
  onSaveEdit,
  onExport,
}) => {
  const isEditing = editingId === session.id;

  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2.5 rounded-xl cursor-pointer text-xs transition-all duration-200 ${
        isActive
          ? 'bg-purple-600/15 border border-purple-500/30 text-[var(--text-main)] font-semibold shadow-sm'
          : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
        <MessageSquare size={15} className={isActive ? 'text-purple-400 shrink-0' : 'shrink-0'} />
        {isEditing ? (
          <form onSubmit={onSaveEdit} className="flex-1 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              autoFocus
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full px-1.5 py-0.5 bg-[var(--bg-primary)] border border-purple-500 text-xs rounded text-[var(--text-main)] focus:outline-none"
            />
            <button type="submit" className="p-0.5 text-green-400">
              <Check size={13} />
            </button>
          </form>
        ) : (
          <span className="truncate font-medium text-xs">{session.title}</span>
        )}
      </div>

      {/* Item Action Buttons */}
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onTogglePin}
            title={session.pinned ? 'Unpin' : 'Pin to top'}
            className={`p-1 hover:text-purple-400 rounded ${session.pinned ? 'text-purple-400' : 'text-[var(--text-muted)]'}`}
          >
            <Pin size={12} />
          </button>
          <button
            onClick={onStartEdit}
            title="Rename"
            className="p-1 hover:text-blue-400 text-[var(--text-muted)] rounded"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={(e) => onExport(e, 'md')}
            title="Export Markdown"
            className="p-1 hover:text-indigo-400 text-[var(--text-muted)] rounded"
          >
            <Download size={12} />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="p-1 hover:text-red-400 text-[var(--text-muted)] rounded"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
};
