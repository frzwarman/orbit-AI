# Orbit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-quality, mobile-responsive AI coworker whose selectable 3D assistant reacts to real Puter streaming lifecycle events.

**Architecture:** Orbit is a client-only React application with feature-level Zustand stores, Dexie repositories, a replaceable `AIProvider`, and an isolated lazy-loaded React Three Fiber scene. Chat orchestration owns the lifecycle; the scene only consumes state and camera commands, while accessible HTML remains fully functional without WebGL.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Zustand, Dexie, Puter.js, React Markdown, Prism React Renderer, Three.js, React Three Fiber, Drei, GSAP, Vitest, React Testing Library, Playwright.

---

## File Map

The implementation creates these focused units:

```text
index.html                              Puter script and application mount
src/main.tsx                            React bootstrap
src/app/App.tsx                         hydration and onboarding/workspace routing
src/app/providers/AppProviders.tsx      error boundaries and provider composition
src/app/router/AppRouter.tsx            local onboarding/workspace route switch
src/components/assistant/               status, HumanAssistant, procedural fallback
src/components/chat/                    composer, message list, markdown, code block
src/components/common/                  error boundary, dialogs, icons, loading UI
src/components/scene/                   lazy canvases, office, effects, camera rig
src/components/settings/                preferences and command menu
src/features/assistant-selection/       onboarding experience
src/features/chat/                      orchestration and prompt quick actions
src/features/conversations/             sidebar, drawer, search, CRUD controls
src/features/preferences/               capability and keyboard behavior
src/data/portfolio-context.ts            constrained local portfolio knowledge
src/lib/ai/                             provider contract, Puter, mock, prompts
src/lib/animation/                      lifecycle completion and GSAP controller
src/lib/storage/                        Dexie schema and repositories
src/lib/three/                          capability and quality helpers
src/stores/                             assistant, chat, conversation, preferences
src/types/                              shared domain types and Puter declaration
tests/                                  Vitest setup and focused unit/component tests
e2e/                                   Playwright desktop/mobile journeys
```

## Task 1: Scaffold the Strict React Application

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `eslint.config.js`
- Create: `src/main.tsx`
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`
- Create: `tests/setup.ts`
- Create: `playwright.config.ts`

- [ ] **Step 1: Create package metadata and scripts**

Use `package.json` scripts:

```json
{
  "name": "orbit-ai-coworker",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint . --max-warnings=0",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "check": "npm run lint && npm run test && npm run build"
  }
}
```

- [ ] **Step 2: Install runtime and development dependencies**

Run:

```bash
npm install react@^19 react-dom@^19 zustand dexie react-markdown prism-react-renderer three @react-three/fiber @react-three/drei gsap clsx
npm install -D typescript vite @vitejs/plugin-react @tailwindcss/vite tailwindcss eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh @types/react @types/react-dom @types/three vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test fake-indexeddb
```

Expected: dependencies install without peer-dependency errors.

- [ ] **Step 3: Configure strict TypeScript, Vite, Tailwind, Vitest, ESLint, and Playwright**

`tsconfig.app.json` must enable:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src", "tests", "e2e"]
}
```

Configure Vite with `react()`, `tailwindcss()`, and Vitest `environment: "jsdom"`, `setupFiles: ["./tests/setup.ts"]`, and CSS enabled. Configure Playwright to start `npm run dev -- --host 127.0.0.1` and test desktop Chromium plus a Pixel 7 viewport.

- [ ] **Step 4: Add the bootstrap and visual tokens**

`index.html` loads `https://js.puter.com/v2/` with `defer`, then `/src/main.tsx`. `src/styles.css` imports Tailwind and defines navy surfaces, violet/cyan accents, focus rings, safe-area spacing, reduced-motion rules, scrollbar styling, and `100dvh` application sizing.

- [ ] **Step 5: Verify the empty shell**

Run: `npm run build && npm run lint`

Expected: both commands exit successfully.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json index.html vite.config.ts tsconfig*.json eslint.config.js playwright.config.ts src/main.tsx src/styles.css src/vite-env.d.ts tests/setup.ts
git commit -m "build: scaffold Orbit application"
```

## Task 2: Define Domain Types and Persistence Repositories

**Files:**
- Create: `src/types/assistant.ts`
- Create: `src/types/chat.ts`
- Create: `src/types/conversation.ts`
- Create: `src/types/preferences.ts`
- Create: `src/lib/storage/database.ts`
- Create: `src/lib/storage/conversation-repository.ts`
- Create: `src/lib/storage/settings-repository.ts`
- Test: `src/lib/storage/repositories.test.ts`

- [ ] **Step 1: Write failing repository tests**

Use `fake-indexeddb/auto` and assert this behavior:

```ts
it("creates and deletes a conversation with its messages", async () => {
  const conversation = await conversations.create("New conversation");
  await conversations.appendMessage({
    id: "message-1",
    conversationId: conversation.id,
    role: "user",
    content: "Hello",
    createdAt: 1,
    status: "complete",
  });
  expect(await conversations.getMessages(conversation.id)).toHaveLength(1);
  await conversations.delete(conversation.id);
  expect(await conversations.getMessages(conversation.id)).toEqual([]);
});

it("persists assistant and responsive preferences", async () => {
  await settings.set("assistant", { character: "ava", name: "Ava", personality: "friendly", voiceEnabled: false });
  await settings.set("threeDEnabled", false);
  expect(await settings.get("assistant")).toMatchObject({ character: "ava" });
  expect(await settings.get("threeDEnabled")).toBe(false);
});
```

- [ ] **Step 2: Run tests and confirm the missing-module failure**

Run: `npm test -- src/lib/storage/repositories.test.ts`

Expected: FAIL because repositories are not implemented.

- [ ] **Step 3: Implement strict domain types**

Define:

```ts
export type AssistantState = "idle" | "thinking" | "streaming" | "done";
export type AssistantCharacter = "alex" | "ava";
export type AssistantConfig = {
  character: AssistantCharacter;
  name: string;
  personality: "professional" | "friendly" | "concise";
  voiceEnabled: boolean;
};

export type MessageRole = "system" | "user" | "assistant";
export type MessageStatus = "streaming" | "complete" | "interrupted" | "error";
export type StoredMessage = {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: number;
  status: MessageStatus;
};
```

Add `Conversation`, `AssistantMode`, `QualityMode`, and strongly typed `PersistedSettings` definitions without `any`.

- [ ] **Step 4: Implement the Dexie schema and repositories**

Use tables `conversations`, `messages`, and `settings`, with message indexing by `conversationId` and `createdAt`. Repository methods must include `create`, `list`, `rename`, `delete`, `search`, `getMessages`, `appendMessage`, `updateMessage`, and `truncateAfter`. Delete conversations and their messages in one Dexie transaction.

- [ ] **Step 5: Run repository tests**

Run: `npm test -- src/lib/storage/repositories.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/types src/lib/storage
git commit -m "feat: add typed local persistence"
```

## Task 3: Implement Assistant and Preference Stores

**Files:**
- Create: `src/stores/assistant-store.ts`
- Create: `src/stores/preferences-store.ts`
- Create: `src/features/preferences/detect-preferences.ts`
- Test: `src/stores/assistant-store.test.ts`
- Test: `src/stores/preferences-store.test.ts`

- [ ] **Step 1: Write failing store tests**

```ts
it("persists the selected assistant", async () => {
  useAssistantStore.getState().setAssistant({
    character: "ava",
    name: "Ava",
    personality: "friendly",
    voiceEnabled: false,
  });
  expect(useAssistantStore.getState().config?.character).toBe("ava");
  expect(settingsRepository.set).toHaveBeenCalledWith("assistant", expect.objectContaining({ character: "ava" }));
});

it("honors reduced motion and disables 3D", () => {
  usePreferencesStore.getState().setReducedMotion(true);
  usePreferencesStore.getState().setThreeDEnabled(false);
  expect(usePreferencesStore.getState()).toMatchObject({ reducedMotion: true, threeDEnabled: false });
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/stores/assistant-store.test.ts src/stores/preferences-store.test.ts`

Expected: FAIL because stores are missing.

- [ ] **Step 3: Implement narrowly subscribed Zustand stores**

`AssistantStore` exposes `config`, `state`, `setAssistant`, `setState`, `hydrate`, and `reset`. `PreferencesStore` exposes `mode`, `threeDEnabled`, `reducedMotion`, `quality`, `hydrated`, setters, and `hydrate`. Setters update state immediately and write through `settingsRepository`; failed writes set a non-fatal `persistenceWarning`.

- [ ] **Step 4: Implement device defaults**

`detectPreferenceDefaults()` returns reduced motion from `matchMedia`, chooses low quality for coarse pointers, fewer than 4 logical CPU cores, or less than 4 GB device memory when available through a typed navigator extension, and never overrides a persisted user choice.

- [ ] **Step 5: Verify tests**

Run: `npm test -- src/stores/assistant-store.test.ts src/stores/preferences-store.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/stores/assistant-store.ts src/stores/preferences-store.ts src/features/preferences src/stores/*.test.ts
git commit -m "feat: add assistant and preference state"
```

## Task 4: Add Puter and Mock AI Providers

**Files:**
- Create: `src/types/puter.d.ts`
- Create: `src/lib/ai/types.ts`
- Create: `src/lib/ai/puter-provider.ts`
- Create: `src/lib/ai/mock-provider.ts`
- Create: `src/lib/ai/provider.ts`
- Create: `src/lib/ai/prompts.ts`
- Create: `src/data/portfolio-context.ts`
- Test: `src/lib/ai/providers.test.ts`
- Test: `src/lib/ai/prompts.test.ts`

- [ ] **Step 1: Write failing provider and prompt tests**

```ts
it("streams deterministic chunks and supports abort", async () => {
  const controller = new AbortController();
  const tokens: string[] = [];
  const promise = new MockAIProvider(["Orbit ", "ready"]).streamChat([], {
    signal: controller.signal,
    onToken: (token) => {
      tokens.push(token);
      controller.abort();
    },
  });
  await expect(promise).rejects.toMatchObject({ name: "AbortError" });
  expect(tokens).toEqual(["Orbit "]);
});

it("constrains About Fariz to local facts", () => {
  const prompt = buildSystemPrompt("about");
  expect(prompt).toContain("Do not invent");
  expect(prompt).toContain(portfolioContext.profile);
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/lib/ai/providers.test.ts src/lib/ai/prompts.test.ts`

Expected: FAIL because provider modules are missing.

- [ ] **Step 3: Implement the required provider contract**

```ts
export type ChatMessage = {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
};
export type StreamChatOptions = {
  signal?: AbortSignal;
  onToken: (token: string) => void;
};
export interface AIProvider {
  streamChat(messages: ChatMessage[], options: StreamChatOptions): Promise<void>;
}
```

- [ ] **Step 4: Implement Puter streaming**

Declare only the Puter members used by Orbit. Convert Orbit messages to Puter's accepted role/content records, request `stream: true`, iterate async chunks, normalize string and `{ text?: string }` payloads, check `signal.aborted` before and during iteration, and call iterator `return()` when aborting if available. Throw a descriptive `PuterUnavailableError` when `window.puter?.ai?.chat` is absent.

- [ ] **Step 5: Implement deterministic mock and mode prompts**

Mock chunks must be constructor-configurable and delayed with an abort-aware promise. Coding mode includes the requested quick-action guidance. About Fariz serializes the exported portfolio object and says: “Use only the supplied portfolio context. Do not invent or infer missing facts; state that the information is unavailable.”

- [ ] **Step 6: Verify tests and commit**

Run: `npm test -- src/lib/ai`

Expected: PASS.

```bash
git add src/lib/ai src/types/puter.d.ts src/data/portfolio-context.ts
git commit -m "feat: add Puter streaming provider"
```

## Task 5: Build Conversation and Chat Orchestration

**Files:**
- Create: `src/stores/conversation-store.ts`
- Create: `src/stores/chat-store.ts`
- Create: `src/features/chat/chat-controller.ts`
- Create: `src/lib/animation/assistant-lifecycle.ts`
- Test: `src/features/chat/chat-controller.test.ts`
- Test: `src/stores/conversation-store.test.ts`

- [ ] **Step 1: Write lifecycle tests before implementation**

```ts
it("derives thinking, streaming, done, and idle from stream events", async () => {
  const execution = controller.submit("Explain Orbit");
  expect(useAssistantStore.getState().state).toBe("thinking");
  provider.emit("First token");
  expect(useAssistantStore.getState().state).toBe("streaming");
  provider.finish();
  await execution;
  expect(useAssistantStore.getState().state).toBe("done");
  vi.advanceTimersByTime(1500);
  expect(useAssistantStore.getState().state).toBe("idle");
});

it("aborts generation and retains a non-empty partial response", async () => {
  const execution = controller.submit("Long task");
  provider.emit("Partial");
  controller.stop();
  await execution;
  expect(useAssistantStore.getState().state).toBe("idle");
  expect(useChatStore.getState().messages.at(-1)).toMatchObject({ content: "Partial", status: "interrupted" });
});
```

- [ ] **Step 2: Confirm lifecycle tests fail**

Run: `npm test -- src/features/chat/chat-controller.test.ts`

Expected: FAIL because controller and stores are missing.

- [ ] **Step 3: Implement conversation store**

Expose hydration, active conversation selection, creation, rename, deletion, search, message loading, and active-message replacement. Deleting the active conversation selects the most recent remaining item or creates none until the next submission.

- [ ] **Step 4: Implement chat controller**

The controller owns one `AbortController`, rejects blank or concurrent submissions, ensures an active conversation, writes the user message, constructs mode context, and creates the assistant record only on the first token. It batches durable content writes at most once per 100 ms while updating visible store content immediately. It clears previous completion timers before every new request.

On success it persists `complete`, enters `done`, and schedules the only fake-timer-compatible transition at 1,500 ms. Abort marks non-empty output `interrupted`, removes empty output, and returns directly to idle. Provider failures persist useful partial output with `error` status and expose retry metadata.

- [ ] **Step 5: Add regenerate and edit/resend**

Regenerate removes the selected assistant response and submits against preceding context without duplicating the user message. Edit/resend updates the selected user message, truncates all later messages through the repository, then starts a new assistant response.

- [ ] **Step 6: Verify focused tests**

Run: `npm test -- src/features/chat/chat-controller.test.ts src/stores/conversation-store.test.ts`

Expected: PASS with fake timers used only for completion delay.

- [ ] **Step 7: Commit**

```bash
git add src/stores/chat-store.ts src/stores/conversation-store.ts src/features/chat src/lib/animation/assistant-lifecycle.ts
git commit -m "feat: orchestrate persistent streaming chat"
```

## Task 6: Create Onboarding and the Responsive App Shell

**Files:**
- Create: `src/app/App.tsx`
- Create: `src/app/providers/AppProviders.tsx`
- Create: `src/app/router/AppRouter.tsx`
- Create: `src/components/common/AppErrorBoundary.tsx`
- Create: `src/components/common/OrbitLogo.tsx`
- Create: `src/features/assistant-selection/AssistantSelection.tsx`
- Create: `src/features/assistant-selection/AssistantCard.tsx`
- Create: `src/features/assistant-selection/SelectionPreview.tsx`
- Test: `src/features/assistant-selection/AssistantSelection.test.tsx`
- Test: `src/app/App.test.tsx`

- [ ] **Step 1: Write onboarding tests**

```tsx
it("selects Ava and reveals the workspace action", async () => {
  render(<AssistantSelection />);
  await user.click(screen.getByRole("button", { name: /select ava/i }));
  expect(screen.getByText("Your assistant is ready")).toBeVisible();
  expect(useAssistantStore.getState().config?.character).toBe("ava");
  expect(screen.getByRole("button", { name: /enter workspace/i })).toBeEnabled();
});

it("routes a hydrated returning user directly to the workspace", async () => {
  seedAssistant("alex");
  render(<App />);
  expect(await screen.findByRole("main", { name: /orbit workspace/i })).toBeVisible();
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/features/assistant-selection src/app/App.test.tsx`

Expected: FAIL because components are missing.

- [ ] **Step 3: Implement hydration and local route state**

`App` hydrates stores concurrently, renders a labelled loading shell, then routes users without a selection to onboarding. First-time selection remains on a confirmation state; “Enter workspace” switches to the workspace. Returning users bypass confirmation.

- [ ] **Step 4: Implement polished character cards**

Use semantic headings and buttons, visible focus rings, assistant-specific cyan/violet accents, hover lift disabled by reduced motion, procedural portrait silhouettes, personality text, and `aria-pressed` for current selection. `SelectionPreview` is statically useful before the 3D task exists.

- [ ] **Step 5: Verify responsive onboarding tests**

Run: `npm test -- src/features/assistant-selection src/app/App.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/app src/components/common src/features/assistant-selection
git commit -m "feat: add assistant onboarding"
```

## Task 7: Build the Accessible Chat Workspace

**Files:**
- Create: `src/components/chat/ChatWorkspace.tsx`
- Create: `src/components/chat/MessageList.tsx`
- Create: `src/components/chat/ChatMessage.tsx`
- Create: `src/components/chat/MarkdownContent.tsx`
- Create: `src/components/chat/CodeBlock.tsx`
- Create: `src/components/chat/PromptComposer.tsx`
- Create: `src/components/assistant/AssistantStatus.tsx`
- Create: `src/hooks/use-smart-scroll.ts`
- Test: `src/components/chat/ChatWorkspace.test.tsx`
- Test: `src/components/chat/PromptComposer.test.tsx`

- [ ] **Step 1: Write chat interaction tests**

```tsx
it("submits with Enter and preserves Shift+Enter", async () => {
  render(<PromptComposer onSubmit={onSubmit} isStreaming={false} onStop={vi.fn()} />);
  const textbox = screen.getByRole("textbox", { name: /message orbit/i });
  await user.type(textbox, "first{shift>}{enter}{/shift}second");
  expect(textbox).toHaveValue("first\nsecond");
  await user.keyboard("{Enter}");
  expect(onSubmit).toHaveBeenCalledWith("first\nsecond");
});

it("announces real lifecycle changes", () => {
  render(<AssistantStatus state="streaming" assistantName="Ava" />);
  expect(screen.getByRole("status")).toHaveTextContent("Ava is responding");
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/components/chat`

Expected: FAIL because chat components are missing.

- [ ] **Step 3: Implement the message list and smart scrolling**

`useSmartScroll` tracks whether the viewport is within 96 px of the bottom. New tokens scroll only while that flag is true. Prepending or rerendering older content restores the prior scroll offset. The message list uses semantic articles and visible interrupted/error labels.

- [ ] **Step 4: Implement Markdown and code rendering**

Use `react-markdown` without raw HTML plugins. `CodeBlock` uses `prism-react-renderer`, horizontal overflow, a language label, and a labelled copy button with a temporary “Copied” status. Plain inline code stays inline.

- [ ] **Step 5: Implement the mobile-safe composer**

Use an auto-growing textarea capped at 40% of the visual viewport, submit and stop buttons of at least 44 px, `Enter`/`Shift+Enter`, disabled states, provider retry action, and bottom padding using `env(safe-area-inset-bottom)`.

- [ ] **Step 6: Verify tests and commit**

Run: `npm test -- src/components/chat`

Expected: PASS.

```bash
git add src/components/chat src/components/assistant/AssistantStatus.tsx src/hooks/use-smart-scroll.ts
git commit -m "feat: add accessible streaming chat UI"
```

## Task 8: Add Conversations, Modes, Settings, and Keyboard Commands

**Files:**
- Create: `src/features/conversations/ConversationSidebar.tsx`
- Create: `src/features/conversations/ConversationDrawer.tsx`
- Create: `src/features/conversations/ConversationItem.tsx`
- Create: `src/features/chat/ModeSwitcher.tsx`
- Create: `src/features/chat/CodingQuickActions.tsx`
- Create: `src/components/settings/SettingsDialog.tsx`
- Create: `src/components/settings/CommandMenu.tsx`
- Create: `src/hooks/use-keyboard-shortcuts.ts`
- Test: `src/features/conversations/Conversations.test.tsx`
- Test: `src/hooks/use-keyboard-shortcuts.test.tsx`

- [ ] **Step 1: Write CRUD, mode, and shortcut tests**

```tsx
it("renames and deletes a conversation after confirmation", async () => {
  render(<ConversationSidebar />);
  await user.click(screen.getByRole("button", { name: /conversation actions/i }));
  await user.click(screen.getByRole("menuitem", { name: /rename/i }));
  await user.clear(screen.getByRole("textbox", { name: /conversation name/i }));
  await user.type(screen.getByRole("textbox", { name: /conversation name/i }), "Orbit plan{Enter}");
  expect(rename).toHaveBeenCalledWith(expect.any(String), "Orbit plan");
});

it("switches to Coding Assistant and shows quick actions", async () => {
  render(<ModeSwitcher />);
  await user.selectOptions(screen.getByLabelText(/assistant mode/i), "coding");
  expect(screen.getByRole("button", { name: /improve typescript types/i })).toBeVisible();
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/features/conversations src/hooks/use-keyboard-shortcuts.test.tsx`

Expected: FAIL because controls are missing.

- [ ] **Step 3: Implement responsive conversation navigation**

Desktop renders a sidebar; mobile renders the same content in a modal drawer with focus trapping, labelled close control, Escape handling, and focus restoration. Search debounces by 150 ms. Rename uses an inline form; delete uses a confirmation dialog.

- [ ] **Step 4: Implement modes and requested coding quick actions**

Render General, Coding, and About Fariz. Coding mode exposes buttons for Explain code, Find bugs, Improve TypeScript types, Refactor component, Generate tests, Review accessibility, Improve React performance, and Convert styles to Tailwind. A quick action inserts a clear instruction into the composer without auto-submitting.

- [ ] **Step 5: Implement settings, command menu, and shortcuts**

Settings includes 3D enabled, reduced motion, and auto/low/high quality. `Cmd/Ctrl+K` creates a new conversation, `Cmd/Ctrl+/` opens the command menu, and Escape closes the topmost drawer or dialog. Ignore shortcuts originating in editable fields except Escape.

- [ ] **Step 6: Verify tests and commit**

Run: `npm test -- src/features/conversations src/hooks/use-keyboard-shortcuts.test.tsx`

Expected: PASS.

```bash
git add src/features/conversations src/features/chat/ModeSwitcher.tsx src/features/chat/CodingQuickActions.tsx src/components/settings src/hooks/use-keyboard-shortcuts.ts
git commit -m "feat: add conversation and workspace controls"
```

## Task 9: Implement the Reactive 3D Assistant and Office

**Files:**
- Create: `src/components/assistant/HumanAssistant.tsx`
- Create: `src/components/assistant/AnimatedModel.tsx`
- Create: `src/components/assistant/ProceduralHuman.tsx`
- Create: `src/components/scene/SceneBoundary.tsx`
- Create: `src/components/scene/WorkspaceCanvas.tsx`
- Create: `src/components/scene/CompactAssistantCanvas.tsx`
- Create: `src/components/scene/OfficeScene.tsx`
- Create: `src/components/scene/StateEffects.tsx`
- Create: `src/components/scene/CameraRig.tsx`
- Create: `src/lib/animation/camera-controller.ts`
- Create: `src/lib/three/capabilities.ts`
- Test: `src/components/assistant/HumanAssistant.test.tsx`
- Test: `src/lib/animation/camera-controller.test.ts`

- [ ] **Step 1: Write animation contract tests**

```ts
it("does not restart the current action and crossfades to the next", () => {
  transitionAnimation(actions, "Idle", "Thinking");
  expect(actions.Idle.fadeOut).toHaveBeenCalledWith(0.35);
  expect(actions.Thinking.reset).toHaveBeenCalledOnce();
  expect(actions.Thinking.fadeIn).toHaveBeenCalledWith(0.35);
  transitionAnimation(actions, "Thinking", "Thinking");
  expect(actions.Thinking.reset).toHaveBeenCalledOnce();
});

it("uses LoopOnce and clamping for Done", () => {
  configureAction(doneAction, "Done");
  expect(doneAction.setLoop).toHaveBeenCalledWith(THREE.LoopOnce, 1);
  expect(doneAction.clampWhenFinished).toBe(true);
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/components/assistant/HumanAssistant.test.tsx src/lib/animation/camera-controller.test.ts`

Expected: FAIL because animation helpers are missing.

- [ ] **Step 3: Implement `HumanAssistant` model contract and fallback**

`HumanAssistant({ character, state })` delegates to `AnimatedModel` inside a local Suspense/error boundary and falls back to `ProceduralHuman`. `AnimatedModel` uses `useGLTF` and `useAnimations`, maps state to `Idle`, `Thinking`, `Streaming`, and `Done`, crossfades over 0.35 s, loops the first three, and configures Done with `LoopOnce` and clamping. It listens for mixer completion to restore the visual idle action without mutating chat state.

- [ ] **Step 4: Implement the procedural assistant**

Build reusable primitive geometry with assistant-specific colors and proportions. `useFrame` applies subtle breathing in idle, a chin/forward tilt in thinking, an explaining arm gesture in streaming, and a short nod in done. Reuse vectors and do not allocate in frame callbacks.

- [ ] **Step 5: Implement the contained office and lifecycle effects**

Compose a desk, holographic monitor, window skyline, task cards, restrained ambient particles, soft area/key lights, and contact shadows. Thinking displays “Analyzing…” in the HTML status while particles orbit the panel. Streaming sends cyan pulses toward the monitor. Done emits one expanding completion ring.

- [ ] **Step 6: Implement GSAP camera targets**

Define typed targets for selection, workspace, chat, settings, and assistantFocus. Each exported movement function kills conflicting position/look-at tweens before starting. Reduced motion sets final values synchronously. Lifecycle subscribers call focusAssistant on thinking, focusChat on first token, and moveToWorkspace on completion.

- [ ] **Step 7: Verify tests and commit**

Run: `npm test -- src/components/assistant src/lib/animation/camera-controller.test.ts`

Expected: PASS.

```bash
git add src/components/assistant src/components/scene src/lib/animation/camera-controller.ts src/lib/three
git commit -m "feat: add reactive 3D workspace"
```

## Task 10: Integrate Adaptive Responsive Rendering and Accessibility

**Files:**
- Modify: `src/components/chat/ChatWorkspace.tsx`
- Modify: `src/app/App.tsx`
- Modify: `src/styles.css`
- Create: `src/hooks/use-document-visibility.ts`
- Create: `src/hooks/use-webgl-support.ts`
- Test: `src/app/accessibility.test.tsx`
- Test: `src/app/responsive-fallback.test.tsx`

- [ ] **Step 1: Write reduced-motion, Disable 3D, and WebGL tests**

```tsx
it("unmounts WebGL while preserving all chat controls", async () => {
  render(<Workspace />);
  await user.click(screen.getByRole("switch", { name: /enable 3d/i }));
  expect(screen.queryByTestId("workspace-canvas")).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: /message orbit/i })).toBeEnabled();
});

it("uses an accessible fallback when WebGL is unavailable", () => {
  mockWebGLSupport(false);
  render(<Workspace />);
  expect(screen.getByRole("status", { name: /assistant status/i })).toBeVisible();
  expect(screen.queryByRole("canvas")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Confirm failures**

Run: `npm test -- src/app/accessibility.test.tsx src/app/responsive-fallback.test.tsx`

Expected: FAIL until integration exists.

- [ ] **Step 3: Integrate breakpoint-specific scenes**

Below 768 px render only `CompactAssistantCanvas`; from 768 through 1199 px render simplified office quality; at 1200 px render the full contained office. Do not rely only on JavaScript width: CSS owns layout and `matchMedia` selects scene cost. When 3D is disabled or WebGL is unavailable, unmount Canvas and render `AssistantStatus`.

- [ ] **Step 4: Add adaptive quality and visibility pausing**

Cap DPR at 1 for low and compact modes and 1.5 for high desktop mode. Quality controls shadows, particle counts, antialiasing, and contact shadows. `useDocumentVisibility` invalidates or pauses scene effects while hidden; resume without replaying completion effects.

- [ ] **Step 5: Complete responsive and accessible behavior**

Use `100dvh`, safe-area padding, drawer navigation below 768 px, collapsible sidebar through tablet, horizontal code scrolling, `overflow-wrap:anywhere`, and prompt placement compatible with the visual viewport. Add skip link, semantic landmarks, labelled dialogs, focus restoration, high-contrast state labels, and polite/assertive live regions as appropriate.

- [ ] **Step 6: Verify tests, typecheck, and build**

Run: `npm test && npm run build`

Expected: all tests pass and Vite produces a production bundle.

- [ ] **Step 7: Commit**

```bash
git add src/app src/components/chat/ChatWorkspace.tsx src/hooks src/styles.css
git commit -m "feat: optimize responsive accessible workspace"
```

## Task 11: Add Complete Playwright Journeys

**Files:**
- Create: `e2e/helpers.ts`
- Create: `e2e/orbit-journey.spec.ts`
- Create: `e2e/mobile-workspace.spec.ts`
- Modify: `src/lib/ai/provider.ts`
- Modify: `vite.config.ts`

- [ ] **Step 1: Add deterministic E2E provider injection**

When and only when `VITE_E2E_MOCK_AI === "true"`, construct `MockAIProvider` with delayed chunks `['Here is ', 'your Orbit ', 'response.']`. Production and normal development construct `PuterAIProvider`. Do not use fallback-on-error behavior.

- [ ] **Step 2: Write the main persisted lifecycle journey**

```ts
test("Ava reacts through the complete persisted chat journey", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /select ava/i }).click();
  await page.getByRole("button", { name: /enter workspace/i }).click();
  await page.getByRole("textbox", { name: /message orbit/i }).fill("Introduce yourself");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("status")).toContainText(/analyzing/i);
  await expect(page.getByRole("status")).toContainText(/responding/i);
  await expect(page.getByRole("status")).toContainText(/complete/i);
  await page.reload();
  await expect(page.getByText("Introduce yourself")).toBeVisible();
  await expect(page.getByText(/Assistant: Ava/i)).toBeVisible();
});
```

- [ ] **Step 3: Add mobile, abort, reduced-motion, and 3D-disabled journeys**

At the Pixel 7 project size, assert drawer history, 44 px controls, composer visibility after viewport resizing, stop generation, retained partial output, Disable 3D persistence across reload, and complete chat usability without a canvas. Emulate reduced motion and assert camera transition duration is effectively zero through a stable `data-motion` marker.

- [ ] **Step 4: Install browser and run E2E tests**

Run:

```bash
npx playwright install chromium
VITE_E2E_MOCK_AI=true npm run test:e2e
```

Expected: desktop and mobile projects pass.

- [ ] **Step 5: Commit**

```bash
git add e2e playwright.config.ts src/lib/ai/provider.ts vite.config.ts
git commit -m "test: cover Orbit user journeys"
```

## Task 12: Document Models, Security, and Operation

**Files:**
- Create: `README.md`
- Create: `public/models/README.md`
- Create: `public/models/.gitkeep`
- Create: `public/textures/.gitkeep`

- [ ] **Step 1: Write complete setup and operation documentation**

Document Node requirements, `npm install`, `npm run dev`, `npm test`, `npm run test:e2e`, and `npm run build`. Explain that Puter is loaded from its browser SDK and can require network access or user authorization.

- [ ] **Step 2: Document replacing procedural models**

Specify `/public/models/alex.glb` and `/public/models/ava.glb`, shared clip names `Idle`, `Thinking`, `Streaming`, and `Done`, crossfade behavior, LoopOnce/clamping for Done, scale/origin expectations, and fallback behavior. Include `npx gltf-transform optimize input.glb output.glb --compress draco` as an example and explain KTX2 texture preparation.

- [ ] **Step 3: Document lifecycle and frontend security**

Explain that submit starts thinking, the first real token starts streaming, provider resolution starts done, and only the 1.5-second done-to-idle transition is timed. State explicitly that Vite variables are public, no private provider keys belong in the frontend, Puter inherits external privacy/quota/security constraints, and privileged workflows require a trusted backend.

- [ ] **Step 4: Commit**

```bash
git add README.md public
git commit -m "docs: add Orbit setup and model guide"
```

## Task 13: Final Quality Gate and Review

**Files:**
- Modify only files identified by failing checks or review findings.

- [ ] **Step 1: Run the complete automated quality gate**

Run:

```bash
npm run lint
npm test
npm run build
VITE_E2E_MOCK_AI=true npm run test:e2e
```

Expected: every command exits with status 0.

- [ ] **Step 2: Inspect production bundle and lazy chunks**

Run: `npm run build`

Expected: the full scene is emitted as a separate lazy chunk; no source includes private API keys; no unexpected large character binaries are bundled.

- [ ] **Step 3: Perform focused manual checks**

Verify onboarding and workspace at 375x667, 768x1024, 1024x768, and 1440x900. Test keyboard-only onboarding/chat/dialogs, screen-reader status text, viewport resize with the prompt focused, 3D disable/re-enable, reduced motion, low quality, Puter unavailable error, IndexedDB failure warning, and WebGL fallback.

- [ ] **Step 4: Request code and UI review**

Request an architecture/maintainability review and a responsive visual/accessibility review. Fix only concrete issues that violate the approved design or quality gate; avoid unrelated expansion.

- [ ] **Step 5: Re-run verification after fixes**

Run: `npm run check && VITE_E2E_MOCK_AI=true npm run test:e2e`

Expected: all checks pass after review fixes.

- [ ] **Step 6: Commit final fixes if needed**

```bash
git add src/ e2e/ README.md public/ package.json package-lock.json vite.config.ts playwright.config.ts
git commit -m "fix: address Orbit quality review"
```
