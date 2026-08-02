import { useLayoutEffect, useRef, useState } from "react";

type PromptComposerProps = {
  onSubmit: (content: string) => boolean | Promise<boolean>;
  isStreaming: boolean;
  onStop: () => void;
  error?: string | null;
  onRetry?: () => boolean | Promise<boolean>;
  value?: string;
  onValueChange?: (value: string) => void;
};

export function PromptComposer({ onSubmit, isStreaming, onStop, error, onRetry, value, onValueChange }: PromptComposerProps) {
  const [internalValue, setInternalValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draft = value ?? internalValue;
  const setDraft = onValueChange ?? setInternalValue;

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    textarea.style.height = "auto";
    textarea.style.maxHeight = `${Math.floor(viewportHeight * 0.4)}px`;
    textarea.style.height = `${Math.min(textarea.scrollHeight, viewportHeight * 0.4)}px`;
    textarea.style.overflowY = textarea.scrollHeight > viewportHeight * 0.4 ? "auto" : "hidden";
  }, [draft]);

  const submit = async () => {
    if (!draft.trim() || isStreaming) return;
    const submitted = await onSubmit(draft);
    if (submitted !== false) setDraft("");
  };

  return (
    <div className="composer-shell">
      {error && (
        <div className="composer-error" role="alert">
          <span>{error}</span>
          {onRetry && <button type="button" onClick={() => void onRetry()}>Retry</button>}
        </div>
      )}
      <div className="prompt-composer">
        <label className="sr-only" htmlFor="orbit-prompt">Message Orbit</label>
        <textarea
          ref={textareaRef}
          id="orbit-prompt"
          rows={1}
          value={draft}
          placeholder="Message Orbit…"
          disabled={isStreaming}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
            event.preventDefault();
            void submit();
          }}
        />
        {isStreaming ? (
          <button className="composer-button composer-button--stop" type="button" onClick={onStop} aria-label="Stop response">
            <span aria-hidden="true">■</span>
          </button>
        ) : (
          <button className="composer-button" type="button" disabled={!draft.trim()} onClick={() => void submit()} aria-label="Send message">
            <span aria-hidden="true">↑</span>
          </button>
        )}
      </div>
      <p className="composer-hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}
