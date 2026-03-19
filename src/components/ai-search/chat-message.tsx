import { BotAvatar } from "@/components/ai-search/bot-avatar";
import { OpportunityCard } from "@/components/ai-search/opportunity-card";
import { AiChatMessage } from "@/components/ai-search/types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: AiChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500", isUser ? "justify-end" : "justify-start")}>
      {!isUser ? <BotAvatar size="sm" className="mt-1" /> : null}

      <div className={cn("max-w-4xl", isUser ? "order-first" : "")}>
        <Card
          className={cn(
            "py-3 px-4 gap-2",
            isUser
              ? "bg-sky-500 text-white border-sky-400"
              : "bg-card border-border",
          )}
        >
          <p
            className={cn("text-sm", isUser ? "text-white" : "text-foreground")}
          >
            {message.text}
          </p>
        </Card>

        {message.opportunities?.length ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {message.opportunities.map((opportunity) => (
              <OpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function StreamingMessageSkeleton() {
  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-backwards">
      <BotAvatar size="sm" className="mt-1" />
      <div className="flex max-w-4xl items-center py-2">
        <div className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-background/40 px-5 shadow-[0_0_20px_rgba(51,170,204,0.15)] backdrop-blur-2xl border border-white/10">
          <span className="size-2.5 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
          <span className="size-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-0.15s]" />
          <span className="size-2.5 animate-bounce rounded-full bg-emerald-400" />
        </div>
        <span className="ml-4 text-xs font-medium text-muted-foreground/80 animate-pulse tracking-wide">
          Intelligence gathering...
        </span>
      </div>
    </div>
  );
}
