import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAssistantStore } from "../../stores/assistant-store";
import { AssistantSelection } from "./AssistantSelection";

describe("AssistantSelection", () => {
  afterEach(() => {
    useAssistantStore.setState({ config: null, state: "idle", persistenceWarning: null });
  });

  it("selects Ava and reveals the workspace action", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<AssistantSelection onComplete={onComplete} />);

    await user.click(screen.getByRole("button", { name: /select ava/i }));

    expect(screen.getByText("Your assistant is ready")).toBeVisible();
    expect(useAssistantStore.getState().config?.character).toBe("ava");
    const enterButton = screen.getByRole("button", { name: /enter workspace/i });
    expect(enterButton).toBeEnabled();
    await user.click(enterButton);
    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("lets keyboard users choose a personality before selecting Alex", async () => {
    const user = userEvent.setup();
    render(<AssistantSelection onComplete={vi.fn()} />);

    await user.click(screen.getByRole("radio", { name: /concise/i }));
    await user.click(screen.getByRole("button", { name: /select alex/i }));

    expect(useAssistantStore.getState().config).toMatchObject({
      character: "alex",
      personality: "concise",
    });
  });
});
