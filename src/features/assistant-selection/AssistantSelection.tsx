import { useState } from "react";

import { OrbitLogo } from "../../components/common/OrbitLogo";
import { useAssistantStore } from "../../stores/assistant-store";
import type { AssistantCharacter, AssistantPersonality } from "../../types/assistant";
import { AssistantCard } from "./AssistantCard";

type AssistantSelectionProps = { onComplete: () => void };

const assistants = [
  { character: "alex", name: "Alex", description: "Calm and considered. Alex keeps complex work focused, clear, and moving forward." },
  { character: "ava", name: "Ava", description: "Warm and collaborative. Ava brings energy, curiosity, and thoughtful momentum." },
] as const;

const personalities: { value: AssistantPersonality; label: string; detail: string }[] = [
  { value: "professional", label: "Professional", detail: "Structured and polished" },
  { value: "friendly", label: "Friendly", detail: "Warm and conversational" },
  { value: "concise", label: "Concise", detail: "Direct and efficient" },
];

export function AssistantSelection({ onComplete }: AssistantSelectionProps) {
  const config = useAssistantStore((store) => store.config);
  const setAssistant = useAssistantStore((store) => store.setAssistant);
  const warning = useAssistantStore((store) => store.persistenceWarning);
  const [personality, setPersonality] = useState<AssistantPersonality>("professional");

  const selectAssistant = (character: AssistantCharacter, name: string) => {
    setAssistant({ character, name, personality, voiceEnabled: false });
  };

  return (
    <main className="onboarding-shell" aria-labelledby="selection-title">
      <header className="onboarding-header">
        <OrbitLogo />
        <p className="hidden text-sm text-slate-400 sm:block">A workspace that works beside you.</p>
      </header>

      <section className="mx-auto w-full max-w-5xl py-10 sm:py-14 lg:py-20">
        <div className="max-w-2xl">
          <p className="eyebrow">Personalize your workspace</p>
          <h1 id="selection-title" className="mt-4 text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">
            Choose your AI coworker
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
            Pick the presence and communication style that helps you do your best work. You can change both later.
          </p>
        </div>

        <fieldset className="mt-8 sm:mt-10">
          <legend className="text-sm font-semibold text-white">How should your coworker communicate?</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {personalities.map((item) => (
              <label key={item.value} className="personality-option">
                <input
                  type="radio"
                  name="personality"
                  value={item.value}
                  checked={personality === item.value}
                  onChange={() => setPersonality(item.value)}
                />
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.detail}</small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
          {assistants.map((assistant) => (
            <AssistantCard
              key={assistant.character}
              {...assistant}
              selected={config?.character === assistant.character}
              onSelect={() => selectAssistant(assistant.character, assistant.name)}
            />
          ))}
        </div>

        {config && (
          <section className="confirmation-panel" aria-labelledby="confirmation-title">
            <div>
              <p className="eyebrow">Configuration complete</p>
              <h2 id="confirmation-title" className="mt-2 text-2xl font-semibold text-white">Your assistant is ready</h2>
              <p className="mt-1 text-sm text-slate-300">{config.name} will meet you in the workspace.</p>
            </div>
            <button className="primary-button w-full sm:w-auto" type="button" onClick={onComplete}>
              Enter workspace <span aria-hidden="true">→</span>
            </button>
          </section>
        )}
        {warning && <p className="mt-4 text-sm text-amber-200" role="status">{warning}</p>}
      </section>
    </main>
  );
}
