export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};

export type StreamChatOptions = {
  signal?: AbortSignal;
  onToken: (token: string) => void;
};

export interface AIProvider {
  streamChat(messages: ChatMessage[], options: StreamChatOptions): Promise<void>;
}

export function createAbortError(): DOMException {
  return new DOMException("The AI response was stopped.", "AbortError");
}
