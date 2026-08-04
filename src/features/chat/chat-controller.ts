import type { StoreApi } from "zustand/vanilla";

import { createAIProvider } from "../../lib/ai/provider";
import { buildSystemPrompt } from "../../lib/ai/prompts";
import type { AIProvider, ChatMessage } from "../../lib/ai/types";
import { createAssistantLifecycle } from "../../lib/animation/assistant-lifecycle";
import { classifyAvatarIntent } from "../../lib/animation/avatar-intent";
import {
  conversationRepository,
  type ConversationRepository,
} from "../../lib/storage/conversation-repository";
import { useAssistantStore } from "../../stores/assistant-store";
import { type AvatarState, useAvatarStore } from "../../stores/avatar-store";
import { type ChatState, type RetryMetadata, useChatStore } from "../../stores/chat-store";
import { type ConversationState, useConversationStore } from "../../stores/conversation-store";
import { usePreferencesStore } from "../../stores/preferences-store";
import type { StoredMessage } from "../../types/chat";

type StoreLike<State> = Pick<StoreApi<State>, "getState" | "setState">;

type ControllerDependencies = {
  provider?: AIProvider;
  repository?: ConversationRepository;
  conversationStore?: StoreLike<ConversationState>;
  chatStore?: StoreLike<ChatState>;
  avatarStore?: StoreLike<AvatarState>;
};

export type ChatController = {
  submit: (content: string) => Promise<boolean>;
  stop: () => void;
  retry: () => Promise<boolean>;
  regenerate: (assistantMessageId: string) => Promise<boolean>;
  editAndResend: (userMessageId: string, content: string) => Promise<boolean>;
  loadConversation: (conversationId: string) => Promise<void>;
  dispose: () => void;
};

const titleFrom = (content: string) => content.replace(/\s+/g, " ").trim().slice(0, 52) || "New conversation";
const makeId = () => crypto.randomUUID();
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Orbit could not complete the response.");
const nextCreatedAt = (messages: StoredMessage[]) =>
  Math.max(Date.now(), ...messages.map(({ createdAt }) => createdAt + 1));

export function createChatController({
  provider = createAIProvider(),
  repository = conversationRepository,
  conversationStore = useConversationStore,
  chatStore = useChatStore,
  avatarStore = useAvatarStore,
}: ControllerDependencies = {}): ChatController {
  let activeRequest: AbortController | null = null;
  const lifecycle = createAssistantLifecycle(useAssistantStore.getState().setState);

  const syncMessages = (messages: StoredMessage[]) => {
    chatStore.getState().replaceMessages(messages);
    conversationStore.getState().replaceActiveMessages(messages);
  };

  const beginAvatarReaction = (content: string) => {
    avatarStore.getState().resetCues();
    const cue = classifyAvatarIntent(content, "user");
    if (cue) avatarStore.getState().emitCue(cue);
  };

  const showAvatarError = () => {
    avatarStore.getState().emitCue({
      source: "error",
      action: "Death",
      expression: "Sad",
      persistent: true,
    });
  };

  const runResponse = async (
    userMessage: StoredMessage,
    retryKind: RetryMetadata["kind"],
  ): Promise<boolean> => {
    const controller = new AbortController();
    activeRequest = controller;
    let assistantMessage: StoredMessage | null = null;
    let durableTimer: ReturnType<typeof setTimeout> | null = null;
    let persistChain = Promise.resolve();
    let responseCueEmitted = false;
    const retryBase: RetryMetadata = { kind: retryKind, userMessageId: userMessage.id };

    const clearDurableTimer = () => {
      if (durableTimer !== null) clearTimeout(durableTimer);
      durableTimer = null;
    };

    const persistVisibleContent = () => {
      clearDurableTimer();
      const current = assistantMessage;
      if (!current) return;
      const content = current.content;
      persistChain = persistChain.then(() => repository.updateMessage(current.id, { content }));
    };

    const scheduleDurableContent = () => {
      if (durableTimer !== null) return;
      durableTimer = setTimeout(persistVisibleContent, 100);
    };

    const reactToResponse = (content: string) => {
      if (responseCueEmitted) return;
      const cue = classifyAvatarIntent(content, "response");
      if (!cue) return;
      responseCueEmitted = true;
      avatarStore.getState().emitCue(cue);
    };

    const context: ChatMessage[] = [
      {
        id: "orbit-system",
        role: "system",
        content: buildSystemPrompt(usePreferencesStore.getState().mode, useAssistantStore.getState().config ?? undefined),
      },
      ...chatStore.getState().messages.map(({ id, role, content }) => ({ id, role, content })),
    ];

    try {
      await provider.streamChat(context, {
        signal: controller.signal,
        onToken: (token) => {
          if (!token || controller.signal.aborted) return;
          if (!assistantMessage) {
            const createdAt = Math.max(Date.now(), userMessage.createdAt + 1);
            assistantMessage = {
              id: makeId(),
              conversationId: userMessage.conversationId,
              role: "assistant",
              content: token,
              createdAt,
              status: "streaming",
            };
            syncMessages([...chatStore.getState().messages, assistantMessage]);
            persistChain = persistChain.then(() => repository.appendMessage(assistantMessage as StoredMessage));
            lifecycle.stream();
            reactToResponse(assistantMessage.content);
            return;
          }
          const nextAssistant: StoredMessage = { ...assistantMessage, content: assistantMessage.content + token };
          assistantMessage = nextAssistant;
          const visible = chatStore
            .getState()
            .messages.map((message) => (message.id === nextAssistant.id ? nextAssistant : message));
          syncMessages(visible);
          reactToResponse(nextAssistant.content);
          scheduleDurableContent();
        },
      });

      clearDurableTimer();
      await persistChain;
      const latestAssistant = assistantMessage as StoredMessage | null;
      if (latestAssistant) {
        const complete: StoredMessage = { ...latestAssistant, status: "complete" };
        await repository.updateMessage(complete.id, { content: complete.content, status: "complete" });
        syncMessages(chatStore.getState().messages.map((message) => (message.id === complete.id ? complete : message)));
      }
      chatStore.getState().setFailure(null);
      if (!responseCueEmitted) {
        avatarStore.getState().emitCue({ source: "response", action: "ThumbsUp", expression: "Neutral" });
      }
      lifecycle.complete();
      return true;
    } catch (error) {
      clearDurableTimer();
      await persistChain.catch(() => undefined);
      const aborted = controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError");
      const latestAssistant = assistantMessage as StoredMessage | null;
      if (latestAssistant) {
        const status = aborted ? "interrupted" : "error";
        const finalMessage: StoredMessage = { ...latestAssistant, status };
        await repository
          .updateMessage(finalMessage.id, { content: finalMessage.content, status })
          .catch(() => undefined);
        syncMessages(chatStore.getState().messages.map((message) => (message.id === finalMessage.id ? finalMessage : message)));
        retryBase.assistantMessageId = finalMessage.id;
      }
      if (aborted) {
        chatStore.getState().setFailure(null);
        avatarStore.getState().resetCues();
        avatarStore.getState().emitCue({ source: "response", action: "No", expression: "Neutral" });
      } else {
        chatStore.getState().setFailure(errorText(error), retryBase);
        showAvatarError();
      }
      lifecycle.stop();
      return false;
    } finally {
      if (activeRequest === controller) activeRequest = null;
      chatStore.getState().setGenerating(false);
    }
  };

  const beginExistingUser = async (userMessage: StoredMessage, kind: RetryMetadata["kind"]) => {
    if (chatStore.getState().isGenerating) return false;
    chatStore.getState().setGenerating(true);
    chatStore.getState().setFailure(null);
    beginAvatarReaction(userMessage.content);
    lifecycle.begin();
    return runResponse(userMessage, kind);
  };

  const submit = async (rawContent: string): Promise<boolean> => {
    const content = rawContent.trim();
    if (!content || chatStore.getState().isGenerating) return false;
    chatStore.getState().setGenerating(true);
    chatStore.getState().setFailure(null);
    beginAvatarReaction(content);
    lifecycle.begin();
    try {
      let conversationId = conversationStore.getState().activeConversationId;
      if (!conversationId) {
        const conversation = await conversationStore.getState().createConversation(titleFrom(content));
        conversationId = conversation.id;
        syncMessages([]);
      }
      const userMessage: StoredMessage = {
        id: makeId(),
        conversationId,
        role: "user",
        content,
        createdAt: nextCreatedAt(chatStore.getState().messages),
        status: "complete",
      };
      await repository.appendMessage(userMessage);
      syncMessages([...chatStore.getState().messages, userMessage]);
      return runResponse(userMessage, "submit");
    } catch (error) {
      chatStore.getState().setFailure(errorText(error));
      showAvatarError();
      chatStore.getState().setGenerating(false);
      lifecycle.stop();
      return false;
    }
  };

  const regenerate = async (assistantMessageId: string): Promise<boolean> => {
    if (chatStore.getState().isGenerating) return false;
    const messages = chatStore.getState().messages;
    const assistantIndex = messages.findIndex(({ id, role }) => id === assistantMessageId && role === "assistant");
    if (assistantIndex < 0) return false;
    const userMessage = [...messages.slice(0, assistantIndex)].reverse().find(({ role }) => role === "user");
    if (!userMessage) return false;
    chatStore.getState().setGenerating(true);
    chatStore.getState().setFailure(null);
    beginAvatarReaction(userMessage.content);
    lifecycle.begin();
    try {
      await repository.truncateAfter(userMessage.conversationId, userMessage.createdAt);
      syncMessages(messages.slice(0, messages.indexOf(userMessage) + 1));
      return runResponse(userMessage, "regenerate");
    } catch (error) {
      chatStore.getState().setFailure(errorText(error));
      showAvatarError();
      chatStore.getState().setGenerating(false);
      lifecycle.stop();
      return false;
    }
  };

  const editAndResend = async (userMessageId: string, rawContent: string): Promise<boolean> => {
    const content = rawContent.trim();
    if (!content || chatStore.getState().isGenerating) return false;
    const messages = chatStore.getState().messages;
    const userIndex = messages.findIndex(({ id, role }) => id === userMessageId && role === "user");
    if (userIndex < 0) return false;
    const existingUser = messages[userIndex];
    if (!existingUser) return false;
    const userMessage: StoredMessage = { ...existingUser, content };
    chatStore.getState().setGenerating(true);
    chatStore.getState().setFailure(null);
    beginAvatarReaction(content);
    lifecycle.begin();
    try {
      await repository.updateMessage(userMessage.id, { content });
      await repository.truncateAfter(userMessage.conversationId, userMessage.createdAt);
      syncMessages([...messages.slice(0, userIndex), userMessage]);
      return runResponse(userMessage, "edit-resend");
    } catch (error) {
      chatStore.getState().setFailure(errorText(error));
      showAvatarError();
      chatStore.getState().setGenerating(false);
      lifecycle.stop();
      return false;
    }
  };

  return {
    submit,
    stop: () => activeRequest?.abort(),
    retry: async () => {
      const retry = chatStore.getState().retry;
      if (!retry) return false;
      if (retry.assistantMessageId) return regenerate(retry.assistantMessageId);
      const userMessage = chatStore.getState().messages.find(({ id }) => id === retry.userMessageId);
      return userMessage ? beginExistingUser(userMessage, retry.kind) : false;
    },
    regenerate,
    editAndResend,
    loadConversation: async (conversationId) => {
      if (chatStore.getState().isGenerating) return;
      await conversationStore.getState().selectConversation(conversationId);
      chatStore.getState().replaceMessages(conversationStore.getState().activeMessages);
    },
    dispose: () => {
      activeRequest?.abort();
      lifecycle.dispose();
    },
  };
}

export const chatController = createChatController();
