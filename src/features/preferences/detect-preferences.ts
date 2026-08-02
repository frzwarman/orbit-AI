import type { QualityMode } from "../../types/preferences";

type NavigatorWithMemory = Navigator & { deviceMemory?: number };

export type PreferenceSignals = {
  reducedMotion: boolean;
  coarsePointer: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
};

export type PreferenceDefaults = {
  reducedMotion: boolean;
  quality: QualityMode;
};

function readSignals(): PreferenceSignals {
  const browserNavigator = navigator as NavigatorWithMemory;
  return {
    reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false,
    coarsePointer: window.matchMedia?.("(pointer: coarse)").matches ?? false,
    hardwareConcurrency: browserNavigator.hardwareConcurrency,
    deviceMemory: browserNavigator.deviceMemory,
  };
}

export function detectPreferenceDefaults(signals: PreferenceSignals = readSignals()): PreferenceDefaults {
  const constrained =
    signals.coarsePointer ||
    (signals.hardwareConcurrency !== undefined && signals.hardwareConcurrency < 4) ||
    (signals.deviceMemory !== undefined && signals.deviceMemory < 4);

  return {
    reducedMotion: signals.reducedMotion,
    quality: constrained ? "low" : "auto",
  };
}
