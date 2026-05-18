"use client";

import { SearchResult } from "@/lib/ai-search/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ai-search/ui/dialog";
import { Badge } from "@/components/ai-search/ui/badge";
import {
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Globe,
  BookOpen,
  Target,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ScholarshipModalProps {
  result: SearchResult | null;
  open?: boolean;
  isOpen?: boolean;
  onClose: () => void;
}

function getCategory(result: SearchResult): string | null {
  if (result.category) return result.category;
  if (result.tags && result.tags.length > 0) return result.tags[0];
  return null;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.88, y: 30 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 350,
      damping: 35,
      mass: 1,
    },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
    },
  },
};

export function ScholarshipModal({
  result,
  open,
  isOpen,
  onClose,
}: ScholarshipModalProps) {
  const dialogOpen = typeof open === "boolean" ? open : Boolean(isOpen);

  if (!result) return null;

  const cardId = `scholarship-card-${result.id}`;
  const category = getCategory(result);
  const allTags = result.tags ?? (category ? [category] : []);
  const hasRequirements = result.requirements && result.requirements.length > 0;
  const hasBenefits = result.benefits && result.benefits.length > 0;

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none w-[80vw] max-w-none sm:max-w-none h-[90vh] overflow-hidden rounded-[2rem]">
        <DialogHeader className="hidden">
          <DialogTitle className="sr-only">{result.title}</DialogTitle>
        </DialogHeader>

        {/* Animated backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-scholar-blue/5 via-purple-500/5 to-pink-500/5 dark:from-scholar-blue/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-[2rem] pointer-events-none" />

        {/* Premium glass background with 2-column sidebar layout */}
        <motion.div
          layout
          layoutId={cardId}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 35,
            mass: 0.8,
          }}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[2rem] border border-white/40 dark:border-white/10 overflow-hidden h-full flex flex-col lg:flex-row"
          style={{
            boxShadow:
              "0 20px 80px rgba(51, 153, 204, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
          }}
        >
          {/* Main Content Area (Left) */}
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="px-8 py-10 lg:px-14 lg:py-14 space-y-12"
            >
              {/* Header inside scrollable area */}
              <motion.div
                layout
                layoutId="modal-header"
                className="relative z-10"
              >
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap gap-2 mb-6"
                >
                  {allTags.map((tag, i) => (
                    <Badge
                      key={tag}
                      className="text-sm font-semibold px-4 py-1.5 rounded-full border border-scholar-blue/20 bg-scholar-blue/5 text-scholar-blue dark:text-scholar-blue-light backdrop-blur-md"
                    >
                      {tag}
                    </Badge>
                  ))}
                </motion.div>

                <motion.h2
                  layoutId={`${cardId}-title`}
                  variants={itemVariants}
                  className="text-4xl md:text-5xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-300"
                >
                  {result.title}
                </motion.h2>

                {result.description && (
                  <motion.p
                    variants={itemVariants}
                    className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-4xl"
                  >
                    {result.description}
                  </motion.p>
                )}
              </motion.div>

              <hr className="border-border/50" />

              {/* Eligibility Section */}
              {result.eligibility && (
                <motion.div
                  layout
                  layoutId="eligibility-section"
                  variants={itemVariants}
                  className="space-y-5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20">
                      <BookOpen className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">
                      Eligibility Overview
                    </h3>
                  </div>
                  <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 leading-relaxed text-lg text-foreground/80">
                    {result.eligibility}
                  </div>
                </motion.div>
              )}

              {/* Requirements & Benefits Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Requirements */}
                {hasRequirements && (
                  <motion.div
                    layout
                    layoutId="requirements-section"
                    variants={itemVariants}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-orange-500/10 dark:bg-orange-500/20">
                        <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        Requirements
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.requirements?.map((req, i) => (
                        <motion.li
                          key={i}
                          layout
                          layoutId={`requirement-${i}`}
                          className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center text-sm font-bold text-orange-600 dark:text-orange-400">
                            {i + 1}
                          </span>
                          <span className="text-base text-foreground/80 leading-relaxed pt-1">
                            {req}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {/* Benefits */}
                {hasBenefits && (
                  <motion.div
                    layout
                    layoutId="benefits-section"
                    variants={itemVariants}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        Benefits
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.benefits?.map((benefit, i) => (
                        <motion.li
                          key={i}
                          layout
                          layoutId={`benefit-${i}`}
                          className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <span className="text-base text-foreground/80 leading-relaxed pt-1">
                            {benefit}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sticky Sidebar (Right) - Data Visualization & Actions */}
          <div className="w-full lg:w-[420px] bg-slate-50/80 dark:bg-slate-900/80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 flex flex-col h-auto lg:h-full lg:overflow-y-auto">
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              className="p-8 flex flex-col gap-8 h-full"
            >
              {/* Match Card Visualization */}
              {result.match_percentage && (
                <motion.div
                  variants={itemVariants}
                  className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-scholar-blue to-scholar-blue-dark dark:from-scholar-blue-dark dark:to-slate-800 text-white shadow-xl shadow-scholar-blue/20"
                >
                  <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-scholar-blue-light/80 text-sm font-medium uppercase tracking-wider mb-1">
                        AI Match Score
                      </p>
                      <h4 className="text-5xl font-black tracking-tighter">
                        {Math.round(result.match_percentage)}%
                      </h4>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <Target className="w-8 h-8 text-white" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick Specs Visual Grid */}
              <div className="space-y-4 flex-1">
                {result.funding && (
                  <motion.div
                    layout
                    layoutId="card-funding"
                    variants={itemVariants}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5"
                  >
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/10">
                      <DollarSign className="w-7 h-7 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Funding Amount
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {result.funding}
                      </p>
                    </div>
                  </motion.div>
                )}

                {result.deadline && (
                  <motion.div
                    layout
                    layoutId="card-deadline"
                    variants={itemVariants}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5"
                  >
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10">
                      <Calendar className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Deadline
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {result.deadline}
                      </p>
                    </div>
                  </motion.div>
                )}

                {result.location && (
                  <motion.div
                    layout
                    layoutId="card-location"
                    variants={itemVariants}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5"
                  >
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/10">
                      <MapPin className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Location
                      </p>
                      <p className="text-xl font-bold text-foreground">
                        {result.location}
                      </p>
                    </div>
                  </motion.div>
                )}

                {result.url && (
                  <motion.div
                    layout
                    layoutId="card-website"
                    variants={itemVariants}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5"
                  >
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <Globe className="w-7 h-7 text-scholar-blue dark:text-blue-400" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                        Source Website
                      </p>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-bold text-scholar-blue hover:text-scholar-blue-dark transition-colors truncate block"
                      >
                        {new URL(result.url).hostname.replace("www.", "")}
                      </a>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Actions Footer */}
              <motion.div
                layout
                layoutId="modal-footer"
                className="mt-auto pt-6 space-y-3"
              >
                {result.url && (
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={result.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 px-8 py-5 rounded-2xl font-bold text-lg text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark shadow-lg shadow-scholar-blue/30 transition-all"
                  >
                    Proceed to Application
                    <ExternalLink className="w-5 h-5 ml-1" />
                  </motion.a>
                )}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="w-full px-8 py-5 rounded-2xl font-bold text-lg text-foreground bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                >
                  Close & Continue Searching
                </motion.button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
