import { cn } from "@/lib/utils";

interface BotAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showOnlineBadge?: boolean;
}

export function BotAvatar({ size = "md", className, showOnlineBadge }: BotAvatarProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={cn("relative shrink-0", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-violet-600 text-white font-bold",
          sizeClasses[size],
        )}
      >
        <span className="text-[0.6em]">AI</span>
      </div>
      {showOnlineBadge && (
        <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  );
}
