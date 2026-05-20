"use client";

import { SearchResult } from "@/lib/ai-search/types";
import { Badge } from "@/components/ai-search/ui/badge";
import { Calendar, DollarSign, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { cardVariants, buttonVariants } from "@/lib/ai-search-animations";
import { useState } from "react";

interface ScholarshipCardProps {
  result: SearchResult;
  onViewDetails: (result: SearchResult) => void;
}

function getCategory(result: SearchResult): string | null {
  if (result.category) return result.category;
  if (result.tags && result.tags.length > 0) return result.tags[0];
  return null;
}

export function ScholarshipCard({
  result,
  onViewDetails,
}: ScholarshipCardProps) {
  const category = getCategory(result);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      variants={cardVariants}
      whileHover="hover"
      whileTap="tap"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onViewDetails(result)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onViewDetails(result);
        }
      }}
      role="button"
      tabIndex={0}
      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-white/10 flex flex-col h-full min-h-[280px] overflow-hidden hover:cursor-pointer transition-all duration-300 group relative"
      style={{
        boxShadow: isHovered
          ? "0 20px 60px rgba(51, 153, 204, 0.15)"
          : "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* Gradient border effect on hover */}
      {isHovered && (
        <motion.div
          layoutId="border"
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background:
              "linear-gradient(135deg, rgba(51, 153, 204, 0.2), transparent)",
          }}
        />
      )}

      {/* Top: category badge + match % */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3 relative z-10">
        <div className="flex flex-wrap gap-1.5">
          {category && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Badge className="text-[11px] font-semibold px-3 py-1 rounded-full h-auto bg-gradient-to-r from-scholar-blue/20 to-purple-500/10 border border-scholar-blue/30 text-scholar-blue">
                {category}
              </Badge>
            </motion.div>
          )}
          {result.tags &&
            result.tags.slice(1, 2).map((tag) => (
              <motion.div
                key={tag}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
              >
                <Badge className="text-[11px] font-medium px-2.5 py-0.5 rounded-full h-auto bg-purple-100/80 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/50">
                  {tag}
                </Badge>
              </motion.div>
            ))}
        </div>

        {/* Match percentage badge */}
        {result.match_percentage && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-green-100/80 dark:bg-green-900/30"
          >
            <Star className="w-3.5 h-3.5 fill-green-600 text-green-600" />
            <span className="text-xs font-semibold text-green-700 dark:text-green-300">
              {Math.round(result.match_percentage)}%
            </span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="px-5 flex-1 flex flex-col gap-3 relative z-10">
        <div>
          <motion.h3
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="font-bold text-base text-foreground leading-snug mb-1.5 group-hover:text-scholar-blue transition-colors"
          >
            {result.title}
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground leading-relaxed line-clamp-2"
          >
            {result.description}
          </motion.p>
        </div>

        {/* Funding and deadline info */}
        <motion.div
          className="flex flex-col gap-2 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          {(result.fundingLevel || result.funding) && (
            <motion.div
              className="flex items-center gap-2 text-foreground/80 group-hover:text-scholar-blue transition-colors"
              whileHover={{ x: 4 }}
            >
              <div className="p-1.5 rounded-lg bg-scholar-blue/10">
                <DollarSign className="w-4 h-4 text-scholar-blue" />
              </div>
              <span className="font-semibold">
                {result.fundingLevel || result.funding}
              </span>
            </motion.div>
          )}
          {result.deadline && (
            <motion.div
              className="flex items-center gap-2 text-foreground/80 group-hover:text-scholar-blue transition-colors"
              whileHover={{ x: 4 }}
            >
              <div className="p-1.5 rounded-lg bg-scholar-blue/10">
                <Calendar className="w-4 h-4 text-scholar-blue" />
              </div>
              <span className="text-xs">Deadline: {result.deadline}</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom: View Details button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-5 pb-5 pt-3 relative z-10"
      >
        <motion.button
          variants={buttonVariants}
          initial="rest"
          whileHover="hover"
          whileTap="tap"
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails(result);
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-scholar-blue/10 to-purple-500/10 text-scholar-blue font-semibold hover:from-scholar-blue/20 hover:to-purple-500/20 border border-scholar-blue/20 transition-all group/btn"
        >
          View Details
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
