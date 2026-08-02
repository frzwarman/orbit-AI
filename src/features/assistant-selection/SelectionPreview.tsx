import type { AssistantCharacter } from "../../types/assistant";

type SelectionPreviewProps = { character: AssistantCharacter };

export function SelectionPreview({ character }: SelectionPreviewProps) {
  const isAva = character === "ava";

  return (
    <div
      className={`portrait-stage ${isAva ? "portrait-stage--ava" : "portrait-stage--alex"}`}
      role="img"
      aria-label={`${isAva ? "Ava" : "Alex"}, a stylized AI coworker portrait`}
    >
      <span className="portrait-orbit portrait-orbit--outer" />
      <span className="portrait-orbit portrait-orbit--inner" />
      <div className="portrait-person" aria-hidden="true">
        <span className="portrait-head" />
        <span className="portrait-neck" />
        <span className="portrait-body" />
      </div>
      <span className="portrait-scan" aria-hidden="true" />
      <span className="portrait-status" aria-hidden="true">Online</span>
    </div>
  );
}
