"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SwitchSize = "sm" | "md" | "lg";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  size?: SwitchSize;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

const sizeMap: Record<SwitchSize, { track: string; thumb: string; translateX: number }> = {
  sm: { track: "h-5 w-[44px] px-0.5", thumb: "h-3.5 w-3.5", translateX: 22 },
  md: { track: "h-7 px-1 w-[60px]", thumb: "h-5 w-5", translateX: 32 },
  lg: { track: "h-9 px-1 w-[76px]", thumb: "h-7 w-7", translateX: 42 },
};

export function Switch({
  checked,
  onCheckedChange,
  size = "md",
  disabled = false,
  className,
  id,
  label,
}: SwitchProps) {
  const { track, thumb, translateX } = sizeMap[size];

  return (
    <label
      htmlFor={id ?? "switch"}
      className={cn(
        "flex items-center gap-3",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <div
        className={cn(
          track,
          "flex items-center border border-transparent shadow-[inset_0px_0px_12px_rgba(0,0,0,0.25)] rounded-full relative cursor-pointer transition-colors duration-200",
          checked ? "bg-cyan-500" : "bg-slate-700 border-slate-500",
          disabled && "cursor-not-allowed"
        )}
        aria-checked={checked}
        role="switch"
      >
        <motion.div
          layout
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
          className={cn(thumb, "rounded-full bg-white shadow-md z-10 block")}
          animate={{
            x: checked ? translateX : 0,
          }}
        />
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
          id={id ?? "switch"}
        />
      </div>
      {label && (
        <span className="text-sm font-medium text-neutral-300 select-none">
          {label}
        </span>
      )}
    </label>
  );
}
