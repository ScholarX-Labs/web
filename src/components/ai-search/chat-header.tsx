import { BotAvatar } from "@/components/ai-search/bot-avatar";
import { Badge } from "@/components/ui/badge";

export function ChatHeader() {
  return (
    <header className="border-b border-white/5 bg-background/40 backdrop-blur-3xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 lg:px-6">
        <BotAvatar showOnlineBadge />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">
            AI Opportunity Assistant
          </p>
          <p className="text-xs text-emerald-600">Online • Ready to help</p>
        </div>
        <Badge 
          variant="outline" 
          className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        >
          <span className="mr-2 flex size-2 relative">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500"></span>
          </span>
          Live Session
        </Badge>
      </div>
    </header>
  );
}
