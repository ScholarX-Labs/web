import { useState } from "react";
import { Funding, FundingColors, Opportunity } from "@/lib/opportunities/types";
import { Bookmark, Calendar, MapPin } from "lucide-react";
import OpportunityModal from "./OpportunityModal";
import { COLOR_MAP, getBadgeColors } from "@/lib/opportunities/colors";

const FUNDING_DISPLAY_NAME: Record<Funding, string> = {
  [Funding.FullyFunded]: "Fully Funded",
  [Funding.PartiallyFunded]: "Partially Funded",
};

function OpportiuntyCard({ Opportunity }: { Opportunity: Opportunity }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="relative flex flex-col gap-1 p-4 border border-border rounded-xl bg-card shadow-sm hover:shadow-md active:shadow-md transition-all overflow-hidden group pt-0">
        <div className="h-1.5 -mx-4 mb-2 bg-primary" />
        <div className="flex flex-row justify-between">
          <div className="flex flex-row gap-0.5 scroll-auto">
            {Opportunity.subtype &&
              Opportunity.subtype.map((subtype) => {
                const colors = getBadgeColors(subtype);
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
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-20 border-2 border-accent rounded-xl p-2 font-medium transition-all duration-200 bg-transparent text-accent hover:cursor-pointer hover:bg-accent/5 active:bg-accent/10 active:scale-[0.98]"
          >
            Apply
          </button>
        </div>
      </div>
      <OpportunityModal
        opportunity={Opportunity}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default OpportiuntyCard;
