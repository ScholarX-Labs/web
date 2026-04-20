"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Clock, Plus, Trash2, StickyNote } from "lucide-react";
import { FloatingPanel } from "@/components/ui/glass-panel";
import { AnimatedButton } from "@/components/ui/animated-button";
import { useUILayoutStore } from "@/store/ui-layout-store";
import { useNotes } from "@/hooks/use-notes";
import { springPanel, staggerContainer, staggerItem } from "@/lib/motion-variants";
import { zIndex } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface NotesPanelOverlayProps {
  lessonId?: string;
  courseSlug?: string;
}

/**
 * NotesPanelOverlay — Spring-animated slide-in notes panel.
 *
 * Desktop: Fixed right-side panel (380px wide).
 * Mobile: Rendered as bottom sheet via LessonLayoutShell's DrawerContent.
 *
 * Entry animation: springPanel (physical overshoot from right).
 * Dismiss: X button, ESC key, or click outside.
 */
export function NotesPanelOverlay({
  lessonId = "lesson-current",
  courseSlug = "course-current",
}: NotesPanelOverlayProps) {
  const { setNotesOverlayOpen } = useUILayoutStore();
  const {
    notes, noteInput, setNoteInput, editingId, editText, setEditText,
    textareaRef, handleAddNote, handleDeleteNote, handleSaveEdit, startEdit, cancelEdit,
  } = useNotes({ lessonId, courseSlug });

  // ESC key to close
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setNotesOverlayOpen(false);
  }, [setNotesOverlayOpen]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      {/* Backdrop (click to close) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/30 backdrop-blur-sm"
        style={{ zIndex: zIndex.overlay - 1 }}
        onClick={() => setNotesOverlayOpen(false)}
      />

      {/* Panel */}
      <motion.div
        variants={springPanel}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="fixed right-0 top-0 h-full w-full max-w-[380px] flex flex-col gap-0 overflow-hidden"
        style={{ zIndex: zIndex.overlay }}
      >
      <FloatingPanel
        className="h-full w-full flex flex-col gap-0 rounded-none border-r-0 border-y-0"
        style={{ zIndex: zIndex.overlay }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <StickyNote className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">My Notes</h2>
              <span className="text-[10px] text-white/40 font-medium">
                {notes.length} {notes.length === 1 ? "note" : "notes"}
              </span>
            </div>
          </div>
          <AnimatedButton
            aria-label="Close notes panel"
            onClick={() => setNotesOverlayOpen(false)}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </AnimatedButton>
        </div>

        {/* Add Note Input */}
        <div className="px-6 py-4 border-b border-white/[0.04] shrink-0">
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
              placeholder="Type a note… (⌘ + Enter to save)"
              rows={3}
              className="w-full bg-transparent p-4 text-sm text-white placeholder:text-white/20 resize-none outline-none leading-relaxed"
            />
            <div className="flex items-center justify-between px-4 pb-3">
              <div className="flex items-center gap-1.5 text-[10px] text-white/20 font-medium">
                <Clock className="w-3 h-3" />
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}
              </div>
              <AnimatedButton
                onClick={handleAddNote}
                disabled={!noteInput.trim()}
                aria-label="Save note"
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                  noteInput.trim()
                    ? "bg-blue-500 hover:bg-blue-400 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                    : "bg-white/5 text-white/20 cursor-not-allowed"
                )}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </AnimatedButton>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
          {notes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                <StickyNote className="w-5 h-5 text-white/20" />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-white/30">No notes yet</span>
                <span className="text-xs text-white/20">Start typing to capture your thoughts</span>
              </div>
            </div>
          ) : (
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="flex flex-col gap-2"
            >
              <AnimatePresence initial={false}>
                {notes.map((note) => (
                  <motion.div
                    key={note.id}
                    variants={staggerItem}
                    initial={{ opacity: 0, height: 0, scale: 0.97 }}
                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                    exit={{ opacity: 0, height: 0, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="group flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 hover:border-white/10 transition-colors overflow-hidden"
                  >
                    {editingId === note.id ? (
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
                            onClick={cancelEdit}
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
                      <>
                        <p
                          className="text-sm text-white/70 leading-relaxed cursor-pointer hover:text-white/90 transition-colors"
                          onClick={() => startEdit(note)}
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
            </motion.div>
          )}
        </div>
      </FloatingPanel>
      </motion.div>
    </>
  );
}
