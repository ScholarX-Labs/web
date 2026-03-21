import { BotAvatar } from "@/components/ai-search/bot-avatar";
import { OpportunityCard } from "@/components/ai-search/opportunity-card";
import { AiChatMessage } from "@/components/ai-search/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  return (
    <div className="flex w-full gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-backwards">
      <BotAvatar size="sm" className="mt-1 shrink-0" />
      <div className="flex w-full max-w-4xl flex-col gap-4">
        {/* Apple Siri-like Orb / Status Indicator */}
        <div className="flex items-center py-2">
          <div className="relative flex h-10 w-24 items-center justify-center overflow-hidden rounded-full bg-card/60 shadow-[0_0_30px_rgba(51,170,204,0.15)] backdrop-blur-3xl border border-sky-500/10">
            {/* Animated glowing mesh orbs */}
            <div className="absolute left-1/4 top-1/2 size-8 -translate-y-1/2 animate-[spin_3s_linear_infinite] rounded-full bg-sky-500/40 blur-[8px]" />
            <div className="absolute right-1/4 top-1/2 size-8 -translate-y-1/2 animate-[pulse_2s_ease-in-out_infinite] rounded-full bg-violet-500/40 blur-[8px]" />
            <div className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite_reverse] rounded-full bg-emerald-500/40 blur-[8px]" />
          </div>
          <span className="ml-4 text-xs font-semibold text-transparent bg-clip-text bg-linear-to-r from-sky-500 via-violet-500 to-sky-500 animate-[pulse_2s_ease-in-out_infinite] tracking-wide">
            Synthesizing intelligence...
          </span>
        </div>

        {/* Apple Style Glassmorphism Skeleton Cards */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/40 p-4 shadow-xl backdrop-blur-xl transition-all"
              style={{
                animation: `pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite`,
                animationDelay: `${i * 150}ms`,
              }}
            >
              {/* Shimmer effect overlay */}
              <div className="absolute inset-0 z-0 bg-linear-to-br from-background/5 via-sky-500/5 to-transparent opacity-50" />

              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-center gap-4">
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>

                <div className="space-y-2 mt-2">
                  <Skeleton className="h-4 w-3/4 rounded-lg" />
                  <Skeleton className="h-3 w-1/2 rounded-lg" />
                </div>

                <div className="mt-5 space-y-2">
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-2 w-4/5 rounded-full" />
                  <Skeleton className="mt-5 h-8 w-full rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
