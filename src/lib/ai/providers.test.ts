import { describe, expect, it } from "vitest";

import { MockAIProvider } from "./mock-provider";
import { PuterAIProvider, PuterUnavailableError } from "./puter-provider";

describe("AI providers", () => {
  it("streams deterministic chunks and supports abort", async () => {
    const controller = new AbortController();
    const tokens: string[] = [];
    const promise = new MockAIProvider(["Orbit ", "ready"]).streamChat([], {
      signal: controller.signal,
      onToken: (token) => {
        tokens.push(token);
        controller.abort();
      },
    });

    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(tokens).toEqual(["Orbit "]);
  });

  it("reports when Puter is unavailable instead of falling back", async () => {
    const originalPuter = window.puter;
    window.puter = undefined;

    await expect(new PuterAIProvider().streamChat([], { onToken: () => undefined })).rejects.toBeInstanceOf(
      PuterUnavailableError,
    );

    window.puter = originalPuter;
  });
});
