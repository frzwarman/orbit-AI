import type { StoredMessage } from "../../types/chat";
import { useSmartScroll } from "../../hooks/use-smart-scroll";
import { ChatMessage } from "./ChatMessage";

type MessageListProps = {
  messages: StoredMessage[];
  assistantName: string;
  isGenerating: boolean;
  onRegenerate: (messageId: string) => void;
  onEdit: (messageId: string, content: string) => void;
};

export function MessageList({ messages, assistantName, isGenerating, onRegenerate, onEdit }: MessageListProps) {
  const contentKey = messages.map(({ id, content, status }) => `${id}:${content.length}:${status}`).join("|");
  const itemKeys = messages.map(({ id }) => id);
  const { viewportRef, onScroll, scrollToBottom, showJumpButton } = useSmartScroll(contentKey, itemKeys);

  return (
    <div className="message-list-wrap">
      <div ref={viewportRef} className="message-list" onScroll={onScroll} aria-label="Conversation messages" tabIndex={0}>
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p className="eyebrow">New conversation</p>
            <h1>What are we working on?</h1>
            <p>Ask a question, plan a feature, or bring a problem to solve together.</p>
          </div>
        ) : (
          messages.filter(({ role }) => role !== "system").map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              assistantName={assistantName}
              disabled={isGenerating}
              onRegenerate={onRegenerate}
              onEdit={onEdit}
            />
          ))
        )}
      </div>
      {showJumpButton && (
        <button className="jump-latest" type="button" onClick={() => scrollToBottom()} aria-label="Jump to latest message">
          ↓ Latest
        </button>
      )}
    </div>
  );
}
