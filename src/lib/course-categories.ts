import { type ElementType } from "react";
import { Monitor, PenTool, Database, Cpu, Code2, Tag } from "lucide-react";

export interface CategoryStyle {
  icon: ElementType;
  gradient: string;
  shadow: string;
  ring: string;
  text: string;
  dot: string;
  hoverBg: string;
}

export const CATEGORY_CONFIG: Record<string, CategoryStyle> = {
  Engineering: {
    icon: Monitor,
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
    ring: "ring-blue-400/30",
    text: "text-blue-500",
    dot: "bg-blue-500",
    hoverBg: "hover:bg-blue-500 focus:bg-blue-500 dark:hover:bg-blue-500 dark:focus:bg-blue-500",
  },
  Design: {
    icon: PenTool,
    gradient: "from-pink-500 to-rose-400",
    shadow: "shadow-[0_4px_14px_rgba(236,72,153,0.4)]",
    ring: "ring-pink-400/30",
    text: "text-pink-500",
    dot: "bg-pink-500",
    hoverBg: "hover:bg-pink-500 focus:bg-pink-500 dark:hover:bg-pink-500 dark:focus:bg-pink-500",
  },
  Backend: {
    icon: Database,
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-[0_4px_14px_rgba(16,185,129,0.4)]",
    ring: "ring-emerald-400/30",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-500 focus:bg-emerald-500 dark:hover:bg-emerald-500 dark:focus:bg-emerald-500",
  },
  Systems: {
    icon: Cpu,
    gradient: "from-purple-500 to-violet-400",
    shadow: "shadow-[0_4px_14px_rgba(168,85,247,0.4)]",
    ring: "ring-purple-400/30",
    text: "text-purple-500",
    dot: "bg-purple-500",
    hoverBg: "hover:bg-purple-500 focus:bg-purple-500 dark:hover:bg-purple-500 dark:focus:bg-purple-500",
  },
  Development: {
    icon: Code2,
    gradient: "from-amber-500 to-orange-400",
    shadow: "shadow-[0_4px_14px_rgba(245,158,11,0.4)]",
    ring: "ring-amber-400/30",
    text: "text-amber-500",
    dot: "bg-amber-500",
    hoverBg: "hover:bg-amber-500 focus:bg-amber-500 dark:hover:bg-amber-500 dark:focus:bg-amber-500",
  },
};

export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Tag,
  gradient: "from-hero-orange to-[#ff8a6a]",
  shadow: "shadow-[0_4px_14px_rgba(255,106,58,0.4)]",
  ring: "ring-white/30",
  text: "text-orange-500",
  dot: "bg-orange-500",
  hoverBg: "hover:bg-orange-500 focus:bg-orange-500 dark:hover:bg-orange-500 dark:focus:bg-orange-500",
};

export function getCategoryStyle(category?: string | null): CategoryStyle {
  if (!category) return DEFAULT_CATEGORY_STYLE;
  return CATEGORY_CONFIG[category] || DEFAULT_CATEGORY_STYLE;
}
