"use client";

import { useEffect, useState, useLayoutEffect, useRef, useCallback } from "react";
import { Opportunity, Funding } from "@/lib/opportunities/types";
import { Calendar, MapPin, X, Globe, DollarSign, Copy, Check, ArrowUpRight } from "lucide-react";
import { getBadgeColors } from "@/lib/opportunities/colors";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useFlipAnimation } from "@/hooks/use-flip-animation";
import { createPortal } from "react-dom";

interface OpportunityModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  originRect?: DOMRect | null;
  onClose: () => void;
}

const FUNDING_DISPLAY_NAME: Record<string, string> = {
  [Funding.FullyFunded]: "Fully Funded",
  [Funding.PartiallyFunded]: "Partially Funded",
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-2 ml-1">
        Application Link
      </p>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "flex items-center px-4 py-3 rounded-2xl border transition-all duration-300",
          "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50",
          hovered && "border-primary/30 bg-white dark:bg-slate-800 shadow-sm",
        )}
      >
        <p className="flex-1 min-w-0 text-sm text-slate-600 dark:text-slate-300 truncate font-mono">
          {url}
        </p>
        <AnimatePresence>
          {(hovered || copied) && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="ml-2"
            >
              <button
                onClick={handleCopy}
                className={cn(
                  "p-2 rounded-xl transition-all",
                  copied
                    ? "bg-green-500 text-white shadow-lg"
                    : "bg-primary text-white hover:shadow-md active:scale-95"
                )}
                aria-label={copied ? "Link copied" : "Copy link"}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {copied && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2">
              <Check size={14} />
              Copied to clipboard
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OpportunityModal({
  opportunity,
  isOpen,
  originRect,
  onClose,
}: OpportunityModalProps) {
  const [mounted, setMounted] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const { applyInverseFromRect, play, playReverse } = useFlipAnimation();
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [flipComplete, setFlipComplete] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!sheetRef.current || !isOpen || !mounted) return;

    const element = sheetRef.current;

    if (prefersReducedMotion || !originRect) {
      setFlipComplete(true);
      return;
    }

    applyInverseFromRect(element, originRect);

    const frame = requestAnimationFrame(() => {
      void play(element, {
        duration: 500,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
        onComplete: () => {
          setFlipComplete(true);
        },
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [applyInverseFromRect, originRect, play, prefersReducedMotion, isOpen, mounted]);

  const handleDismiss = useCallback(async () => {
    if (isDismissing) return;
    setIsDismissing(true);
    setFlipComplete(false);

    const element = sheetRef.current;
    if (element && originRect && !prefersReducedMotion) {
      await playReverse(element, originRect, {
        duration: 420,
        easing: "cubic-bezier(0.32, 0.72, 0, 1)",
      });
    }

    onClose();
    setIsDismissing(false);
  }, [isDismissing, onClose, originRect, playReverse, prefersReducedMotion]);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "auto";
    };
  }, [handleDismiss, isOpen]);

  const reveal = (index: number) => ({
    initial: false,
    animate: flipComplete
      ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      : {
          opacity: 0,
          y: prefersReducedMotion ? 0 : 16,
          scale: 0.98,
          filter: "blur(4px)",
        },
    transition: {
      duration: prefersReducedMotion ? 0.2 : 0.55,
      delay: prefersReducedMotion ? 0 : 0.1 + index * 0.05,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  });

  if (!isOpen || !mounted) return null;

  return createPortal(
    <motion.div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-100 flex items-start justify-center px-4 py-4 sm:px-6 sm:py-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.22 } }}
      exit={{ opacity: 0, transition: { duration: 0.16 } }}
    >
      <button
        aria-label="Close details"
        className="absolute inset-0 cursor-default bg-slate-950/58 backdrop-blur-2xl"
        onClick={handleDismiss}
      />

      <div
        ref={sheetRef}
        className={cn(
          "relative w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/30 bg-white/95 shadow-[0_48px_140px_rgba(15,23,42,0.4)] ring-1 ring-slate-100/80 dark:border-slate-800/70 dark:bg-slate-950/95 dark:ring-slate-800/80",
          "max-h-[min(850px,90vh)] flex flex-col z-10"
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <motion.div 
            {...reveal(0)}
            className="flex justify-between items-start p-8 pb-4 flex-shrink-0"
          >
            <div className="p-0">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                {opportunity.title}
              </h2>
            </div>
            <button
              onClick={handleDismiss}
              className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-full transition-all hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </motion.div>

          {/* Body */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            {/* Top Fade Indicator */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-white/95 dark:from-slate-950/95 to-transparent z-20 pointer-events-none" />
            
            <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8 flex flex-col gap-8 scroll-smooth">
              {/* Badges and Quick Info */}
            <motion.div 
              {...reveal(1)}
              className="flex flex-wrap gap-4 text-sm bg-slate-50/50 dark:bg-slate-800/30 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800/50"
            >
              {opportunity.location && (
                <div className="flex gap-2.5 items-center font-bold text-slate-600 dark:text-slate-300">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <MapPin size={18} className="text-primary" />
                  </div>
                  <span>{opportunity.location}</span>
                </div>
              )}
              {opportunity.deadline && (
                <div className="flex gap-2.5 items-center font-bold text-slate-600 dark:text-slate-300">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Calendar size={18} className="text-primary" />
                  </div>
                  <span>
                    Deadline: {new Date(opportunity.deadline).toLocaleDateString("en-US", {
                      month: "short",
                      day: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
              {opportunity.officialWebsite && (
                <div className="flex gap-2.5 items-center font-bold">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <Globe size={18} className="text-primary" />
                  </div>
                  <a
                    href={opportunity.officialWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline text-primary"
                  >
                    Official Website
                  </a>
                </div>
              )}
            </motion.div>

            <motion.div 
              {...reveal(2)}
              className="grid grid-cols-1 sm:grid-cols-2 gap-8"
            >
              {opportunity.fundType && opportunity.fundType.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">
                    Funding Details
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.fundType.map((type) => {
                      const isPartially = type === Funding.PartiallyFunded;
                      const colorClasses = isPartially
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
                      return (
                        <span
                          key={type}
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wider rounded-full px-4 py-1.5 border flex items-center gap-1.5 shadow-sm",
                            colorClasses
                          )}
                        >
                          <DollarSign size={12} strokeWidth={3} />
                          {FUNDING_DISPLAY_NAME[type] || type}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {opportunity.subtype && opportunity.subtype.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">
                    Opportunity Type
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.subtype.map((subtype) => {
                      const colors = getBadgeColors(subtype);
                      return (
                        <span
                          key={subtype}
                          className={cn(
                            "text-[10px] font-black uppercase tracking-wider rounded-full px-4 py-1.5 border shadow-sm",
                            colors.bg,
                            colors.text,
                            colors.border
                          )}
                        >
                          {subtype}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Description sections */}
            <motion.div {...reveal(3)} className="space-y-4">
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white mb-3">
                  Description
                </h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {opportunity.description}
                </p>
              </div>

              {opportunity.eligibility && (
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-3">
                    Eligibility & Requirements
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {opportunity.eligibility}
                  </p>
                </div>
              )}

              {opportunity.benefits && opportunity.benefits.length > 0 && (
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white mb-3">
                    Benefits
                  </h3>
                  <ul className="space-y-2.5">
                    {opportunity.benefits.map((benefit, i) => (
                      <li key={i} className="flex gap-3 text-slate-600 dark:text-slate-400 leading-relaxed">
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>

            {/* Additional requirements if any */}
            {(opportunity.gpa ||
              (opportunity.documentsRequired &&
                opportunity.documentsRequired.length > 0)) && (
              <motion.div {...reveal(4)} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {opportunity.gpa && (
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800/50">
                    <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      Minimum GPA
                    </span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {opportunity.gpa}
                    </span>
                  </div>
                )}
                {opportunity.documentsRequired &&
                  opportunity.documentsRequired.length > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-[24px] border border-slate-100 dark:border-slate-800/50">
                      <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                        Required Documents
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.documentsRequired.map((doc, i) => (
                          <span
                            key={i}
                            className="bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold"
                          >
                            {doc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </motion.div>
            )}
          </div>

            {/* Bottom Fade Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white/95 dark:from-slate-950/95 to-transparent z-10 pointer-events-none" />
          </div>

          {/* Footer */}
          <motion.div 
            {...reveal(5)}
            className="p-8 border-t border-slate-100 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md flex-shrink-0"
          >
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-6 min-w-0">
              <div className="flex-1 min-w-0">
                <CopyButton url={opportunity.applicationLink} />
              </div>
              <motion.a
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                href={opportunity.applicationLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-primary text-white rounded-2xl font-black shadow-[0_10px_25px_-5px_rgba(30,64,175,0.4)] hover:shadow-[0_20px_40px_-5px_rgba(30,64,175,0.5)] transition-all flex items-center justify-center gap-3"
              >
                <span>Apply Now</span>
                <ArrowUpRight size={20} strokeWidth={3} />
              </motion.a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>,
    document.body
  );
}
