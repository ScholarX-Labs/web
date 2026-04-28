"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { issueCertificateOnCompletion } from "@/actions/certificates/issue-certificate-on-completion.action";
import type { LessonSummary } from "@/types/course.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CourseCompletionInput {
  courseId: string;
  courseSlug: string;
  programName: string;
  seasonNumber: number;
  role: "mentee" | "mentor";
  /** The full ordered lesson list for the course */
  lessons: LessonSummary[];
}

interface CompletionResult {
  success: boolean;
  certificateId?: string;
  shortId?: string;
  verificationUrl?: string;
  message: string;
}

interface UseCertificateCompletionReturn {
  /** True when the celebration modal should be shown */
  showModal: boolean;
  /** True while the Server Action is in flight */
  isIssuing: boolean;
  /** Result returned by the issuance Server Action */
  result: CompletionResult | null;
  /** Call this to dismiss the modal */
  dismiss: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Reads each lesson's persisted progress from localStorage and returns
 * true only if EVERY lesson in the course has a truthy `completedAt` value.
 *
 * This is the single source of truth for "course complete":
 * all lessons must be individually marked done (≥ 80% watched) before
 * the certificate issuance pipeline is triggered.
 */
function areAllLessonsComplete(
  courseSlug: string,
  lessons: LessonSummary[],
): boolean {
  if (lessons.length === 0) return false;
  try {
    return lessons.every((lesson) => {
      const key = `progress:${courseSlug}:${lesson.id}`;
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      const p = JSON.parse(raw) as { completedAt?: number | null };
      return !!p.completedAt;
    });
  } catch {
    return false;
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * useCertificateCompletion
 *
 * Watches lesson progress across the entire course.
 * When ALL lessons reach ≥ 80% watch threshold (tracked by `useLessonProgress`),
 * this hook fires the `issueCertificateOnCompletion` Server Action exactly once
 * and shows the celebration modal.
 *
 * Design decisions:
 * - Certificate is per-COURSE, not per-lesson.
 * - The trigger is a localStorage scan of all lesson progress records —
 *   no network call needed to determine completeness.
 * - A ref flag (`hasTriggered`) ensures idempotency even if progress
 *   state flickers or the component re-renders.
 * - The Server Action handles auth and DB-level idempotency (one cert
 *   per user/course/season).
 */
export function useCertificateCompletion({
  courseId,
  courseSlug,
  programName,
  seasonNumber,
  role,
  lessons,
}: CourseCompletionInput): UseCertificateCompletionReturn {
  const [showModal, setShowModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);

  // Guard: fire the Server Action at most once per component lifecycle
  const hasTriggered = useRef(false);

  const dismiss = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    // Re-check after every progress update (triggered by parent re-renders)
    if (hasTriggered.current) return;
    if (!areAllLessonsComplete(courseSlug, lessons)) return;

    // All lessons done — trigger certificate issuance
    hasTriggered.current = true;
    setShowModal(true);
    setIsIssuing(true);

    issueCertificateOnCompletion({ courseId, programName, seasonNumber, role })
      .then((res) => setResult(res))
      .catch(() =>
        setResult({
          success: false,
          message: "Something went wrong. Please try again later.",
        }),
      )
      .finally(() => setIsIssuing(false));
  });
  // Intentionally no dependency array — re-evaluates on every render
  // so it picks up localStorage changes from the progress hook.

  return { showModal, isIssuing, result, dismiss };
}
