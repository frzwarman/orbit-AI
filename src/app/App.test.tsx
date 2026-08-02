import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useAssistantStore } from "../stores/assistant-store";
import { usePreferencesStore } from "../stores/preferences-store";
import { App } from "./App";

describe("App", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    useAssistantStore.setState({ config: null, hydrated: false });
    usePreferencesStore.setState({ hydrated: false });
  });

  it("shows a labelled startup state while preferences hydrate", () => {
    vi.spyOn(useAssistantStore.getState(), "hydrate").mockImplementation(async () => undefined);
    vi.spyOn(usePreferencesStore.getState(), "hydrate").mockImplementation(async () => undefined);
    render(<App />);

    expect(screen.getByRole("status", { name: /starting orbit/i })).toBeVisible();
  });

  it("routes a hydrated returning user directly to the workspace", () => {
    useAssistantStore.setState({
      config: { character: "alex", name: "Alex", personality: "professional", voiceEnabled: false },
      hydrated: true,
    });
    usePreferencesStore.setState({ hydrated: true });

    render(<App />);

    expect(screen.getByRole("main", { name: /orbit workspace/i })).toBeVisible();
    expect(screen.getByRole("button", { name: /toggle assistant preview/i })).toBeVisible();
  });
});
