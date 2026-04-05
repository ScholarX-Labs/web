"use client";

import { useState, useRef, KeyboardEvent } from "react";
import {
  ArrowRight,
  Loader2,
  Globe,
  FlaskConical,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Textarea } from "@/components/ai-search/ui/textarea";

interface SearchHeroProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SUGGESTION_CHIPS = [
  "Fully funded masters in Europe",
  "STEM scholarships with no essays",
  "Study abroad with IELTS below 6.5",
];

export function SearchHero({ onSearch, isLoading }: SearchHeroProps) {
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

  function handleChipClick(chip: string) {
    setQuery(chip);
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
          Find your future with{" "}
          <span
            className="font-extrabold"
            style={{ color: "var(--scholar-blue)" }}
          >
            AI-powered
          </span>{" "}
          search
        </h1>
        <p className="text-muted-foreground text-lg">
          The premium discovery engine for global scholarships and academic
          opportunities.
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
            placeholder="Tell us about your dreams, your major, and where you want to go..."
            className="min-h-25 resize-none border-0 shadow-none focus-visible:ring-0 text-base p-2 bg-transparent placeholder:text-muted-foreground/70"
            aria-label="Search query"
          />
        </div>

        {/* Bottom bar: chips + submit */}
        <div className="flex items-end justify-between px-4 pb-4 gap-3">
          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] font-medium text-muted-foreground mr-0.5">
              Try:
            </span>
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
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
                aria-label={`Try "${chip}"`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* OPTION 1: CIRCLE ARROW BUTTON (Commented) */}
          {/* <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="shrink-0 size-10 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{ backgroundColor: "var(--scholar-blue)" }}
            aria-label="Search"
          >
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <ArrowRight className="size-5" />
            )}
          </button> */}
        </div>

        {/* OPTION 2: FULL-WIDTH GRADIENT BUTTON (Active) */}
        {/* To use Option 1, comment this div out and uncomment Option 1 above */}
        <div className="px-4 pb-3">
          <button
            onClick={handleSubmit}
            disabled={!query.trim() || isLoading}
            className="group w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-35 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.99]"
            style={{
              background:
                "linear-gradient(135deg, var(--scholar-blue) 0%, var(--scholar-blue-dark) 100%)",
            }}
            aria-label="Search"
          >
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                Discover Matches
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>

        {/* Powered by footer */}
        <div className="px-4 pb-3 flex items-center gap-1.5 text-xs text-muted-foreground border-t border-gray-100 pt-3">
          <Sparkles
            className="size-3"
            style={{ color: "var(--scholar-blue)" }}
          />
          <span>AI Search · Powered by ScholarX AI</span>
        </div>
      </div>

      {/* Popular Searches */}
      {/* <div
        className="w-full max-w-2xl mt-14 animate-fade-in-up"
        style={{ animationDelay: "0.2s" }}
      >
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Popular Searches
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FEATURE_CARDS.map(({ Icon, title, description }) => (
            <div
              key={title}
              onClick={() => {
                setQuery(title);
                onSearch(title);
              }}
              className="bg-white/70 border border-gray-100 rounded-xl p-5 hover:shadow-md transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
            >
              <div
                className="size-9 rounded-lg flex items-center justify-center mb-3"
                style={{ backgroundColor: "var(--scholar-blue-light)" }}
              >
                <Icon
                  className="size-5"
                  style={{ color: "var(--scholar-blue)" }}
                />
              </div>
              <h3 className="font-semibold text-sm text-foreground mb-1">
                {title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div> */}
    </main>
  );
}
