/* eslint-disable react-refresh/only-export-components -- Animation helpers are pure and contract-tested. */
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { AnimationAction, LoopOnce, LoopRepeat, type Group, type Mesh, type Object3D } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";

import { useAvatarStore } from "../../stores/avatar-store";
import type { AssistantCharacter, AssistantState } from "../../types/assistant";
import type { AvatarBaseState, AvatarExpression, AvatarEmote, RobotActionName } from "../../types/avatar";

type ActionLike = Pick<AnimationAction, "fadeIn" | "fadeOut" | "play" | "reset" | "setLoop" | "clampWhenFinished">;

const MODEL_URL = "/models/RobotExpressive.glb";
const LOOPING_ACTIONS = new Set<RobotActionName>(["Idle", "Walking", "Running", "Dance"]);
const EMOTES = new Set<RobotActionName>(["Jump", "Yes", "No", "Wave", "Punch", "ThumbsUp"]);

export type LifecycleAnimation = { base: AvatarBaseState; emote?: AvatarEmote };

export function getLifecycleAnimation(state: AssistantState, reducedMotion: boolean): LifecycleAnimation {
  const base = state === "thinking" ? "Sitting" : "Standing";
  if (reducedMotion) return { base };
  if (state === "streaming") return { base, emote: "Wave" };
  if (state === "done") return { base, emote: "ThumbsUp" };
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
): RobotActionName {
  if (currentName === nextName) return nextName;
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
  const manualState = useAvatarStore((store) => store.manualState);
  const expression = useAvatarStore((store) => store.expression);
  const emoteRequest = useAvatarStore((store) => store.emoteRequest);
  const current = useRef<RobotActionName | null>(null);
  const base = manualState ?? getLifecycleAnimation(state, reducedMotion).base;
  const baseRef = useRef<AvatarBaseState>(base);
  const previousLifecycle = useRef<AssistantState | null>(null);

  useEffect(() => {
    baseRef.current = base;
    const lifecycle = getLifecycleAnimation(state, reducedMotion);
    const lifecycleChanged = previousLifecycle.current !== state;
    previousLifecycle.current = state;
    const automaticEmote = manualState === null && lifecycleChanged ? lifecycle.emote : undefined;
    current.current = transitionAnimation(actions, current.current, automaticEmote ?? base, reducedMotion ? 0 : 0.35);
  }, [actions, base, manualState, reducedMotion, state]);

  useEffect(() => {
    if (!emoteRequest) return;
    current.current = transitionAnimation(actions, current.current, emoteRequest.name, reducedMotion ? 0 : 0.2);
  }, [actions, emoteRequest, reducedMotion]);

  useEffect(() => {
    applyExpression(scene, expression);
  }, [expression, scene]);

  useEffect(() => {
    const onFinished = (event: { action: AnimationAction }) => {
      const finished = current.current;
      if (!finished || actions[finished] !== event.action) return;
      const restore = restoreBaseAnimation(finished, baseRef.current);
      if (restore) current.current = transitionAnimation(actions, finished, restore, reducedMotion ? 0 : 0.2);
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [actions, mixer, reducedMotion]);

  return <primitive ref={group} object={scene} scale={0.82} position={[-0.75, 0, 0]} rotation={[0, 0.25, 0]} />;
};
