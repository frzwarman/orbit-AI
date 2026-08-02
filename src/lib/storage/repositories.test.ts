import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { AssistantConfig } from "../../types/assistant";
import { ConversationRepository } from "./conversation-repository";
import { OrbitDatabase } from "./database";
import { SettingsRepository } from "./settings-repository";

describe("local repositories", () => {
  let database: OrbitDatabase;
  let conversations: ConversationRepository;
  let settings: SettingsRepository;

  beforeEach(() => {
    database = new OrbitDatabase(`orbit-test-${crypto.randomUUID()}`);
    conversations = new ConversationRepository(database);
    settings = new SettingsRepository(database);
  });

  afterEach(async () => {
    await database.delete();
  });

  it("creates and deletes a conversation with its messages", async () => {
    const conversation = await conversations.create("New conversation");
    await conversations.appendMessage({
      id: "message-1",
      conversationId: conversation.id,
      role: "user",
      content: "Hello",
      createdAt: 1,
      status: "complete",
    });

    expect(await conversations.getMessages(conversation.id)).toHaveLength(1);
    await conversations.delete(conversation.id);
    expect(await conversations.getMessages(conversation.id)).toEqual([]);
  });

  it("persists assistant and responsive preferences", async () => {
    const assistant: AssistantConfig = {
      character: "ava",
      name: "Ava",
      personality: "friendly",
      voiceEnabled: false,
    };

    await settings.set("assistant", assistant);
    await settings.set("threeDEnabled", false);

    expect(await settings.get("assistant")).toMatchObject({ character: "ava" });
    expect(await settings.get("threeDEnabled")).toBe(false);
  });
});
