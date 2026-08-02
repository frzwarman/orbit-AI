import { useRef, useState } from "react";

import { useDialogFocus } from "../../hooks/use-dialog-focus";
import type { Conversation } from "../../types/conversation";

type ConversationItemProps = {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
  onRename: (title: string) => Promise<void>;
  onDelete: () => Promise<void>;
};

function DeleteDialog({ conversation, onCancel, onDelete }: { conversation: Conversation; onCancel: () => void; onDelete: () => Promise<void> }) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onCancel);
  return (
    <div className="modal-backdrop" role="presentation">
      <div ref={ref} className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby={`delete-${conversation.id}`}>
        <p className="eyebrow">Permanent action</p>
        <h2 id={`delete-${conversation.id}`}>Delete conversation?</h2>
        <p>“{conversation.title}” and its messages will be removed from this device.</p>
        <div>
          <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
          <button type="button" className="danger-button" onClick={() => void onDelete().then(onCancel)}>Delete</button>
        </div>
      </div>
    </div>
  );
}

export function ConversationItem({ conversation, active, onSelect, onRename, onDelete }: ConversationItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [title, setTitle] = useState(conversation.title);

  const finishRename = async () => {
    if (!title.trim()) return;
    await onRename(title);
    setRenaming(false);
  };

  return (
    <li className={`conversation-item${active ? " conversation-item--active" : ""}`}>
      {renaming ? (
        <form onSubmit={(event) => { event.preventDefault(); void finishRename(); }}>
          <label className="sr-only" htmlFor={`rename-${conversation.id}`}>Conversation name</label>
          <input id={`rename-${conversation.id}`} aria-label="Conversation name" value={title} autoFocus
            onChange={(event) => setTitle(event.target.value)} onBlur={() => void finishRename()} />
        </form>
      ) : (
        <button type="button" className="conversation-item__select" aria-current={active ? "page" : undefined} onClick={onSelect}>
          <span>{conversation.title}</span>
          <time dateTime={new Date(conversation.updatedAt).toISOString()}>{new Date(conversation.updatedAt).toLocaleDateString()}</time>
        </button>
      )}
      <button type="button" className="conversation-item__actions" aria-label={`Conversation actions for ${conversation.title}`}
        aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>•••</button>
      {menuOpen && (
        <div className="conversation-menu" role="menu">
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setRenaming(true); }}>Rename</button>
          <button type="button" role="menuitem" onClick={() => { setMenuOpen(false); setConfirmingDelete(true); }}>Delete</button>
        </div>
      )}
      {confirmingDelete && (
        <DeleteDialog conversation={conversation} onCancel={() => setConfirmingDelete(false)} onDelete={onDelete} />
      )}
    </li>
  );
}
