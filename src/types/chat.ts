export type MessageRole = "system" | "user" | "assistant";

export type MessageStatus = "streaming" | "complete" | "interrupted" | "error";

export type StoredMessage = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
};

export type MessageUpdate = Partial<Pick<StoredMessage, "content" | "status">>;
