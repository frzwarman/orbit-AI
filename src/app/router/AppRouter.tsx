import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatWorkspace } from "../../components/chat/ChatWorkspace";
import { OrbitLogo } from "../../components/common/OrbitLogo";
import { CommandMenu } from "../../components/settings/CommandMenu";
import { SettingsDialog } from "../../components/settings/SettingsDialog";
import { AssistantSelection } from "../../features/assistant-selection/AssistantSelection";
import { chatController } from "../../features/chat/chat-controller";
import { ConversationDrawer } from "../../features/conversations/ConversationDrawer";
import { ConversationSidebar } from "../../features/conversations/ConversationSidebar";
import { useKeyboardShortcuts } from "../../hooks/use-keyboard-shortcuts";
import { useResponsiveScene } from "../../hooks/use-responsive-scene";
import { useAssistantStore } from "../../stores/assistant-store";
import { useChatStore } from "../../stores/chat-store";
import { useConversationStore } from "../../stores/conversation-store";
import { usePreferencesStore } from "../../stores/preferences-store";

const WorkspaceCanvas = lazy(async () => {
  const module = await import("../../components/scene/WorkspaceCanvas");
  return { default: module.WorkspaceCanvas };
});

function StartupScreen() {
  return (
    <main className="app-root grid place-items-center bg-[#050816]">
      <div className="text-center" role="status" aria-label="Starting Orbit">
        <OrbitLogo />
        <div className="mx-auto mt-6 h-px w-32 overflow-hidden bg-white/10">
          <span className="block h-full w-1/2 animate-pulse bg-cyan-300" />
        </div>
        <p className="mt-4 text-sm text-slate-400">Preparing your workspace…</p>
      </div>
    </main>
  );
}

function WorkspaceShell() {
  const assistant = useAssistantStore((store) => store.config);
  const threeDEnabled = usePreferencesStore((store) => store.threeDEnabled);
  const reducedMotion = usePreferencesStore((store) => store.reducedMotion);
  const sceneMode = useResponsiveScene();
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false);
  const hydrateConversations = useConversationStore((store) => store.hydrate);
  const conversationsHydrated = useConversationStore((store) => store.hydrated);
  const [overlay, setOverlay] = useState<"conversations" | "settings" | "commands" | null>(null);
  const hydrationStarted = useRef(false);

  useEffect(() => {
    if (conversationsHydrated || hydrationStarted.current) return;
    hydrationStarted.current = true;
    void hydrateConversations().then(() => {
      useChatStore.getState().replaceMessages(useConversationStore.getState().activeMessages);
    });
  }, [conversationsHydrated, hydrateConversations]);

  const newConversation = useCallback(() => {
    void useConversationStore.getState().createConversation().then(() => {
      useChatStore.getState().replaceMessages([]);
      setOverlay(null);
    });
  }, []);
  const selectConversation = useCallback((id: string) => {
    void chatController.loadConversation(id).then(() => setOverlay(null));
  }, []);
  const shortcutActions = useMemo(() => ({
    onNewConversation: newConversation,
    onOpenCommandMenu: () => setOverlay("commands" as const),
    onEscape: () => setOverlay(null),
  }), [newConversation]);
  useKeyboardShortcuts(shortcutActions);

  return (
    <main
      className={`workspace-shell${reducedMotion ? " workspace-shell--reduced-motion" : ""}`}
      data-motion={reducedMotion ? "reduced" : "full"}
      aria-label="Orbit workspace"
    >
      <a className="skip-link" href="#chat-panel">Skip to chat</a>
      <header className="workspace-header">
        <button type="button" className="icon-button" aria-label="Open conversations" onClick={() => setOverlay("conversations")}>☰</button>
        <OrbitLogo />
        <div className="workspace-header__actions">
          <button type="button" className="icon-button" aria-label="Toggle assistant preview" aria-pressed={mobilePreviewOpen}
            onClick={() => setMobilePreviewOpen((open) => !open)}>◉</button>
          <button type="button" className="icon-button" aria-label="Open settings" onClick={() => setOverlay("settings")}>⚙</button>
        </div>
      </header>
      <aside className="workspace-rail" aria-label="Conversation navigation">
        <OrbitLogo compact />
        <div className="workspace-rail__actions">
          <button type="button" className="icon-button" aria-label="New conversation" onClick={newConversation}>＋</button>
          <button type="button" className="icon-button" aria-label="Open command menu" onClick={() => setOverlay("commands")}>⌘</button>
          <button type="button" className="icon-button" aria-label="Open settings" onClick={() => setOverlay("settings")}>⚙</button>
        </div>
      </aside>
      <aside className="workspace-conversations"><ConversationSidebar onNewConversation={newConversation} onSelectConversation={selectConversation} /></aside>
      <section className={`workspace-stage${mobilePreviewOpen ? " workspace-stage--mobile-open" : ""}`} aria-label="Assistant preview">
        {threeDEnabled ? (
          <Suspense fallback={<div className="scene-fallback" role="status">Loading assistant preview…</div>}>
            <WorkspaceCanvas compact={sceneMode !== "full"} />
          </Suspense>
        ) : <div className="scene-fallback"><p className="eyebrow">Assistant space</p><p>{assistant?.name ?? "Orbit"} is online</p></div>}
      </section>
      <section className="workspace-chat" id="chat-panel" tabIndex={-1} aria-label="Chat panel">
        <ChatWorkspace />
      </section>
      {overlay === "conversations" && <ConversationDrawer onClose={() => setOverlay(null)} onNewConversation={newConversation} onSelectConversation={selectConversation} />}
      {overlay === "settings" && <SettingsDialog onClose={() => setOverlay(null)} />}
      {overlay === "commands" && <CommandMenu onClose={() => setOverlay(null)} onNewConversation={newConversation}
        onOpenConversations={() => setOverlay("conversations")} onOpenSettings={() => setOverlay("settings")} />}
    </main>
  );
}

function HydratedRouter() {
  const config = useAssistantStore((store) => store.config);
  const [showOnboarding, setShowOnboarding] = useState(config === null);

  if (showOnboarding) {
    return <AssistantSelection onComplete={() => setShowOnboarding(false)} />;
  }

  return <WorkspaceShell />;
}

export function AppRouter() {
  const assistantHydrated = useAssistantStore((store) => store.hydrated);
  const preferencesHydrated = usePreferencesStore((store) => store.hydrated);
  const hydrateAssistant = useAssistantStore((store) => store.hydrate);
  const hydratePreferences = usePreferencesStore((store) => store.hydrate);
  const hydrationStarted = useRef(false);

  useEffect(() => {
    if (assistantHydrated && preferencesHydrated) return;
    if (hydrationStarted.current) return;
    hydrationStarted.current = true;
    void Promise.all([hydrateAssistant(), hydratePreferences()]);
  }, [assistantHydrated, hydrateAssistant, hydratePreferences, preferencesHydrated]);

  if (!assistantHydrated || !preferencesHydrated) return <StartupScreen />;

  return <HydratedRouter />;
}
