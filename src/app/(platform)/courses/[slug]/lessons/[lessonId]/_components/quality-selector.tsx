"use client";

import { useVideoQualityOptions, useMediaStore } from "@vidstack/react";
import { CheckIcon, Gauge } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * QualitySelector — A premium, accessible quality picker that hooks
 * directly into VidStack's quality management API.
 */
export function QualitySelector({ className }: { className?: string }) {
  const options = useVideoQualityOptions({ auto: true, sort: "descending" });
  const { canSetQuality } = useMediaStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // --- Guard: hide entirely when quality is not user-controllable (e.g. YouTube embed) ---
  if (!canSetQuality || options.length === 0) {
    return null;
  }

  const selectedLabel = options.selectedQuality
    ? `${options.selectedQuality.height}p`
    : "Auto";

  return (
    <div className={cn("relative flex items-center", className)}>
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
          options.selectedValue === "auto" && "text-white/70"
        )}
      >
        <Gauge className="w-3.5 h-3.5 shrink-0" />
        <span>{options.selectedValue === "auto" ? "Auto" : selectedLabel}</span>
      </button>

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
  options: any; // Returning the complex options object from Vidstack
  onClose: () => void;
}

const QualityDropdown = forwardRef<HTMLDivElement, QualityDropdownProps>(
  ({ options, onClose }, ref) => {
    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref && "current" in ref && ref.current && !ref.current.contains(e.target as Node)) {
          onClose();
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [onClose, ref]);

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
          {options.map((opt: any) => (
            <QualityOption
              key={opt.value}
              label={opt.label}
              isSelected={opt.selected}
              onClick={() => {
                opt.select();
                onClose();
              }}
              badge={opt.quality && opt.quality.height >= 720 ? "HD" : undefined}
            />
          ))}
        </ul>
      </div>
    );
  }
);

QualityDropdown.displayName = "QualityDropdown";

interface QualityOptionProps {
  label: string;
  badge?: string;
  isSelected: boolean;
  onClick: () => void;
}

function QualityOption({ label, badge, isSelected, onClick }: QualityOptionProps) {
  return (
    <li role="option" aria-selected={isSelected}>
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
