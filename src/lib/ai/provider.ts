import { MockAIProvider } from "./mock-provider";
import { PuterAIProvider } from "./puter-provider";
import type { AIProvider } from "./types";

export function createAIProvider(): AIProvider {
  if (import.meta.env.VITE_E2E_MOCK_AI === "true") {
    return new MockAIProvider(["Here is ", "your Orbit ", "response."], 250);
  }
  return new PuterAIProvider();
}
