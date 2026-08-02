import { useState } from "react";

import type { StoredMessage } from "../../types/chat";
import { MarkdownContent } from "./MarkdownContent";

type ChatMessageProps = {
  message: StoredMessage;
  assistantName: string;
  disabled?: boolean;
  onRegenerate?: (messageId: string) => void;
  onEdit?: (messageId: string, content: string) => void;
};

export function ChatMessage({ message, assistantName, disabled, onRegenerate, onEdit }: ChatMessageProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const author = message.role === "user" ? "You" : assistantName;

  return (
    <article className={`chat-message chat-message--${message.role}`} aria-label={`Message from ${author}`}>
      <header className="chat-message__header">
        <span>{author}</span>
        <time dateTime={new Date(message.createdAt).toISOString()}>
          {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </header>
      {editing ? (
        <form
          className="message-editor"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.trim()) return;
            onEdit?.(message.id, draft);
            setEditing(false);
          }}
        >
          <label className="sr-only" htmlFor={`edit-${message.id}`}>Edit message</label>
          <textarea id={`edit-${message.id}`} value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
          <div><button className="secondary-button" type="button" onClick={() => setEditing(false)}>Cancel</button><button className="primary-button" type="submit">Save and resend</button></div>
        </form>
      ) : (
        <MarkdownContent content={message.content} />
      )}
      {message.status === "streaming" && <span className="stream-caret" aria-hidden="true" />}
      {message.status === "interrupted" && <p className="message-state">Response stopped before completion.</p>}
      {message.status === "error" && <p className="message-state message-state--error">Response ended because of an error.</p>}
      {message.role === "user" && onEdit && !editing && (
        <button className="message-action" type="button" disabled={disabled} onClick={() => setEditing(true)}>Edit</button>
      )}
      {message.role === "assistant" && message.status !== "streaming" && onRegenerate && (
        <button className="message-action" type="button" disabled={disabled} onClick={() => onRegenerate(message.id)}>Regenerate</button>
      )}
    </article>
  );
}
