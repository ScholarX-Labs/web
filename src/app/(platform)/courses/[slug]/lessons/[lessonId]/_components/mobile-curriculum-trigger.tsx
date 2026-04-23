"use client";

import { ListVideo } from "lucide-react";
import { motion } from "framer-motion";
import { useUILayoutStore } from "@/store/ui-layout-store";

export function MobileCurriculumTrigger() {
  const { setDrawerOpen } = useUILayoutStore();

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setDrawerOpen(true)}
      className="lg:hidden flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/70 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors"
    >
      <ListVideo className="w-3.5 h-3.5" />
      Lessons
    </motion.button>
  );
}
