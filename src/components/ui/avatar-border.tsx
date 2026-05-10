/** @usage User avatars with status indicators, profile pictures, team members */
"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckIcon } from "lucide-react";

export function AvatarBorder() {
  return (
    <div className="flex items-center justify-center px-4">
      <div className="relative w-fit">
        <Avatar className="ring-offset-background ring-2 ring-teal-600 ring-offset-2 dark:ring-teal-400">
          <AvatarImage
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=96&h=96&fit=crop&crop=face"
            alt="User avatar"
          />
          <AvatarFallback className="text-xs">HR</AvatarFallback>
        </Avatar>
        <span className="absolute -right-1.5 -bottom-1.5 inline-flex size-4 items-center justify-center rounded-full bg-teal-600 dark:bg-teal-400">
          <CheckIcon className="size-3 text-white" />
        </span>
      </div>
    </div>
  );
}
