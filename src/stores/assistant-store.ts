import { create } from "zustand";

import { settingsRepository } from "../lib/storage/settings-repository";
import type { AssistantConfig, AssistantState } from "../types/assistant";

type AssistantStore = {
  config: AssistantConfig | null;
  state: AssistantState;
  hydrated: boolean;
  persistenceWarning: string | null;
  setAssistant: (config: AssistantConfig) => void;
  setState: (state: AssistantState) => void;
  hydrate: () => Promise<void>;
  reset: () => void;
};

const persistenceMessage = "Your assistant preference could not be saved on this device.";

export const useAssistantStore = create<AssistantStore>((set) => ({
  config: null,
  state: "idle",
  hydrated: false,
  persistenceWarning: null,
  setAssistant: (config) => {
    set({ config, persistenceWarning: null });
    void settingsRepository.set("assistant", config).catch(() => set({ persistenceWarning: persistenceMessage }));
  },
  setState: (state) => set({ state }),
  hydrate: async () => {
    try {
      const config = await settingsRepository.get("assistant");
      set({ config: config ?? null, hydrated: true, persistenceWarning: null });
    } catch {
      set({ hydrated: true, persistenceWarning: "Saved assistant settings are currently unavailable." });
    }
  },
  reset: () => {
    set({ config: null, state: "idle", persistenceWarning: null });
    void settingsRepository.remove("assistant").catch(() => set({ persistenceWarning: persistenceMessage }));
  },
}));
