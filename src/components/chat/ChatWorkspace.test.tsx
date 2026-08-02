import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAssistantStore } from "../../stores/assistant-store";
import { useChatStore } from "../../stores/chat-store";
import type { StoredMessage } from "../../types/chat";
import { AssistantStatus } from "../assistant/AssistantStatus";
import { ChatWorkspace } from "./ChatWorkspace";
import { MarkdownContent } from "./MarkdownContent";

const assistantMessage = (status: StoredMessage["status"]): StoredMessage => ({
  id: "assistant-1",
  conversationId: "conversation-1",
  role: "assistant",
  content: "Try `npm test`\n\n```ts\nconst ready = true\n```",
  createdAt: 2,
  status,
});

afterEach(() => {
  useChatStore.setState({ messages: [], isGenerating: false, error: null, retry: null });
  useAssistantStore.setState({ config: null, state: "idle" });
});

describe("ChatWorkspace", () => {
  it("announces real lifecycle changes", () => {
    render(<AssistantStatus state="streaming" assistantName="Ava" />);
    expect(screen.getByRole("status")).toHaveTextContent("Ava is responding");
  });

  it("renders semantic messages and visible interruption state", () => {
    useAssistantStore.setState({
      config: { character: "ava", name: "Ava", personality: "friendly", voiceEnabled: false },
      state: "idle",
    });
    useChatStore.setState({ messages: [assistantMessage("interrupted")] });

    render(<ChatWorkspace />);

    expect(screen.getByRole("article", { name: /message from ava/i })).toBeVisible();
    expect(screen.getByText(/response stopped/i)).toBeVisible();
    expect(screen.getByText("npm test").tagName).toBe("CODE");
    expect(screen.getByText("TypeScript")).toBeVisible();
    expect(screen.getByRole("button", { name: /copy typescript code/i })).toBeVisible();
  });

  it("does not render raw HTML from markdown", () => {
    const { container } = render(<MarkdownContent content={'<img src=x onerror="alert(1)">'} />);
    expect(container.querySelector("img")).not.toBeInTheDocument();
    expect(screen.getByText(/<img src=x/)).toBeVisible();
  });

  it("copies a code block and reports success", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MarkdownContent content={'```js\nconsole.log("Orbit")\n```'} />);

    await user.click(screen.getByRole("button", { name: /copy javascript code/i }));
    expect(writeText).toHaveBeenCalledWith('console.log("Orbit")');
    expect(screen.getByText("Copied")).toBeVisible();
  });
});
