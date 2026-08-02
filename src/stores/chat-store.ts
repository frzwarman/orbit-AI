import { create } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type { StoredMessage } from "../types/chat";

export type RetryMetadata = {
  kind: "submit" | "regenerate" | "edit-resend";
  userMessageId: string;
  assistantMessageId?: string;
};

export type ChatState = {
  messages: StoredMessage[];
  isGenerating: boolean;
  error: string | null;
  retry: RetryMetadata | null;
  replaceMessages: (messages: StoredMessage[]) => void;
  setGenerating: (isGenerating: boolean) => void;
  setFailure: (error: string | null, retry?: RetryMetadata | null) => void;
};

const createChatState = (set: StoreApi<ChatState>["setState"]): ChatState => ({
  messages: [],
  isGenerating: false,
  error: null,
  retry: null,
  replaceMessages: (messages) => set({ messages }),
  setGenerating: (isGenerating) => set({ isGenerating }),
  setFailure: (error, retry = null) => set({ error, retry }),
});

export function createChatStore(): StoreApi<ChatState> {
  return createStore<ChatState>(createChatState);
}

export const useChatStore = create<ChatState>(createChatState);
