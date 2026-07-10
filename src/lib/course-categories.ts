import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Code2,
  Cpu,
  Database,
  Globe,
  GraduationCap,
  Monitor,
  PenTool,
  Tag,
} from "lucide-react";

export interface CategoryStyle {
  icon: LucideIcon;
  bg: string;
  gradient: string;
  shadow: string;
  ring: string;
  text: string;
  dot: string;
  hoverBg: string;
}

export const CATEGORY_STYLE_BY_ICON_KEY: Record<string, CategoryStyle> = {
  monitor: {
    icon: Monitor,
    bg: "bg-blue-100",
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
    ring: "ring-blue-400/30",
    text: "text-blue-500",
    dot: "bg-blue-500",
    hoverBg: "hover:bg-blue-500 focus:bg-blue-500 dark:hover:bg-blue-500 dark:focus:bg-blue-500",
  },
  "pen-tool": {
    icon: PenTool,
    bg: "bg-pink-100",
    gradient: "from-pink-500 to-rose-400",
    shadow: "shadow-[0_4px_14px_rgba(236,72,153,0.4)]",
    ring: "ring-pink-400/30",
    text: "text-pink-500",
    dot: "bg-pink-500",
    hoverBg: "hover:bg-pink-500 focus:bg-pink-500 dark:hover:bg-pink-500 dark:focus:bg-pink-500",
  },
  database: {
    icon: Database,
    bg: "bg-emerald-100",
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-[0_4px_14px_rgba(16,185,129,0.4)]",
    ring: "ring-emerald-400/30",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    hoverBg: "hover:bg-emerald-500 focus:bg-emerald-500 dark:hover:bg-emerald-500 dark:focus:bg-emerald-500",
  },
  cpu: {
    icon: Cpu,
    bg: "bg-purple-100",
    gradient: "from-purple-500 to-violet-400",
    shadow: "shadow-[0_4px_14px_rgba(168,85,247,0.4)]",
    ring: "ring-purple-400/30",
    text: "text-purple-500",
    dot: "bg-purple-500",
    hoverBg: "hover:bg-purple-500 focus:bg-purple-500 dark:hover:bg-purple-500 dark:focus:bg-purple-500",
  },
  code: {
    icon: Code2,
    bg: "bg-amber-100",
    gradient: "from-amber-500 to-orange-400",
    shadow: "shadow-[0_4px_14px_rgba(245,158,11,0.4)]",
    ring: "ring-amber-400/30",
    text: "text-amber-500",
    dot: "bg-amber-500",
    hoverBg: "hover:bg-amber-500 focus:bg-amber-500 dark:hover:bg-amber-500 dark:focus:bg-amber-500",
  },
  briefcase: {
    icon: Briefcase,
    bg: "bg-indigo-100",
    gradient: "from-indigo-500 to-sky-400",
    shadow: "shadow-[0_4px_14px_rgba(99,102,241,0.4)]",
    ring: "ring-indigo-400/30",
    text: "text-indigo-500",
    dot: "bg-indigo-500",
    hoverBg: "hover:bg-indigo-500 focus:bg-indigo-500 dark:hover:bg-indigo-500 dark:focus:bg-indigo-500",
  },
  globe: {
    icon: Globe,
    bg: "bg-cyan-100",
    gradient: "from-cyan-500 to-blue-400",
    shadow: "shadow-[0_4px_14px_rgba(6,182,212,0.4)]",
    ring: "ring-cyan-400/30",
    text: "text-cyan-500",
    dot: "bg-cyan-500",
    hoverBg: "hover:bg-cyan-500 focus:bg-cyan-500 dark:hover:bg-cyan-500 dark:focus:bg-cyan-500",
  },
  "book-open": {
    icon: BookOpen,
    bg: "bg-lime-100",
    gradient: "from-lime-500 to-green-400",
    shadow: "shadow-[0_4px_14px_rgba(132,204,22,0.4)]",
    ring: "ring-lime-400/30",
    text: "text-lime-600",
    dot: "bg-lime-500",
    hoverBg: "hover:bg-lime-500 focus:bg-lime-500 dark:hover:bg-lime-500 dark:focus:bg-lime-500",
  },
  "graduation-cap": {
    icon: GraduationCap,
    bg: "bg-violet-100",
    gradient: "from-violet-500 to-fuchsia-400",
    shadow: "shadow-[0_4px_14px_rgba(139,92,246,0.4)]",
    ring: "ring-violet-400/30",
    text: "text-violet-500",
    dot: "bg-violet-500",
    hoverBg: "hover:bg-violet-500 focus:bg-violet-500 dark:hover:bg-violet-500 dark:focus:bg-violet-500",
  },
};

export const DEFAULT_CATEGORY_STYLE: CategoryStyle = {
  icon: Tag,
  bg: "bg-orange-100",
  gradient: "from-hero-orange to-[#ff8a6a]",
  shadow: "shadow-[0_4px_14px_rgba(255,106,58,0.4)]",
  ring: "ring-white/30",
  text: "text-orange-500",
  dot: "bg-orange-500",
  hoverBg: "hover:bg-orange-500 focus:bg-orange-500 dark:hover:bg-orange-500 dark:focus:bg-orange-500",
};

export const LEGACY_CATEGORY_ICON_KEYS: Record<string, string> = {
  Engineering: "monitor",
  Design: "pen-tool",
  Backend: "database",
  Systems: "cpu",
  Development: "code",
  Featured: "graduation-cap",
  ScholarX: "book-open",
};

export function getCategoryStyle(
  iconKeyOrCategory?: string | null,
): CategoryStyle {
  if (!iconKeyOrCategory) return DEFAULT_CATEGORY_STYLE;

  const iconKey =
    LEGACY_CATEGORY_ICON_KEYS[iconKeyOrCategory] ?? iconKeyOrCategory;

  return CATEGORY_STYLE_BY_ICON_KEY[iconKey] || DEFAULT_CATEGORY_STYLE;
}

export const CATEGORY_CONFIG: Record<string, CategoryStyle> = Object.fromEntries(
  Object.entries(LEGACY_CATEGORY_ICON_KEYS).map(([category, iconKey]) => [
    category,
    getCategoryStyle(iconKey),
  ]),
);
