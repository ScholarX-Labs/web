import {
  Funding,
  FundingColors,
  Opportunity,
  OpportunityTypeColors,
} from "@/lib/opportunities/types";
import { Bookmark, Calendar, MapPin } from "lucide-react";

const COLOR_MAP: Record<string, { bg: string; text: string; border: string }> =
  {
    "blue-500": {
      bg: "bg-blue-500/10",
      text: "text-blue-500",
      border: "border-blue-500/20",
    },
    "purple-500": {
      bg: "bg-purple-500/10",
      text: "text-purple-500",
      border: "border-purple-500/20",
    },
    "fuchsia-500": {
      bg: "bg-fuchsia-500/10",
      text: "text-fuchsia-500",
      border: "border-fuchsia-500/20",
    },
    "emerald-500": {
      bg: "bg-emerald-500/10",
      text: "text-emerald-500",
      border: "border-emerald-500/20",
    },
    "amber-500": {
      bg: "bg-amber-500/10",
      text: "text-amber-500",
      border: "border-amber-500/20",
    },
    "rose-500": {
      bg: "bg-rose-500/10",
      text: "text-rose-500",
      border: "border-rose-500/20",
    },
    "cyan-500": {
      bg: "bg-cyan-500/10",
      text: "text-cyan-500",
      border: "border-cyan-500/20",
    },
    "lime-500": {
      bg: "bg-lime-500/10",
      text: "text-lime-500",
      border: "border-lime-500/20",
    },
  };

const FUNDING_DISPLAY_NAME: Record<Funding, string> = {
  [Funding.FullyFunded]: "Fully Funded",
  [Funding.PartiallyFunded]: "Partially Funded",
};

function OpportiuntyCard({ Opportunity }: { Opportunity: Opportunity }) {
  return (
    <div className="relative flex flex-col gap-1 p-4 border border-border rounded-xl bg-card shadow-sm hover:shadow-md active:shadow-md transition-all overflow-hidden group pt-0">
      <div className="h-1.5 -mx-4 mb-2 bg-primary" />
      <div className="flex flex-row justify-between">
        <div className="flex flex-row gap-0.5 scroll-auto">
          {Opportunity.subtype &&
            Opportunity.subtype.map((subtype) => {
              const colorBase = OpportunityTypeColors[subtype];
              const colors = COLOR_MAP[colorBase] || {
                bg: "bg-gray-500/10",
                text: "text-gray-500",
                border: "border-gray-500/20",
              };
              return (
                <span
                  key={subtype}
                  className={`text-xs m-0.5 rounded-full px-2.5 py-1 font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                </span>
              );
            })}
        </div>
        <button
          className="rounded-4xl transition-colors p-1 hover:bg-gray-400/50 active:bg-gray-400/70 hover:cursor-pointer z-2"
          onClick={(e) => {
            e.stopPropagation();
            console.log("arhive");
          }}
        >
          <Bookmark />
        </button>
      </div>
      <div className="w-full">
        <h4 className="text-lg line-clamp-2 text-ellipsis min-h-14">
          {Opportunity.title}
        </h4>
      </div>
      <div className="mb-2">
        <p className="text-sm text-gray-500 line-clamp-4 min-h-20">
          {Opportunity.description}
        </p>
      </div>
      <div className="relative w-full flex justify-center pt-2">
        <div className="absolute top-0 w-3/4 border-t border-gray-400/30"></div>
        <div className="flex flex-row gap-3 w-full mt-2 text-xs text-gray-500">
          {Opportunity.location && (
            <div className="flex items-center gap-1">
              <MapPin size={14} color="#55AAD4" />
              <span>{Opportunity.location}</span>
            </div>
          )}
          {Opportunity.deadline && (
            <div className="flex items-center gap-1">
              <Calendar size={14} color="#55AAD4" />
              <span>
                {new Date(Opportunity.deadline).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-row justify-between items-center text-center">
        <div className="flex flex-row gap-0.5">
          {Opportunity.fundType &&
            Opportunity.fundType.map((type) => {
              const colorBase = FundingColors[type];
              const colors = COLOR_MAP[colorBase] || {
                bg: "bg-gray-500/10",
                text: "text-gray-500",
                border: "border-gray-500/20",
              };
              return (
                <span
                  key={type}
                  className={`text-xs m-0.5 rounded-full px-2.5 py-1 font-medium ${colors.bg} ${colors.text} border ${colors.border}`}
                >
                  {FUNDING_DISPLAY_NAME[type]}
                </span>
              );
            })}
        </div>
        <a
          href={Opportunity.applicationLink}
          className="w-20 border-2 border-accent rounded-xl p-2 font-medium transition-all duration-200 bg-transparent text-accent hover:bg-accent/5 active:bg-accent/10 active:scale-[0.98]"
        >
          Apply
        </a>
      </div>
    </div>
  );
}

export default OpportiuntyCard;
