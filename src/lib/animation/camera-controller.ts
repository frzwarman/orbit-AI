import gsap from "gsap";
import type { Camera, Vector3 } from "three";

export type CameraDestination = "selection" | "workspace" | "chat" | "settings" | "assistantFocus";

type CameraPose = {
  position: [number, number, number];
  lookAt: [number, number, number];
};

type TweenAdapter = Pick<typeof gsap, "killTweensOf" | "to">;

export const CAMERA_TARGETS: Record<CameraDestination, CameraPose> = {
  selection: { position: [0, 1.8, 5.8], lookAt: [0, 1.2, 0] },
  workspace: { position: [4.6, 3.2, 7.2], lookAt: [0, 1.15, 0] },
  chat: { position: [3.3, 2.3, 5.2], lookAt: [0.9, 1.35, -0.3] },
  settings: { position: [-3.6, 2.8, 6.2], lookAt: [-0.7, 1.2, 0] },
  assistantFocus: { position: [1.35, 2.15, 4.15], lookAt: [-0.6, 1.35, 0] },
};

export function createCameraController(
  camera: Camera,
  lookAtTarget: Vector3,
  options: { reducedMotion: boolean; tween?: TweenAdapter },
) {
  const tween = options.tween ?? gsap;

  const moveTo = (destination: CameraDestination) => {
    const target = CAMERA_TARGETS[destination];
    tween.killTweensOf(camera.position);
    tween.killTweensOf(lookAtTarget);

    if (options.reducedMotion) {
      camera.position.set(...target.position);
      lookAtTarget.set(...target.lookAt);
      return;
    }

    const [x, y, z] = target.position;
    const [lookX, lookY, lookZ] = target.lookAt;
    tween.to(camera.position, { x, y, z, duration: 0.8, ease: "power2.inOut" });
    tween.to(lookAtTarget, { x: lookX, y: lookY, z: lookZ, duration: 0.8, ease: "power2.inOut" });
  };

  return {
    moveToSelection: () => moveTo("selection"),
    moveToWorkspace: () => moveTo("workspace"),
    focusChat: () => moveTo("chat"),
    focusSettings: () => moveTo("settings"),
    focusAssistant: () => moveTo("assistantFocus"),
    dispose: () => {
      tween.killTweensOf(camera.position);
      tween.killTweensOf(lookAtTarget);
    },
  };
}
