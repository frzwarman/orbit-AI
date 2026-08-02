import { useRef } from "react";

import { useDialogFocus } from "../../hooks/use-dialog-focus";
import { ConversationSidebar } from "./ConversationSidebar";

type ConversationDrawerProps = {
  onClose: () => void;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
};

export function ConversationDrawer({ onClose, onNewConversation, onSelectConversation }: ConversationDrawerProps) {
  const ref = useRef<HTMLElement>(null);
  useDialogFocus(ref, onClose);
  return (
    <div className="drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside ref={ref} className="conversation-drawer" role="dialog" aria-modal="true" aria-label="Conversation drawer">
        <button type="button" className="drawer-close icon-button" aria-label="Close conversations" onClick={onClose}>×</button>
        <ConversationSidebar onNewConversation={onNewConversation} onSelectConversation={onSelectConversation} />
      </aside>
    </div>
  );
}
