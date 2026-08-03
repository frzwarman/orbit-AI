import { ContactShadows, Environment, Float, RoundedBox } from "@react-three/drei";

import type { AssistantCharacter, AssistantState } from "../../types/assistant";
import { HumanAssistant } from "../assistant/HumanAssistant";
import { StateEffects } from "./StateEffects";

export function OfficeScene({ character, state, reducedMotion, compact = false, highQuality = true, paused = false }: { character: AssistantCharacter; state: AssistantState; reducedMotion: boolean; compact?: boolean; highQuality?: boolean; paused?: boolean }) {
  const accent = character === "ava" ? "#a88cff" : "#55e6ff";
  return (
    <group>
      <color attach="background" args={["#070b18"]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} color="#dbeafe" castShadow={highQuality} />
      <pointLight position={[-3, 3, 2]} intensity={18} color={accent} distance={7} />
      <HumanAssistant character={character} state={state} reducedMotion={reducedMotion} />
      {!compact && (
        <>
          <RoundedBox args={[3.5, 0.16, 1.25]} radius={0.08} position={[0.7, 0.78, -0.25]} castShadow receiveShadow><meshStandardMaterial color="#121a2d" roughness={0.42} metalness={0.45} /></RoundedBox>
          <mesh position={[0.75, 1.52, -0.63]} rotation={[0, -0.08, 0]}><boxGeometry args={[1.85, 1.05, 0.06]} /><meshStandardMaterial color="#07111e" emissive={accent} emissiveIntensity={state === "streaming" ? 0.55 : 0.18} /></mesh>
          <mesh position={[0.75, 1.52, -0.594]} rotation={[0, -0.08, 0]}><planeGeometry args={[1.65, 0.82]} /><meshBasicMaterial color="#0b2940" transparent opacity={0.7} /></mesh>
          {[-0.45, 0, 0.45].map((x, index) => <Float key={x} speed={reducedMotion ? 0 : 1 + index * 0.2} floatIntensity={0.08}><RoundedBox args={[0.34, 0.22, 0.025]} radius={0.035} position={[x + 0.7, 2.35 + (index % 2) * 0.14, -0.5]}><meshStandardMaterial color={index === 1 ? accent : "#27314d"} emissive={accent} emissiveIntensity={0.15} /></RoundedBox></Float>)}
          <mesh position={[-2.4, 2.2, -1.25]}><planeGeometry args={[2.4, 2.7]} /><meshStandardMaterial color="#0b1730" emissive="#102d53" emissiveIntensity={0.32} /></mesh>
          {[0, 1, 2, 3].map((index) => <mesh key={index} position={[-3.15 + index * 0.48, 1.5 + index * 0.2, -1.2]}><boxGeometry args={[0.18, 0.6 + index * 0.25, 0.04]} /><meshBasicMaterial color={index % 2 ? "#284a78" : "#19365f"} /></mesh>)}
          {highQuality && <ContactShadows position={[0, 0.02, 0]} opacity={0.42} scale={8} blur={2.6} far={4} />}
        </>
      )}
      <StateEffects state={state} accent={accent} reducedMotion={reducedMotion} particleCount={highQuality ? 18 : 8} paused={paused} showStatus={!compact} />
      {highQuality && <Environment preset="city" environmentIntensity={0.25} />}
    </group>
  );
}
