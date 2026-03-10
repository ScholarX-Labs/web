import { cn } from "@/lib/utils";
import { Sparkles, Clock } from "lucide-react";

interface SocialProofRibbonProps {
  isBestseller?: boolean;
  urgencyText?: string;
  className?: string;
}

export function SocialProofRibbon({
  isBestseller,
  urgencyText,
  className,
}: SocialProofRibbonProps) {
  if (!isBestseller && !urgencyText) return null;

  return (
    <div className={cn("absolute -top-3 -right-3 z-30 flex flex-col gap-2 items-end drop-shadow-md", className)}>
      {isBestseller && (
        <div className="bg-linear-to-r from-amber-400 to-yellow-500 text-white text-[10px] font-black uppercase tracking-widest py-1 px-3 rounded-l-full rounded-tr-full shadow-[0_4px_10px_rgba(251,191,36,0.5)] border border-yellow-300 ring-1 ring-white/50 flex items-center gap-1 overflow-hidden relative group">
          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/50 to-transparent -translate-x-[150%] animate-[shimmer_2.5s_infinite]" />
          <Sparkles className="w-3 h-3 text-yellow-100" />
          Bestseller
        </div>
      )}

      {urgencyText && (
        <div className="bg-red-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wide py-1 px-3 rounded-full shadow-md border border-red-400/50 flex items-center gap-1 animate-pulse">
          <Clock className="w-3 h-3" />
          {urgencyText}
        </div>
      )}
    </div>
  );
}