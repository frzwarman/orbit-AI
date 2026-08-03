import { describe, expect, it } from "vitest";

import { createAvatarStore } from "./avatar-store";

describe("avatar controls store", () => {
  it("supports automatic and manual base states", () => {
    const store = createAvatarStore();

    store.getState().setManualState("Running");
    expect(store.getState().manualState).toBe("Running");

    store.getState().setManualState(null);
    expect(store.getState().manualState).toBeNull();
  });

  it("creates a new request when the same emote is triggered repeatedly", () => {
    const store = createAvatarStore();

    store.getState().triggerEmote("Wave");
    const first = store.getState().emoteRequest;
    store.getState().triggerEmote("Wave");

    expect(first).toEqual({ name: "Wave", sequence: 1 });
    expect(store.getState().emoteRequest).toEqual({ name: "Wave", sequence: 2 });
  });

  it("selects one facial expression at a time", () => {
    const store = createAvatarStore();
    store.getState().setExpression("Angry");
    expect(store.getState().expression).toBe("Angry");
    store.getState().setExpression("Neutral");
    expect(store.getState().expression).toBe("Neutral");
  });
});
