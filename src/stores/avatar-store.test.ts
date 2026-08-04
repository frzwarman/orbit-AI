import { describe, expect, it } from "vitest";

import { createAvatarStore } from "./avatar-store";

describe("automatic avatar cue store", () => {
  it("activates cues and assigns a new sequence to repeated actions", () => {
    const store = createAvatarStore();

    store.getState().emitCue({ source: "user", action: "Wave", expression: "Neutral" });
    const first = store.getState().activeCue;
    store.getState().completeCue(first?.sequence ?? -1);
    store.getState().emitCue({ source: "user", action: "Wave", expression: "Neutral" });

    expect(first?.sequence).toBe(1);
    expect(store.getState().activeCue?.sequence).toBe(2);
  });

  it("queues lower-priority response cues behind user cues", () => {
    const store = createAvatarStore();
    store.getState().emitCue({ source: "user", action: "Wave", expression: "Neutral" });
    store.getState().emitCue({ source: "response", action: "ThumbsUp", expression: "Neutral" });

    expect(store.getState().activeCue?.action).toBe("Wave");
    expect(store.getState().pendingCue?.action).toBe("ThumbsUp");

    store.getState().completeCue(store.getState().activeCue?.sequence ?? -1);
    expect(store.getState().activeCue?.action).toBe("ThumbsUp");
    expect(store.getState().pendingCue).toBeNull();
  });

  it("does not repeat the same reaction when user and response share an intent", () => {
    const store = createAvatarStore();
    store.getState().emitCue({ source: "user", action: "Wave", expression: "Neutral" });
    store.getState().emitCue({ source: "response", action: "Wave", expression: "Neutral" });

    expect(store.getState().activeCue?.action).toBe("Wave");
    expect(store.getState().pendingCue).toBeNull();
    expect(store.getState().nextSequence).toBe(1);
  });

  it("lets a persistent error replace all other cues until reset", () => {
    const store = createAvatarStore();
    store.getState().emitCue({ source: "user", action: "Wave", expression: "Neutral" });
    store.getState().emitCue({ source: "response", action: "Yes", expression: "Neutral" });
    store.getState().emitCue({ source: "error", action: "Death", expression: "Sad", persistent: true });

    const error = store.getState().activeCue;
    expect(error).toMatchObject({ source: "error", action: "Death", expression: "Sad", persistent: true });
    expect(store.getState().pendingCue).toBeNull();
    store.getState().completeCue(error?.sequence ?? -1);
    expect(store.getState().activeCue).toEqual(error);

    store.getState().resetCues();
    expect(store.getState().activeCue).toBeNull();
    expect(store.getState().pendingCue).toBeNull();
  });
});
