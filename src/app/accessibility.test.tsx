import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAssistantStore } from "../stores/assistant-store";
import { usePreferencesStore } from "../stores/preferences-store";
import { App } from "./App";

vi.mock("../components/scene/WorkspaceCanvas", () => ({
  WorkspaceCanvas: () => <canvas data-testid="workspace-canvas" aria-label="3D assistant workspace" />,
}));

describe("workspace accessibility", () => {
  afterEach(() => {
    useAssistantStore.setState({ config: null, hydrated: false });
    usePreferencesStore.setState({ hydrated: false, threeDEnabled: true });
  });

  it("keeps chat functional when 3D is disabled", async () => {
    const user = userEvent.setup();
    useAssistantStore.setState({
      config: { character: "ava", name: "Ava", personality: "friendly", voiceEnabled: false },
      hydrated: true,
    });
    usePreferencesStore.setState({ hydrated: true, threeDEnabled: true });
    render(<App />);

    expect(await screen.findByTestId("workspace-canvas")).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: /open settings/i })[0]!);
    await user.click(screen.getByRole("switch", { name: /enable 3d/i }));
    await user.click(screen.getByRole("switch", { name: /reduce motion/i }));

    expect(screen.queryByTestId("workspace-canvas")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message orbit/i })).toBeEnabled();
    expect(screen.getByRole("link", { name: /skip to chat/i })).toHaveAttribute("href", "#chat-panel");
    expect(screen.getByRole("main", { name: /orbit workspace/i })).toHaveClass("workspace-shell--reduced-motion");
  });
});
