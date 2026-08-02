import type { AssistantState } from "../../types/assistant";

type AssistantStatusProps = {
  state: AssistantState;
  assistantName: string;
};

const stateCopy: Record<AssistantState, string> = {
  idle: "is ready",
  thinking: "is thinking",
  streaming: "is responding",
  done: "finished responding",
};

export function AssistantStatus({ state, assistantName }: AssistantStatusProps) {
  return (
    <div className={`assistant-status assistant-status--${state}`} role="status" aria-label={`Assistant status: ${assistantName} ${stateCopy[state]}`} aria-live="polite" aria-atomic="true">
      <span className="assistant-status__dot" aria-hidden="true" />
      <span>{assistantName} {stateCopy[state]}</span>
    </div>
  );
}
