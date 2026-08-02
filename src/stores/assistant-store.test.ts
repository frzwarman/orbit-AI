import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AssistantConfig } from "../types/assistant";

const settings = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/storage/settings-repository", () => ({ settingsRepository: settings }));

import { useAssistantStore } from "./assistant-store";

describe("assistant store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAssistantStore.setState({ config: null, state: "idle", hydrated: false, persistenceWarning: null });
  });

  it("persists the selected assistant", () => {
    const assistant: AssistantConfig = {
      character: "ava",
      name: "Ava",
      personality: "friendly",
      voiceEnabled: false,
    };

    useAssistantStore.getState().setAssistant(assistant);

    expect(useAssistantStore.getState().config?.character).toBe("ava");
    expect(settings.set).toHaveBeenCalledWith("assistant", expect.objectContaining({ character: "ava" }));
  });

  it("hydrates the persisted assistant", async () => {
    settings.get.mockResolvedValueOnce({
      character: "alex",
      name: "Alex",
      personality: "professional",
      voiceEnabled: false,
    });

    await useAssistantStore.getState().hydrate();

    expect(useAssistantStore.getState()).toMatchObject({ hydrated: true, config: { character: "alex" } });
  });
});
