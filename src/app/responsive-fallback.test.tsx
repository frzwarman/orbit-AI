import { act, render, renderHook, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useDocumentVisibility } from "../hooks/use-document-visibility";
import { getResponsiveSceneMode } from "../hooks/use-responsive-scene";
import { useWebGLSupport } from "../hooks/use-webgl-support";
import * as capabilities from "../lib/three/capabilities";
import { useAssistantStore } from "../stores/assistant-store";
import { WorkspaceCanvas } from "../components/scene/WorkspaceCanvas";

vi.mock("../components/scene/OfficeScene", () => ({ OfficeScene: () => null }));
vi.mock("../components/scene/CameraRig", () => ({ CameraRig: () => null }));

describe("adaptive rendering hooks", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports WebGL capability without probing during every render", () => {
    const probe = vi.spyOn(capabilities, "supportsWebGL").mockReturnValue(false);
    const { result, rerender } = renderHook(() => useWebGLSupport());

    rerender();
    expect(result.current).toBe(false);
    expect(probe).toHaveBeenCalledTimes(1);
  });

  it("does not allocate a throwaway WebGL context during capability detection", () => {
    Object.defineProperty(window, "WebGLRenderingContext", { configurable: true, value: class {} });
    const createElement = vi.spyOn(document, "createElement");

    expect(capabilities.supportsWebGL()).toBe(true);
    expect(createElement).not.toHaveBeenCalled();
  });

  it("tracks document visibility so animation work can pause", async () => {
    const { result } = renderHook(() => useDocumentVisibility());
    expect(result.current).toBe(true);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    await act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(false);

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
    await act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(result.current).toBe(true);
  });

  it("selects compact, simplified, and full scenes at the CSS breakpoints", () => {
    expect(getResponsiveSceneMode(767)).toBe("compact");
    expect(getResponsiveSceneMode(768)).toBe("simplified");
    expect(getResponsiveSceneMode(1199)).toBe("simplified");
    expect(getResponsiveSceneMode(1200)).toBe("full");
  });

  it("uses an accessible status fallback when WebGL is unavailable", () => {
    vi.spyOn(capabilities, "supportsWebGL").mockReturnValue(false);
    useAssistantStore.setState({
      config: { character: "alex", name: "Alex", personality: "professional", voiceEnabled: false },
      state: "idle",
    });

    render(<WorkspaceCanvas />);

    expect(screen.getByRole("status", { name: /assistant status/i })).toHaveTextContent("Alex is ready");
    expect(screen.queryByRole("canvas")).not.toBeInTheDocument();
  });
});
