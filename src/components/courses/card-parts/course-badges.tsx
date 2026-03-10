import { motion } from "framer-motion";
import { Monitor, PenTool, Database, Cpu, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_STYLES: Record<
  string,
  { icon: React.ElementType; gradient: string; shadow: string; ring: string }
> = {
  Engineering: {
    icon: Monitor,
    gradient: "from-blue-500 to-cyan-400",
    shadow: "shadow-[0_4px_14px_rgba(59,130,246,0.4)]",
    ring: "ring-blue-400/30",
  },
  Design: {
    icon: PenTool,
    gradient: "from-pink-500 to-rose-400",
    shadow: "shadow-[0_4px_14px_rgba(236,72,153,0.4)]",
    ring: "ring-pink-400/30",
  },
  Backend: {
    icon: Database,
    gradient: "from-emerald-500 to-teal-400",
    shadow: "shadow-[0_4px_14px_rgba(16,185,129,0.4)]",
    ring: "ring-emerald-400/30",
  },
  Systems: {
    icon: Cpu,
    gradient: "from-purple-500 to-violet-400",
    shadow: "shadow-[0_4px_14px_rgba(168,85,247,0.4)]",
    ring: "ring-purple-400/30",
  },
};

const DEFAULT_CATEGORY_STYLE = {
  icon: Tag,
  gradient: "from-hero-orange to-[#ff8a6a]",
  shadow: "shadow-[0_4px_14px_rgba(255,106,58,0.4)]",
  ring: "ring-white/30",
};

interface CourseCategoryBadgeProps {
  category?: string;
  className?: string;
  delay?: number;
}

export function CourseCategoryBadge({
  category,
  className,
  delay = 0.2,
}: CourseCategoryBadgeProps) {
  if (!category) return null;

  const style = CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
  const Icon = style.icon;

  return (
    <motion.span
      className={cn(
        "bg-linear-to-r text-white text-[11px] font-bold tracking-wide rounded-md px-2.5 py-1.5 ring-1 backdrop-blur-md flex items-center gap-1.5",
        style.gradient,
        style.shadow,
        style.ring,
        className
      )}
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
    >
      <Icon className="w-3.5 h-3.5" />
      {category}
    </motion.span>
  );
}