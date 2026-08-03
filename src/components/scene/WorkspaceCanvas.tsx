import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";

import { useDocumentVisibility } from "../../hooks/use-document-visibility";
import { useWebGLSupport } from "../../hooks/use-webgl-support";
import { useAssistantStore } from "../../stores/assistant-store";
import { usePreferencesStore } from "../../stores/preferences-store";
import { AssistantStatus } from "../assistant/AssistantStatus";
import { CameraRig } from "./CameraRig";
import { OfficeScene } from "./OfficeScene";
import { SceneBoundary } from "./SceneBoundary";

function WebGLContextEvents({ onLost, onRestored, onReady }: { onLost: (event: Event) => void; onRestored: () => void; onReady: () => void }) {
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    onReady();
    return () => {
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
    };
  }, [canvas, onLost, onReady, onRestored]);

  return null;
}

export function WorkspaceCanvas({ compact = false, active = true }: { compact?: boolean; active?: boolean }) {
  const config = useAssistantStore((store) => store.config);
  const state = useAssistantStore((store) => store.state);
  const reducedMotion = usePreferencesStore((store) => store.reducedMotion);
  const quality = usePreferencesStore((store) => store.quality);
  const webGLSupported = useWebGLSupport();
  const documentVisible = useDocumentVisibility();
  const [contextLost, setContextLost] = useState(false);
  const [canvasKey, setCanvasKey] = useState(0);
  const [contextEventsReady, setContextEventsReady] = useState(false);
  const recoveryTimer = useRef<number | null>(null);
  const automaticRetryUsed = useRef(false);

  const remountCanvas = useCallback(() => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    recoveryTimer.current = null;
    setContextEventsReady(false);
    setCanvasKey((key) => key + 1);
    setContextLost(false);
  }, []);

  useEffect(() => () => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
  }, []);

  const handleContextLost = useCallback((event: Event) => {
    event.preventDefault();
    setContextLost(true);
    if (!automaticRetryUsed.current) {
      automaticRetryUsed.current = true;
      recoveryTimer.current = window.setTimeout(remountCanvas, 300);
    }
  }, [remountCanvas]);

  const handleContextRestored = useCallback(() => {
    if (recoveryTimer.current !== null) window.clearTimeout(recoveryTimer.current);
    recoveryTimer.current = null;
    setContextLost(false);
  }, []);

  if (!config) return null;
  const fallback = <div className="scene-fallback"><AssistantStatus assistantName={config.name} state={state} /></div>;
  if (!webGLSupported) return fallback;

  const highQuality = !compact && quality !== "low";

  return (
    <SceneBoundary fallback={fallback}>
      <div className="workspace-canvas" data-testid="workspace-canvas" data-canvas-generation={canvasKey} data-context-events-ready={contextEventsReady}>
        <Canvas key={canvasKey} frameloop={active && documentVisible ? "always" : "never"} shadows={highQuality ? "basic" : false} dpr={highQuality ? [1, 1.5] : 1} camera={{ position: compact ? [0, 1.7, 5] : [4.6, 3.2, 7.2], fov: 38 }} gl={{ antialias: highQuality, alpha: false }}>
          <WebGLContextEvents onLost={handleContextLost} onRestored={handleContextRestored} onReady={() => setContextEventsReady(true)} />
          <OfficeScene character={config.character} state={state} reducedMotion={reducedMotion} compact={compact} highQuality={highQuality} paused={!documentVisible} />
          <CameraRig state={state} reducedMotion={reducedMotion} />
        </Canvas>
        {contextLost && (
          <div className="scene-fallback scene-fallback--overlay" role="status" aria-label="3D preview unavailable">
            <p>3D preview paused after the graphics context was lost.</p>
            <button
              className="secondary-button"
              type="button"
              onClick={remountCanvas}
            >
              Retry 3D preview
            </button>
          </div>
        )}
      </div>
    </SceneBoundary>
  );
}
