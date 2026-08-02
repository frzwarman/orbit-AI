type PuterChatRole = "system" | "assistant" | "user";

type PuterChatMessage = {
  role: PuterChatRole;
  content: string;
};

type PuterChatResponseChunk =
  | string
  | {
      type?: "text" | "reasoning" | "tool_use" | "compaction" | "extra_content" | "usage";
      text?: string;
    };

type PuterChatStream = AsyncIterable<PuterChatResponseChunk>;

interface PuterAI {
  chat(messages: PuterChatMessage[], options: { stream: true; model?: string }): Promise<PuterChatStream>;
}

interface Window {
  puter?: {
    ai?: PuterAI;
  };
}
