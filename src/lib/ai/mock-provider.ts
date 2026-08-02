import type { AIProvider, ChatMessage, StreamChatOptions } from "./types";
import { createAbortError } from "./types";

function wait(delayMs: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(createAbortError());
  if (delayMs <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, delayMs);
    const onAbort = () => {
      window.clearTimeout(timeout);
      reject(createAbortError());
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class MockAIProvider implements AIProvider {
  constructor(
    private readonly chunks: readonly string[] = ["Orbit is ready."],
    private readonly delayMs = 0,
  ) {}

  async streamChat(_messages: ChatMessage[], { signal, onToken }: StreamChatOptions): Promise<void> {
    for (const chunk of this.chunks) {
      if (signal?.aborted) throw createAbortError();
      await wait(this.delayMs, signal);
      onToken(chunk);
      if (signal?.aborted) throw createAbortError();
    }
  }
}
