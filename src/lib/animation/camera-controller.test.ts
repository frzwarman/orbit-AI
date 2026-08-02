import { describe, expect, it, vi } from "vitest";
import { PerspectiveCamera, Vector3 } from "three";

import { CAMERA_TARGETS, createCameraController } from "./camera-controller";

describe("camera controller", () => {
  it("sets the final pose synchronously with reduced motion", () => {
    const camera = new PerspectiveCamera();
    const lookAt = new Vector3();
    const controller = createCameraController(camera, lookAt, { reducedMotion: true });

    controller.focusAssistant();

    expect(camera.position.toArray()).toEqual(CAMERA_TARGETS.assistantFocus.position);
    expect(lookAt.toArray()).toEqual(CAMERA_TARGETS.assistantFocus.lookAt);
  });

  it("kills conflicting tweens before starting a new movement", () => {
    const camera = new PerspectiveCamera();
    const lookAt = new Vector3();
    const tween = { killTweensOf: vi.fn(), to: vi.fn() };
    const controller = createCameraController(camera, lookAt, { reducedMotion: false, tween });

    controller.focusChat();

    expect(tween.killTweensOf).toHaveBeenCalledWith(camera.position);
    expect(tween.killTweensOf).toHaveBeenCalledWith(lookAt);
    expect(tween.to).toHaveBeenCalledTimes(2);
  });
});
