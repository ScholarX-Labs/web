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
import { MOCK_OPPORTUNITIES } from "@/components/ai-search/mock-data";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChatStore } from "@/stores/ai-chat.store";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AiSearchPageClient() {
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

  const submitPrompt = () => {
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

    window.setTimeout(() => {
      addMessage({
        id: createId(),
        role: "assistant",
        text: "Great question. Here are high-fit opportunities ranked for your query.",
        opportunities: MOCK_OPPORTUNITIES,
      });
      setStreaming(false);
    }, 850);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#F0F7FB]">
      <div className="flex h-full">
        <div className="hidden w-75 shrink-0 border-r border-border bg-background/95 p-4 lg:block animate-in fade-in slide-in-from-left-8 duration-700">
          <AiSearchSidebar onClearConversation={clearConversation} />
        </div>

        {isSidebarOpen ? (
          <div className="fixed inset-0 z-40 bg-black/40 lg:hidden">
            <div className="h-full w-75 bg-background p-4 shadow-xl">
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
            <span className="ml-2 text-sm font-medium">AI Search</span>
          </div>

          <ChatHeader />

          <ScrollArea className="ai-chat-scroll min-h-0 flex-1">
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 lg:px-6 lg:py-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}

              {!hasConversation && !isStreaming ? (
                <p className="text-center text-xs text-muted-foreground">
                  Ask for scholarships, internships, fellowships, or
                  conferences.
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
