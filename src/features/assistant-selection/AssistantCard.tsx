import type { AssistantCharacter } from "../../types/assistant";
import { SelectionPreview } from "./SelectionPreview";

type AssistantCardProps = {
  character: AssistantCharacter;
  name: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
};

export function AssistantCard({ character, name, description, selected, onSelect }: AssistantCardProps) {
  return (
    <article className={`assistant-card ${selected ? "assistant-card--selected" : ""}`}>
      <SelectionPreview character={character} />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">AI coworker</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">{name}</h2>
          </div>
          {selected && <span className="selection-pill">Selected</span>}
        </div>
        <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">{description}</p>
        <button
          className="secondary-button mt-5 w-full"
          type="button"
          aria-pressed={selected}
          onClick={onSelect}
        >
          Select {name}
        </button>
      </div>
    </article>
  );
}
