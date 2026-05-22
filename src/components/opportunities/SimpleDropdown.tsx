"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Option = { displayName: string; value: string };

export default function SimpleDropdown({
  label,
  options,
  selected,
  onChange,
  disabled = false,
}: {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (value: string, checked: boolean) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (disabled) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
  }, [disabled]);

  useEffect(() => {
    if (disabled) return;

    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [disabled]);

  return (
    <div
      className={cn("relative", disabled && "opacity-50 cursor-not-allowed")}
      ref={ref}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 text-sm font-medium transition-all",
          open ? "ring-2 ring-primary/20 border-primary shadow-sm" : "hover:border-slate-300 dark:hover:border-slate-700",
          disabled ? "cursor-not-allowed" : "cursor-pointer"
        )}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="truncate pr-2">
          {selected.length > 0 ? `${label} (${selected.length})` : label}
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={18} className="text-slate-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            role="menu"
            className="absolute left-0 z-50 mt-2 w-full min-w-[200px] max-h-64 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-2xl backdrop-blur-xl"
          >
            <div className="space-y-1">
              {(options ?? []).map((opt) => {
                const isSelected = selected.includes(opt.value);
                return (
                  <motion.label
                    key={opt.value}
                    whileHover={{ x: 4 }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors cursor-pointer",
                      isSelected 
                        ? "bg-primary/5 text-primary font-semibold" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all",
                      isSelected 
                        ? "bg-primary border-primary text-white" 
                        : "border-slate-300 dark:border-slate-700 bg-transparent"
                    )}>
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => onChange(opt.value, e.target.checked)}
                      className="hidden"
                    />
                    <span className="truncate">
                      {opt.displayName}
                    </span>
                  </motion.label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

