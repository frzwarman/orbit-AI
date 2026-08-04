/* eslint-disable react-refresh/only-export-components -- Animation helpers are pure and contract-tested. */
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { AnimationAction, LoopOnce, LoopRepeat, type Group, type Mesh, type Object3D } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import { useAvatarStore } from "../../stores/avatar-store";
import type { AssistantCharacter, AssistantState } from "../../types/assistant";
import type { AvatarBaseState, AvatarExpression, RobotActionName } from "../../types/avatar";

type ActionLike = Pick<AnimationAction, "fadeIn" | "fadeOut" | "play" | "reset" | "setLoop" | "clampWhenFinished">;

const MODEL_URL = "/models/RobotExpressive.glb";
const LOOPING_ACTIONS = new Set<RobotActionName>(["Idle", "Walking", "Running", "Dance"]);
const EMOTES = new Set<RobotActionName>(["Jump", "Yes", "No", "Wave", "Punch", "ThumbsUp"]);

export type LifecycleAnimation = { base: AvatarBaseState };

export function getLifecycleAnimation(state: AssistantState, reducedMotion: boolean): LifecycleAnimation {
  void reducedMotion;
  const base = state === "thinking" ? "Sitting" : "Standing";
  return { base };
}

export function restoreBaseAnimation(finished: RobotActionName, base: AvatarBaseState): AvatarBaseState | null {
  return EMOTES.has(finished) ? base : null;
}

export function configureAction(action: ActionLike, name: RobotActionName) {
  const loops = LOOPING_ACTIONS.has(name);
  action.clampWhenFinished = !loops;
  action.setLoop(loops ? LoopRepeat : LoopOnce, loops ? Number.POSITIVE_INFINITY : 1);
}

export function transitionAnimation<T extends ActionLike>(
  actions: Partial<Record<RobotActionName, T>>,
  currentName: RobotActionName | null,
  nextName: RobotActionName,
  duration = 0.35,
  restart = false,
): RobotActionName {
  if (currentName === nextName && !restart) return nextName;
  const next = actions[nextName];
  if (!next) return currentName ?? nextName;
  if (currentName) actions[currentName]?.fadeOut(duration);
  configureAction(next, nextName);
  next.reset().fadeIn(duration).play();
  return nextName;
}

function applyExpression(root: Object3D, expression: AvatarExpression) {
  root.traverse((object) => {
    const mesh = object as Mesh;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
    for (const name of ["Angry", "Surprised", "Sad"] as const) {
      const index = mesh.morphTargetDictionary[name];
      if (index !== undefined) mesh.morphTargetInfluences[index] = expression === name ? 1 : 0;
    }
  });
}

export function AnimatedModel({ state, reducedMotion }: { character: AssistantCharacter; state: AssistantState; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const gltf = useGLTF(MODEL_URL);
  const scene = useMemo(() => clone(gltf.scene), [gltf.scene]);
  const { actions, mixer } = useAnimations(gltf.animations, group);
  const activeCue = useAvatarStore((store) => store.activeCue);
  const completeCue = useAvatarStore((store) => store.completeCue);
  const current = useRef<RobotActionName | null>(null);
  const currentCueSequence = useRef<number | null>(null);
  const base = getLifecycleAnimation(state, reducedMotion).base;
  const baseRef = useRef<AvatarBaseState>(base);

  useEffect(() => {
    baseRef.current = base;
    if (activeCue) return;
    currentCueSequence.current = null;
    current.current = transitionAnimation(actions, current.current, base, reducedMotion ? 0 : 0.35);
  }, [actions, activeCue, base, reducedMotion]);

  useEffect(() => {
    if (!activeCue) return;
    currentCueSequence.current = activeCue.sequence;
    const reducedAction = activeCue.expression === "Sad" ? "Sitting" : baseRef.current;
    const action = reducedMotion ? reducedAction : activeCue.action;
    current.current = transitionAnimation(actions, current.current, action, reducedMotion ? 0 : 0.2, true);
  }, [actions, activeCue, reducedMotion]);

  useEffect(() => {
    applyExpression(scene, activeCue?.expression ?? "Neutral");
  }, [activeCue?.expression, scene]);

  useEffect(() => {
    if (!activeCue || activeCue.persistent) return;
    const isLoopingCue = LOOPING_ACTIONS.has(activeCue.action);
    if (!isLoopingCue && !reducedMotion) return;
    const timer = window.setTimeout(
      () => completeCue(activeCue.sequence),
      activeCue.holdMs ?? (reducedMotion ? 1_200 : 1_800),
    );
    return () => window.clearTimeout(timer);
  }, [activeCue, completeCue, reducedMotion]);

  useEffect(() => {
    const onFinished = (event: { action: AnimationAction }) => {
      const cue = useAvatarStore.getState().activeCue;
      if (!cue || cue.persistent || currentCueSequence.current !== cue.sequence) return;
      const action = reducedMotion ? (cue.expression === "Sad" ? "Sitting" : baseRef.current) : cue.action;
      if (actions[action] !== event.action) return;
      completeCue(cue.sequence);
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [actions, completeCue, mixer, reducedMotion]);

  return <primitive ref={group} object={scene} scale={0.82} position={[-0.75, 0, 0]} rotation={[0, 0.25, 0]} />;
};
