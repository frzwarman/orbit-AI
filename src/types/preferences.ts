import type { AssistantConfig } from "./assistant";

export type AssistantMode = "general" | "coding" | "about";
export type QualityMode = "auto" | "low" | "high";

export type PersistedSettings = {
  assistant: AssistantConfig;
  mode: AssistantMode;
  threeDEnabled: boolean;
  reducedMotion: boolean;
  quality: QualityMode;
  conversationPanelCollapsed: boolean;
};

export type SettingRecord = {
  [Key in keyof PersistedSettings]: {
    key: Key;
    value: PersistedSettings[Key];
  };
}[keyof PersistedSettings];
