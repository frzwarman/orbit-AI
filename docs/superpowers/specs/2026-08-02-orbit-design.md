# Orbit Product and Technical Design

**Date:** 2026-08-02  
**Status:** Awaiting written-spec review

## Product Summary

Orbit is a personalized AI coworker with selectable human assistants that visually react while thinking, responding, and completing user tasks. It combines an accessible, responsive HTML chat application with a decorative and reactive Three.js workspace. The complete product remains usable when WebGL is unavailable or 3D is disabled.

The first release supports two assistants:

- **Alex:** calm, professional, and concise.
- **Ava:** warm, expressive, and collaborative.

It supports General Assistant, Coding Assistant, and About Fariz modes. Puter is the only production LLM provider. A deterministic mock provider is available for automated tests and isolated development, but production does not silently fall back from Puter to mock responses.

## Delivery Strategy

Implementation will proceed through integrated vertical milestones rather than isolated subsystem construction:

1. Foundation, application shell, strict TypeScript, and persistence.
2. Onboarding and assistant selection.
3. Complete chat lifecycle with Puter streaming.
4. Reactive 3D workspace and GSAP transitions.
5. Responsive behavior, accessibility, and performance adaptation.
6. Unit, component, and end-to-end testing plus final polish.

Each milestone must leave the application functional and tested. This approach exposes integration problems early while retaining clear domain boundaries.

## Architecture

Orbit is a client-only React 19 application built with TypeScript and Vite. Its architecture has four layers:

1. **Application shell:** providers, onboarding/workspace routing, keyboard commands, global dialogs, and startup hydration.
2. **Feature domains:** assistant selection, conversations, chat orchestration, modes, and preferences.
3. **Infrastructure adapters:** Puter streaming, Dexie repositories, GSAP camera control, WebGL and device capability detection.
4. **Presentation:** accessible HTML interfaces and a lazy-loaded React Three Fiber scene.

Dependencies flow in one direction:

```text
UI -> feature actions -> stores and services
                         |-- AIProvider
                         |-- persistence repositories
                         `-- scene and camera commands
```

The 3D scene consumes application state but never owns chat, persistence, or navigation logic. Components do not call Dexie directly. Repositories provide typed persistence APIs so storage can be tested and changed independently.

The source tree follows the requested domains:

```text
src/
  app/
    App.tsx
    providers/
    router/
  components/
    assistant/
    chat/
    common/
    scene/
    settings/
  data/
    portfolio-context.ts
  features/
    assistant-selection/
    chat/
    conversations/
    preferences/
  hooks/
  lib/
    ai/
    animation/
    storage/
    three/
  stores/
  types/
  assets/
```

## State Ownership

State is split by responsibility:

- `assistantStore` owns the selected assistant configuration and visual lifecycle state.
- `chatStore` owns the current draft, stream controller, transient assistant response, provider error, and chat commands.
- `conversationStore` owns conversation summaries, the active conversation, search, and CRUD operations.
- `preferencesStore` owns the selected mode, 3D setting, reduced-motion preference, and adaptive quality setting.

Zustand stores hold runtime state. Dexie repositories hold durable records. Startup hydration reads persisted data through services and exposes a bounded loading state before routing to onboarding or the workspace.

The required assistant lifecycle type is:

```ts
export type AssistantState =
  | "idle"
  | "thinking"
  | "streaming"
  | "done";
```

The selected assistant configuration is persisted locally. Assistant configuration and state transitions use typed store actions rather than direct mutation.

## Chat Lifecycle

A submission follows one orchestration path:

1. Validate and persist the user message.
2. Set assistant state to `thinking`.
3. Move the camera toward the assistant and enable analysis effects.
4. Call `AIProvider.streamChat()` with an `AbortSignal`.
5. When the first non-empty response token arrives, create or update the in-progress assistant message, set state to `streaming`, and focus the chat display.
6. Append subsequent tokens in order. Rendering and durable writes are throttled without delaying visible text.
7. On successful completion, finalize and persist the assistant message, set state to `done`, show the completion effect, and return the camera to the workspace.
8. After approximately 1.5 seconds, transition from `done` to `idle`.

Only `done -> idle` is timer-driven. The `thinking -> streaming` transition requires a real response token, and `streaming -> done` requires successful stream completion.

Stopping generation aborts the provider request and retains a non-empty partial response marked as interrupted. Empty incomplete assistant messages are removed. Abort returns the assistant to `idle` without presenting a provider failure. Provider errors retain the user message, preserve useful partial output, show retry controls, announce the failure accessibly, and return the assistant to `idle`.

Regeneration replaces the selected assistant response while preserving the preceding conversation context. Editing and resending a user message truncates later branch messages because the first release has a linear conversation model rather than branch navigation.

## AI Provider and Prompts

The provider boundary uses the specified `AIProvider`, `ChatMessage`, and `StreamChatOptions` interfaces. The Puter adapter is the only production implementation and exposes no private API key. Provider unavailability is displayed as a recoverable error; Orbit does not fabricate a mock production answer.

The mock provider emits deterministic delayed chunks, supports cancellation, and is injected by unit, component, and end-to-end tests.

Prompt builders are mode-specific:

- **General Assistant:** helpful general-purpose behavior.
- **Coding Assistant:** frontend, React, accessibility, and strict TypeScript guidance with quick actions.
- **About Fariz:** injects the local portfolio context and requires the assistant to state when information is unavailable rather than inventing facts.

`src/data/portfolio-context.ts` contains clearly labeled local placeholder data for profile, experience, projects, skills, technologies, and contact information.

## Conversation Persistence

Dexie stores normalized conversations, messages, assistant selection, and preferences. Repositories expose typed operations for:

- Creating, renaming, searching, listing, and deleting conversations.
- Appending, replacing, updating, and truncating messages.
- Reading and writing assistant selection.
- Reading and writing mode, 3D, reduced-motion, and quality preferences.

Conversation titles initially derive from the first user message and remain editable. Search matches titles and message text using normalized case-insensitive terms suitable for the expected local dataset.

If IndexedDB initialization or a write fails, the application remains usable for the current session and displays a persistent warning that changes may not survive reload. Storage failures must not crash or disable chat.

## Onboarding Experience

First-run onboarding displays “Choose your AI coworker” and presents Alex and Ava as character cards rather than gender controls. Each card contains a looping 3D preview when available, a stylized static or procedural fallback, the character name, personality description, and Select button.

Cards support hover motion, visible keyboard focus, selection state, and screen-reader labels. Selection persists immediately and reveals a confirmation state: “Your assistant is ready” with an “Enter workspace” action.

Entering the workspace performs this sequence when reduced motion is not requested:

1. Fade the selection interface.
2. Move the camera from `selection` to `workspace`.
3. Reveal the selected assistant.
4. Animate the HTML chat panel into view.

Reduced motion substitutes immediate camera placement and short opacity changes.

## Responsive Workspace

Responsive behavior is a primary layout, not a degraded desktop view.

### Mobile: below 768px

- Full-width standard chat layout.
- Compact 3D assistant portrait or accessible static status card.
- Conversation history in an accessible drawer.
- Prompt composer anchored above safe-area insets and the on-screen keyboard.
- Touch targets of at least 44 by 44 CSS pixels.
- Rename, delete, search, mode switching, settings, stop, regenerate, and edit/resend remain available.
- The full room is not rendered; compact 3D uses reduced quality and can be disabled.

### Tablet: 768px through 1199px

- Collapsible sidebar.
- Simplified contained workspace with reduced particles and shadows.
- Chat remains the dominant interaction area.

### Desktop: 1200px and above

- Persistent or collapsible conversation sidebar.
- Contained futuristic office with the assistant as the visual focus.
- Large HTML chat display coordinated with cinematic camera framing.

All breakpoints support portrait and landscape orientation, dynamic viewport units, safe-area insets, browser zoom, long unbroken content, horizontally scrollable code blocks, and virtual-keyboard resize behavior.

## Chat Interface

The accessible HTML interface supports:

- New, searchable, renameable, and deletable conversations.
- Streaming responses, stop, retry, and regenerate.
- Editing and resending user messages.
- Markdown and highlighted code with copy buttons.
- Loading, empty, error, and interrupted states.
- Auto-scroll while the user remains near the bottom.
- Preservation of user scroll position when reading older content.
- `Cmd/Ctrl+K` for a new conversation.
- `Cmd/Ctrl+/` for the command menu.
- `Escape` to close the active panel.
- `Enter` to send and `Shift+Enter` for a newline.

React Markdown renders assistant content with a restricted component map. Code highlighting uses a lightweight client-compatible highlighter and never executes generated code.

## Three-Dimensional System

The full React Three Fiber scene is lazy-loaded under Suspense. It depicts a restrained futuristic office containing a desk, holographic display, city or window backdrop, floating task cards, ambient particles, soft lighting, subtle reflections, and optional low-cost accessories.

`HumanAssistant` preserves this public API:

```tsx
<HumanAssistant character="alex" state="thinking" />
```

It loads `/models/alex.glb` or `/models/ava.glb` with `useGLTF` and binds animations with `useAnimations`. Both model contracts use `Idle`, `Thinking`, `Streaming`, and `Done` clips.

When a model or clip is unavailable, a procedural humanoid fallback visually differentiates Alex and Ava and reacts to the same state prop. Missing assets do not fail the scene. The fallback also enables a complete source delivery without shipping third-party character binaries.

Animation transitions:

- Do not restart the currently active clip.
- Fade out the previous action and fade in the next action.
- Loop `Idle`, `Thinking`, and `Streaming`.
- Play `Done` once with `THREE.LoopOnce` and `clampWhenFinished`.
- Return visual playback to idle after `Done` completes, while the centralized assistant state remains authoritative.

State effects remain subtle: breathing and posture motion in idle, analysis particles and “Analyzing…” during thinking, pulses toward the display during streaming, and one completion pulse during done.

## Camera and Motion

One GSAP camera controller owns named targets:

- `selection`
- `workspace`
- `chat`
- `settings`
- `assistantFocus`

It exposes `moveToSelection()`, `moveToWorkspace()`, `focusAssistant()`, `focusChat()`, and `openSettingsView()`. Calls supersede conflicting active camera tweens to prevent race conditions.

Chat orchestration issues camera commands but does not manipulate Three.js objects directly. Reduced motion immediately positions the camera or uses a brief crossfade. The normal completion sequence returns the camera to `workspace` before the visual state returns to idle.

## Accessibility

All critical information and controls exist in semantic HTML. WebGL is decorative and marked appropriately so it does not create duplicate screen-reader content.

The application includes:

- Complete keyboard navigation and visible focus indicators.
- Correctly labelled controls and dialog/drawer focus management.
- `aria-live` announcements for thinking, streaming start, completion, abort, and error.
- A user-controlled reduced-motion preference that honors the operating-system default.
- A persistent Disable 3D control.
- High-contrast text and status information that does not rely only on color.
- Accessible static replacements for all 3D status communication.

## Performance and Capability Adaptation

Orbit detects coarse device capability without collecting identifying data. Quality tiers control DPR, antialiasing, shadows, reflection cost, and particle count. DPR is capped even on high-density screens.

The implementation will:

- Lazy-load the full scene and character files.
- Use Suspense and visible loading fallbacks.
- Support Draco-compressed models and document KTX2 texture replacement.
- Avoid object allocation in frame loops.
- Memoize static geometry and materials where ownership permits.
- Pause expensive animation when the document is hidden.
- Dispose scene resources owned outside declarative R3F lifecycle.
- Avoid unnecessary store subscriptions and React rerenders.
- Provide low-performance and Disable 3D modes.

On mobile the full office is replaced with a compact portrait. With 3D disabled, the canvas is unmounted rather than hidden.

## Error Handling

Errors are categorized and recover independently:

- **Provider:** retain context and partial output, show retry, announce failure.
- **Storage:** continue in memory and warn that persistence is unavailable.
- **WebGL/model:** replace with static or procedural fallback; chat remains unaffected.
- **Abort:** preserve useful partial content, clear generation controls, and return to idle without an error alert.

React error boundaries isolate the scene from the HTML application. No scene failure can remove the prompt composer or conversation controls.

## Testing Strategy

Vitest and React Testing Library cover:

- Assistant lifecycle transitions driven by mock stream events.
- The sole timed `done -> idle` transition.
- Assistant selection persistence.
- Conversation creation, rename, search, and deletion.
- Chat submission, token updates, abort, retry, regenerate, and edit/resend.
- Mode switching and prompt construction.
- Reduced-motion and Disable 3D behavior.
- Static fallback behavior when WebGL or model loading is unavailable.
- Keyboard commands and critical accessibility semantics.

Playwright runs deterministic desktop and mobile journeys with the mock provider injected at build or runtime test configuration. The primary journey chooses Ava, enters the workspace, submits a prompt, observes thinking, streaming, done, and idle, reloads, and confirms persisted selection and conversation data.

Timing assertions observe explicit states rather than relying on arbitrary sleeps. Unit tests use fake timers only for the specified `done -> idle` delay.

## Security Boundaries

Orbit does not place private OpenAI, Anthropic, Gemini, OpenRouter, or other secret keys in Vite variables. Puter is a browser-facing integration and inherits Puter's authentication, availability, privacy, quota, and policy constraints. The README will state that frontend wrappers cannot protect embedded secrets and that sensitive or privileged workloads require a trusted backend.

Generated Markdown is rendered as untrusted content without raw HTML execution. Portfolio context is local application content and must contain only information intended for users.

## Documentation Deliverables

The README will explain:

- Installation, development, testing, and production builds.
- Puter availability and frontend security limitations.
- The assistant lifecycle and how it maps to real stream events.
- How to replace procedural models with `alex.glb` and `ava.glb`.
- Required animation clip names and how to add clips.
- Draco and KTX2 optimization guidance.
- Mock provider use in tests.
- Responsive, reduced-motion, low-performance, and Disable 3D modes.

## Explicit Non-Goals

The first release does not include authentication, multiplayer, a traditional backend, physics, collision detection, walking controls, an explorable world, conversation branching UI, cloud synchronization, or private API-key integrations.

## Acceptance Criteria

The implementation is complete when:

1. A first-time user can select Alex or Ava and enter the responsive workspace.
2. Puter streams real responses through the provider adapter without a private frontend key.
3. Assistant state follows `idle -> thinking -> streaming -> done -> idle` from real chat events.
4. All required chat, conversation, mode, persistence, keyboard, and error-recovery actions work on desktop and mobile.
5. The assistant and scene react to lifecycle state, with procedural fallbacks for absent GLBs.
6. Disabling 3D or losing WebGL leaves a complete accessible chat application.
7. Preferences, selection, conversations, and messages survive reload through repositories backed by Dexie.
8. Adaptive quality, visibility pausing, lazy loading, and reduced motion are implemented.
9. Strict TypeScript, linting, unit/component tests, and the primary Playwright journeys pass.
10. Documentation covers setup, models, animations, lifecycle, performance, and frontend LLM security.
