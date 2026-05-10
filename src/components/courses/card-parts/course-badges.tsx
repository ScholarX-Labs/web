import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getCategoryStyle } from "@/lib/course-categories";

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

  const style = getCategoryStyle(category);
  const Icon = style.icon;

  return (
    <motion.span
      className={cn(
        "bg-linear-to-r text-white text-[11px] font-bold tracking-wide rounded-md px-2.5 py-1.5 ring-1 backdrop-blur-md flex items-center gap-1.5",
        style.gradient,
        style.shadow,
        style.ring,
        className,
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
