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
      
      interface ApiResult {
        id: string;
        score: number;
        opportunity?: {
          id?: string;
          type?: { subtype?: string[] };
          title?: string;
          location?: string;
          target_segment?: string[];
          description?: string;
          country?: string[];
          degree?: string[];
          funding_type?: string[];
          deadline?: string;
          link?: string;
          verified?: boolean;
        };
      }

      // Safety checks / defaults mapping
      const mappedOpportunities = (data.results || []).map((result: ApiResult) => {
        const opp = result.opportunity || {};
        return {
          id: opp.id || result.id || crypto.randomUUID(),
          type: opp.type?.subtype?.[0] || "scholarship",
          title: opp.title || "Unknown Opportunity",
          subtitle: opp.location || (opp.target_segment ? opp.target_segment.join(", ") : ""),
          description: opp.description ? opp.description.slice(0, 150) + "..." : "",
          aiReason: `Matched based on semantic similarity of ${Math.round((result.score || 0) * 100)}%.`,
          country: opp.country?.[0] || "Global",
          degree: opp.degree?.[0] || "Bachelor",
          fundingType: opp.funding_type?.[0] || "Fully Funded",
          deadline: opp.deadline || "TBA",
          link: opp.link || "#",
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