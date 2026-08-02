import type { AssistantState } from "../../types/assistant";

export type AssistantLifecycle = {
  begin: () => void;
  stream: () => void;
  complete: () => void;
  stop: () => void;
  dispose: () => void;
};

export function createAssistantLifecycle(
  setState: (state: AssistantState) => void,
  completionDelayMs = 1_500,
): AssistantLifecycle {
  let completionTimer: ReturnType<typeof setTimeout> | null = null;

  const clearCompletion = () => {
    if (completionTimer !== null) clearTimeout(completionTimer);
    completionTimer = null;
  };

  return {
    begin: () => {
      clearCompletion();
      setState("thinking");
    },
    stream: () => setState("streaming"),
    complete: () => {
      clearCompletion();
      setState("done");
      completionTimer = setTimeout(() => {
        completionTimer = null;
        setState("idle");
      }, completionDelayMs);
    },
    stop: () => {
      clearCompletion();
      setState("idle");
    },
    dispose: clearCompletion,
  };
}
