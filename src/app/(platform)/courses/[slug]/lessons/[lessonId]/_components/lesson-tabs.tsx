"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, NotebookPen, FolderOpen, Plus, Trash2,
  File, Link2, Video, Download, ExternalLink, Clock, StickyNote
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Note {
  id: string;
  text: string;
  timestamp: string;    // Human-readable time, e.g. "22:35"
  createdAt: number;    // Unix ms
}

interface Resource {
  id: string;
  type: "pdf" | "link" | "video" | "code";
  title: string;
  description: string;
  url: string;
  size?: string;
}

interface LessonTabsProps {
  lessonId: string;
  courseSlug: string;
  description?: string;
  resources?: Resource[];
  initialTab?: TabId;
  onTabChange?: () => void;
}

type TabId = "overview" | "notes" | "resources";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Resources
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RESOURCES: Resource[] = [
  {
    id: "r1",
    type: "pdf",
    title: "Lesson Slides",
    description: "Full slide deck for this lesson in PDF format",
    url: "#",
    size: "2.4 MB",
  },
  {
    id: "r2",
    type: "code",
    title: "Starter Code",
    description: "GitHub repository with the starter project template",
    url: "https://github.com",
    size: "ZIP",
  },
  {
    id: "r3",
    type: "link",
    title: "React Documentation",
    description: "Official React 18 docs referenced in this lesson",
    url: "https://react.dev",
  },
  {
    id: "r4",
    type: "video",
    title: "Supplemental Video",
    description: "Extended walkthrough of the advanced patterns",
    url: "#",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Resource Icon + color map
// ─────────────────────────────────────────────────────────────────────────────

const resourceMeta: Record<Resource["type"], { icon: React.ReactNode; color: string; bg: string }> = {
  pdf: {
    icon: <File className="w-4 h-4" />,
    color: "text-red-400",
    bg: "bg-red-500/10 border-red-500/20",
  },
  code: {
    icon: <File className="w-4 h-4" />,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  link: {
    icon: <Link2 className="w-4 h-4" />,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  video: {
    icon: <Video className="w-4 h-4" />,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tab Bar
// ─────────────────────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",  label: "Overview",  icon: <BookOpen    className="w-3.5 h-3.5" /> },
  { id: "notes",     label: "Notes",     icon: <NotebookPen className="w-3.5 h-3.5" /> },
  { id: "resources", label: "Resources", icon: <FolderOpen  className="w-3.5 h-3.5" /> },
];

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function LessonTabs({
  lessonId,
  courseSlug,
  description,
  resources = DEFAULT_RESOURCES,
  initialTab,
  onTabChange,
}: LessonTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(initialTab ?? "overview");
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // React to external tab override (e.g. from More Options dropdown)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      onTabChange?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const storageKey = `notes:${courseSlug}:${lessonId}`;

  // Load notes from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setNotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  // Persist notes to localStorage
  const persistNotes = useCallback((updated: Note[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleAddNote = useCallback(() => {
    const text = noteInput.trim();
    if (!text) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    const newNote: Note = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp,
      createdAt: now.getTime(),
    };
    persistNotes([newNote, ...notes]);
    setNoteInput("");
    textareaRef.current?.focus();
  }, [noteInput, notes, persistNotes]);

  const handleDeleteNote = useCallback((id: string) => {
    persistNotes(notes.filter((n) => n.id !== id));
  }, [notes, persistNotes]);

  const handleSaveEdit = useCallback((id: string) => {
    const text = editText.trim();
    if (!text) return;
    persistNotes(notes.map((n) => n.id === id ? { ...n, text } : n));
    setEditingId(null);
    setEditText("");
  }, [editText, notes, persistNotes]);

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm">
      {/* Tab Bar */}
      <div className="flex items-center gap-0.5 p-1.5 border-b border-white/[0.06] bg-white/[0.02]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
              activeTab === tab.id
                ? "text-white"
                : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
            )}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-bg"
                className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/10"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {tab.id === "notes" && notes.length > 0 && (
                <span className="ml-0.5 min-w-[16px] h-4 rounded-full bg-blue-500/30 text-blue-300 text-[9px] font-black flex items-center justify-center px-1">
                  {notes.length}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          {/* ── OVERVIEW ── */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="text-white/60 text-sm leading-relaxed space-y-3"
            >
              <p>
                {description ??
                  "In this lesson, we dive deep into the core mechanics of building robust, scalable front-end architectures. By combining industry-standard patterns with fluid UI aesthetics, you'll learn how to craft experiences that resonate deeply with users."}
              </p>
              <p className="text-white/40">
                Ensure you have completed the prerequisites before continuing.
                All project assets are available in the course repository.
              </p>
            </motion.div>
          )}

          {/* ── NOTES ── */}
          {activeTab === "notes" && (
            <motion.div
              key="notes"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-4"
            >
              {/* Input Area */}
              <div className="flex flex-col gap-2 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden focus-within:border-blue-500/40 focus-within:bg-blue-500/5 transition-all duration-300">
                <textarea
                  ref={textareaRef}
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                      e.preventDefault();
                      handleAddNote();
                    }
                  }}
                  placeholder="Type your note here… (⌘ + Enter to save)"
                  rows={3}
                  className="w-full bg-transparent p-4 text-sm text-white placeholder:text-white/20 resize-none outline-none leading-relaxed"
                />
                <div className="flex items-center justify-between px-4 pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAddNote}
                    disabled={!noteInput.trim()}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                      noteInput.trim()
                        ? "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        : "bg-white/5 text-white/20 cursor-not-allowed"
                    )}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Note
                  </motion.button>
                </div>
              </div>

              {/* Notes List */}
              {notes.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                    <StickyNote className="w-5 h-5 text-white/20" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white/30">No notes yet</span>
                    <span className="text-xs text-white/20">Notes you add will be saved here</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <AnimatePresence initial={false}>
                    {notes.map((note) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, height: 0, scale: 0.97 }}
                        animate={{ opacity: 1, height: "auto", scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="group flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-white/10 transition-colors overflow-hidden"
                      >
                        {editingId === note.id ? (
                          /* Edit Mode */
                          <div className="flex flex-col gap-2">
                            <textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              autoFocus
                              rows={3}
                              className="w-full bg-white/5 rounded-lg p-3 text-sm text-white outline-none border border-blue-500/30 resize-none leading-relaxed focus:border-blue-500/60"
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setEditingId(null); setEditText(""); }}
                                className="px-3 py-1.5 text-xs font-semibold text-white/40 hover:text-white/70 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(note.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors"
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* View Mode */
                          <>
                            <p
                              className="text-sm text-white/70 leading-relaxed cursor-pointer hover:text-white/90 transition-colors"
                              onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                            >
                              {note.text}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-medium">
                                <Clock className="w-3 h-3" />
                                {note.timestamp} · {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDeleteNote(note.id)}
                                  className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
                                  aria-label="Delete note"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          )}

          {/* ── RESOURCES ── */}
          {activeTab === "resources" && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col gap-2"
            >
              {resources.map((resource) => {
                const meta = resourceMeta[resource.type];
                const isExternal = resource.url.startsWith("http");
                return (
                  <motion.a
                    key={resource.id}
                    href={resource.url}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    download={!isExternal && resource.url !== "#" ? true : undefined}
                    whileHover={{ x: 3 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className="group flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05] p-4 transition-all duration-200 cursor-pointer"
                  >
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                      meta.bg, meta.color
                    )}>
                      {meta.icon}
                    </div>

                    {/* Text */}
                    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate">
                        {resource.title}
                      </span>
                      <span className="text-xs text-white/30 truncate">{resource.description}</span>
                    </div>

                    {/* Action + Size */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {resource.size && (
                        <span className="text-[10px] font-bold text-white/20 tabular-nums">{resource.size}</span>
                      )}
                      <div className={cn(
                        "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                        meta.bg, meta.color, "group-hover:opacity-100 opacity-60"
                      )}>
                        {isExternal ? (
                          <ExternalLink className="w-3 h-3" />
                        ) : (
                          <Download className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
