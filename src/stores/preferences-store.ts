import { create } from "zustand";

import { detectPreferenceDefaults } from "../features/preferences/detect-preferences";
import { settingsRepository } from "../lib/storage/settings-repository";
import type { AssistantMode, PersistedSettings, QualityMode } from "../types/preferences";

type PreferencesStore = {
  mode: AssistantMode;
  threeDEnabled: boolean;
  reducedMotion: boolean;
  quality: QualityMode;
  conversationPanelCollapsed: boolean;
  hydrated: boolean;
  persistenceWarning: string | null;
  setMode: (mode: AssistantMode) => void;
  setThreeDEnabled: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setQuality: (quality: QualityMode) => void;
  setConversationPanelCollapsed: (collapsed: boolean) => void;
  hydrate: () => Promise<void>;
};

const writeWarning = "This preference could not be saved on this device.";

export const usePreferencesStore = create<PreferencesStore>((set) => {
  const persist = <Key extends keyof PersistedSettings>(key: Key, value: PersistedSettings[Key]) => {
    void settingsRepository.set(key, value).catch(() => set({ persistenceWarning: writeWarning }));
  };

  return {
    mode: "general",
    threeDEnabled: true,
    reducedMotion: false,
    quality: "auto",
    conversationPanelCollapsed: false,
    hydrated: false,
    persistenceWarning: null,
    setMode: (mode) => {
      set({ mode, persistenceWarning: null });
      persist("mode", mode);
    },
    setThreeDEnabled: (threeDEnabled) => {
      set({ threeDEnabled, persistenceWarning: null });
      persist("threeDEnabled", threeDEnabled);
    },
    setReducedMotion: (reducedMotion) => {
      set({ reducedMotion, persistenceWarning: null });
      persist("reducedMotion", reducedMotion);
    },
    setQuality: (quality) => {
      set({ quality, persistenceWarning: null });
      persist("quality", quality);
    },
    setConversationPanelCollapsed: (conversationPanelCollapsed) => {
      set({ conversationPanelCollapsed, persistenceWarning: null });
      persist("conversationPanelCollapsed", conversationPanelCollapsed);
    },
    hydrate: async () => {
      const defaults = detectPreferenceDefaults();
      try {
        const [mode, threeDEnabled, reducedMotion, quality, conversationPanelCollapsed] = await Promise.all([
          settingsRepository.get("mode"),
          settingsRepository.get("threeDEnabled"),
          settingsRepository.get("reducedMotion"),
          settingsRepository.get("quality"),
          settingsRepository.get("conversationPanelCollapsed"),
        ]);
        set({
          mode: mode ?? "general",
          threeDEnabled: threeDEnabled ?? true,
          reducedMotion: reducedMotion ?? defaults.reducedMotion,
          quality: quality ?? defaults.quality,
          conversationPanelCollapsed: conversationPanelCollapsed ?? false,
          hydrated: true,
          persistenceWarning: null,
        });
      } catch {
        set({ ...defaults, hydrated: true, persistenceWarning: "Saved preferences are currently unavailable." });
      }
    },
  };
});
