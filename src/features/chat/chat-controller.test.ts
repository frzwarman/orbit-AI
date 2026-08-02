import { act } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { AIProvider, ChatMessage, StreamChatOptions } from "../../lib/ai/types";
import type { ConversationRepository } from "../../lib/storage/conversation-repository";
import { useAssistantStore } from "../../stores/assistant-store";
import { createChatStore } from "../../stores/chat-store";
import { createConversationStore } from "../../stores/conversation-store";
import type { StoredMessage } from "../../types/chat";
import type { Conversation } from "../../types/conversation";
import { createChatController } from "./chat-controller";

class ControlledProvider implements AIProvider {
  private options?: StreamChatOptions;
  private resolve?: () => void;
  private reject?: (error: unknown) => void;
  private markStarted!: () => void;
  readonly started = new Promise<void>((resolve) => {
    this.markStarted = resolve;
  });

  streamChat(_messages: ChatMessage[], options: StreamChatOptions): Promise<void> {
    this.options = options;
    this.markStarted();
    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      options.signal?.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError")), {
        once: true,
      });
    });
  }

  emit(token: string) {
    this.options?.onToken(token);
  }

  finish() {
    this.resolve?.();
  }

  fail(error: Error) {
    this.reject?.(error);
  }
}

function makeRepository() {
  const conversation: Conversation = { id: "conversation-1", title: "Orbit", createdAt: 1, updatedAt: 1 };
  const messages: StoredMessage[] = [];
  return {
    conversation,
    messages,
    repository: {
      create: vi.fn(async () => conversation),
      list: vi.fn(async () => [conversation]),
      rename: vi.fn(async () => undefined),
      delete: vi.fn(async () => undefined),
      search: vi.fn(async () => [conversation]),
      getMessages: vi.fn(async () => [...messages]),
      appendMessage: vi.fn(async (message: StoredMessage) => {
        messages.push({ ...message });
      }),
      updateMessage: vi.fn(async (id: string, changes: Partial<StoredMessage>) => {
        const message = messages.find((candidate) => candidate.id === id);
        if (message) Object.assign(message, changes);
      }),
      truncateAfter: vi.fn(async (_conversationId: string, createdAt: number) => {
        messages.splice(0, messages.length, ...messages.filter((message) => message.createdAt <= createdAt));
      }),
    } as unknown as ConversationRepository,
  };
}

describe("chat controller", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useAssistantStore.setState({ state: "idle", config: null });
  });

  afterEach(() => vi.useRealTimers());

  it("derives thinking, streaming, done, and idle from real stream events", async () => {
    const provider = new ControlledProvider();
    const { conversation, repository } = makeRepository();
    const conversationStore = createConversationStore(repository);
    conversationStore.setState({ conversations: [conversation], activeConversationId: conversation.id });
    const chatStore = createChatStore();
    const controller = createChatController({ provider, repository, conversationStore, chatStore });

    const execution = controller.submit("Explain Orbit");
    expect(useAssistantStore.getState().state).toBe("thinking");
    await provider.started;
    provider.emit("First token");
    expect(useAssistantStore.getState().state).toBe("streaming");
    provider.finish();
    await execution;
    expect(useAssistantStore.getState().state).toBe("done");
    await act(async () => vi.advanceTimersByTime(1_500));
    expect(useAssistantStore.getState().state).toBe("idle");
  });

  it("aborts generation and retains a non-empty partial response", async () => {
    const provider = new ControlledProvider();
    const { conversation, repository } = makeRepository();
    const conversationStore = createConversationStore(repository);
    conversationStore.setState({ conversations: [conversation], activeConversationId: conversation.id });
    const chatStore = createChatStore();
    const controller = createChatController({ provider, repository, conversationStore, chatStore });

    const execution = controller.submit("Long task");
    await provider.started;
    provider.emit("Partial");
    controller.stop();
    await execution;

    expect(useAssistantStore.getState().state).toBe("idle");
    expect(chatStore.getState().messages.at(-1)).toMatchObject({ content: "Partial", status: "interrupted" });
  });

  it("preserves partial output and retry metadata when the provider fails", async () => {
    const provider = new ControlledProvider();
    const { conversation, repository } = makeRepository();
    const conversationStore = createConversationStore(repository);
    conversationStore.setState({ conversations: [conversation], activeConversationId: conversation.id });
    const chatStore = createChatStore();
    const controller = createChatController({ provider, repository, conversationStore, chatStore });

    const execution = controller.submit("Risky task");
    await provider.started;
    provider.emit("Useful partial");
    provider.fail(new Error("Provider offline"));
    await execution;

    expect(chatStore.getState()).toMatchObject({
      error: "Provider offline",
      retry: { kind: "submit" },
    });
    expect(chatStore.getState().messages.at(-1)).toMatchObject({ status: "error", content: "Useful partial" });
  });

  it("locks generation before regeneration storage work begins", async () => {
    const provider = new ControlledProvider();
    const { conversation, repository } = makeRepository();
    let releaseTruncate!: () => void;
    vi.mocked(repository.truncateAfter).mockImplementation(
      () => new Promise<void>((resolve) => (releaseTruncate = resolve)),
    );
    const user: StoredMessage = {
      id: "user-1",
      conversationId: conversation.id,
      role: "user",
      content: "Original",
      createdAt: 10,
      status: "complete",
    };
    const assistant: StoredMessage = {
      id: "assistant-1",
      conversationId: conversation.id,
      role: "assistant",
      content: "Old answer",
      createdAt: 11,
      status: "complete",
    };
    const conversationStore = createConversationStore(repository);
    conversationStore.setState({ conversations: [conversation], activeConversationId: conversation.id });
    const chatStore = createChatStore();
    chatStore.getState().replaceMessages([user, assistant]);
    const controller = createChatController({ provider, repository, conversationStore, chatStore });

    const regeneration = controller.regenerate(assistant.id);
    expect(chatStore.getState().isGenerating).toBe(true);
    await expect(controller.submit("Concurrent request")).resolves.toBe(false);
    releaseTruncate();
    await provider.started;
    provider.emit("Regenerated");
    provider.finish();
    await regeneration;
    expect(repository.appendMessage).toHaveBeenCalledTimes(1);
    expect(vi.mocked(repository.appendMessage).mock.calls[0]?.[0]).toMatchObject({ role: "assistant" });
  });

  it("edits a user message, truncates later history, and resends without duplicating the user", async () => {
    const provider = new ControlledProvider();
    const { conversation, repository } = makeRepository();
    const user: StoredMessage = {
      id: "user-edit",
      conversationId: conversation.id,
      role: "user",
      content: "Before",
      createdAt: 20,
      status: "complete",
    };
    const oldAssistant: StoredMessage = {
      id: "assistant-old",
      conversationId: conversation.id,
      role: "assistant",
      content: "Old",
      createdAt: 21,
      status: "complete",
    };
    const conversationStore = createConversationStore(repository);
    conversationStore.setState({ conversations: [conversation], activeConversationId: conversation.id });
    const chatStore = createChatStore();
    chatStore.getState().replaceMessages([user, oldAssistant]);
    const controller = createChatController({ provider, repository, conversationStore, chatStore });

    const execution = controller.editAndResend(user.id, "After");
    await provider.started;
    provider.emit("New answer");
    provider.finish();
    await execution;

    expect(repository.updateMessage).toHaveBeenCalledWith(user.id, { content: "After" });
    expect(repository.truncateAfter).toHaveBeenCalledWith(conversation.id, user.createdAt);
    expect(chatStore.getState().messages.filter(({ role }) => role === "user")).toHaveLength(1);
    expect(chatStore.getState().messages).toEqual([
      expect.objectContaining({ id: user.id, content: "After" }),
      expect.objectContaining({ role: "assistant", content: "New answer", status: "complete" }),
    ]);
  });
});
