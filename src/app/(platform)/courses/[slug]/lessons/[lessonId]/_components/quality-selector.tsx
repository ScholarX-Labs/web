"use client";

import { useVideoQualityOptions } from "@vidstack/react";
import { CheckIcon, Gauge } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * QualitySelector — A premium, accessible quality picker that hooks
 * directly into VidStack's quality management API.
 *
 * Design Principles (SOLID):
 * - Single Responsibility: Renders quality options. Nothing else.
 * - Open/Closed: Extensible via className prop without modifying internals.
 * - Liskov: Can be dropped anywhere inside a <MediaPlayer> tree.
 *
 * @note This component MUST be rendered inside a <MediaPlayer> for
 * useVideoQualityOptions() to access the media context.
 */
export function QualitySelector({ className }: { className?: string }) {
  const options = useVideoQualityOptions({ auto: true, sort: "descending" });
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Guard: hide entirely when quality is not user-controllable (e.g. YouTube embed) ---
  if (!options.canSetQuality || options.qualities.length === 0) {
    return null;
  }

  const selectedLabel = options.selectedQuality
    ? `${options.selectedQuality.height}p`
    : "Auto";

  return (
    <div className={cn("relative flex items-center", className)}>
      {/* Trigger Button */}
      <button
        id="quality-selector-trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Select video quality"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          "group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "bg-white/10 hover:bg-white/20 text-white",
          "border border-white/20 hover:border-white/40",
          "backdrop-blur-md transition-all duration-200 active:scale-95",
          options.autoQuality && "text-white/70"
        )}
      >
        <Gauge className="w-3.5 h-3.5 shrink-0" />
        <span>{options.autoQuality ? "Auto" : selectedLabel}</span>
      </button>

      {/* Dropdown Menu — animated, glassmorphic */}
      {isOpen && (
        <QualityDropdown
          ref={menuRef}
          options={options}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Private sub-component: Dropdown ─────────────────────────────────────────

import { forwardRef } from "react";

interface QualityDropdownProps {
  options: ReturnType<typeof useVideoQualityOptions>;
  onClose: () => void;
}

const QualityDropdown = forwardRef<HTMLDivElement, QualityDropdownProps>(
  ({ options, onClose }, ref) => {
    // Close on outside click
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref && "current" in ref && ref.current && !ref.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [onClose, ref]);

    // Close on Escape
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
      <div
        ref={ref}
        role="listbox"
        aria-label="Video quality options"
        className={cn(
          "absolute bottom-full right-0 mb-2 w-36 z-50",
          "bg-black/80 backdrop-blur-2xl border border-white/15",
          "rounded-2xl shadow-2xl shadow-black/60",
          "overflow-hidden",
          "animate-in fade-in slide-in-from-bottom-2 duration-150"
        )}
      >
        <div className="px-3 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Quality
          </p>
        </div>

        <ul className="flex flex-col gap-0.5 p-1.5">
          {/* Auto option */}
          <QualityOption
            label="Auto"
            isSelected={options.autoQuality}
            onClick={() => {
              options.autoSelectQuality();
              onClose();
            }}
          />

          {/* Specific quality renditions, sorted descending (1080p → 360p) */}
          {options.qualities.map((quality) => (
            <QualityOption
              key={quality.id}
              label={`${quality.height}p`}
              badge={quality.height >= 1080 ? "HD" : quality.height >= 720 ? "HD" : undefined}
              isSelected={!options.autoQuality && options.selectedQuality?.id === quality.id}
              onClick={() => {
                quality.select();
                onClose();
              }}
            />
          ))}
        </ul>
      </div>
    );
  }
);

QualityDropdown.displayName = "QualityDropdown";

// ─── Private atom: single option row ─────────────────────────────────────────

interface QualityOptionProps {
  label: string;
  badge?: string;
  isSelected: boolean;
  onClick: () => void;
}

function QualityOption({ label, badge, isSelected, onClick }: QualityOptionProps) {
  return (
    <li
      role="option"
      aria-selected={isSelected}
    >
      <button
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm font-medium",
          "transition-all duration-150 active:scale-[0.97]",
          isSelected
            ? "bg-white text-black"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <span className="flex items-center gap-2">
          {label}
          {badge && !isSelected && (
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-hero-blue/80 text-white">
              {badge}
            </span>
          )}
        </span>
        {isSelected && <CheckIcon className="w-3.5 h-3.5 shrink-0 text-black" />}
      </button>
    </li>
  );
}
