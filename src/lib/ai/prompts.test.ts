import { describe, expect, it } from "vitest";

import { portfolioContext } from "../../data/portfolio-context";
import { buildSystemPrompt } from "./prompts";

describe("mode prompts", () => {
  it("constrains About Fariz to local facts", () => {
    const prompt = buildSystemPrompt("about");

    expect(prompt).toContain("Do not invent");
    expect(prompt).toContain(portfolioContext.profile);
  });

  it("focuses coding mode on accessible strict frontend work", () => {
    const prompt = buildSystemPrompt("coding");

    expect(prompt).toMatch(/strict TypeScript/i);
    expect(prompt).toMatch(/accessibility/i);
  });
});
