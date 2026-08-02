import { beforeEach, describe, expect, it, vi } from "vitest";

const settings = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../lib/storage/settings-repository", () => ({ settingsRepository: settings }));

import { detectPreferenceDefaults } from "../features/preferences/detect-preferences";
import { usePreferencesStore } from "./preferences-store";

describe("preferences store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    settings.get.mockResolvedValue(undefined);
    usePreferencesStore.setState({
      mode: "general",
      threeDEnabled: true,
      reducedMotion: false,
      quality: "auto",
      hydrated: false,
      persistenceWarning: null,
    });
  });

  it("honors reduced motion and disables 3D", () => {
    usePreferencesStore.getState().setReducedMotion(true);
    usePreferencesStore.getState().setThreeDEnabled(false);

    expect(usePreferencesStore.getState()).toMatchObject({ reducedMotion: true, threeDEnabled: false });
  });

  it("preserves persisted choices while hydrating", async () => {
    settings.get.mockImplementation(async (key: string) => {
      if (key === "quality") return "high";
      if (key === "threeDEnabled") return false;
      return undefined;
    });

    await usePreferencesStore.getState().hydrate();

    expect(usePreferencesStore.getState()).toMatchObject({ quality: "high", threeDEnabled: false, hydrated: true });
  });

  it("selects low quality for constrained devices", () => {
    const defaults = detectPreferenceDefaults({
      hardwareConcurrency: 2,
      deviceMemory: 2,
      coarsePointer: false,
      reducedMotion: false,
    });

    expect(defaults.quality).toBe("low");
  });
});
