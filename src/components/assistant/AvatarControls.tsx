import { useState } from "react";

import { useAvatarStore } from "../../stores/avatar-store";
import { AVATAR_BASE_STATES, AVATAR_EMOTES, AVATAR_EXPRESSIONS, type AvatarBaseState, type AvatarExpression } from "../../types/avatar";

const EMOTE_LABELS = { Jump: "Jump", Yes: "Yes", No: "No", Wave: "Wave", Punch: "Punch", ThumbsUp: "Thumbs up" } as const;

interface AvatarControlsProps {
  initiallyCollapsed?: boolean;
}

export function AvatarControls({ initiallyCollapsed = false }: AvatarControlsProps) {
  const [collapsed, setCollapsed] = useState(initiallyCollapsed);
  const manualState = useAvatarStore((store) => store.manualState);
  const expression = useAvatarStore((store) => store.expression);
  const setManualState = useAvatarStore((store) => store.setManualState);
  const setExpression = useAvatarStore((store) => store.setExpression);
  const triggerEmote = useAvatarStore((store) => store.triggerEmote);

  if (collapsed) {
    return (
      <button className="avatar-controls__toggle avatar-controls__toggle--collapsed" type="button" aria-label="Expand avatar controls" onClick={() => setCollapsed(false)}>
        <span aria-hidden="true">✦</span><span>Avatar</span>
      </button>
    );
  }

  return (
    <section className="avatar-controls" aria-label="Avatar controls">
      <div className="avatar-controls__header">
        <div><span className="avatar-controls__signal" aria-hidden="true" /><strong>Avatar lab</strong></div>
        <button className="avatar-controls__toggle" type="button" aria-label="Minimize avatar controls" onClick={() => setCollapsed(true)}>⌄</button>
      </div>
      <div className="avatar-controls__fields">
        <label>
          <span>State</span>
          <select aria-label="Avatar state" value={manualState ?? "auto"} onChange={(event) => setManualState(event.target.value === "auto" ? null : event.target.value as AvatarBaseState)}>
            <option value="auto">Follow chat</option>
            {AVATAR_BASE_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
        </label>
        <label>
          <span>Expression</span>
          <select aria-label="Avatar expression" value={expression} onChange={(event) => setExpression(event.target.value as AvatarExpression)}>
            {AVATAR_EXPRESSIONS.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>
      <div className="avatar-controls__emotes" aria-label="Avatar emotes">
        {AVATAR_EMOTES.map((emote) => <button key={emote} type="button" onClick={() => triggerEmote(emote)}>{EMOTE_LABELS[emote]}</button>)}
      </div>
    </section>
  );
}
