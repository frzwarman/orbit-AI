import { usePreferencesStore } from "../../stores/preferences-store";
import type { AssistantMode } from "../../types/preferences";
import { CodingQuickActions } from "./CodingQuickActions";

export function ModeSwitcher({ onQuickAction }: { onQuickAction: (instruction: string) => void }) {
  const mode = usePreferencesStore((store) => store.mode);
  const setMode = usePreferencesStore((store) => store.setMode);
  return (
    <div className="mode-controls">
      <label>
        <span className="sr-only">Assistant mode</span>
        <select aria-label="Assistant mode" value={mode} onChange={(event) => setMode(event.target.value as AssistantMode)}>
          <option value="general">General</option>
          <option value="coding">Coding Assistant</option>
          <option value="about">About Fariz</option>
        </select>
      </label>
      {mode === "coding" && <CodingQuickActions onSelect={onQuickAction} />}
    </div>
  );
}
