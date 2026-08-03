import { create } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type { AvatarBaseState, AvatarEmote, AvatarEmoteRequest, AvatarExpression } from "../types/avatar";

export type AvatarState = {
  manualState: AvatarBaseState | null;
  expression: AvatarExpression;
  emoteRequest: AvatarEmoteRequest | null;
  setManualState: (state: AvatarBaseState | null) => void;
  setExpression: (expression: AvatarExpression) => void;
  triggerEmote: (emote: AvatarEmote) => void;
};

const createAvatarState = (set: StoreApi<AvatarState>["setState"]): AvatarState => ({
  manualState: null,
  expression: "Neutral",
  emoteRequest: null,
  setManualState: (manualState) => set({ manualState }),
  setExpression: (expression) => set({ expression }),
  triggerEmote: (name) => set((state) => ({
    emoteRequest: { name, sequence: (state.emoteRequest?.sequence ?? 0) + 1 },
  })),
});

export function createAvatarStore(): StoreApi<AvatarState> {
  return createStore<AvatarState>(createAvatarState);
}

export const useAvatarStore = create<AvatarState>(createAvatarState);
