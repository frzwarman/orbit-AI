import { describe, expect, it } from "vitest";

import { classifyAvatarIntent } from "./avatar-intent";

describe("classifyAvatarIntent", () => {
  it.each([
    ["Hello Orbit", "user", { action: "Wave", expression: "Neutral" }],
    ["Let's celebrate this win", "user", { action: "Dance", expression: "Neutral" }],
    ["Wow, that is surprising", "response", { action: "Jump", expression: "Surprised" }],
    ["Yes, that is correct", "response", { action: "Yes", expression: "Neutral" }],
    ["Thank you for fixing it", "user", { action: "ThumbsUp", expression: "Neutral" }],
    ["No, I cannot do that", "response", { action: "No", expression: "Sad" }],
    ["This is frustrating and makes me angry", "user", { action: "Punch", expression: "Angry" }],
    ["I am sorry this failed", "response", { action: "Sitting", expression: "Sad" }],
    ["Hurry, let's go", "user", { action: "Running", expression: "Neutral" }],
    ["Please step through this with me", "user", { action: "Walking", expression: "Neutral" }],
  ] as const)("maps %s to an automatic avatar cue", (text, source, expected) => {
    expect(classifyAvatarIntent(text, source)).toMatchObject(expected);
  });

  it("uses word boundaries and leaves neutral content to the lifecycle", () => {
    expect(classifyAvatarIntent("This highlights the result", "user")).toBeNull();
    expect(classifyAvatarIntent("Explain the component architecture", "user")).toBeNull();
  });
});
