import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PromptComposer } from "./PromptComposer";

describe("PromptComposer", () => {
  it("submits with Enter and preserves Shift+Enter", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(true);
    render(<PromptComposer onSubmit={onSubmit} isStreaming={false} onStop={vi.fn()} />);

    const textbox = screen.getByRole("textbox", { name: /message orbit/i });
    await user.type(textbox, "first{shift>}{enter}{/shift}second");
    expect(textbox).toHaveValue("first\nsecond");

    await user.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledWith("first\nsecond");
    expect(textbox).toHaveValue("");
  });

  it("shows a stop action while streaming and a retry action after failure", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onRetry = vi.fn().mockResolvedValue(true);
    const { rerender } = render(
      <PromptComposer onSubmit={vi.fn()} isStreaming onStop={onStop} />,
    );

    await user.click(screen.getByRole("button", { name: /stop response/i }));
    expect(onStop).toHaveBeenCalledOnce();

    rerender(
      <PromptComposer
        onSubmit={vi.fn()}
        isStreaming={false}
        onStop={onStop}
        error="Provider unavailable"
        onRetry={onRetry}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Provider unavailable");
    await user.click(screen.getByRole("button", { name: /retry/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
