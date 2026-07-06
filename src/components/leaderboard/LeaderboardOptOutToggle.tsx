"use client";

import { useState, useTransition, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Shield } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LeaderboardOptOutToggleProps {
  courseId: string;
  isAnonymous: boolean;
  isGloballyPrivate?: boolean;
}

export function LeaderboardOptOutToggle({ courseId, isAnonymous, isGloballyPrivate }: LeaderboardOptOutToggleProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticState, setOptimisticState] = useState(isAnonymous);
  const queryClient = useQueryClient();

  // Sync with prop if it changes from outside
  useEffect(() => {
    setOptimisticState(isAnonymous);
  }, [isAnonymous]);

  const handleToggle = async (checked: boolean) => {
    setOptimisticState(checked);
    startTransition(async () => {
      try {
        const res = await fetch("/api/leaderboard/opt-out", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            isAnonymous: checked,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to update privacy");
        }

        // Invalidate queries so the leaderboard re-fetches and masks/unmasks the user
        await queryClient.invalidateQueries({ queryKey: ["leaderboard", courseId] });
        
        toast.success(
          checked 
            ? "You are now anonymous on this leaderboard." 
            : "Your name is now visible on this leaderboard."
        );
      } catch (error) {
        console.error(error);
        setOptimisticState(!checked); // Revert
        toast.error("Failed to update leaderboard privacy.");
      }
    });
  };

  return (
    <div className="flex items-center space-x-2 bg-muted/50 px-3 py-1.5 rounded-md border border-border">
      <Shield className="h-4 w-4 text-muted-foreground" />
      <Label htmlFor="opt-out" className="text-sm font-medium cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
        Anonymous Mode
      </Label>
      {isGloballyPrivate ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Switch 
                  id="opt-out" 
                  checked={true} 
                  disabled={true}
                  className="data-[state=checked]:bg-primary opacity-50 cursor-not-allowed"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Your global profile is Private. You are hidden on all leaderboards.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <Switch 
          id="opt-out" 
          checked={optimisticState} 
          onCheckedChange={handleToggle} 
          disabled={isPending}
          className="data-[state=checked]:bg-primary"
        />
      )}
    </div>
  );
}
