import type { AIProvider, ChatMessage, StreamChatOptions } from "./types";
import { createAbortError } from "./types";

export class PuterUnavailableError extends Error {
  constructor() {
    super("Puter AI is unavailable. Check your connection and reload Orbit.");
    this.name = "PuterUnavailableError";
  }
}

async function nextChunk(
  iterator: AsyncIterator<PuterChatResponseChunk>,
  signal?: AbortSignal,
): Promise<IteratorResult<PuterChatResponseChunk>> {
  if (!signal) return iterator.next();
  if (signal.aborted) {
    void iterator.return?.();
    throw createAbortError();
  }

  return new Promise((resolve, reject) => {
    const abort = () => {
      void iterator.return?.();
      reject(createAbortError());
    };
    signal.addEventListener("abort", abort, { once: true });
    void iterator.next().then(resolve, reject).finally(() => signal.removeEventListener("abort", abort));
  });
}

function tokenFromChunk(chunk: PuterChatResponseChunk): string {
  if (typeof chunk === "string") return chunk;
  if (chunk.type && chunk.type !== "text") return "";
  return chunk.text ?? "";
}

export class PuterAIProvider implements AIProvider {
  async streamChat(messages: ChatMessage[], { signal, onToken }: StreamChatOptions): Promise<void> {
    const ai = window.puter?.ai;
    if (!ai?.chat) throw new PuterUnavailableError();
    if (signal?.aborted) throw createAbortError();

    const stream = await ai.chat(
      messages.map(({ role, content }) => ({ role, content })),
      { stream: true },
    );
    const iterator = stream[Symbol.asyncIterator]();

    while (true) {
      const result = await nextChunk(iterator, signal);
      if (result.done) return;
      const token = tokenFromChunk(result.value);
      if (token) onToken(token);
    }
  }
}
