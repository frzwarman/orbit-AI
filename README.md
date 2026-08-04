# Orbit

Orbit is a browser-based AI coworker with selectable Alex and Ava assistants, persistent conversations, accessible streaming chat, and an adaptive 3D office. It is a frontend-only React application: production chat is provided by the Puter browser SDK, while deterministic mock streaming is reserved for automated end-to-end tests.

## Requirements

- Node.js `^20.19.0` or `>=22.12.0`
- npm
- A modern browser with IndexedDB; WebGL is optional
- Network access for the Puter SDK and AI requests

## Setup

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Puter is loaded from its v2 browser SDK in `index.html`. The first AI request can require Puter authorization, and availability depends on the user's network, Puter account, service quotas, and supported models.

## Commands

```bash
npm run dev          # start the Vite development server
npm run lint         # run ESLint with zero warnings allowed
npm test             # run Vitest and Testing Library tests once
npm run test:watch   # run Vitest in watch mode
npm run build        # type-check and create the production bundle
npm run check        # lint, unit/component tests, and production build
npx playwright install chromium  # one-time browser installation
npm run test:e2e     # run Playwright journeys with the configured mock server
```

`playwright.config.ts` starts Vite with `VITE_E2E_MOCK_AI=true`. That build flag selects a deterministic mock stream so browser tests never depend on external AI availability. Do not enable it in a production deployment. Normal development and production builds use Puter only and do not silently fall back to mock responses.

## Product behavior

### Assistant lifecycle

The UI state follows provider activity rather than simulated progress:

1. Submitting a valid prompt enters **thinking**.
2. The first non-empty provider token enters **streaming**.
3. Successful provider completion enters **done**.
4. A single 1.5-second completion timer returns the assistant to **idle**.

Stopping or failing a request preserves any partial response and marks it interrupted or failed. Conversation content is durably written to IndexedDB as it streams. Alex/Ava selection, mode, 3D, motion, and rendering preferences are persisted locally as well.

### Accessibility and fallback

Chat, history, settings, keyboard shortcuts, and all core actions work without WebGL. Orbit automatically reduces scene complexity on smaller or lower-capability devices, pauses rendering in hidden tabs, respects the OS reduced-motion preference, and lets the user disable both motion and 3D. Dialogs trap focus, restore it when closed, support Escape, and use labelled controls and status announcements.

### Local data

Dexie stores conversations, messages, and settings in the browser's `orbit` IndexedDB database. Data does not sync between browsers or devices. Clearing site data removes it. Storage failures are surfaced as non-blocking warnings so chat remains usable for the current session.

## RobotExpressive avatar

Orbit ships the Three.js `RobotExpressive.glb` avatar locally and uses it by default. Its behavior is automatic: a deterministic local intent engine reacts to user messages and streamed assistant responses without making another AI request. Greetings trigger **Wave**, celebration triggers **Dance**, surprise triggers **Jump** with a surprised expression, agreement and success use **Yes** or **ThumbsUp**, and anger or sadness select matching actions and expressions. Provider and storage failures trigger persistent **Death** with a sad expression until the next request; stopping a response uses **No** instead.

The chat lifecycle supplies stable background poses—**Sitting** while thinking and **Standing** otherwise—while semantic reactions temporarily take precedence. Reduced-motion mode keeps expressions and stable poses but suppresses energetic automatic actions. There are no manual avatar controls. If the model cannot load or render, the local scene boundary restores the procedural assistant instead of breaking chat.

The model is CC0 and is attributed in [`public/models/README.md`](public/models/README.md), which also documents its clip and morph-target contract.

## Frontend security and privacy

- Every `VITE_*` value is compiled into public browser code. Never place private API keys, service credentials, or secrets in Vite variables, source files, model metadata, or browser storage.
- Puter is an external runtime dependency. AI prompts and responses are subject to Puter's privacy, authorization, availability, security, model, and quota policies.
- Orbit renders Markdown without raw HTML support, but generated content should still be treated as untrusted. Copied or suggested code must be reviewed before use.
- IndexedDB is local application storage, not secure secret storage. Anyone with access to the browser profile can potentially access it.
- Operations requiring private credentials, privileged data, server-side authorization, auditing, or enforceable access control must run through a trusted backend. A frontend-only deployment cannot provide those guarantees.

## Production deployment

```bash
npm run check
npm run build
```

Deploy the generated `dist/` directory as a static site. The host must allow the external Puter SDK requested by `index.html`; restrictive Content Security Policy rules must explicitly permit that script and its required network connections. Serve over HTTPS for production browser APIs and authorization flows.

## Project structure

- `src/app` — hydration, providers, routing, and responsive workspace composition
- `src/components` — chat, settings, and 3D assistant presentation
- `src/features` — onboarding, conversation controls, modes, and chat orchestration
- `src/lib/ai` — Puter and deterministic test provider contracts
- `src/lib/storage` — Dexie database and repositories
- `src/stores` — focused Zustand state stores
- `e2e` — desktop and Pixel 7 Playwright journeys
- `public/models` — vendored RobotExpressive GLB, attribution, and animation contract
