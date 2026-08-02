/* eslint-disable react-refresh/only-export-components -- Animation helpers are pure and contract-tested. */
import { useAnimations, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { AnimationAction, LoopOnce, LoopRepeat, type Group } from "three";

import type { AssistantCharacter, AssistantState } from "../../types/assistant";

type ActionName = "Idle" | "Thinking" | "Streaming" | "Done";
type ActionLike = Pick<AnimationAction, "fadeIn" | "fadeOut" | "play" | "reset" | "setLoop" | "clampWhenFinished">;

const ACTION_FOR_STATE: Record<AssistantState, ActionName> = {
  idle: "Idle",
  thinking: "Thinking",
  streaming: "Streaming",
  done: "Done",
};

const MODEL_URLS: Record<AssistantCharacter, string> = {
  alex: "/models/alex.glb",
  ava: "/models/ava.glb",
};

export function configureAction(action: ActionLike, name: ActionName) {
  action.clampWhenFinished = name === "Done";
  action.setLoop(name === "Done" ? LoopOnce : LoopRepeat, name === "Done" ? 1 : Number.POSITIVE_INFINITY);
}

export function transitionAnimation<T extends ActionLike>(
  actions: Partial<Record<ActionName, T>>,
  currentName: ActionName | null,
  nextName: ActionName,
): ActionName {
  if (currentName === nextName) return nextName;
  const next = actions[nextName];
  if (!next) return currentName ?? nextName;
  if (currentName) actions[currentName]?.fadeOut(0.35);
  configureAction(next, nextName);
  next.reset().fadeIn(0.35).play();
  return nextName;
}

export function AnimatedModel({ character, state }: { character: AssistantCharacter; state: AssistantState }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URLS[character]);
  const { actions, mixer } = useAnimations(animations, group);
  const current = useRef<ActionName | null>(null);

  useEffect(() => {
    current.current = transitionAnimation(actions, current.current, ACTION_FOR_STATE[state]);
  }, [actions, state]);

  useEffect(() => {
    const onFinished = () => {
      if (current.current === "Done") current.current = transitionAnimation(actions, "Done", "Idle");
    };
    mixer.addEventListener("finished", onFinished);
    return () => mixer.removeEventListener("finished", onFinished);
  }, [actions, mixer]);

  return <primitive ref={group} object={scene} scale={1.15} position={[-0.75, 0, 0]} />;
}
