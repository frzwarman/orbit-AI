import { useEffect, useState } from "react";

import { useChatStore } from "../../stores/chat-store";
import { useConversationStore } from "../../stores/conversation-store";
import { ConversationItem } from "./ConversationItem";

type ConversationSidebarProps = {
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
};

export function ConversationSidebar({ onNewConversation, onSelectConversation }: ConversationSidebarProps) {
  const conversations = useConversationStore((store) => store.conversations);
  const activeId = useConversationStore((store) => store.activeConversationId);
  const rename = useConversationStore((store) => store.renameConversation);
  const remove = useConversationStore((store) => store.deleteConversation);
  const search = useConversationStore((store) => store.searchConversations);
  const storageWarning = useConversationStore((store) => store.storageWarning);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => void search(query), 150);
    return () => window.clearTimeout(timer);
  }, [query, search]);

  return (
    <nav className="conversation-sidebar" aria-label="Conversations">
      <div className="conversation-sidebar__top">
        <div><p className="eyebrow">Workspace</p><h2>Conversations</h2></div>
        <button type="button" className="new-chat-button" onClick={onNewConversation} aria-label="New conversation">＋</button>
      </div>
      <label className="conversation-search">
        <span className="sr-only">Search conversations</span>
        <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search history" />
      </label>
      {storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}
      <ul className="conversation-list">
        {conversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} active={conversation.id === activeId}
            onSelect={() => onSelectConversation(conversation.id)} onRename={(title) => rename(conversation.id, title)}
            onDelete={async () => { await remove(conversation.id); useChatStore.getState().replaceMessages(useConversationStore.getState().activeMessages); }} />
        ))}
      </ul>
      {!conversations.length && <p className="conversation-empty">No conversations yet. Start with a question.</p>}
    </nav>
  );
}
