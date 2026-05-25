"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Globe,
  Target,
} from "lucide-react";
import { Textarea } from "@/components/ai-search/ui/textarea";
import { SearchButtonLoader } from "@/components/ai-search/loading";
import type { IndicatorConfig } from "@/components/ai-search/loading";
import { motion } from "framer-motion";
import {
  heroContainerVariants,
  heroItemVariants,
  searchCardVariants,
  chipVariants,
  buttonVariants,
} from "@/lib/ai-search-animations";

interface SearchHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  indicatorConfig: IndicatorConfig;
}

const SUGGESTION_CHIPS = [
  {
    text: "Fully funded masters in Europe",
    icon: Globe,
  },
  {
    text: "STEM scholarships with no essays",
    icon: Target,
  },
  {
    text: "Study abroad with IELTS below 6.5",
    icon: Zap,
  },
];

export function SearchHero({ onSearch, isLoading, indicatorConfig }: SearchHeroProps) {
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  function handleSubmit() {
    const trimmed = query.trim();
    if (!trimmed || isLoading) return;
    onSearch(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleChipClick(chip: string) {
    setQuery(chip);
    textareaRef.current?.focus();
  }

  return (
    <main className="relative overflow-hidden">
      {/* Animated background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200 dark:bg-blue-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute -bottom-8 left-1/4 w-96 h-96 bg-purple-200 dark:bg-purple-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />

      {/* Content */}
      <motion.div
        variants={heroContainerVariants}
        initial="hidden"
        animate="visible"
        className="relative flex flex-col items-center px-4 py-16 md:py-28 z-10"
      >
        {/* Top Badge */}
        <motion.div variants={heroItemVariants}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/10 backdrop-blur-md border border-white/20 shadow-lg mb-8">
            <Sparkles className="w-4 h-4 text-scholar-blue" />
            <span className="text-sm font-semibold text-foreground">
              By ScholarX AI
            </span>
          </div>
        </motion.div>

        {/* Hero Heading */}
        <motion.div
          variants={heroItemVariants}
          className="text-center mb-12 max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-tight mb-6 tracking-tight">
            Find your future with{" "}
            <span className="bg-gradient-to-r from-scholar-blue via-purple-600 to-scholar-blue bg-clip-text text-transparent">
              ScholarX AI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            The premium discovery engine for global scholarships and academic
            opportunities. Get personalized recommendations in seconds.
          </p>
        </motion.div>

        {/* Search Card with enhanced styling */}
        <motion.div variants={searchCardVariants} className="w-full max-w-2xl">
          <div
            className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 overflow-hidden shadow-2xl ${
              isFocused
                ? "border-scholar-blue/50 shadow-2xl shadow-scholar-blue/20"
                : "border-white/20 dark:border-white/10"
            }`}
          >
            <div className="p-6 pb-2">
              <Textarea
                ref={textareaRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Tell us about your dreams, your major, and where you want to go..."
                className="min-h-28 resize-none border-0 shadow-none focus-visible:ring-0 text-base p-0 bg-transparent placeholder:text-muted-foreground/60 focus:placeholder:text-muted-foreground/40 transition-colors"
                aria-label="Search query"
              />
            </div>

            {/* Bottom bar: chips + submit */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              {/* Suggestion chips */}
              <motion.div
                className="flex flex-wrap gap-2"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: {
                    transition: {
                      staggerChildren: 0.08,
                    },
                  },
                }}
              >
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-center">
                  Try:
                </span>
                {SUGGESTION_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <motion.button
                      key={chip.text}
                      onClick={() => handleChipClick(chip.text)}
                      variants={chipVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-scholar-blue/50"
                      style={{
                        backgroundColor: "var(--scholar-blue-light)",
                        color: "var(--scholar-blue-dark)",
                      }}
                      aria-label={`Try "${chip.text}"`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {chip.text}
                    </motion.button>
                  );
                })}
              </motion.div>

              {/* Submit button with enhanced styling */}
              <motion.button
                onClick={handleSubmit}
                disabled={!query.trim() || isLoading}
                variants={buttonVariants}
                initial="rest"
                whileHover="hover"
                whileTap="tap"
                className="group w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, var(--scholar-blue) 0%, var(--scholar-blue-dark) 100%)",
                  boxShadow: "0 8px 24px rgba(51, 153, 204, 0.3)",
                }}
                aria-label="Search"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 group-hover:translate-x-full transition-transform duration-700" />

                {isLoading ? (
                  <SearchButtonLoader indicatorConfig={indicatorConfig} />
                ) : (
                  <>
                    <span>Discover Opportunities</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Bottom social proof / info */}
        <motion.div
          variants={heroItemVariants}
          className="mt-12 flex gap-6 md:gap-12 text-center md:text-left"
        >
          <div>
            <p className="text-2xl md:text-3xl font-bold text-scholar-blue">
              50K+
            </p>
            <p className="text-sm text-muted-foreground">Scholarships</p>
          </div>
          <div className="hidden md:block w-px bg-border" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-scholar-blue">
              180+
            </p>
            <p className="text-sm text-muted-foreground">Countries</p>
          </div>
          <div className="hidden md:block w-px bg-border" />
          <div>
            <p className="text-2xl md:text-3xl font-bold text-scholar-blue">
              $2B+
            </p>
            <p className="text-sm text-muted-foreground">In Funding</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Animated blob styles */}
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </main>
  );
}
