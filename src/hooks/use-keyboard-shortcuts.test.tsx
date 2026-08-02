import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";

import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";

function Harness(props: Parameters<typeof useKeyboardShortcuts>[0]) {
  useKeyboardShortcuts(props);
  return <textarea aria-label="Editor" />;
}

it("handles global commands while ignoring editable fields except Escape", async () => {
  const user = userEvent.setup();
  const onNewConversation = vi.fn();
  const onOpenCommandMenu = vi.fn();
  const onEscape = vi.fn();
  render(<Harness {...{ onNewConversation, onOpenCommandMenu, onEscape }} />);

  await user.keyboard("{Control>}k{/Control}");
  expect(onNewConversation).toHaveBeenCalledOnce();
  await user.keyboard("{Control>}/{/Control}");
  expect(onOpenCommandMenu).toHaveBeenCalledOnce();

  const editor = document.querySelector("textarea")!;
  editor.focus();
  await user.keyboard("{Control>}k{/Control}{Escape}");
  expect(onNewConversation).toHaveBeenCalledOnce();
  expect(onEscape).toHaveBeenCalledOnce();
});
