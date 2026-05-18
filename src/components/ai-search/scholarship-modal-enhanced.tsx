"use client";

import { SearchResult } from "@/lib/ai-search/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ai-search/ui/dialog";
import { Badge } from "@/components/ai-search/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  DollarSign,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Globe,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 30,
    transition: {
      duration: 0.2,
      type: "tween" as const,
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
  const [activeTab, setActiveTab] = useState<"overview" | "requirements">(
    "overview",
  );
  const dialogOpen = typeof open === "boolean" ? open : Boolean(isOpen);

  if (!result) return null;

  const category = getCategory(result);
  const allTags = result.tags ?? (category ? [category] : []);
  const hasRequirements = result.requirements && result.requirements.length > 0;
  const hasBenefits = result.benefits && result.benefits.length > 0;

  return (
    <Dialog open={dialogOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="p-0 border-0 bg-transparent shadow-none max-w-6xl overflow-hidden rounded-3xl max-h-[92vh]">
        {/* Animated backdrop gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-scholar-blue/5 via-purple-500/5 to-pink-500/5 dark:from-scholar-blue/10 dark:via-purple-500/10 dark:to-pink-500/10 rounded-3xl pointer-events-none" />

        {/* Premium glass background */}
        <motion.div
          layout
          layoutId="modal-container"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-white/30 dark:border-white/10 overflow-hidden h-[92vh] flex flex-col"
          style={{
            boxShadow:
              "0 20px 60px rgba(51, 153, 204, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
          }}
        >
          {/* Header with gradient background */}
          <motion.div
            layout
            layoutId="modal-header"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            className="relative bg-gradient-to-br from-scholar-blue/5 to-purple-600/5 dark:from-scholar-blue/10 dark:to-purple-600/10 border-b border-white/20 dark:border-white/10 px-10 py-10 sticky top-0 z-10 backdrop-blur-sm"
          >
            {/* Top decorative element */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-scholar-blue/10 to-transparent rounded-full blur-3xl opacity-50" />

            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-2 mb-5 relative z-10"
            >
              {allTags.slice(0, 3).map((tag, i) => (
                <motion.div
                  key={tag}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                >
                  <Badge
                    className="text-xs font-semibold px-3 py-1.5 rounded-full border border-scholar-blue/20 bg-gradient-to-r from-scholar-blue/10 to-purple-500/10 text-scholar-blue dark:text-scholar-blue hover:from-scholar-blue/20 hover:to-purple-500/20 transition-all"
                  >
                    {tag}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>

            <motion.div variants={itemVariants} className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight mb-3">
                {result.title}
              </h2>
              {result.description && (
                <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                  {result.description}
                </p>
              )}
            </motion.div>

            {/* Match percentage badge - top right */}
            {result.match_percentage && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="absolute top-8 right-8 flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-100/80 to-emerald-100/80 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  {Math.round(result.match_percentage)}% Match
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          {(hasRequirements || hasBenefits) && (
            <motion.div
              layout
              layoutId="tabs-container"
              variants={itemVariants}
              className="px-10 pt-8 pb-6 flex gap-3 border-b border-white/10 sticky top-24 z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
            >
              <motion.button
                layout
                layoutId={activeTab === "overview" ? "active-tab" : ""}
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all relative whitespace-nowrap ${
                  activeTab === "overview"
                    ? "text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark shadow-lg shadow-scholar-blue/30"
                    : "text-muted-foreground hover:text-foreground bg-white/0 hover:bg-white/5 dark:hover:bg-white/5"
                }`}
              >
                Overview
              </motion.button>
              <motion.button
                layout
                layoutId={activeTab === "requirements" ? "active-tab" : ""}
                onClick={() => setActiveTab("requirements")}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all relative whitespace-nowrap ${
                  activeTab === "requirements"
                    ? "text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark shadow-lg shadow-scholar-blue/30"
                    : "text-muted-foreground hover:text-foreground bg-white/0 hover:bg-white/5 dark:hover:bg-white/5"
                }`}
              >
                Details
              </motion.button>
            </motion.div>
          )}

          {/* Content */}
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                layout
                layoutId="content-overview"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="px-10 py-10 space-y-8 flex-1 overflow-y-auto"
              >
                {/* Key Details Grid - 2x2 on desktop, larger cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {result.funding && (
                    <motion.div
                      layout
                      layoutId="card-funding"
                      variants={itemVariants}
                      className="group p-7 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/30 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/30 dark:border-blue-800/30 hover:shadow-lg hover:shadow-blue-200/20 dark:hover:shadow-blue-900/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-scholar-blue/20 group-hover:bg-scholar-blue/30 transition-all">
                          <DollarSign className="w-6 h-6 text-scholar-blue" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Funding
                          </p>
                          <p className="text-xl font-bold text-foreground">
                            {result.funding}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {result.deadline && (
                    <motion.div
                      layout
                      layoutId="card-deadline"
                      variants={itemVariants}
                      className="group p-7 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100/30 dark:from-amber-900/20 dark:to-amber-800/10 border border-amber-200/30 dark:border-amber-800/30 hover:shadow-lg hover:shadow-amber-200/20 dark:hover:shadow-amber-900/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-amber-500/20 group-hover:bg-amber-500/30 transition-all">
                          <Calendar className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Deadline
                          </p>
                          <p className="text-xl font-bold text-foreground">
                            {result.deadline}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {result.location && (
                    <motion.div
                      layout
                      layoutId="card-location"
                      variants={itemVariants}
                      className="group p-7 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/30 dark:from-purple-900/20 dark:to-purple-800/10 border border-purple-200/30 dark:border-purple-800/30 hover:shadow-lg hover:shadow-purple-200/20 dark:hover:shadow-purple-900/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-all">
                          <MapPin className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Location
                          </p>
                          <p className="text-xl font-bold text-foreground">
                            {result.location}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {result.url && (
                    <motion.div
                      layout
                      layoutId="card-website"
                      variants={itemVariants}
                      className="group p-7 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/30 dark:from-green-900/20 dark:to-green-800/10 border border-green-200/30 dark:border-green-800/30 hover:shadow-lg hover:shadow-green-200/20 dark:hover:shadow-green-900/20 transition-all"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-all">
                          <Globe className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Website
                          </p>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-lg font-bold text-scholar-blue hover:text-scholar-blue-dark transition-colors break-all"
                          >
                            View Opportunity
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Eligibility Section */}
                {result.eligibility && (
                  <motion.div
                    layout
                    layoutId="eligibility-section"
                    variants={itemVariants}
                    className="p-8 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-800/30 dark:to-slate-700/20 border border-slate-200/30 dark:border-slate-700/30"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-slate-300/30">
                        <BookOpen className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                        Eligibility
                      </h3>
                    </div>
                    <p className="text-base leading-relaxed text-foreground/80">
                      {result.eligibility}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === "requirements" && (
              <motion.div
                key="requirements"
                layout
                layoutId="content-requirements"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit={{ opacity: 0, y: -10 }}
                className="px-10 py-10 space-y-10 flex-1 overflow-y-auto"
              >
                {/* Requirements */}
                {hasRequirements && (
                  <motion.div
                    layout
                    layoutId="requirements-section"
                    variants={itemVariants}
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-scholar-blue" />
                      <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
                        Requirements
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.requirements?.map((req, i) => (
                        <motion.li
                          key={i}
                          layout
                          layoutId={`requirement-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.05 }}
                          className="flex gap-4 text-base text-foreground/80 leading-relaxed"
                        >
                          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-scholar-blue/20 flex items-center justify-center text-sm font-bold text-scholar-blue flex-none">
                            {i + 1}
                          </span>
                          <span className="pt-0.5">{req}</span>
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
                    className="space-y-5"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                      <h3 className="text-base font-bold uppercase tracking-wider text-foreground">
                        Benefits
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {result.benefits?.map((benefit, i) => (
                        <motion.li
                          key={i}
                          layout
                          layoutId={`benefit-${i}`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 + i * 0.05 }}
                          className="flex gap-4 text-base text-foreground/80 leading-relaxed"
                        >
                          <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 flex-none pt-0.5" />
                          <span className="pt-0.5">{benefit}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer with CTA */}
          <motion.div
            layout
            layoutId="modal-footer"
            variants={itemVariants}
            className="sticky bottom-0 px-10 py-8 bg-gradient-to-t from-white dark:from-slate-900 to-white/0 dark:to-slate-900/0 border-t border-white/10 backdrop-blur-sm flex gap-4"
          >
            <motion.button
              layout
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 px-8 py-4 rounded-xl font-semibold text-base text-foreground border border-white/20 dark:border-white/10 bg-white/50 dark:bg-slate-800/50 hover:bg-white/70 dark:hover:bg-slate-700/70 transition-all"
            >
              Close
            </motion.button>
            {result.url && (
              <motion.a
                layout
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-base text-white bg-gradient-to-r from-scholar-blue to-scholar-blue-dark hover:shadow-lg hover:shadow-scholar-blue/40 transition-all"
              >
                Apply Now
                <ExternalLink className="w-5 h-5" />
              </motion.a>
            )}
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
