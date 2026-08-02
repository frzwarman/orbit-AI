import { Canvas } from "@react-three/fiber";

import { useDocumentVisibility } from "../../hooks/use-document-visibility";
import { useWebGLSupport } from "../../hooks/use-webgl-support";
import { useAssistantStore } from "../../stores/assistant-store";
import { usePreferencesStore } from "../../stores/preferences-store";
import { AssistantStatus } from "../assistant/AssistantStatus";
import { CameraRig } from "./CameraRig";
import { OfficeScene } from "./OfficeScene";
import { SceneBoundary } from "./SceneBoundary";

export function WorkspaceCanvas({ compact = false }: { compact?: boolean }) {
  const config = useAssistantStore((store) => store.config);
  const state = useAssistantStore((store) => store.state);
  const reducedMotion = usePreferencesStore((store) => store.reducedMotion);
  const quality = usePreferencesStore((store) => store.quality);
  const webGLSupported = useWebGLSupport();
  const documentVisible = useDocumentVisibility();
  if (!config) return null;
  const fallback = <div className="scene-fallback"><AssistantStatus assistantName={config.name} state={state} /></div>;
  if (!webGLSupported) return fallback;

  const highQuality = !compact && quality !== "low";

  return (
    <SceneBoundary fallback={fallback}>
      <div className="workspace-canvas" data-testid="workspace-canvas">
        <Canvas frameloop={documentVisible ? "always" : "never"} shadows={highQuality ? "basic" : false} dpr={highQuality ? [1, 1.5] : 1} camera={{ position: compact ? [0, 1.7, 5] : [4.6, 3.2, 7.2], fov: 38 }} gl={{ antialias: highQuality, alpha: false }}>
          <OfficeScene character={config.character} state={state} reducedMotion={reducedMotion} compact={compact} highQuality={highQuality} paused={!documentVisible} />
          <CameraRig state={state} reducedMotion={reducedMotion} />
        </Canvas>
      </div>
    </SceneBoundary>
  );
}
