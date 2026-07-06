"use client";

import { Shield, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PrivacyBadgeProps {
  isCurrentUser?: boolean;
  isGloballyPrivate?: boolean;
}

export function PrivacyBadge({ isCurrentUser, isGloballyPrivate }: PrivacyBadgeProps) {
  const t = useTranslations("leaderboard.admin");
  
  if (isCurrentUser) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border ml-2 align-middle cursor-help">
              <EyeOff className="h-3 w-3" />
              Hidden
            </span>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>
              {isGloballyPrivate 
                ? "Hidden because your global profile is private." 
                : "Hidden because you opted out of this leaderboard."}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning border border-warning/20 ml-2 align-middle">
      <Shield className="h-3 w-3" />
      {t("privateBadge")}
    </span>
  );
}
