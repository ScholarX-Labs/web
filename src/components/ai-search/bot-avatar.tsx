import Image from "next/image";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BotAvatarProps {
  size?: "default" | "sm" | "lg";
  className?: string;
  showOnlineBadge?: boolean;
  alt?: string;
}

const FALLBACK_ICON_CLASS: Record<
  NonNullable<BotAvatarProps["size"]>,
  string
> = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
};

export function BotAvatar({
  size = "default",
  className,
  showOnlineBadge = false,
  alt = "AI Opportunity Assistant",
}: BotAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage src="/Bot_Logo.svg" alt={alt} />
      <AvatarFallback className="bg-primary/10 text-primary">
        <Image
          src="/Bot_Logo.svg"
          alt="AI"
          width={16}
          height={16}
          className={cn(FALLBACK_ICON_CLASS[size])}
        />
      </AvatarFallback>
      {showOnlineBadge ? <AvatarBadge className="bg-emerald-500" /> : null}
    </Avatar>
  );
}
