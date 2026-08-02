import { create } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import { conversationRepository, type ConversationRepository } from "../lib/storage/conversation-repository";
import type { StoredMessage } from "../types/chat";
import type { Conversation } from "../types/conversation";

export type ConversationState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  activeMessages: StoredMessage[];
  hydrated: boolean;
  storageWarning: string | null;
  hydrate: () => Promise<void>;
  selectConversation: (id: string) => Promise<void>;
  createConversation: (title?: string) => Promise<Conversation>;
  renameConversation: (id: string, title: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  searchConversations: (query: string) => Promise<void>;
  replaceActiveMessages: (messages: StoredMessage[]) => void;
};

const storageWarning = "Conversation history is currently unavailable on this device.";

function createConversationState(
  set: StoreApi<ConversationState>["setState"],
  get: StoreApi<ConversationState>["getState"],
  repository: ConversationRepository,
): ConversationState {
  return {
    conversations: [],
    activeConversationId: null,
    activeMessages: [],
    hydrated: false,
    storageWarning: null,
    hydrate: async () => {
      try {
        const conversations = await repository.list();
        const activeConversationId = conversations[0]?.id ?? null;
        const activeMessages = activeConversationId ? await repository.getMessages(activeConversationId) : [];
        set({ conversations, activeConversationId, activeMessages, hydrated: true, storageWarning: null });
      } catch {
        set({ hydrated: true, storageWarning });
      }
    },
    selectConversation: async (id) => {
      if (!get().conversations.some((conversation) => conversation.id === id)) return;
      try {
        const activeMessages = await repository.getMessages(id);
        set({ activeConversationId: id, activeMessages, storageWarning: null });
      } catch {
        set({ storageWarning });
      }
    },
    createConversation: async (title = "New conversation") => {
      const conversation = await repository.create(title);
      set((state) => ({
        conversations: [conversation, ...state.conversations.filter(({ id }) => id !== conversation.id)],
        activeConversationId: conversation.id,
        activeMessages: [],
        storageWarning: null,
      }));
      return conversation;
    },
    renameConversation: async (id, title) => {
      const normalizedTitle = title.trim();
      if (!normalizedTitle) return;
      await repository.rename(id, normalizedTitle);
      set((state) => ({
        conversations: state.conversations.map((conversation) =>
          conversation.id === id ? { ...conversation, title: normalizedTitle, updatedAt: Date.now() } : conversation,
        ),
        storageWarning: null,
      }));
    },
    deleteConversation: async (id) => {
      await repository.delete(id);
      const remaining = get().conversations.filter((conversation) => conversation.id !== id);
      if (get().activeConversationId !== id) {
        set({ conversations: remaining, storageWarning: null });
        return;
      }
      const nextId = remaining[0]?.id ?? null;
      const activeMessages = nextId ? await repository.getMessages(nextId) : [];
      set({ conversations: remaining, activeConversationId: nextId, activeMessages, storageWarning: null });
    },
    searchConversations: async (query) => {
      try {
        set({ conversations: await repository.search(query), storageWarning: null });
      } catch {
        set({ storageWarning });
      }
    },
    replaceActiveMessages: (activeMessages) => set({ activeMessages }),
  };
}

export function createConversationStore(repository: ConversationRepository = conversationRepository): StoreApi<ConversationState> {
  return createStore<ConversationState>((set, get) => createConversationState(set, get, repository));
}

export const useConversationStore = create<ConversationState>((set, get) =>
  createConversationState(set, get, conversationRepository),
);
