import { describe, expect, it, vi } from "vitest";

import type { ConversationRepository } from "../lib/storage/conversation-repository";
import type { StoredMessage } from "../types/chat";
import type { Conversation } from "../types/conversation";
import { createConversationStore } from "./conversation-store";

describe("conversation store", () => {
  it("hydrates the newest conversation and its messages", async () => {
    const conversation: Conversation = { id: "newest", title: "Newest", createdAt: 2, updatedAt: 3 };
    const message: StoredMessage = {
      id: "message-1",
      conversationId: conversation.id,
      role: "user",
      content: "Hello",
      createdAt: 4,
      status: "complete",
    };
    const repository = {
      list: vi.fn(async () => [conversation]),
      getMessages: vi.fn(async () => [message]),
    } as unknown as ConversationRepository;
    const store = createConversationStore(repository);

    await store.getState().hydrate();

    expect(store.getState()).toMatchObject({
      hydrated: true,
      activeConversationId: conversation.id,
      activeMessages: [message],
    });
  });

  it("selects the next recent conversation after deleting the active one", async () => {
    const first: Conversation = { id: "first", title: "First", createdAt: 1, updatedAt: 3 };
    const second: Conversation = { id: "second", title: "Second", createdAt: 1, updatedAt: 2 };
    const repository = {
      delete: vi.fn(async () => undefined),
      getMessages: vi.fn(async () => []),
    } as unknown as ConversationRepository;
    const store = createConversationStore(repository);
    store.setState({ conversations: [first, second], activeConversationId: first.id });

    await store.getState().deleteConversation(first.id);

    expect(repository.delete).toHaveBeenCalledWith(first.id);
    expect(store.getState().activeConversationId).toBe(second.id);
  });
});
