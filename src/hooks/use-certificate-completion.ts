"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { issueCertificateOnCompletion } from "@/actions/certificates/issue-certificate-on-completion.action";

interface CompletionInput {
  courseId: string;
  programName: string;
  seasonNumber: number;
  role: "mentee" | "mentor";
  /** Pass true when useLessonProgress fires completedAt for the first time */
  isCompleted: boolean;
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

/**
 * useCertificateCompletion
 *
 * Orchestrates the celebration modal UX when a lesson's completion
 * threshold is crossed for the first time.
 *
 * Responsibilities (Single Responsibility Principle):
 * - Detects the first-time completion event from `isCompleted`
 * - Calls the `issueCertificateOnCompletion` Server Action exactly once
 *   (idempotent — guarded by a ref flag)
 * - Exposes modal visibility and result state to the consuming component
 *
 * The Server Action handles all auth, business logic, and DB work.
 * This hook is purely a UI-state coordinator.
 */
export function useCertificateCompletion({
  courseId,
  programName,
  seasonNumber,
  role,
  isCompleted,
}: CompletionInput): UseCertificateCompletionReturn {
  const [showModal, setShowModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [result, setResult] = useState<CompletionResult | null>(null);

  // Guard: only fire once per session even if isCompleted flickers
  const hasTriggered = useRef(false);

  const dismiss = useCallback(() => setShowModal(false), []);

  useEffect(() => {
    if (!isCompleted || hasTriggered.current) return;

    hasTriggered.current = true;
    setShowModal(true);
    setIsIssuing(true);

    issueCertificateOnCompletion({ courseId, programName, seasonNumber, role })
      .then((res) => {
        setResult(res);
      })
      .catch(() => {
        setResult({ success: false, message: "Something went wrong. Please try again later." });
      })
      .finally(() => {
        setIsIssuing(false);
      });
  }, [isCompleted, courseId, programName, seasonNumber, role]);

  return { showModal, isIssuing, result, dismiss };
}
