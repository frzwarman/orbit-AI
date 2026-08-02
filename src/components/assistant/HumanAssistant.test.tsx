import { describe, expect, it, vi } from "vitest";
import { LoopOnce, LoopRepeat } from "three";

import { configureAction, transitionAnimation } from "./AnimatedModel";

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
    const idle = action();
    const thinking = action();
    const actions = { Idle: idle, Thinking: thinking };

    const current = transitionAnimation(actions, "Idle", "Thinking");

    expect(idle.fadeOut).toHaveBeenCalledWith(0.35);
    expect(thinking.reset).toHaveBeenCalledOnce();
    expect(thinking.fadeIn).toHaveBeenCalledWith(0.35);
    expect(thinking.play).toHaveBeenCalledOnce();
    expect(transitionAnimation(actions, current, "Thinking")).toBe("Thinking");
    expect(thinking.reset).toHaveBeenCalledOnce();
  });

  it("uses LoopOnce and clamping for Done while looping other states", () => {
    const done = action();
    const idle = action();

    configureAction(done, "Done");
    configureAction(idle, "Idle");

    expect(done.setLoop).toHaveBeenCalledWith(LoopOnce, 1);
    expect(done.clampWhenFinished).toBe(true);
    expect(idle.setLoop).toHaveBeenCalledWith(LoopRepeat, Number.POSITIVE_INFINITY);
    expect(idle.clampWhenFinished).toBe(false);
  });
});
