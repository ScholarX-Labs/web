"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ai-search/ui/textarea";
import type { IndicatorConfig } from "@/components/ai-search/loading";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";

interface SearchHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  indicatorConfig: IndicatorConfig;
}

interface SuggestionChip {
  tKey: string;
  query: string;
}

const SUGGESTION_CHIPS: SuggestionChip[] = [
  { tKey: "mastersEurope", query: "Fully funded masters in Europe" },
  { tKey: "stemNoEssays", query: "STEM scholarships with no essays" },
  { tKey: "ieltsStudyAbroad", query: "Study abroad with IELTS below 6.5" },
];

export function SearchHero({
  onSearch,
  isLoading,
  indicatorConfig,
}: SearchHeroProps) {
  const t = useTranslations("aiSearch");
  const [query, setQuery] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  function handleChipClick(chip: SuggestionChip) {
    setQuery(chip.query);
    textareaRef.current?.focus();
  }

  return (
    <main
      className="flex flex-col items-center px-4 py-16 md:py-24"
      style={{ backgroundColor: "var(--page-bg)" }}
    >
      {/* Hero Heading */}
      <div className="text-center mb-10 max-w-3xl animate-fade-in-up">
        <h1 className="text-5xl md:text-6xl font-extrabold text-foreground leading-tight mb-4">
          {t("hero.titlePrefix")}{" "}
          <span
            className="font-extrabold"
            style={{ color: "var(--scholar-blue)" }}
          >
            {t("hero.titleBrand")}
          </span>
        </h1>
        <p className="text-muted-foreground text-lg">
          {t("hero.description")}
        </p>
      </div>

      {/* Search Card */}
      <div
        className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 overflow-hidden animate-fade-in-up"
        style={{
          animationDelay: "0.1s",
          boxShadow:
            "0 4px 30px rgba(51, 153, 204, 0.15), 0 0 60px rgba(51, 153, 204, 0.08)",
        }}
      >
        <div className="p-4 pb-2">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("hero.placeholder")}
            className="min-h-25 resize-none border-0 shadow-none focus-visible:ring-0 text-base p-2 bg-transparent placeholder:text-muted-foreground/70"
            aria-label={t("hero.searchAriaLabel")}
          />
        </div>

        {/* Suggestion chips + submit */}
        <div className="flex items-end justify-between px-4 pb-4 gap-3">
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-medium text-muted-foreground mr-0.5">
              {t("hero.tryLabel")}
            </span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip.tKey}
                onClick={() => handleChipClick(chip)}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full transition-all focus:outline-none"
                style={{
                  backgroundColor: "var(--scholar-blue-light)",
                  color: "var(--scholar-blue-dark)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "var(--scholar-blue)";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "var(--scholar-blue-light)";
                  e.currentTarget.style.color = "var(--scholar-blue-dark)";
                }}
                aria-label={t("hero.tryChipLabel", { text: chip.query })}
              >
                {t(`hero.suggestions.${chip.tKey}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Full-width submit button */}
        <div className="px-4 pb-3">
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, var(--scholar-blue) 0%, var(--scholar-blue-dark) 100%)",
            }}
            aria-label={t("hero.submitAlt")}
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("hero.searching")}
              </>
            ) : (
              <>
                {t("hero.submitAlt")}
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Loading stage indicator */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-3 flex items-center gap-2 text-xs font-semibold">
                <span
                  className={`bg-gradient-to-r ${indicatorConfig.gradient} bg-clip-text text-transparent`}
                  role="status"
                  aria-live="polite"
                >
                  {indicatorConfig.label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Powered by footer */}
        <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-gray-100 pt-3">
          <Sparkles
            className="size-3"
            style={{ color: "var(--scholar-blue)" }}
          />
          <span>{t("hero.poweredBy")}</span>
        </div>
      </div>
    </main>
  );
}
