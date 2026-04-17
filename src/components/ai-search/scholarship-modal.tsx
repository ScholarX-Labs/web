"use client";

import { SearchResult } from "@/lib/ai-search/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ai-search/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, DollarSign, MapPin, ExternalLink } from "lucide-react";

interface ScholarshipModalProps {
  result: SearchResult | null;
  open: boolean;
  onClose: () => void;
}

function getMatchPct(result: SearchResult): number | null {
  const raw = result.match_percentage;
  if (raw == null) return null;
  return raw > 1 ? Math.round(raw) : Math.round(raw * 100);
}

function getCategory(result: SearchResult): string | null {
  if (result.category) return result.category;
  if (result.tags && result.tags.length > 0) return result.tags[0];
  return null;
}

export function ScholarshipModal({
  result,
  open,
  onClose,
}: ScholarshipModalProps) {
  if (!result) return null;

  const category = getCategory(result);
  const allTags = result.tags ?? (category ? [category] : []);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          {/* Top row: tags + match% */}
          <div className="flex items-start justify-between gap-4 pr-6">
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => (
                <Badge
                  key={tag}
                  className="text-xs font-medium px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: "var(--scholar-blue-light)",
                    color: "var(--scholar-blue-dark)",
                    border: "none",
                  }}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <DialogTitle className="text-xl font-bold leading-snug mt-2">
            {result.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {result.description}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Details */}
        <div className="grid gap-3">
          {result.funding && (
            <div className="flex items-start gap-3">
              <DollarSign
                className="size-4 mt-0.5 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  Funding
                </p>
                <p className="text-sm font-medium">{result.funding}</p>
              </div>
            </div>
          )}

          {result.deadline && (
            <div className="flex items-start gap-3">
              <Calendar
                className="size-4 mt-0.5 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  Deadline
                </p>
                <p className="text-sm font-medium">{result.deadline}</p>
              </div>
            </div>
          )}

          {result.location && (
            <div className="flex items-start gap-3">
              <MapPin
                className="size-4 mt-0.5 shrink-0"
                style={{ color: "var(--scholar-blue)" }}
              />
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                  Location
                </p>
                <p className="text-sm font-medium">{result.location}</p>
              </div>
            </div>
          )}

          {result.eligibility && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Eligibility
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {result.eligibility}
              </p>
            </div>
          )}

          {result.requirements && result.requirements.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Requirements
              </p>
              <ul className="list-disc list-inside space-y-1">
                {result.requirements.map((req, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.benefits && result.benefits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                Benefits
              </p>
              <ul className="list-disc list-inside space-y-1">
                {result.benefits.map((b, i) => (
                  <li key={i} className="text-sm text-foreground/80">
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Apply button */}
        {result.url && (
          <Button
            asChild
            className="w-full font-semibold text-white mt-2"
            style={{
              backgroundColor: "var(--scholar-blue-dark)",
              borderColor: "transparent",
            }}
          >
            <a href={result.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Apply Now
            </a>
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
