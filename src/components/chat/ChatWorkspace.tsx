import { useEffect, useState } from "react";

import { chatController } from "../../features/chat/chat-controller";
import { ModeSwitcher } from "../../features/chat/ModeSwitcher";
import { useAssistantStore } from "../../stores/assistant-store";
import { useChatStore } from "../../stores/chat-store";
import { AssistantStatus } from "../assistant/AssistantStatus";
import { MessageList } from "./MessageList";
import { PromptComposer } from "./PromptComposer";

export function ChatWorkspace() {
  const [draft, setDraft] = useState("");
  const messages = useChatStore((store) => store.messages);
  const isGenerating = useChatStore((store) => store.isGenerating);
  const error = useChatStore((store) => store.error);
  const assistant = useAssistantStore((store) => store.config);
  const assistantState = useAssistantStore((store) => store.state);
  const assistantName = assistant?.name ?? "Orbit";

  useEffect(() => () => chatController.dispose(), []);

  return (
    <div className="chat-workspace" id="chat-workspace">
      <header className="chat-workspace__header">
        <div>
          <p className="eyebrow">Current session</p>
          <h2>Work with {assistantName}</h2>
        </div>
        <AssistantStatus state={assistantState} assistantName={assistantName} />
      </header>
      <ModeSwitcher onQuickAction={(instruction) => setDraft((current) => current ? `${current}\n\n${instruction}` : instruction)} />
      <MessageList
        messages={messages}
        assistantName={assistantName}
        isGenerating={isGenerating}
        onRegenerate={(id) => void chatController.regenerate(id)}
        onEdit={(id, content) => void chatController.editAndResend(id, content)}
      />
      <PromptComposer
        onSubmit={chatController.submit}
        isStreaming={isGenerating}
        onStop={chatController.stop}
        error={error}
        onRetry={chatController.retry}
        value={draft}
        onValueChange={setDraft}
      />
    </div>
  );
}
