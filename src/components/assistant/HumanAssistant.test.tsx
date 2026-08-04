import { describe, expect, it, vi } from "vitest";
import { LoopOnce, LoopRepeat } from "three";

import {
  configureAction,
  getLifecycleAnimation,
  restoreBaseAnimation,
  transitionAnimation,
} from "./AnimatedModel";

function action() {
  return {
    clampWhenFinished: false,
    fadeIn: vi.fn().mockReturnThis(),
    fadeOut: vi.fn().mockReturnThis(),
    play: vi.fn().mockReturnThis(),
    reset: vi.fn().mockReturnThis(),
    setLoop: vi.fn().mockReturnThis(),
  };
}

describe("assistant animation transitions", () => {
  it("does not restart the current action and crossfades to the next", () => {
    const standing = action();
    const sitting = action();
    const actions = { Standing: standing, Sitting: sitting };

    const current = transitionAnimation(actions, "Standing", "Sitting", 0.35);

    expect(standing.fadeOut).toHaveBeenCalledWith(0.35);
    expect(sitting.reset).toHaveBeenCalledOnce();
    expect(sitting.fadeIn).toHaveBeenCalledWith(0.35);
    expect(sitting.play).toHaveBeenCalledOnce();
    expect(transitionAnimation(actions, current, "Sitting", 0.35)).toBe("Sitting");
    expect(sitting.reset).toHaveBeenCalledOnce();
  });

  it("uses LoopOnce for emotes and terminal poses while locomotion loops", () => {
    const thumbsUp = action();
    const standing = action();
    const walking = action();

    configureAction(thumbsUp, "ThumbsUp");
    configureAction(standing, "Standing");
    configureAction(walking, "Walking");

    expect(thumbsUp.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(thumbsUp.clampWhenFinished).toBe(true);
    expect(standing.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(walking.setLoop).toHaveBeenCalledWith(LoopRepeat, Number.POSITIVE_INFINITY);
    expect(walking.clampWhenFinished).toBe(false);
  });

  it("maps chat lifecycle to stable poses without generic emotes", () => {
    expect(getLifecycleAnimation("idle", false)).toEqual({ base: "Standing" });
    expect(getLifecycleAnimation("thinking", false)).toEqual({ base: "Sitting" });
    expect(getLifecycleAnimation("streaming", false)).toEqual({ base: "Standing" });
    expect(getLifecycleAnimation("done", false)).toEqual({ base: "Standing" });
    expect(getLifecycleAnimation("done", true)).toEqual({ base: "Standing" });
  });

  it("restores the selected base after a one-shot action finishes", () => {
    expect(restoreBaseAnimation("ThumbsUp", "Walking")).toBe("Walking");
    expect(restoreBaseAnimation("Standing", "Walking")).toBeNull();
  });
});
