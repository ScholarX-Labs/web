"use client";

import { motion } from "framer-motion";
import { PlayCircle, Award, ShieldCheck } from "lucide-react";

interface EnrollModalBenefitsProps {
  shouldReduceMotion: boolean;
  durationLabel?: string | null;
}

export function EnrollModalBenefits({
  shouldReduceMotion,
  durationLabel,
}: EnrollModalBenefitsProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
        What you get
      </h4>

      <motion.ul
        className="space-y-3"
        initial={false}
        animate={{
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : 0.06,
          },
        }}
      >
        <motion.li
          className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <PlayCircle className="h-5 w-5 text-hero-blue" />
          {durationLabel || "12 hours"} of high-quality video content
        </motion.li>

        <motion.li
          className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <Award className="h-5 w-5 text-hero-blue" />
          Certificate of completion included
        </motion.li>

        <motion.li
          className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300"
          initial={shouldReduceMotion ? undefined : { opacity: 0, x: -8 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <ShieldCheck className="h-5 w-5 text-hero-blue" />
          Lifetime access to all updates
        </motion.li>
      </motion.ul>
    </div>
  );
}
