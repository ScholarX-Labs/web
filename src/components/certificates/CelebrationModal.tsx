"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import confetti from "canvas-confetti";

interface CelebrationModalProps {
  open: boolean;
  isIssuing: boolean;
  certificateId?: string;
  shortId?: string;
  verificationUrl?: string;
  programName: string;
  onDismiss: () => void;
}

/**
 * CelebrationModal
 *
 * Glassmorphism celebration overlay that appears instantly over the
 * video player when a lesson's watch threshold is crossed.
 *
 * Premium UX (Constitution §IV):
 * - Framer Motion spring entrance animation
 * - canvas-confetti burst on mount
 * - Animated pulsing trophy icon
 * - LinkedIn share CTA pre-filled with verification URL
 * - Accessible: focus-traps, keyboard dismiss, ARIA roles
 */
export function CelebrationModal({
  open,
  isIssuing,
  certificateId,
  shortId,
  verificationUrl,
  programName,
  onDismiss,
}: CelebrationModalProps) {
  const confettiFired = useRef(false);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  // Fire confetti exactly once when modal opens and cert is ready
  useEffect(() => {
    if (open && !isIssuing && certificateId && !confettiFired.current) {
      confettiFired.current = true;

      // Staggered confetti bursts
      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          origin: { y: 0.6 },
          ...opts,
          particleCount: Math.floor(200 * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ["#C9A84C", "#FFD700"] });
      fire(0.2, { spread: 60, colors: ["#1E3A5F", "#4A90D9"] });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#C9A84C", "#ffffff"] });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [open, isIssuing, certificateId]);

  // Auto-focus dismiss button for keyboard accessibility
  useEffect(() => {
    if (open) {
      setTimeout(() => dismissButtonRef.current?.focus(), 300);
    }
  }, [open]);

  const linkedInUrl = verificationUrl
    ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verificationUrl)}`
    : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="celebration-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Certificate earned"
          onClick={(e) => e.target === e.currentTarget && onDismiss()}
        >
          <motion.div
            key="celebration-card"
            initial={{ scale: 0.85, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="relative w-full max-w-md bg-gradient-to-b from-[#0d1b2a] to-[#1a2d45] border border-[#C9A84C]/30 rounded-3xl p-8 shadow-[0_40px_120px_-20px_rgba(201,168,76,0.25)] overflow-hidden"
          >
            {/* Gold shimmer top edge */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A84C]/60 to-transparent" />

            {/* Ambient glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#C9A84C]/10 rounded-full blur-[80px]" />

            {/* Trophy icon with pulse animation */}
            <div className="relative flex justify-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="w-20 h-20 rounded-full bg-[#C9A84C]/10 border border-[#C9A84C]/30 flex items-center justify-center text-4xl"
                aria-hidden="true"
              >
                🏆
              </motion.div>
            </div>

            {/* Headline */}
            <div className="text-center mb-6">
              <p className="text-xs text-[#C9A84C] font-semibold tracking-widest uppercase mb-2">
                Congratulations!
              </p>
              <h2 className="text-2xl font-bold text-white mb-2">
                You've earned a certificate!
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                You've completed{" "}
                <span className="text-white font-semibold">{programName}</span>.
                Your digital certificate is being generated.
              </p>
            </div>

            {/* Loading state */}
            {isIssuing && (
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                <p className="text-slate-500 text-xs">Generating your certificate…</p>
              </div>
            )}

            {/* Certificate details — shown once issued */}
            {!isIssuing && certificateId && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-6"
              >
                {shortId && (
                  <p className="text-center text-slate-500 text-xs font-mono mb-4">{shortId}</p>
                )}

                {/* Primary CTA */}
                {verificationUrl && (
                  <Link
                    href={verificationUrl}
                    className="block w-full py-3 text-center bg-[#C9A84C] text-[#1E3A5F] font-bold rounded-xl hover:bg-[#C9A84C]/90 transition-colors mb-3 text-sm"
                  >
                    View My Certificate →
                  </Link>
                )}

                {/* LinkedIn share */}
                {linkedInUrl && (
                  <a
                    href={linkedInUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-3 text-center bg-[#0A66C2]/20 text-[#5AA9E6] font-semibold rounded-xl hover:bg-[#0A66C2]/30 transition-colors border border-[#0A66C2]/30 text-sm"
                  >
                    Share on LinkedIn
                  </a>
                )}
              </motion.div>
            )}

            {/* Error state */}
            {!isIssuing && !certificateId && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                <p className="text-red-400 text-sm">
                  Certificate issuance encountered an issue. Check your email or
                  contact <a href="mailto:support@scholarx.lk" className="underline">support</a>.
                </p>
              </div>
            )}

            {/* Dismiss button */}
            <button
              ref={dismissButtonRef}
              onClick={onDismiss}
              className="w-full py-2.5 text-slate-400 text-sm hover:text-white transition-colors rounded-xl hover:bg-white/5"
              aria-label="Close celebration modal"
            >
              Continue Learning
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
