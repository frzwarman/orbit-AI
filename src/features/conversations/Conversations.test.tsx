import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useConversationStore } from "../../stores/conversation-store";
import { usePreferencesStore } from "../../stores/preferences-store";
import { ModeSwitcher } from "../chat/ModeSwitcher";
import { ConversationSidebar } from "./ConversationSidebar";

const conversations = [
  { id: "one", title: "First draft", createdAt: 1, updatedAt: 2 },
  { id: "two", title: "Second draft", createdAt: 3, updatedAt: 4 },
];

afterEach(() => {
  useConversationStore.setState({ conversations: [], activeConversationId: null, activeMessages: [] });
  usePreferencesStore.setState({ mode: "general" });
});

describe("conversation controls", () => {
  it("renames and deletes a conversation after confirmation", async () => {
    const user = userEvent.setup();
    const renameConversation = vi.fn().mockResolvedValue(undefined);
    const deleteConversation = vi.fn().mockResolvedValue(undefined);
    useConversationStore.setState({ conversations, activeConversationId: "one", renameConversation, deleteConversation });
    render(<ConversationSidebar onNewConversation={vi.fn()} onSelectConversation={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /conversation actions for first draft/i }));
    await user.click(screen.getByRole("menuitem", { name: /rename/i }));
    await user.clear(screen.getByRole("textbox", { name: /conversation name/i }));
    await user.type(screen.getByRole("textbox", { name: /conversation name/i }), "Orbit plan{Enter}");
    expect(renameConversation).toHaveBeenCalledWith("one", "Orbit plan");

    await user.click(screen.getByRole("button", { name: /conversation actions for second draft/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    expect(screen.getByRole("dialog", { name: /delete conversation/i })).toBeVisible();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog", { name: /delete conversation/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /conversation actions for second draft/i }));
    await user.click(screen.getByRole("menuitem", { name: /delete/i }));
    await user.click(screen.getByRole("button", { name: /^delete$/i }));
    expect(deleteConversation).toHaveBeenCalledWith("two");
  });

  it("switches to Coding Assistant and shows all requested quick actions", async () => {
    const user = userEvent.setup();
    const onQuickAction = vi.fn();
    render(<ModeSwitcher onQuickAction={onQuickAction} />);
    await user.selectOptions(screen.getByLabelText(/assistant mode/i), "coding");

    const action = screen.getByRole("button", { name: /improve typescript types/i });
    expect(action).toBeVisible();
    expect(screen.getAllByRole("button")).toHaveLength(8);
    await user.click(action);
    expect(onQuickAction).toHaveBeenCalledWith(expect.stringMatching(/typescript types/i));
  });
});
