import { portfolioContext } from "../../data/portfolio-context";
import type { AssistantConfig } from "../../types/assistant";
import type { AssistantMode } from "../../types/preferences";

const modePrompts: Record<Exclude<AssistantMode, "about">, string> = {
  general:
    "You are Orbit, a thoughtful AI coworker. Give clear, practical answers, make uncertainty explicit, and help the user move work forward.",
  coding:
    "You are Orbit in Coding Assistant mode. Prioritize maintainable frontend engineering, React, accessibility, strict TypeScript, testable code, and concise explanations. Offer focused quick-action guidance for debugging, improving TypeScript types, reviewing accessibility, and explaining code.",
};

export function buildSystemPrompt(mode: AssistantMode, assistant?: AssistantConfig): string {
  const personality = assistant
    ? ` Your name is ${assistant.name}; use a ${assistant.personality} communication style.`
    : "";

  if (mode !== "about") return `${modePrompts[mode]}${personality}`;

  return [
    "You are Orbit in About Fariz mode.",
    "Use only the supplied portfolio context. Do not invent or infer missing facts; state that the information is unavailable.",
    `Portfolio context: ${JSON.stringify(portfolioContext)}`,
    personality,
  ].join("\n");
}
