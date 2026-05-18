import { useEffect, useRef, useState } from "react";
import { Opportunity, Funding } from "@/lib/opportunities/types";
import { Calendar, MapPin, X, Globe, DollarSign, Copy, Check } from "lucide-react";
import { getBadgeColors } from "@/lib/opportunities/colors";
import { cn } from "@/lib/utils";

interface OpportunityModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
}

const FUNDING_DISPLAY_NAME: Record<string, string> = {
  [Funding.FullyFunded]: "Fully Funded",
  [Funding.PartiallyFunded]: "Partially Funded",
};

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="relative">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">
        Application Link
      </p>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          "flex items-center px-3 py-2.5 rounded-xl border transition-all duration-300",
          "bg-muted/30 border-border/60",
          hovered && "border-primary/30 bg-muted/40",
        )}
      >
        <p className="flex-1 min-w-0 text-xs text-muted-foreground truncate font-mono">
          {url}
        </p>
        <div
          className={cn(
            "flex items-center transition-all duration-300",
            hovered || copied ? "w-9 ml-2 opacity-100" : "w-0 opacity-0 overflow-hidden",
          )}
        >
          <button
            onClick={handleCopy}
            className={cn(
              "p-2 rounded-xl shrink-0 transition-all duration-300",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
              copied
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-md",
            )}
            aria-label={copied ? "Link copied" : "Copy link"}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
      </div>

      {copied && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-green-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap flex items-center gap-1.5">
            <Check size={12} />
            Copied to clipboard
          </div>
        </div>
      )}
    </div>
  );
}

export default function OpportunityModal({
  opportunity,
  isOpen,
  onClose,
}: OpportunityModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    if (isOpen) {
      if (!dialogNode.open) {
        dialogNode.showModal();
        document.body.style.overflow = "hidden"; // Prevent background scrolling
      }
    } else {
      if (dialogNode.open) {
        dialogNode.close();
        document.body.style.overflow = "";
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle native ESC key close
  useEffect(() => {
    const dialogNode = dialogRef.current;
    if (!dialogNode) return;

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dialogNode.addEventListener("cancel", handleCancel);
    return () => dialogNode.removeEventListener("cancel", handleCancel);
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 backdrop:backdrop-blur-sm bg-card text-card-foreground rounded-2xl md:max-w-2xl w-[95vw] shadow-xl border border-border open:animate-in open:fade-in-0 open:zoom-in-95 p-0 fixed inset-0 m-auto"
      onClick={(e) => {
        // Close if clicking outside the modal content (on the backdrop itself)
        if (e.target === dialogRef.current) onClose();
      }}
    >
      <div className="flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex justify-between items-start p-5 sm:p-6 border-b border-border/50 sticky top-0 bg-card z-10">
          <h2 className="text-xl sm:text-2xl font-semibold pr-4 leading-snug">
            {opportunity.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 sm:p-1.5 -mr-2 sm:-mr-1 mt-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-full transition-colors shrink-0"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {/* Badges and Quick Info */}
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl">
            {opportunity.location && (
              <div className="flex gap-2 items-center">
                <MapPin size={16} className="text-[#55AAD4]" />
                <span className="font-medium">{opportunity.location}</span>
              </div>
            )}
            {opportunity.deadline && (
              <div className="flex gap-2 items-center">
                <Calendar size={16} className="text-[#55AAD4]" />
                <span className="font-medium">
                  Deadline:{" "}
                  {(() => {
                    const date = new Date(opportunity.deadline);
                    return isNaN(date.getTime())
                      ? opportunity.deadline
                      : date.toLocaleDateString("en-US", {
                          month: "short",
                          day: "2-digit",
                          year: "numeric",
                        });
                  })()}
                </span>
              </div>
            )}
            {opportunity.officialWebsite && (
              <div className="flex gap-2 items-center">
                <Globe size={16} className="text-[#55AAD4]" />
                <a
                  href={opportunity.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline text-blue-500"
                >
                  Official Website
                </a>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {opportunity.fundType && opportunity.fundType.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 text-muted-foreground">
                  Funding Details
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.fundType.map((type) => {
                    const isPartially = type === Funding.PartiallyFunded;
                    const colorClasses = isPartially
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
                    return (
                      <span
                        key={type}
                        className={`text-xs rounded-full px-3 py-1 font-medium border flex items-center gap-1 ${colorClasses}`}
                      >
                        <DollarSign size={12} />
                        {FUNDING_DISPLAY_NAME[type] || type}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {opportunity.subtype && opportunity.subtype.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wider mb-2 text-muted-foreground">
                  Opportunity Type
                </h3>
                <div className="flex flex-wrap gap-2">
                  {opportunity.subtype.map((subtype) => {
                    const colors = getBadgeColors(subtype);
                    return (
                      <span
                        key={subtype}
                        className={`text-xs rounded-full px-3 py-1 font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                      >
                        {subtype.charAt(0).toUpperCase() + subtype.slice(1)}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Description sections */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-foreground">
              Description
            </h3>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/90">
              {opportunity.description}
            </p>
          </div>

          {opportunity.eligibility && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Eligibility & Requirements
              </h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground/90">
                {opportunity.eligibility}
              </p>
            </div>
          )}

          {opportunity.benefits && opportunity.benefits.length > 0 && (
            <div>
              <h3 className="font-semibold text-lg mb-2 text-foreground">
                Benefits
              </h3>
              <ul className="list-disc list-inside text-sm leading-relaxed text-muted-foreground/90 space-y-1">
                {opportunity.benefits.map((benefit, i) => (
                  <li key={i}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Additional requirements if any */}
          {(opportunity.gpa ||
            (opportunity.documentsRequired &&
              opportunity.documentsRequired.length > 0)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {opportunity.gpa && (
                <div className="bg-muted/30 p-3 rounded-lg">
                  <span className="block text-xs text-muted-foreground uppercase font-semibold">
                    Minimum GPA
                  </span>
                  <span className="font-medium text-foreground">
                    {opportunity.gpa}
                  </span>
                </div>
              )}
              {opportunity.documentsRequired &&
                opportunity.documentsRequired.length > 0 && (
                  <div className="bg-muted/30 p-3 rounded-lg">
                    <span className="block text-xs text-muted-foreground uppercase font-semibold mb-1">
                      Required Documents
                    </span>
                    <span className="font-medium text-foreground text-sm flex flex-wrap gap-1">
                      {opportunity.documentsRequired.map((doc, i) => (
                        <span
                          key={i}
                          className="bg-background px-2 py-0.5 rounded border border-border"
                        >
                          {doc}
                        </span>
                      ))}
                    </span>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-border/50 bg-card sticky bottom-0 z-10 mt-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <CopyButton url={opportunity.applicationLink} />
            </div>
            <a
              href={opportunity.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-primary rounded-xl font-semibold hover:opacity-90 transition-all duration-200 text-center text-primary-foreground shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 sm:shrink-0"
            >
              Apply Now
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </dialog>
  );
}
