import { BotAvatar } from "@/components/ai-search/bot-avatar";
import { OpportunityCard } from "@/components/ai-search/opportunity-card";
import { AiChatMessage } from "@/components/ai-search/types";
import { cn } from "@/lib/utils";
import { LoadingStateOverlay, useStageTimeline } from "@/components/ai-search/loading";

interface ChatMessageProps {
  message: AiChatMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const isShortUserMessage =
    isUser && message.text.trim().split(/\s+/).filter(Boolean).length <= 1;

  return (
    <div
      className={cn(
        "flex gap-3 w-full",
        isUser
          ? "ai-chat-user-message justify-end"
          : "justify-start animate-in fade-in slide-in-from-bottom-4 duration-500",
      )}
    >
      {!isUser ? <BotAvatar size="sm" className="mt-1" /> : null}

      <div
        className={cn(
          "max-w-4xl flex flex-col",
          isUser ? "order-first items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "relative max-w-[85%]",
            isUser
              ? cn(
                  "ai-chat-user-message-bubble",
                  isShortUserMessage && "ai-chat-user-message-bubble-short",
                )
              : "bg-card/40 border border-white/10 rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.03)] backdrop-blur-md px-[17px] py-[10px]",
          )}
        >
          <p
            className={cn(
              "text-[15px] leading-[1.35] tracking-[-0.01em]",
              isUser
                ? "relative z-10 text-white/95 font-medium antialiased"
                : "text-foreground/90 font-medium tracking-tight leading-[1.45]",
            )}
          >
            {message.text}
          </p>
        </div>

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
  // Isolated chat context — standalone timeline (not shared with search hero)
  const { currentStage, progress } = useStageTimeline(true);

  return (
    <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
      <BotAvatar size="sm" className="mt-1 shrink-0" />
      <div className="flex w-full max-w-4xl flex-col gap-4">
        <LoadingStateOverlay
          isLoading={true}
          currentStage={currentStage}
          progress={progress}
          cardCount={3}
        />
      </div>
    </div>
  );
}
