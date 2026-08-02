import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Vector3 } from "three";

import { createCameraController } from "../../lib/animation/camera-controller";
import type { AssistantState } from "../../types/assistant";

export function CameraRig({ state, reducedMotion }: { state: AssistantState; reducedMotion: boolean }) {
  const camera = useThree((context) => context.camera);
  const target = useMemo(() => new Vector3(0, 1.15, 0), []);
  const controller = useMemo(() => createCameraController(camera, target, { reducedMotion }), [camera, reducedMotion, target]);

  useEffect(() => {
    if (state === "thinking") controller.focusAssistant();
    else if (state === "streaming") controller.focusChat();
    else if (state === "done") controller.moveToWorkspace();
    return () => controller.dispose();
  }, [controller, state]);
  useFrame(() => camera.lookAt(target));
  return null;
}
