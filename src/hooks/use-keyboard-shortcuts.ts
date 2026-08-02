import { useEffect } from "react";

type ShortcutActions = {
  onNewConversation: () => void;
  onOpenCommandMenu: () => void;
  onEscape: () => void;
};

function isEditable(target: EventTarget | null) {
  return target instanceof HTMLElement &&
    (target.isContentEditable || target.matches("input, textarea, select"));
}

export function useKeyboardShortcuts(actions: ShortcutActions) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        actions.onEscape();
        return;
      }
      if (isEditable(event.target) || !(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "k") {
        event.preventDefault();
        actions.onNewConversation();
      } else if (event.key === "/") {
        event.preventDefault();
        actions.onOpenCommandMenu();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [actions]);
}
