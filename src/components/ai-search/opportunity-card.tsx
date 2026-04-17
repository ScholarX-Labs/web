"use client";

import { useOptimistic, useTransition } from "react";
import { cva } from "class-variance-authority";
import { ArrowRight, Bookmark, CalendarDays, MapPin, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { toggleSavedOpportunity } from "@/actions/user.actions";
import { useSession } from "@/lib/auth-client";

import { Opportunity } from "@/components/ai-search/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const typeBadgeVariants = cva("capitalize", {
  variants: {
    type: {
      scholarship: "bg-blue-100 text-blue-700",
      conference: "bg-emerald-100 text-emerald-700",
      prize: "bg-amber-100 text-amber-700",
      internship: "bg-violet-100 text-violet-700",
      fellowship: "bg-cyan-100 text-cyan-700",
    },
  },
  defaultVariants: {
    type: "scholarship",
  },
});

function getScoreClass(score: number) {
  if (score >= 90) {
    return "text-emerald-700 border-emerald-200 bg-emerald-50";
  }

  if (score >= 80) {
    return "text-amber-700 border-amber-200 bg-amber-50";
  }

  return "text-orange-700 border-orange-200 bg-orange-50";
}

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const { data: session } = useSession();

  // Extract the saved list from the user's session safely
  const savedList: string[] = (session?.user as any)?.savedOpportunities || [];
  const isCurrentlySaved = savedList.includes(opportunity.id);

  // Optimistic UI state for instant feedback
  const [optimisticSaved, addOptimisticSaved] = useOptimistic(
    isCurrentlySaved,
    (state, newSavedState: boolean) => newSavedState
  );

  const [isPending, startTransition] = useTransition();

  const handleToggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!session?.user) {
      // You could trigger a sign-in modal/toast here in a real production app.
      return;
    }

    const newState = !optimisticSaved;
    startTransition(async () => {
      addOptimisticSaved(newState);
      try {
        const result = await toggleSavedOpportunity(opportunity.id, newState ? "save" : "unsave");
        if (!result.success) {
          toast.error(result.error || "Failed to update saved status. Please try again.");
        }
      } catch (error) {
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  return (
    <Card className="gap-4 border-blue-200/70 py-4 transition-all duration-500 hover:-translate-y-1 hover:border-sky-400/50 hover:shadow-xl hover:shadow-sky-500/10 cursor-pointer">
      <CardHeader className="gap-2 px-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(typeBadgeVariants({ type: opportunity.type }))}
          >
            {opportunity.type}
          </Badge>
          <Badge
            variant="outline"
            className={cn("ml-auto", getScoreClass(opportunity.matchScore))}
          >
            + {opportunity.matchScore}% Match
          </Badge>
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn(
              "text-muted-foreground transition-colors duration-300",
              optimisticSaved && "text-sky-500 hover:text-sky-600 hover:bg-sky-50"
            )}
            aria-label={optimisticSaved ? "Unsave opportunity" : "Save opportunity"}
            onClick={handleToggleSave}
            disabled={!session?.user} // Prevent action if user is not logged in
          >
            <Bookmark className={cn(optimisticSaved && "fill-sky-500 text-sky-500")} />
          </Button>
        </div>

        <div>
          <CardTitle className="text-sm leading-5">
            {opportunity.title}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {opportunity.subtitle}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 px-4">
        <p className="text-xs text-muted-foreground">
          {opportunity.description}
        </p>

        <Alert className="bg-violet-50/80 border-violet-100 py-2">
          <Sparkles className="size-3.5 text-violet-600" />
          <AlertDescription className="text-xs text-violet-700">
            {opportunity.aiReason}
          </AlertDescription>
        </Alert>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {opportunity.country}
          </span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="size-3.5" />
            {opportunity.deadline}
          </span>
          {opportunity.remote ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[10px]">
              Remote
            </Badge>
          ) : null}
        </div>
      </CardContent>

      <CardFooter className="mt-auto justify-between gap-2 px-4 pt-0">
        <Badge
          variant="secondary"
          className="h-6 bg-emerald-50 text-emerald-700"
        >
          {opportunity.fundingLabel}
        </Badge>
        {opportunity.applicationLink ? (
          <Button
            size="sm"
            className="group bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300"
            asChild
          >
            <a
              href={opportunity.applicationLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              Apply Now
              <ArrowRight className="ml-1.5 size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </Button>
        ) : (
          <Button size="sm" className="bg-sky-500 hover:bg-sky-600 text-white">
            Apply Now
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
