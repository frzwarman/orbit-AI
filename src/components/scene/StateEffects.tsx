import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { Mesh, Points } from "three";

import type { AssistantState } from "../../types/assistant";

const STATUS_COPY: Record<AssistantState, string> = { idle: "Ready", thinking: "Analyzing…", streaming: "Responding…", done: "Complete" };

export function StateEffects({ state, accent, reducedMotion, particleCount = 18, paused = false, showStatus = true }: { state: AssistantState; accent: string; reducedMotion: boolean; particleCount?: number; paused?: boolean; showStatus?: boolean }) {
  const particles = useRef<Points>(null);
  const pulse = useRef<Mesh>(null);
  const streamPulse = useRef<Mesh>(null);
  const points = useMemo(() => {
    const values = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const angle = (index / particleCount) * Math.PI * 2;
      values[index * 3] = Math.cos(angle) * (0.55 + (index % 3) * 0.12);
      values[index * 3 + 1] = 1.5 + Math.sin(index * 1.7) * 0.42;
      values[index * 3 + 2] = Math.sin(angle) * 0.55;
    }
    return values;
  }, [particleCount]);

  useEffect(() => {
    if (state === "done" && pulse.current) pulse.current.scale.setScalar(0.1);
  }, [state]);
  useFrame(({ clock }, delta) => {
    if (reducedMotion || paused) return;
    if (particles.current && state === "thinking") particles.current.rotation.y += delta * 0.65;
    if (pulse.current && state === "done") pulse.current.scale.multiplyScalar(1 + delta * 2.4);
    if (streamPulse.current && state === "streaming") {
      const progress = (clock.elapsedTime * 0.8) % 1;
      streamPulse.current.position.x = -0.15 + progress * 1.65;
      streamPulse.current.scale.setScalar(0.65 + Math.sin(progress * Math.PI) * 0.5);
    }
  });

  return (
    <group>
      {showStatus && <Html center position={[-0.75, 2.85, 0]} distanceFactor={7}>
        <div className={`scene-status scene-status--${state}`} role="status" aria-live="polite">{STATUS_COPY[state]}</div>
      </Html>}
      <points ref={particles} visible={state === "thinking"}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[points, 3]} /></bufferGeometry>
        <pointsMaterial color={accent} size={0.045} transparent opacity={0.75} sizeAttenuation />
      </points>
      <mesh ref={pulse} visible={state === "done"} position={[-0.75, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.65, 0.68, 48]} /><meshBasicMaterial color={accent} transparent opacity={0.6} />
      </mesh>
      <mesh ref={streamPulse} visible={state === "streaming"} position={[-0.15, 1.42, 0]} rotation={[0, -0.35, 0]}>
        <torusGeometry args={[0.16, 0.012, 8, 28]} /><meshBasicMaterial color={accent} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}
