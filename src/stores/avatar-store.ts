import { create } from "zustand";
import { createStore, type StoreApi } from "zustand/vanilla";

import type { AvatarCue, AvatarCueInput, AvatarCueSource } from "../types/avatar";

export type AvatarState = {
  activeCue: AvatarCue | null;
  pendingCue: AvatarCue | null;
  nextSequence: number;
  emitCue: (input: AvatarCueInput) => void;
  completeCue: (sequence: number) => void;
  resetCues: () => void;
};

const PRIORITY: Record<AvatarCueSource, number> = { response: 1, user: 2, error: 3 };

const sameCue = (cue: AvatarCue | null, input: AvatarCueInput) =>
  cue?.action === input.action && cue.expression === input.expression;

const createAvatarState = (set: StoreApi<AvatarState>["setState"]): AvatarState => ({
  activeCue: null,
  pendingCue: null,
  nextSequence: 0,
  emitCue: (input) => set((state) => {
    if (sameCue(state.activeCue, input) || sameCue(state.pendingCue, input)) return state;
    const sequence = state.nextSequence + 1;
    const next: AvatarCue = { ...input, persistent: input.persistent ?? false, sequence };
    if (!state.activeCue) return { activeCue: next, nextSequence: sequence };
    if (input.source === "error") return { activeCue: next, pendingCue: null, nextSequence: sequence };
    if (PRIORITY[input.source] > PRIORITY[state.activeCue.source]) {
      return { activeCue: next, nextSequence: sequence };
    }
    return { pendingCue: next, nextSequence: sequence };
  }),
  completeCue: (sequence) => set((state) => {
    if (state.activeCue?.sequence !== sequence || state.activeCue.persistent) return state;
    return { activeCue: state.pendingCue, pendingCue: null };
  }),
  resetCues: () => set({ activeCue: null, pendingCue: null }),
});

export function createAvatarStore(): StoreApi<AvatarState> {
  return createStore<AvatarState>(createAvatarState);
}

export const useAvatarStore = create<AvatarState>(createAvatarState);
