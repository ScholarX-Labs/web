"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export interface Note {
  id: string;
  text: string;
  /** Human-readable time e.g. "22:35" */
  timestamp: string;
  /** Unix ms */
  createdAt: number;
}

interface UseNotesOptions {
  lessonId: string;
  courseSlug: string;
}

interface UseNotesReturn {
  notes: Note[];
  noteInput: string;
  setNoteInput: (v: string) => void;
  editingId: string | null;
  editText: string;
  setEditText: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleAddNote: () => void;
  handleDeleteNote: (id: string) => void;
  handleSaveEdit: (id: string) => void;
  startEdit: (note: Note) => void;
  cancelEdit: () => void;
}

/**
 * useNotes — SRP hook for lesson note CRUD.
 *
 * Persists to localStorage keyed as `notes:{courseSlug}:{lessonId}`.
 * Extracted from LessonTabs to enable composition in NotesPanelOverlay.
 */
export function useNotes({ lessonId, courseSlug }: UseNotesOptions): UseNotesReturn {
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteInput, setNoteInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const storageKey = `notes:${courseSlug}:${lessonId}`;

  // Load persisted notes
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setNotes(JSON.parse(stored));
    } catch { /* ignore */ }
  }, [storageKey]);

  const persist = useCallback((updated: Note[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch { /* ignore */ }
  }, [storageKey]);

  const handleAddNote = useCallback(() => {
    const text = noteInput.trim();
    if (!text) return;
    const now = new Date();
    const timestamp = now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const newNote: Note = {
      id: `${Date.now()}-${Math.random()}`,
      text,
      timestamp,
      createdAt: now.getTime(),
    };
    persist([newNote, ...notes]);
    setNoteInput("");
    textareaRef.current?.focus();
  }, [noteInput, notes, persist]);

  const handleDeleteNote = useCallback((id: string) => {
    persist(notes.filter((n) => n.id !== id));
  }, [notes, persist]);

  const handleSaveEdit = useCallback((id: string) => {
    const text = editText.trim();
    if (!text) return;
    persist(notes.map((n) => n.id === id ? { ...n, text } : n));
    setEditingId(null);
    setEditText("");
  }, [editText, notes, persist]);

  const startEdit = useCallback((note: Note) => {
    setEditingId(note.id);
    setEditText(note.text);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditText("");
  }, []);

  return {
    notes,
    noteInput,
    setNoteInput,
    editingId,
    editText,
    setEditText,
    textareaRef,
    handleAddNote,
    handleDeleteNote,
    handleSaveEdit,
    startEdit,
    cancelEdit,
  };
}
