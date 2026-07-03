"use client";

import { useState } from "react";
import { Funding, FundingColors, Opportunity } from "@/lib/opportunities/types";
import { Bookmark, Calendar, MapPin, ArrowUpRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useRTLMotion } from "@/hooks/useRTLMotion";
import OpportunityModal from "./OpportunityModal";
import { COLOR_MAP, getBadgeColors } from "@/lib/opportunities/colors";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  trackOpportunityApplyClick,
  trackOpportunitySave,
} from "@/lib/opportunities/opportunity-analytics";
import { trackClientEvent } from "@/lib/executive/analytics/client";
import { ANALYTICS_EVENTS } from "@/lib/executive/analytics/constants";

const FUNDING_DISPLAY_NAME: Record<Funding, string> = {
  [Funding.FullyFunded]: "Fully Funded",
  [Funding.PartiallyFunded]: "Partially Funded",
};

function OpportiuntyCard({ Opportunity }: { Opportunity: Opportunity }) {
  const t = useTranslations("opportunities.card");
  const locale = useLocale();
  const { getX } = useRTLMotion();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [originRect, setOriginRect] = useState<DOMRect | null>(null);

  const fundingDisplayNames = {
    [Funding.FullyFunded]: t("fullyFunded"),
    [Funding.PartiallyFunded]: t("partiallyFunded"),
  };

  const handleCardClick = (e: React.MouseEvent) => {
    const cardElement = e.currentTarget as HTMLElement;
    const rect = cardElement.getBoundingClientRect();
    setOriginRect(rect);
    
    cardElement.style.transition = "opacity 160ms ease-out";
    cardElement.style.opacity = "0.3";
    
    setIsModalOpen(true);
    if (Opportunity.id) {
      void trackClientEvent({
        event: ANALYTICS_EVENTS.OPPORTUNITY_VIEW,
        properties: {
          opportunity_id: Opportunity.id,
          source: "opportunities_grid",
        },
      });
    }
  };

  const handleClose = () => {
    const activeCard = document.querySelector(
      `[data-opportunity-id="${Opportunity.id}"]`
    ) as HTMLElement | null;
    
    if (activeCard) {
      activeCard.style.transition = "opacity 160ms ease-in";
      activeCard.style.opacity = "1";
    }
    
    setIsModalOpen(false);
  };

  return (
    <>
      <motion.div
        layout
        data-opportunity-id={Opportunity.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -8, transition: { duration: 0.2 } }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
        className={cn(
          "relative flex flex-col gap-4 p-6 border border-border/40 rounded-[24px]",
          "bg-white/70 backdrop-blur-xl dark:bg-slate-900/70",
          "shadow-sm hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]",
          "transition-shadow duration-300 cursor-pointer overflow-hidden group"
        )}
      >
        {/* Top Accent Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/40 via-primary to-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="flex flex-row justify-between items-start">
          <div className="flex flex-wrap gap-2">
            {Opportunity.subtype &&
              Opportunity.subtype.slice(0, 2).map((subtype) => {
                const colors = getBadgeColors(subtype);
                return (
                  <span
                    key={subtype}
                    className={cn(
                      "text-[10px] uppercase tracking-wider rounded-full px-3 py-1 font-bold border",
                      colors.bg,
                      colors.text,
                      colors.border
                    )}
                  >
                    {subtype}
                  </span>
                );
              })}
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="rounded-full p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (Opportunity.id) {
                trackOpportunitySave(Opportunity.id, "opportunities_grid");
              }
            }}
          >
            <Bookmark size={20} />
          </motion.button>
        </div>

        <div className="flex-1 space-y-2">
          <h4 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors duration-300 line-clamp-2 min-h-[3.5rem]">
            {Opportunity.title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {Opportunity.description}
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/40">
          <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-400">
            {Opportunity.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-primary/60" />
                <span>{Opportunity.location}</span>
              </div>
            )}
            {Opportunity.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary/60" />
                <span>
                  {new Date(Opportunity.deadline).toLocaleDateString(locale, {
                    month: "short",
                    day: "2-digit",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-row flex-wrap justify-between items-center pt-2 gap-y-3">
            <div className="flex flex-wrap gap-1.5">
              {Opportunity.fundType &&
                Opportunity.fundType.map((type) => {
                  const colorBase = FundingColors[type];
                  const colors = COLOR_MAP[colorBase] || {
                    bg: "bg-slate-500/10",
                    text: "text-slate-500",
                    border: "border-slate-500/20",
                  };
                  return (
                    <span
                      key={type}
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-1 rounded-md border",
                        colors.bg,
                        colors.text,
                        colors.border
                      )}
                    >
                      {fundingDisplayNames[type]}
                    </span>
                  );
                })}
            </div>
            
            <motion.div
              animate={isHovered ? { x: getX(5) } : { x: 0 }}
              className="flex items-center gap-1 text-primary font-bold text-sm shrink-0"
            >
              <span>{t("viewDetails")}</span>
              <ArrowUpRight size={16} />
            </motion.div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>
        {isModalOpen && (
          <OpportunityModal
            opportunity={Opportunity}
            isOpen={isModalOpen}
            originRect={originRect}
            onApply={() => {
              if (Opportunity.id) {
                trackOpportunityApplyClick(Opportunity.id, "opportunities_modal");
              }
            }}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default OpportiuntyCard;

