import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

import type { AssistantCharacter, AssistantState } from "../../types/assistant";

export function ProceduralHuman({ character, state }: { character: AssistantCharacter; state: AssistantState }) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const rightArm = useRef<Group>(null);
  const accent = character === "ava" ? "#a88cff" : "#55e6ff";
  const suit = character === "ava" ? "#292044" : "#172d48";

  useFrame(({ clock }) => {
    if (!root.current || !head.current || !rightArm.current) return;
    const time = clock.elapsedTime;
    root.current.position.y = Math.sin(time * 1.4) * 0.018;
    head.current.rotation.x = state === "thinking" ? 0.16 : state === "done" ? Math.sin(time * 8) * 0.08 : 0;
    root.current.rotation.y = state === "thinking" ? -0.08 : 0;
    rightArm.current.rotation.z = state === "streaming" ? -0.7 + Math.sin(time * 3) * 0.2 : -0.12;
    rightArm.current.rotation.x = state === "streaming" ? -0.35 : 0;
  });

  return (
    <group ref={root} position={[-0.75, 0, 0]}>
      <group ref={head} position={[0, 2.18, 0]}>
        <mesh castShadow><sphereGeometry args={[0.3, 24, 24]} /><meshStandardMaterial color={character === "ava" ? "#d3b5a4" : "#b9876d"} roughness={0.72} /></mesh>
        <mesh position={[0, 0.12, -0.08]} scale={[1.05, 0.55, 1.03]}><sphereGeometry args={[0.31, 20, 20]} /><meshStandardMaterial color={character === "ava" ? "#29233c" : "#201a19"} /></mesh>
        <mesh position={[-0.105, 0.03, 0.278]}><sphereGeometry args={[0.025, 10, 10]} /><meshBasicMaterial color={accent} /></mesh>
        <mesh position={[0.105, 0.03, 0.278]}><sphereGeometry args={[0.025, 10, 10]} /><meshBasicMaterial color={accent} /></mesh>
      </group>
      <mesh castShadow position={[0, 1.3, 0]}><capsuleGeometry args={[0.39, 0.85, 8, 18]} /><meshStandardMaterial color={suit} roughness={0.6} metalness={0.12} /></mesh>
      <mesh position={[0, 1.55, 0.37]}><boxGeometry args={[0.24, 0.08, 0.025]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.8} /></mesh>
      <group position={[-0.48, 1.55, 0]} rotation={[0, 0, 0.12]}><mesh castShadow position={[0, -0.38, 0]}><capsuleGeometry args={[0.105, 0.56, 6, 12]} /><meshStandardMaterial color={suit} /></mesh></group>
      <group ref={rightArm} position={[0.48, 1.55, 0]} rotation={[0, 0, -0.12]}><mesh castShadow position={[0, -0.38, 0]}><capsuleGeometry args={[0.105, 0.56, 6, 12]} /><meshStandardMaterial color={suit} /></mesh></group>
      <mesh castShadow position={[-0.2, 0.48, 0]}><capsuleGeometry args={[0.13, 0.75, 6, 12]} /><meshStandardMaterial color="#11192c" /></mesh>
      <mesh castShadow position={[0.2, 0.48, 0]}><capsuleGeometry args={[0.13, 0.75, 6, 12]} /><meshStandardMaterial color="#11192c" /></mesh>
    </group>
  );
}
