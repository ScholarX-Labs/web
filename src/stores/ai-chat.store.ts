import { create } from "zustand";

import { INITIAL_MESSAGES } from "@/components/ai-search/mock-data";
import { AiChatMessage } from "@/components/ai-search/types";

interface AiChatState {
  messages: AiChatMessage[];
  draft: string;
  isStreaming: boolean;

  setDraft: (draft: string) => void;
  addMessage: (message: AiChatMessage) => void;
  setStreaming: (value: boolean) => void;
  clearConversation: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  messages: INITIAL_MESSAGES,
  draft: "",
  isStreaming: false,

  setDraft: (draft) => set({ draft }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  setStreaming: (value) => set({ isStreaming: value }),
  clearConversation: () =>
    set({
      messages: INITIAL_MESSAGES,
      draft: "",
      isStreaming: false,
    }),
}));
