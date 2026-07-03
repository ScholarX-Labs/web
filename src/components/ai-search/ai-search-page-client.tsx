"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Menu, X } from "lucide-react";

import { AiSearchSidebar } from "@/components/ai-search/ai-search-sidebar";
import { ChatHeader } from "@/components/ai-search/chat-header";
import {
  ChatMessage,
  StreamingMessageSkeleton,
} from "@/components/ai-search/chat-message";
import { ChatInput } from "@/components/ai-search/chat-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChatStore } from "@/stores/ai-chat.store";
import { trackAiSearchResult } from "@/lib/ai/ai-search-analytics";
import { useTranslations, useLocale } from "next-intl";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiSearchPageClient() {
  const t = useTranslations("aiSearch.chat");
  const locale = useLocale();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messages = useAiChatStore((state) => state.messages);
  const draft = useAiChatStore((state) => state.draft);
  const isStreaming = useAiChatStore((state) => state.isStreaming);
  const setDraft = useAiChatStore((state) => state.setDraft);
  const addMessage = useAiChatStore((state) => state.addMessage);
  const setStreaming = useAiChatStore((state) => state.setStreaming);
  const clearConversation = useAiChatStore((state) => state.clearConversation);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const hasConversation = useMemo(() => messages.length > 1, [messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming]);

  const submitPrompt = async () => {
    const value = draft.trim();
    if (!value || isStreaming) {
      return;
    }

    addMessage({
      id: createId(),
      role: "user",
      text: value,
    });

    setDraft("");
    setStreaming(true);
    const startedAt = Date.now();

    try {
      const response = await fetch(
        "https://scholarx-search-api.vercel.app/api/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            query: value,
            lang: locale,
            limit: 10,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch opportunities from the API.");
      }

      const data = await response.json();
      const latencyMs = Date.now() - startedAt;

      const mappedOpportunities = (data.results || []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: Record<string, any>) => {
        const opp = result.opportunity;
        return {
          id: opp.id || result.id,
          type: opp.type?.subtype?.[0] || "scholarship",
          title: opp.title || t("unknownOpportunity"),
          subtitle:
            opp.location ||
            (opp.target_segment ? opp.target_segment.join(", ") : ""),
          description: opp.description
            ? opp.description.slice(0, 150) + "..."
            : "",
          aiReason: t("matchReason", { percent: Math.round(result.score * 100) }),
          country: opp.country?.[0] || t("global"),
          deadline: opp.deadline
            ? new Date(opp.deadline).toLocaleDateString(locale, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : t("rolling"),
          fundingLabel:
            opp.fund_type?.[0] === "fully_funded"
              ? t("fullyFunded")
              : (opp.fund_type?.[0] ? opp.fund_type[0].replace("_", " ") : t("funded")),
          remote: opp.is_remote || false,
          matchScore: Math.round(result.score * 100),
          applicationLink: opp.application_link || null,
        };
      });

      addMessage({
        id: createId(),
        role: "assistant",
        text: t("assistantFound", { count: mappedOpportunities.length }),
        opportunities: mappedOpportunities,
      });
      trackAiSearchResult({
        query: value,
        resultCount: mappedOpportunities.length,
        latencyMs,
        ok: true,
      });
    } catch (error) {
      console.error(error);
      trackAiSearchResult({
        query: value,
        resultCount: 0,
        latencyMs: Date.now() - startedAt,
        ok: false,
      });
      addMessage({
        id: createId(),
        role: "assistant",
        text: t("assistantError"),
      });
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F0F7FB]">
      <div className="flex h-full">
        <div className="hidden w-75 shrink-0 border-r border-white/5 bg-background/40 backdrop-blur-3xl p-4 shadow-[5px_0_30px_rgba(0,0,0,0.03)] lg:block animate-in fade-in slide-in-from-left-8 duration-700">
          <AiSearchSidebar onClearConversation={clearConversation} />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
            <div className="h-full w-75 bg-background/40 backdrop-blur-3xl p-4 shadow-2xl border-r border-white/5">
              <div className="mb-2 flex justify-end">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>
              <AiSearchSidebar
                onClearConversation={() => {
                  clearConversation();
                  setIsSidebarOpen(false);
                }}
              />
            </div>
          </div>
        ) : null}

        <main className="flex min-w-0 flex-1 flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-backwards">
          <div className="flex items-center border-b border-border bg-card/70 px-3 py-2 lg:hidden">
            <Button
              size="icon-sm"
              variant="outline"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-4" />
            </Button>
            <span className="dir-ml-2 text-sm font-medium">{t("mobileTitle")}</span>
          </div>

          <ChatHeader />

          <ScrollArea className="ai-chat-scroll min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 lg:px-6 lg:py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {!hasConversation && !isStreaming ? (
                <p className="text-center text-xs text-muted-foreground">
                  {t("emptyState")}
                </p>
              ) : null}

              {isStreaming ? <StreamingMessageSkeleton /> : null}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          <ChatInput
            value={draft}
            onChange={setDraft}
            disabled={isStreaming}
            onSubmit={submitPrompt}
          />
        </main>
      </div>
    </div>
  );
}
