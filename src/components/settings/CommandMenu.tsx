import { useRef } from "react";

import { useDialogFocus } from "../../hooks/use-dialog-focus";

type CommandMenuProps = {
  onClose: () => void;
  onNewConversation: () => void;
  onOpenSettings: () => void;
  onOpenConversations: () => void;
};

export function CommandMenu({ onClose, onNewConversation, onOpenSettings, onOpenConversations }: CommandMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  useDialogFocus(ref, onClose);
  const invoke = (action: () => void) => { onClose(); action(); };
  return (
    <div className="modal-backdrop command-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div ref={ref} className="command-menu" role="dialog" aria-modal="true" aria-labelledby="command-title">
        <div className="command-menu__header"><span aria-hidden="true">⌘</span><h2 id="command-title">Orbit commands</h2>
          <button type="button" aria-label="Close command menu" onClick={onClose}>Esc</button></div>
        <div className="command-list">
          <button type="button" onClick={() => invoke(onNewConversation)}><span>New conversation</span><kbd>⌘ K</kbd></button>
          <button type="button" onClick={() => invoke(onOpenConversations)}><span>Browse conversations</span></button>
          <button type="button" onClick={() => invoke(onOpenSettings)}><span>Workspace settings</span></button>
        </div>
      </div>
    </div>
  );
}
