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
      <div className="w-full max-w-4xl space-y-3">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
          <Skeleton className="h-52 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
