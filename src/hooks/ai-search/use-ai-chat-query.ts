import { useCallback, useState, useRef } from "react";
import { useAiChatStore } from "@/stores/ai-chat.store";
import { MOCK_OPPORTUNITIES } from "@/components/ai-search/mock-data";

export function useAiChatQuery() {
  const { messages, draft, isStreaming, setDraft, addMessage, setStreaming } = useAiChatStore();
  const [error, setError] = useState<string | null>(null);
  
  // Abort controller for cancelling ongoing requests
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setStreaming(false);
    }
  }, [setStreaming]);

  const submitPrompt = useCallback(async () => {
    const value = draft.trim();
    if (!value || isStreaming) return;

    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    });

    setDraft("");
    setStreaming(true);
    setError(null);

    // Cancel any inflight previous requests
    cancelRequest();
    abortControllerRef.current = new AbortController();

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
            lang: "en",
            limit: 10,
          }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Safety checks / defaults mapping
      const mappedOpportunities = (data.results || []).map((result: unknown) => {
        const r = result as Record<string, unknown>;
        const opp = (r.opportunity as Record<string, unknown>) || {};
        return {
          id: (opp.id as string) || (r.id as string) || crypto.randomUUID(),
          type: ((opp.type as Record<string, unknown>)?.subtype as string[])?.[0] || "scholarship",
          title: (opp.title as string) || "Unknown Opportunity",
          subtitle: (opp.location as string) || ((opp.target_segment as string[])?.join(", ") ?? ""),
          description: (opp.description as string) ? (opp.description as string).slice(0, 150) + "..." : "",
          aiReason: `Matched based on semantic similarity of ${Math.round(((r.score as number) || 0) * 100)}%.`,
          country: ((opp.country as string[])?.[0]) || "Global",
          degree: ((opp.degree as string[])?.[0]) || "Bachelor",
          fundingType: ((opp.funding_type as string[])?.[0]) || "Fully Funded",
          deadline: (opp.deadline as string) || "TBA",
          link: (opp.link as string) || "#",
          isVerified: opp.verified !== false,
        };
      });

      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        text: data.answer || "I found some opportunities for you based on this criteria.",
        opportunities: mappedOpportunities.length > 0 ? mappedOpportunities : [],
      });

    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        console.log("Request intentionally aborted");
        return;
      }
      
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to fetch response");
      
      // Fallback UI or silent error depending on business logic
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        text: "I experienced a network issue. Here is an offline mock result to visualize the UI state.",
        opportunities: MOCK_OPPORTUNITIES,
      });
      
    } finally {
      setStreaming(false);
      abortControllerRef.current = null;
    }
  }, [draft, isStreaming, addMessage, setDraft, setStreaming, cancelRequest]);

  return {
    messages,
    draft,
    isStreaming,
    error,
    setDraft,
    submitPrompt,
    cancelRequest,
    clearConversation: useAiChatStore.getState().clearConversation,
  };
}