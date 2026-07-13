# `/chat` OpenUI OSS / OpenUI Cloud mode switcher

- Status: implemented behind a disabled-by-default feature flag; public rollout safeguards pending
- Scope: a dedicated, full-height `/chat` page in the docs application
- Primary route: `docs/app/chat/page.tsx`
- Previous implementation migrated from: `docs/components/overview-components/chat-modal.tsx`
- Existing OSS generation API: `docs/app/api/chat/route.ts`

The product choices supplied for labels, availability, persistence, analytics,
session identity, switching, template configuration, and Cloud errors are incorporated
as the v1 baseline. The public rollout remains gated on the safeguards recorded in the
open questions and launch checklist.

## 1. Requirements

### 1.1 Product requirements

1. Add a public top-level `/chat` route that lets a visitor choose between two clearly
   named modes: **OpenUI OSS** and **OpenUI Cloud**.
2. Both experiences must retain the same `AgentInterface` chat shell. The selected
   mode must be obvious from the controlled mode switch before the visitor sends a
   prompt. Keep the route header compact and omit per-mode explanatory copy. The two
   integrations are:
   - OpenUI OSS: an app-owned, OpenRouter-backed route using the open-source component
     library and an in-memory demo conversation.
   - OpenUI Cloud: managed generation, persisted conversations/artifacts for the
     anonymous browser-session user, production Cloud components, and supported
     report/presentation artifacts.
3. OpenUI OSS must remain the default so the current demo behavior, cost profile,
   and local-development path do not change unexpectedly.
4. The selection is page-local in the first release. A new `/chat` navigation or full
   reload returns to OpenUI OSS. Do not write a cookie or `localStorage` value for the
   mode and do not add a query parameter in v1. The Cloud anonymous-identity session
   cookie is separate and must never encode the selected mode.
5. Each mode must have its own welcome copy and starter prompts. Cloud starters should
   demonstrate Cloud-only value, including at least one report and one presentation.
6. `/chat` must be a standalone full-height application page without the marketing or
   docs navbar. It must provide a visible link back to the OpenUI docs, inherit the
   root providers/global CSS, and use the route-local `WebsiteThemeProvider`.
7. Preserve the existing client-side OpenUI OSS demo-credit dialog contract and copy,
   and repair the OSS server/stream path so confirmed quota failures can actually
   trigger it. Do not reuse that dialog for Cloud. Any Cloud configuration, token,
   quota, billing, or generation failure uses one generic inline state:
   **"OpenUI Cloud is unavailable."**

### 1.2 Toggle and switching requirements

1. Put a single mode switcher in `/chat` page chrome above the active
   `AgentInterface`. It must remain visible in both modes and must not overlap the
   AgentInterface header, composer, sidebar, or artifact workspace.
2. Implement the switcher as a single-select `ToggleGroup`/segmented control, not as
   two unrelated buttons. Import the repository's components from the supported
   `@openuidev/react-ui/ToggleGroup` and `@openuidev/react-ui/ToggleItem` subpaths
   rather than importing the component-preview-only `SegmentedToggle`.
3. The control must always have exactly one selected value. Use the short visible
   labels **OpenUI OSS** and **OpenUI Cloud**, with
   `aria-label="OpenUI implementation"`.
   Configure Radix with `type="single"`, a controlled `value={mode}`, and ignore its
   empty `onValueChange` value when a visitor clicks the already-selected item.
4. Switching before a prompt is sent is immediate.
5. Switching after the active mode has started a conversation must show a confirmation:
   **"Switch modes? This starts a new chat. Your current conversation will not be
   carried over."** Confirming remounts the destination surface with a fresh active
   thread. Cancelling leaves the current surface untouched.
6. Never translate, copy, or submit a thread ID or transcript from one mode to the
   other. The two message protocols and storage models are incompatible.
7. Disable mode changes while a response is streaming. The control should explain
   that the visitor can stop the response first, then switch. This avoids an ambiguous
   partial transcript and guarantees the current request is not orphaned.
8. A switch must not silently delete a Cloud conversation already stored by Cloud.
   It only leaves that active surface. OpenUI OSS state remains ephemeral and may be
   discarded when its surface is unmounted, as stated in the confirmation copy.
9. Cloud SDK code, frontend-token minting, Cloud storage, and Cloud upstream calls must
   be lazy. Merely loading `/chat` in the default OpenUI OSS mode may call the
   same-origin availability route, but must do no other Cloud work.
10. Navigating away from `/chat`, reloading the route, or otherwise unmounting the page
    while a response is running must cancel the active AgentInterface request. Both
    generation routes must receive that abort; leaving the page must not leave a hidden
    request consuming demo quota.

### 1.3 Mode contract requirements

Both modes must use the same `<AgentInterface>` shell exported by
`@openuidev/react-ui`. The toggle compares two configurations of AgentInterface, not
two chat frameworks or two independently designed chat UIs. OpenUI OSS configures the
shell with the current docs `ChatLLM`, `openuiChatLibrary`, and implicit in-memory
storage; this is the **OpenUI OSS** mode. OpenUI Cloud configures the same shell with a
Responses-based `ChatLLM`,
`useOpenuiCloudStorage()`, Cloud `chatLibrary`, and the report/presentation renderer
registry.

| Concern                 | OpenUI OSS                                                    | OpenUI Cloud                                       |
| ----------------------- | ------------------------------------------------------------- | -------------------------------------------------- |
| Frontend shell          | `<AgentInterface>` from `@openuidev/react-ui`                 | The same `<AgentInterface>` component              |
| Client message format   | `openAIMessageFormat`                                         | `openAIConversationMessageFormat`                  |
| Stream adapter          | `openAIAdapter()`                                             | `openAIResponsesAdapter()`                         |
| Request body            | Full `messages` history                                       | `threadId` plus only the latest `input`            |
| Generation route        | Existing `POST /api/chat`                                     | New `POST /api/openui-cloud/chat`                  |
| Storage prop            | Omitted; AgentInterface creates its default in-memory storage | `storage={useOpenuiCloudStorage(...)}`             |
| Conversation history    | Ephemeral; lost when the OSS surface unmounts                 | Persisted for the anonymous browser-session user   |
| GenUI component library | `openuiChatLibrary`                                           | Cloud `chatLibrary`                                |
| Artifact integration    | None configured                                               | Cloud report/presentation renderers and categories |
| Server credential       | `OPENROUTER_API_KEY`                                          | `THESYS_API_KEY`                                   |

The existing `/api/chat` contract must stay intact. Do not multiplex both protocols
through it and do not infer a protocol from request shape.

### 1.4 Cloud backend and security requirements

1. Add a dedicated `POST /api/openui-cloud/chat` route based on the maintained Cloud
   example/template. It must:
   - validate `threadId` and a non-empty Responses API `input`;
   - require the valid signed session identity and authorize that the supplied
     `threadId` belongs to that session user before using the org master key;
   - call the Cloud embed Responses endpoint with the server-only `THESYS_API_KEY`;
   - use the same default model, model choices, and model switcher as
     `packages/openui-cli/src/templates/openui-cloud`, while validating the copied
     model IDs as a server-side allowlist;
   - match the template's server tools:
     `artifactTool({ artifacts: ["slides", "report"] })`, `web_search`, and
     `image_search`, with `createResponsesInstructions()`;
   - send `conversation: threadId`, `stream: true`, and `store: true` so every Cloud
     response persists to the session user's conversation;
   - forward `req.signal` so stopping generation aborts the upstream request;
   - return Responses-compatible SSE with `no-cache, no-transform`; and
   - expose only sanitized errors to the browser.
2. Add `POST /api/openui-cloud/frontend-token` for short-lived Cloud storage tokens.
   The org master key must never be returned, logged, placed in a `NEXT_PUBLIC_*`
   variable, or accepted from the browser.
3. Do not use the example's shared `DEMO_USER_ID=demo-user` on the public site. Create
   one stable, unguessable anonymous Cloud user per browser cookie session. On first
   use, generate at least 256 bits of CSPRNG entropy and issue a signed opaque session
   identifier. In production, use
   `__Host-openui-cloud-session=<signed-value>; Path=/; HttpOnly; Secure; SameSite=Lax`
   with no `Domain`, `Expires`, or `Max-Age`; use a non-`__Host-` development name and
   omit `Secure` only for HTTP localhost. Derive a namespaced Cloud `user_id` from the
   session using a domain-separated HMAC so the raw cookie is never sent upstream. A
   new browser cookie session receives a new anonymous Cloud user.
4. The token route must derive the Cloud user ID from trusted server state. It must not
   accept a raw `user_id` supplied by the client.
5. Put the Cloud demo behind `OPENUI_CLOUD_DEMO_ENABLED`. Add a same-origin availability
   check that returns only `{ enabled: boolean }`; it must not reveal whether a specific
   secret is missing. When unavailable, keep the Cloud option visible but disabled with
   the explanation **"OpenUI Cloud is unavailable."** Return the
   status with `Cache-Control: no-store` so a recently disabled deployment is not held
   open by a stale response.
6. The status, frontend-token, and chat routes must each fail closed unless the flag
   is exactly the string `"true"` and their required runtime configuration is present.
   A caller must not be able to bypass a disabled UI by calling a route directly.
   Missing configuration must return sanitized JSON `503` responses rather than an
   uncaught environment-helper exception. Read optional configuration at request time
   so local and preview builds without a Cloud key can still build successfully.
7. The frontend-token route is the only route allowed to create or replace anonymous
   session identity. It validates an existing signed session cookie; if none is valid,
   it may atomically mint a new cookie and frontend token for a new Cloud user. Return
   `Cache-Control: no-store` and `Vary: Cookie`, and sanitize all upstream failures.
   Use a dedicated versioned cookie-signing secret with an explicit current/previous
   key rotation policy; never reuse `THESYS_API_KEY`. The status route never mints
   identity, and the chat route requires an already-valid cookie and must never mint
   identity implicitly from an untrusted `threadId`.
8. Apply public-demo rate limiting and quota controls to both Cloud routes before
   production rollout. Use a shared/durable limiter across serverless instances,
   accept client IP only from trusted platform headers, and combine a server-side
   digest of the session identity with IP limits. Pair those app limits with Cloud-org
   budgets/token scopes because browser storage calls go directly to Cloud after a
   frontend token is issued.
9. Require an allowed same-origin `Origin`, JSON content type, schema-valid input, and
   strict request-size limits on public POST routes before doing paid upstream work.
   These checks supplement rather than replace rate limiting.
10. Remove or redact the existing module-global OSS `conversationLog`; it currently
    records full prompts from different visitors in one process. Preserving the OSS
    API contract does not require preserving unsafe prompt logging.
11. Persist every Cloud conversation under that session's anonymous Cloud user.
    Reloading or returning to `/chat` within the same browser session may recover that
    user's Cloud history, even though the selected implementation mode itself never
    persists. When the session cookie is gone, a later session cannot rediscover the
    previous anonymous user's conversations. Define the server-side retention/deletion
    period for those now-orphaned conversations before launch and document it anywhere
    visitors are told that Cloud history is persisted. Never reconnect sessions using
    a PostHog ID, IP address, browser fingerprint, or another durable identifier.

### 1.5 Error and loading requirements

1. Loading Cloud for the first time must show a non-layout-shifting loading state in the
   `/chat` AgentInterface region. The route toolbar, mode switcher, and back-to-docs
   link remain usable.
2. A missing/expired frontend token should be refreshed by the Cloud storage adapter.
   If refresh ultimately fails, show the same generic inline message:
   **"OpenUI Cloud is unavailable."**
3. Treat every Cloud configuration, token, storage, billing/quota, pre-stream, and
   in-stream generation failure as unavailable in the v1 UI. Do not add Cloud billing
   classification, Cloud quota copy, or a Cloud credits dialog. The server may retain
   privacy-safe internal error codes for operations, but it must send only a sanitized
   failure to the browser.
4. Surface the generic unavailable state from normal `AgentInterface`/thread errors,
   including an SSE error received after HTTP `200`. The mode toggle remains usable so
   the visitor can select **OpenUI OSS**. Do not add a Cloud-specific retry, billing, or
   credits workflow in v1.
5. Keep the existing `DemoCreditsDialog` behavior only for confirmed OpenUI OSS demo
   credit exhaustion. Do not make it mode-aware.
6. An error in one mode must not disable the other mode.

### 1.6 Accessibility and responsive requirements

1. `/chat` must use normal document landmarks: one `<main>`, an accessible page title,
   a labelled route toolbar/navigation region, and the AgentInterface application
   region. It must not use dialog semantics or trap focus at the page level.
2. The switcher must support Tab, arrow-key navigation, Enter/Space selection, visible
   focus, `aria-pressed`/Radix selection state, and disabled-state explanation.
3. Announce a completed mode change in a polite live region, for example
   **"OpenUI Cloud mode selected. New chat started."**
4. Use a real focus-trapping/restoring dialog implementation, such as a direct
   `@radix-ui/react-dialog` dependency or a corrected shared wrapper, for the switch
   confirmation and OpenUI OSS credits dialog only. The hand-built
   `DemoCreditsDialog` is not sufficient unchanged.
5. Escape closes only the active switch-confirmation or OSS credits dialog. With no dialog open,
   Escape must not navigate away from `/chat` or reset the active conversation.
6. On screens at or below 768 px, the page toolbar, back link, and switcher must fit
   without horizontal document scrolling. Both mode options must retain at least a
   44 px touch target.
7. A disabled Cloud option must expose its reason through persistent status text and
   `aria-describedby`; do not rely on a hover-only tooltip because disabled Radix items
   are skipped by keyboard focus.
8. Validate light and dark themes and 200% browser zoom. The switcher must not rely on
   color alone to communicate selection.
9. Both current demo triggers must become semantic Next.js links to `/chat`. Links must
   support normal browser navigation, open-in-new-tab, and browser Back behavior; remove
   modal state, `role="button"`, `tabIndex`, and manual keyboard handlers.

### 1.7 Performance and maintainability requirements

1. Keep the OpenUI OSS and OpenUI Cloud integrations in separate child components. This
   keeps `useOpenuiCloudStorage()` unconditional within the Cloud component and makes
   the protocol boundary obvious in code review.
2. Dynamically import the Cloud surface so Cloud SDK and artifact code are excluded
   from the default OpenUI OSS `/chat` path until Cloud is selected. Put
   `dynamic(() => import(...), { ssr: false })` in `chat-page-client.tsx`; client-only
   dynamic configuration must not live in the server `page.tsx`.
3. Import `@openuidev/thesys/styles.css` once at app scope in `docs/app/global.css`, in
   a verified cascade order. Never re-import React UI or Cloud CSS from a `/chat`
   component.
4. Pin compatible `@openuidev/thesys` and `@openuidev/thesys-server` versions in the
   docs package and commit the lockfile change. Do not depend on an unreviewed `latest`
   range in the deployed docs app.
5. Make the route shell a column flex container with `height: 100dvh` and
   `overflow: hidden`. The route header is `flex: none`; the AgentInterface viewport
   is `flex: 1`, `min-height: 0`, `min-width: 0`, and `overflow: hidden`.
6. Scope AgentInterface to the remaining route viewport with `height: 100%` and
   `width: 100%`. Do not copy a raw `100dvh/100dvw` template wrapper beneath the page
   header, which would overflow the route.
7. The existing ToggleGroup CSS is card-oriented. Add `/chat`-scoped overrides for a
   segmented appearance, no wrapping, joined radii/gaps, selected/disabled/focus
   states, and the required touch targets.
8. Keep `docs/app/chat/page.tsx` as a server component for route metadata. Put mode
   state, theme hooks, lazy Cloud loading, and browser lifecycle behavior in a client
   child. No `force-dynamic` export is needed unless the page itself starts reading
   request-time cookies or headers.

## 2. User journeys

### Journey A: Open and use the default OpenUI OSS demo

1. The visitor follows a **Try it out live** link or navigates directly to `/chat`.
2. The full-height chat page loads with **OpenUI OSS** selected.
3. The familiar OpenUI OSS welcome screen and four existing starters are shown.
4. The visitor sends a prompt. The client posts the full formatted history to the
   existing `/api/chat` route and renders Chat Completions SSE.
5. The visitor follows **Back to docs** or uses normal browser Back navigation to leave
   `/chat`.

### Journey B: Switch to OpenUI Cloud before starting

1. With no conversation started, the visitor selects **OpenUI Cloud**.
2. The page immediately announces the new mode, lazily loads the Cloud code, and
   mounts the Cloud-configured `AgentInterface`.
3. On the first Cloud use in the browser session, the server creates a signed anonymous
   session identity and mints a short-lived frontend token for the derived Cloud user;
   no org key is exposed to the browser. Later token refreshes in the same session use
   that same anonymous Cloud user.
4. The visitor sees the Cloud-specific welcome and starters such as **Quarterly deck**
   and **Market report**.
5. Sending a prompt creates a Cloud conversation, posts `threadId` plus only the latest
   input to `/api/openui-cloud/chat`, and streams the response and any supported
   artifact into AgentInterface. The response uses `store: true`; the conversation and
   artifacts remain persisted under that session's anonymous Cloud user.

### Journey C: Switch after chatting

1. The visitor selects the other mode after at least one request has started.
2. A confirmation explains that the current transcript will not be carried over.
3. Choosing **Stay here** closes the confirmation with no state change.
4. Choosing **Switch modes** unmounts the source surface, mounts a fresh destination
   surface, updates the welcome/starters, and announces that a new chat started.
5. No source message, thread ID, partial tool call, or artifact is submitted to the
   destination backend.
6. If the destination is OpenUI Cloud, create/select a new active Cloud conversation.
   Previously stored Cloud conversations remain persisted under the session user but
   are not automatically restored as the active chat.

### Journey D: Try to switch during generation

1. While a response is streaming, the mode control is disabled and exposes the reason.
2. The visitor uses the AgentInterface stop control.
3. Once local cancellation has been requested, the abort has been propagated, and the
   active store reports `isRunning=false`, the mode control becomes available. The
   parser may still be unwinding asynchronously, so surface/server cleanup must make
   unmount safe.
4. The normal post-conversation confirmation journey then applies.

### Journey E: OpenUI Cloud is unavailable

1. If Cloud is disabled for the environment, its option is visible but disabled; the
   default OpenUI OSS demo remains fully usable.
2. Any Cloud initialization, token, storage, quota/billing, generation, or stream error
   shows the same inline message: **"OpenUI Cloud is unavailable."**
3. No Cloud billing, credit, or retry dialog opens. The always-visible mode control
   still lets the visitor select **OpenUI OSS**.

### Journey F: Mobile and keyboard-only use

1. On mobile, `/chat` remains a full-height page. Its compact route header exposes the
   back link and two mode options without horizontal page scrolling.
2. A keyboard visitor can enter the switcher with Tab, change selection with arrow
   keys, confirm with Enter/Space, reach the composer, stop generation, navigate back
   to the docs, and operate nested dialogs without a focus escape.

### Journey G: Leave or reload during generation

1. The visitor navigates away with the route link, browser Back, or another in-app
   navigation, or reloads/closes the tab while generation is active.
2. For client-side navigation, `ChatLifecycleBridge` cleanup calls `cancelMessage()`
   before the active provider is discarded. For reload/tab close, the browser
   terminates the outstanding non-keepalive request.
3. The generation API propagates either disconnect/abort to its upstream runner so no
   hidden stream continues consuming demo quota. Do not depend on asynchronous
   `beforeunload` work.
4. A later fresh visit to `/chat` returns to the default OpenUI OSS mode in v1. The mode
   is not restored, even if the browser-session Cloud identity cookie still exists.

### Journey H: End one anonymous Cloud session and start another

1. Tabs and windows sharing the same browser cookie session use the same anonymous
   Cloud user and can access that user's persisted Cloud conversations if history UI
   is enabled.
2. When no valid session cookie is available, the next Cloud selection creates a new
   anonymous Cloud user; it does not reconnect using PostHog identity, IP address,
   browser fingerprinting, or another durable identifier.
3. The prior user's conversations remain stored only for the approved Cloud retention
   period, but the new session cannot list, recover, merge, or generate against them.
4. Browser session-cookie restoration is browser-defined. If product later requires a
   guaranteed new identity after every browser restart, replace the cookie-session
   design with an explicit server TTL or tab-scoped session design.

## 3. Resolved decisions and implementation assumptions

The product decisions supplied for this plan are now fixed: labels, visible-disabled
Cloud availability, no mode persistence, inherited PostHog only, one anonymous Cloud
user per browser cookie session, fresh-chat switching, template-aligned models/tools,
and one generic Cloud-unavailable state. The remaining rows make the implementation
concrete; section 4 lists decisions that still need an owner.

| Topic                | Decision / implementation assumption                                                   | Reason                                                                         |
| -------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Meaning of Cloud     | A real Cloud integration, not a visual mock or label-only endpoint swap                | The toggle should demonstrate actual managed capabilities                      |
| Page placement       | Standalone `docs/app/chat` route with `WebsiteThemeProvider`, no marketing/docs navbar | Gives AgentInterface the full viewport without inheriting unrelated shells     |
| Default              | OpenUI OSS on every fresh `/chat` load                                                 | Preserves current behavior and avoids unprompted Cloud cost/network calls      |
| Visible labels       | **OpenUI OSS** / **OpenUI Cloud**                                                      | Product-approved labels used consistently in the switcher and page copy        |
| Switch behavior      | Confirm after conversation start, then start a fresh destination chat                  | Protocol-safe and honest about state loss                                      |
| Mid-stream behavior  | Disable switching until response is stopped/completed                                  | Avoids partial cross-mode state and orphaned requests                          |
| Transcript migration | None                                                                                   | OSS Chat Completions and Cloud Responses conversations are not interchangeable |
| Cloud capabilities   | Match the maintained Cloud template's models, switcher, tools, storage, and artifacts  | Keeps the docs demo aligned with the generated Cloud starter                   |
| Cloud loading        | Lazy after explicit selection                                                          | Protects `/chat` initial load and Cloud quota                                  |
| Cloud identity       | One signed anonymous Cloud user per browser cookie session                             | Persists that session's conversations without sharing one public demo user     |
| Cloud persistence    | Store every Cloud conversation/artifact; a later session cannot recover the prior user | Separates backend retention from browser-session recoverability                |
| Cloud errors         | One inline **"OpenUI Cloud is unavailable."** state for every Cloud failure            | Avoids billing/error classification and Cloud-specific dialogs in v1           |
| Route strategy       | Preserve `/api/chat`; add namespaced Cloud routes                                      | No regression or ambiguous protocol dispatch                                   |
| Availability         | Deployment flag plus non-secret status response                                        | Cloud can be enabled independently in local/preview/production                 |
| Mode persistence     | None across route loads in v1                                                          | Deterministic default and no query/cookie/local-storage behavior               |
| Product analytics    | Use inherited PostHog automatic pageviews; add no chat-specific events in v1           | Existing `capture_pageview: "history_change"` already instruments `/chat`      |

## 4. Remaining open questions

### Must be answered before implementation

1. What Cloud-supported mechanism binds a conversation to the signed session user during
   generation? The chat route must reject session A's attempt to use session B's
   `threadId`; possession of an org-valid thread ID is not sufficient authorization.
2. Which Cloud org/key and per-session/per-IP quota are approved for the public docs
   demo? Who owns the emergency disable switch?
3. What is the exact Cloud retention/deletion period for conversations whose anonymous
   browser session has ended? The visitor can no longer recover them, but Cloud still
   stores them until this policy deletes them.
4. Should Cloud conversation history and the artifact browser/sidebar be visible in
   the full-page `/chat` experience? The dedicated route has room to expose it; decide
   whether the OSS in-memory sidebar should also remain visible for shell consistency.
   If shown, Cloud history must list only the current anonymous session user's threads.

### Can be answered during implementation

1. Is deployment-scoped enablement sufficient, or is a runtime kill switch/cohort
   system required? `OPENUI_CLOUD_DEMO_ENABLED` alone normally requires a process
   restart/redeploy and cannot implement per-visitor cohorts.
2. Should `/chat` be indexed and added to `docs/app/sitemap.ts`, or should route metadata
   set `robots: { index: false, follow: true }` and omit it from the sitemap?
3. Should **Back to docs** always target `/docs/openui-lang`, or should the page expose
   only the OpenUI home link and rely on browser Back for source-specific return?

## 5. Current-state constraints

- There is no `/chat` page today. The live experience is mounted from
  `docs/components/overview-components/chat-modal.tsx`, and both current entry points
  open that component with local modal state.
- The existing modal renders one `AgentInterface` using `openuiChatLibrary`,
  `openAIMessageFormat`, `openAIAdapter()`, and internal in-memory storage. The OSS
  configuration should be extracted without changing that pairing.
- A top-level `docs/app/chat` segment inherits `docs/app/layout.tsx` and therefore the
  root global CSS, fonts, root provider, and `PHProvider`. PostHog already uses
  `capture_pageview: "history_change"`, so direct and client-side `/chat` pageviews are
  covered without a manual event. The segment does not inherit the `(home)` or docs
  route-group layouts, so add a route layout that supplies `WebsiteThemeProvider`
  without adding either site navbar.
- The current `/api/chat` route uses `OPENROUTER_API_KEY`, OpenRouter, a generated OpenUI
  system prompt, local mock tools, and Chat Completions SSE.
- That route also keeps a module-global log of full conversations. It can mix prompt
  content from multiple visitors in one server process and must be removed or redacted
  as part of this work even though its public request/stream contract stays unchanged.
- Cloud keeps the same AgentInterface shell but supplies a different message format,
  stream adapter, server endpoint, component library, artifact registry, and persistent
  storage adapter. Every Cloud conversation is stored under the current anonymous
  browser-session user. Changing only the fetch URL—or mutating those props on an
  already mounted AgentInterface—would be incorrect.
- The docs package does not currently depend on `@openuidev/thesys` or
  `@openuidev/thesys-server`.
- The existing chat deliberately avoids a local React UI CSS import because duplicate
  imports break cascade-layer ordering. The `/chat` route must preserve that rule, and
  Cloud CSS needs the same app-wide treatment.
- The docs package has typecheck/lint/build scripts but no component-test harness for
  this experience today.

## 6. Proposed component and data design

### 6.1 Component ownership

`ChatPageClient` owns only shared route concerns:

- `mode: "oss" | "cloud"`;
- Cloud availability;
- whether the current mode has started a conversation;
- whether the current mode is streaming;
- the switch confirmation;
- the existing OpenUI OSS credits dialog;
- the generic inline Cloud-unavailable state;
- the surface revision used for an explicit fresh mount; and
- cancellation when the active surface or `/chat` page unmounts.

It conditionally renders one isolated AgentInterface surface:

- `OssAgentSurface` renders `AgentInterface` configured with today's OSS LLM, adapter,
  `openuiChatLibrary`, starters, and credit callback.
- `CloudAgentSurface` renders the same `AgentInterface` configured with
  `useOpenuiCloudStorage()`, the Cloud LLM, Cloud `chatLibrary`, renderers/categories,
  starters, template model switcher, and a generic availability-error callback.

Add a small lifecycle bridge inside each `AgentInterface` provider. It uses `useThread`
to report `isRunning`, `isLoadingMessages`, `messages`, `threadError`, and a current
`cancelMessage` callback; it also uses `useThreadList` to report `selectedThreadId`,
`isLoadingThreads`, and `threadListError`. Its cleanup calls `cancelMessage` before the
active provider is discarded by client-side route navigation or a confirmed mode
switch. A full document reload/tab close also terminates the
non-keepalive browser request; both generation routes must propagate the resulting
request abort. This also lets the shared switcher enforce the state rules without
guessing from `fetch()` lifecycle; resolving `fetch()` only means response headers
arrived, not that SSE consumption finished.

Latch `hasConversation` after the first submitted/non-empty message or a successfully
loaded selected thread. Do not clear it merely because `messages` is temporarily empty
while Cloud history is loading. Surface Cloud initialization/thread-list failures in a
mode-level overlay because the hidden sidebar does not expose `threadListError`. On
every confirmed switch into Cloud, explicitly create/select a fresh active Cloud
thread; do not let persisted history auto-select the prior active thread. This fresh
selection must not delete older threads stored for the session user.

Replace or cover AgentInterface's built-in `ThreadError` with the generic inline
**"OpenUI Cloud is unavailable."** state. Do not add a Cloud-specific retry action or
automatic generation replay.

The existing OSS route must also propagate `req.signal`/stream cancellation to the
OpenAI runner. `ChatProvider` does not abort merely because it unmounted, so client and
server cleanup are both required to ensure stop, navigation, or reload actually ends
paid upstream work.

### 6.2 Shared AgentInterface frontend architecture

The maintained CLI templates establish the frontend invariant for this work: both
setups render `AgentInterface` from `@openuidev/react-ui`.

- OpenUI OSS/self-hosted reference:
  `packages/openui-cli/src/templates/openui-self-hosted/src/app/page.tsx`
- Cloud shell reference:
  `packages/openui-cli/src/templates/openui-cloud/src/components/cloud-chat.tsx`
- Cloud LLM reference:
  `packages/openui-cli/src/templates/openui-cloud/src/lib/cloud-chat-llm.ts`

Use those files as configuration references, not as full-page components to copy
verbatim. The docs route keeps its own page header, remaining-viewport sizing, route
names, identity and quota controls, error handling, theme source, and app-wide CSS
order.

#### 6.2.1 Mounting model

`docs/app/chat/page.tsx` remains a server component so it can export route metadata and
canonical URL. It renders a client-owned page shell that mounts exactly one complete,
mode-specific AgentInterface tree at a time:

```tsx
<main className={styles.page}>
  <ChatPageHeader backHref="/docs/openui-lang">
    <ChatModeToolbar mode={mode} onModeChange={requestModeChange} />
  </ChatPageHeader>
  <section className={styles.agentViewport} aria-label={`${modeLabel} chat`}>
    {mode === "oss" ? (
      <OssAgentSurface key={`oss-${surfaceRevision}`} {...sharedSurfaceProps} />
    ) : (
      <LazyCloudAgentSurface key={`cloud-${surfaceRevision}`} {...sharedSurfaceProps} />
    )}
  </section>
  <SwitchModeDialog {...switchDialogProps} />
  <OssDemoCreditsDialog {...ossCreditsDialogProps} />
</main>
```

Both children render `AgentInterface`; they differ only in the integration supplied to
it. Do not keep both trees mounted and hide one with CSS: that would initialize Cloud
storage while OSS is selected, duplicate interactive UI, and retain ambiguous in-flight
state. Do not hot-swap `llm`, `storage`, `componentLibrary`, or artifact props on one
mounted AgentInterface either. `ChatProvider` constructs its storage/chat store and
artifact registry on mount, so a prop-only mode change can leave it using the previous
mode's LLM, storage, or renderers.

A confirmed mode change increments `surfaceRevision` and mounts a fresh destination
tree. A switch into Cloud additionally creates/selects a fresh active Cloud thread
without deleting the session user's persisted thread list. The parent never owns or
translates either surface's messages, thread IDs, tool calls, or artifacts. The
lifecycle bridge also cancels on surface cleanup, so route navigation, browser Back,
and intentional mode remounts use the same client cancellation path. Full document
teardown relies on the browser request disconnect plus server-side abort propagation
rather than an unload callback that may not finish.

#### 6.2.2 AgentInterface configuration by mode

| `AgentInterface` concern | OpenUI OSS                                               | OpenUI Cloud                                                                                                    |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Shell                    | `AgentInterface`                                         | The same `AgentInterface`                                                                                       |
| LLM                      | Current docs `ChatLLM` posting full history              | Stable Cloud `ChatLLM` modeled on `createCloudChatLLM()`                                                        |
| Message/stream pair      | `openAIMessageFormat` + `openAIAdapter()`                | `openAIConversationMessageFormat` + `openAIResponsesAdapter()`                                                  |
| Endpoint                 | Existing `/api/chat`                                     | Namespaced `/api/openui-cloud/chat`                                                                             |
| Storage                  | Omit `storage`; use AgentInterface's in-memory default   | Pass `storage={cloudStorage}`; persist all threads/artifacts for the anonymous session user                     |
| `componentLibrary`       | `openuiChatLibrary` from `@openuidev/react-ui/genui-lib` | `chatLibrary` from `@openuidev/thesys`                                                                          |
| Artifact props           | Omit `artifactRenderers` and `artifactCategories`        | Pass presentation/report renderers and categories                                                               |
| `agentName`              | `OpenUI OSS`                                             | `OpenUI Cloud`                                                                                                  |
| Theme                    | Docs `resolvedTheme`                                     | The same docs `resolvedTheme`; do not install a second body-theme controller                                    |
| Welcome/starters         | Current OSS welcome and four current starters            | Cloud-specific welcome and starters, including a report and presentation                                        |
| Scroll behavior          | Preserve the current chat behavior                       | Template defaults: `scrollVariant="always"`, `scrollOnLoad={false}` unless UX testing chooses a shared behavior |
| Header slots             | Default AgentInterface headers                           | Template model switcher in both `MobileHeader` and `ThreadHeader`                                               |
| Model choices            | Current OSS backend configuration                        | Template `MODEL_OPTIONS`, defaulting to `google/gemini-3.1-pro-free`                                            |
| Lifecycle                | Shared `ChatLifecycleBridge` inside the provider         | The same bridge, also reporting storage/thread-list readiness errors                                            |

The component-library difference is intentional and must remain local to each surface.
`componentLibrary` controls how generated OpenUI Lang nodes render inside assistant
messages; it does not replace the AgentInterface chat shell. Never render Cloud output
through `openuiChatLibrary`, and never render the OSS prompt's output through Cloud
`chatLibrary`.

`CloudAgentSurface` creates `cloudStorage` with:

```ts
useOpenuiCloudStorage({
  token: "/api/openui-cloud/frontend-token",
  apiBaseUrl: "https://api.thesys.dev",
  features: { artifact: true },
});
```

The OSS prompt and renderer must remain a matched pair. The current docs build
`generated/chat-system-prompt.txt` from `docs/lib/chat-library.ts`, which exports
`openuiChatLibrary` plus `openuiChatPromptOptions`. If the OSS library changes, regenerate
and deploy its prompt in the same change. Cloud prompt/tool instructions stay on the
Cloud server path through the template's `createResponsesInstructions()`,
`artifactTool({ artifacts: ["slides", "report"] })`, `web_search`, and
`image_search`; the browser must not generate or send the OSS prompt to Cloud.

Define Cloud artifact categories once at module scope, following the Cloud template:
Presentations first, then Reports. `ChatProvider` captures the artifact renderer
registry at mount and the first renderer wins duplicate tool names, so do not rebuild or
reorder this registry during render.

Copy the maintained Cloud template's `MODEL_OPTIONS`, `DEFAULT_MODEL`, and
`ModelSwitcher` behavior into the Cloud surface, including its desktop and mobile
header slots. The current default is `google/gemini-3.1-pro-free`. Keep the copied
definitions as the single client/server source of truth. The template currently accepts
any non-empty model string server-side; the public docs demo deliberately hardens that
behavior by rejecting IDs outside the copied options.

#### 6.2.3 Deliberate deviations from the standalone templates

1. The self-hosted CLI template uses the broader `openuiLibrary`, sends its generated
   `systemPrompt` from the client, and parses `openAIReadableStreamAdapter()`. The current
   docs route instead emits Chat Completions SSE and is paired with
   `openuiChatLibrary`, a server-generated prompt file, and `openAIAdapter()`. Preserve
   the docs pairing for this toggle; do not copy the template adapter or library in
   isolation.
2. Both standalone templates use `/api/chat` because they are separate applications.
   In the combined docs app, preserve `/api/chat` for OSS and use the namespaced Cloud
   chat/token routes.
3. Use the standalone templates' full-height intent, but not a raw `h-screen` wrapper
   beneath the `/chat` header. Each AgentInterface fills `agentViewport`, which owns the
   remaining route height through `flex: 1` and `min-height: 0`.
4. Do not copy the Cloud template's shared `DEMO_USER_ID`. Use the signed anonymous
   browser-session identity, derived Cloud user, and thread-ownership rules in section
   1.4.
5. Do not copy component-level React UI/Thesys stylesheet imports. Keep the docs'
   existing React UI import and add Thesys CSS once at app scope. Scope Cloud template
   overrides beneath a Cloud-surface root so its thread-error, artifact-panel, header,
   and availability selectors cannot change the OSS surface or the surrounding docs
   app.
6. Pass the docs `next-themes` resolved mode to both AgentInterfaces. Do not copy the
   Cloud template's separate body-theme hook/provider.
7. Do not copy the template billing dialog or its special `429` UI. Normalize every
   Cloud failure to the generic unavailable state from section 1.5.
8. Copy the Cloud template's model switcher and model definitions into the
   AgentInterface desktop/mobile header slots. Keep the OpenUI OSS/OpenUI Cloud mode
   control in the route header. Unlike the template's permissive resolver, enforce the
   copied model list as an allowlist on the public docs server.

#### 6.2.4 Shared versus mode-owned frontend responsibilities

| Shared by `ChatPageClient`                                      | Owned by each AgentInterface surface                            |
| --------------------------------------------------------------- | --------------------------------------------------------------- |
| Full-height route shell, page header, and back navigation       | `ChatLLM` and its message/stream protocol                       |
| OpenUI OSS/OpenUI Cloud toggle, availability, confirmation      | `componentLibrary`                                              |
| Theme value and remaining-viewport sizing                       | Storage adapter                                                 |
| Loading boundary for the lazy Cloud bundle                      | Artifact renderers/categories                                   |
| OSS credits dialog, Cloud unavailable state, live announcements | Welcome, starters, agent name, and mode-specific inner headers  |
| Lifecycle callbacks used before switch and during route unmount | Messages, thread IDs, tool calls, artifacts, and provider state |

The required Cloud-only model selector belongs inside AgentInterface as shown by the
Cloud template. The OpenUI OSS/OpenUI Cloud mode toggle belongs above AgentInterface
because it replaces the entire provider configuration. On mobile this produces two
rows—the route mode row and the Cloud AgentInterface header—so verify both together at
320 px.

Give each wrapper an explicit root such as `data-chat-mode="oss"` or
`data-chat-mode="cloud"`. Scope copied template overrides beneath the Cloud root. The
old modal's `.openui-agent-sidebar-container { display: none }` override must not leak
into the route accidentally. Make sidebar behavior mode-scoped: either expose Cloud
history/artifact navigation (and decide whether OSS exposes its in-memory sidebar for
shell consistency), or intentionally hide it and remove inaccessible/dead mobile
navigation controls based on the section 4 decision.

### 6.3 API flow

| Step                    | OpenUI OSS                                    | OpenUI Cloud                                                                         |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Create/select thread    | Internal in-memory adapter                    | Fresh active thread through Cloud storage                                            |
| Format outbound content | Entire message list via `openAIMessageFormat` | Latest message via `openAIConversationMessageFormat`                                 |
| Browser request         | `POST /api/chat`                              | `POST /api/openui-cloud/chat`                                                        |
| Server upstream         | OpenRouter Chat Completions                   | Cloud embed Responses API with the template model/tools and `store: true`            |
| Browser parser          | `openAIAdapter()`                             | `openAIResponsesAdapter()`                                                           |
| Stored history          | Lost on reload/unmount                        | Persisted under the anonymous browser-session user; inaccessible after identity loss |

### 6.4 Suggested file impact

- Add `docs/app/chat/layout.tsx` to wrap only this route in
  `WebsiteThemeProvider`. Keep it independent of the marketing and docs navigation
  layouts.
- Add `docs/app/chat/page.tsx` as a server component that exports the `/chat` title,
  description, and canonical metadata and renders the client page. Add `robots`
  metadata here if product decides the demo should not be indexed.
- Add `docs/app/chat/chat-page.module.css` for the `100dvh` flex shell, compact route
  header, responsive segmented control, remaining-height AgentInterface viewport,
  mode-scoped overrides, loading/error overlays, and mobile behavior.
- Add `docs/app/chat/_components/chat-page-client.tsx` for mode, availability,
  conversation/running state, confirmation/error state, surface revisions, and lazy
  Cloud loading.
- Add `docs/app/chat/_components/chat-page-header.tsx` for the back link, controlled
  mode toggle, and availability state. Keep the page title visually hidden and expose
  mode changes through live announcements from the client page.
- Add `docs/app/chat/_components/agent-viewport.tsx` for the labelled,
  remaining-height boundary and stable Cloud loading/error presentation.
- Add `docs/app/chat/_components/agent-surfaces/oss-agent-surface.tsx` for the
  OSS-configured AgentInterface, current starters/welcome, and current `ChatLLM`.
- Add `docs/app/chat/_components/agent-surfaces/cloud-agent-surface.tsx` for the
  Cloud-configured AgentInterface, storage hook, artifact registry, Cloud
  starters/welcome, and template model switcher/header slots.
- Add
  `docs/app/chat/_components/agent-surfaces/chat-lifecycle-bridge.tsx` for provider
  state, cancellation callbacks, and unmount cleanup shared by both configurations.
- Add `docs/app/chat/_components/agent-surfaces/cloud-model-switcher.tsx` by adapting
  the template switcher, and add `docs/lib/openui-cloud/models.ts` as the copied
  `MODEL_OPTIONS`/`DEFAULT_MODEL` source shared with the server allowlist.
- Add `docs/app/chat/_components/switch-mode-dialog.tsx`; migrate the existing OSS
  `DemoCreditsDialog` to the approved Radix-based wrapper; and render Cloud
  unavailability through
  `docs/app/chat/_components/cloud-unavailable-state.tsx` rather than a dialog.
- Modify `docs/content/docs/openui-lang/components/try-it-out.tsx` and
  `docs/components/overview-components/overview-page.tsx` so both current demo cards
  are semantic Next.js links to `/chat` with `prefetch={false}`. Remove local open
  state, click/keyboard shims, and modal imports.
- Delete `docs/components/overview-components/chat-modal.tsx` and
  `docs/components/overview-components/chat-modal.css` after both callers have
  migrated and all needed OSS behavior has moved under the route.
- Modify `docs/app/sitemap.ts` only if product chooses to index `/chat`; otherwise omit
  it and set explicit no-index metadata on the route.
- Add `docs/lib/openui-cloud/cloud-chat-llm.ts`.
- Add server-only Cloud environment, generic error normalization, session-cookie
  mint/verify/rotation, derived Cloud-user identity, and rate-limit helpers under
  `docs/lib/openui-cloud/`.
- Add `docs/app/api/openui-cloud/chat/route.ts`.
- Add `docs/app/api/openui-cloud/frontend-token/route.ts`.
- Add `docs/app/api/openui-cloud/status/route.ts` for the non-secret, non-cacheable
  availability check used by the visible-disabled switcher state.
- Modify `docs/app/api/chat/route.ts` to remove/redact cross-visitor logging, normalize
  confirmed OSS quota errors for the existing dialog, and propagate abort/cancellation
  to the OpenRouter runner without changing the public request/stream protocol.
- Modify `docs/app/global.css` for the one-time Cloud stylesheet import.
- Modify `docs/package.json`, `pnpm-lock.yaml`, and `docs/README.md` for pinned Cloud
  dependencies, a direct accessible-dialog dependency, and environment setup,
  including the feature flag, Cloud key, template model choices/tools, session-cookie
  signing secret, cookie semantics, and the approved Cloud retention period.

## 7. Implementation phases

### Phase 0: Resolve launch blockers

1. Answer the four remaining blocking questions in section 4.
2. Confirm the Cloud thread-owner check, org/session/IP quotas, retention duration, and
   history/sidebar presentation.
3. Review the already-selected labels, fresh-chat confirmation, session-persistence
   disclosure, and generic unavailable copy.

Exit criterion: product and infrastructure owners have recorded the remaining
thread-ownership, cost-control, retention, and history-presentation decisions.

### Phase 1: Build `/chat` and migrate the OSS surface

1. Add the route layout, server page, `/chat` metadata/canonical, client page shell,
   route header/back link, and remaining-height AgentInterface viewport.
2. Extract the current chat into `OssAgentSurface` without changing its public request
   or rendering contract.
3. Add the controlled single-select mode control, responsive CSS, focus behavior, and
   screen-reader announcement.
4. Add the chat lifecycle bridge, route/surface-unmount cancellation, and
   switch-confirmation flow. Use dialog semantics only for the nested confirmation and
   existing OSS credits experience; Cloud unavailability remains inline.
5. Keep Cloud feature-flagged/unavailable until the backend is ready.
6. Update the OSS route's internal cancellation, quota normalization, and logging
   behavior while preserving its request and SSE format.
7. Convert both current demo entry points to semantic `/chat` links and then delete the
   portal, backdrop, body-scroll-lock, Escape-to-close, and focus-restoration modal
   implementation.

Exit criterion: direct navigation and both existing entry points open `/chat` in
OpenUI OSS mode; the current OSS demo behaves as it does today, navigation away aborts
active work, and all switcher states can be tested without a live Cloud key.

### Phase 2: Build and protect the Cloud server paths

1. Add pinned client/server Cloud SDK dependencies.
2. Implement the status, frontend-token, and chat routes.
3. Implement anonymous browser-session cookie minting/verification, deterministic
   Cloud-user derivation, Cloud thread-ownership authorization, and documented
   retention.
4. Enforce the feature gate independently on every route and add typed fail-closed
   configuration handling.
5. Add origin/content-type checks, input validation, the template-derived model
   allowlist/tools, `store: true`, abort propagation, sanitized generic errors, request
   size limits, durable rate limiting, and Cloud-org quota protection.
6. Normalize every pre-stream and in-stream Cloud failure to the same sanitized
   unavailable contract.
7. Remove or redact the current cross-visitor OSS conversation log.

Exit criterion: integration tests can create and persist an isolated session-user
conversation and stream a Cloud response without exposing a master key or another
session's history.

### Phase 3: Add the lazy Cloud surface

1. Build `CloudAgentSurface` by adapting the maintained Cloud template's
   `AgentInterface` configuration; adapt its full-height shell to the viewport below
   the `/chat` header rather than copying its raw wrapper verbatim.
2. Configure Cloud storage, Responses adapter/message format, component library,
   artifact renderers/categories, welcome copy, starters, and the template model
   switcher/default/options.
3. Define the artifact registry once at module scope, in template order, and mount it
   only with the Cloud AgentInterface.
4. Add one inline **"OpenUI Cloud is unavailable."** state covering initialization,
   token, storage, thread-list, pre-stream, and in-stream errors, with no Cloud-specific
   retry or billing flow.
5. Dynamically import it only after Cloud selection.
6. Add Cloud CSS once in global CSS, scope template overrides to the Cloud surface, and
   verify the existing layer order.
7. Decide and implement Cloud-only history/sidebar/artifact navigation behavior.

Exit criterion: switching into Cloud creates a fresh persisted Cloud thread, retains
older session-user threads, and renders normal responses plus a report and
presentation artifact using the template model/tools.

### Phase 4: Complete availability states and operational telemetry

1. Complete the visible-disabled Cloud state and the single inline unavailable state.
2. Ensure one mode's errors do not affect the other.
3. Add privacy-safe operational metrics for request count, latency, cancellation,
   status, and mode. Never log prompt text, frontend tokens, master keys, raw session
   identifiers, derived Cloud user IDs, or thread contents.
4. Rely on the inherited PostHog automatic pageview instrumentation. Add no
   chat-specific product events and do not link Cloud session identity to PostHog.

Exit criterion: every Cloud failure shows the same unavailable state, existing
PostHog pageviews are not double-counted, and Cloud can be disabled independently
without breaking OpenUI OSS.

### Phase 5: Verify and roll out

1. Run typecheck, lint, formatting check, and production build.
2. Run the automated and manual matrix below.
3. Deploy behind `OPENUI_CLOUD_DEMO_ENABLED=false`, verify a preview with a test Cloud
   org, then enable in preview/staging and finally production. If product requires a
   cohort or immediate no-redeploy kill switch, use an approved runtime flag service
   instead of the environment boolean.
4. Monitor quota, latency, error rate, and cross-session isolation; keep the approved
   independent Cloud disable path ready.

## 8. Verification plan

### 8.1 Automated coverage

Because the docs package has no UI test harness today, add a focused Vitest/React
Testing Library setup or cover the same behavior in the repository's accepted browser
test system. At minimum automate:

- `/chat` renders the standalone page shell with OpenUI OSS selected on every fresh
  mount, while the route metadata has the approved title, canonical, and indexability
  policy. Reload/new navigation writes no mode cookie, local-storage value, or query
  parameter.
- Both existing demo cards are semantic links to `/chat`, preserve open-in-new-tab and
  browser Back behavior, and do not eagerly import the Cloud bundle.
- Selecting OpenUI Cloud before a prompt changes the surface without confirmation.
- Both mode components render `AgentInterface`; OSS receives `openuiChatLibrary` with
  no storage/artifact props, while Cloud receives Thesys `chatLibrary`, Cloud storage,
  and the stable artifact registry.
- A mode change unmounts the old AgentInterface provider and mounts a new keyed
  provider; it does not mutate the captured LLM/storage/renderer props in place.
- Clicking the selected ToggleGroup item cannot clear the controlled mode value, and
  arrow-key behavior plus disabled-state explanations remain accessible.
- Selecting another mode after a prompt opens confirmation.
- Cancelling confirmation retains the current surface and transcript.
- Confirming creates a fresh destination surface and never forwards source messages.
  Switching into Cloud creates/selects a new active thread without deleting older
  persisted threads for the same session user.
- The switcher is disabled while `isRunning=true` and re-enables after stop/completion.
- Navigating away, browser Back, route remount, or surface replacement while either
  mode runs calls `cancelMessage` and aborts the corresponding upstream runner; no
  hidden stream continues after unmount.
- Escape closes the active switch-confirmation or OSS credits dialog and restores focus
  to its trigger. Cloud unavailability never opens a dialog. With no nested dialog
  open, Escape does not navigate away or clear chat.
- No Cloud SDK bundle, frontend-token/storage call, or Cloud upstream call occurs while
  OpenUI OSS remains selected; the same-origin availability request is the only
  permitted pre-selection Cloud-related call.
- Cloud sends only the latest formatted input plus its Cloud `threadId`.
- OSS continues to send full formatted history to `/api/chat`.
- The OSS generated prompt is built from the same `openuiChatLibrary` prompt options
  used by the OSS renderer; Cloud never receives that prompt.
- Missing Cloud configuration keeps OpenUI Cloud visible and disabled with the
  persistent **"OpenUI Cloud is unavailable."** explanation; OpenUI OSS remains usable.
- Cloud thread-list loading cannot incorrectly clear the latched conversation state;
  hidden-sidebar/thread-list failures show the same generic Cloud-unavailable state.
- Configuration, token, storage, thread-list, billing/quota, pre-stream generation, and
  in-stream generation failures all show the same sanitized inline Cloud-unavailable
  state. None opens a Cloud billing/credits dialog or exposes an upstream error.
- Session-identity tests prove the production cookie is `__Host-` prefixed,
  `Path=/`, `HttpOnly`, `Secure`, and `SameSite=Lax`, has no `Domain`, `Expires`, or
  `Max-Age`, and token responses are `no-store` with `Vary: Cookie`.
- Repeated token requests with one valid session cookie derive the same Cloud user; two
  separate cookie sessions derive different users; raw cookie/session values never go
  to Cloud, PostHog, or logs; and a client-supplied `user_id` is ignored/rejected.
- Only the frontend-token route may mint/replace session identity. Tampered or absent
  identity fails on the chat route before paid work, and the route never derives
  identity from a submitted `threadId`.
- Authorization tests prove session A cannot list, recover, or generate against session
  B's stored conversations, while every session-A response uses `store: true` and
  remains available to session A for the retention window.
- Direct route tests prove all Cloud endpoints fail closed when the flag or runtime
  configuration is absent, regardless of what the status UI reported.
- API tests cover invalid origins/content types/bodies, oversized requests, aborts,
  durable rate limits, sanitized upstream/token errors, pre-stream and in-stream
  failures, SSE headers, and cookie-signing-key rotation.
- The page uses one `<main>`, has no outer dialog/portal or body-scroll mutation, and
  sizes AgentInterface to the remaining `100dvh` viewport without document overflow.
- Cloud renders the template `ModelSwitcher` in desktop/mobile header slots, uses the
  copied `MODEL_OPTIONS` and `google/gemini-3.1-pro-free` default, and the server rejects
  models outside that list.
- Cloud requests match the template's slides/report artifact tool, web search, image
  search, `createResponsesInstructions()`, and `store: true`.
- Cloud-scoped template CSS does not alter the OSS AgentInterface.
- Existing PostHog history-change pageview capture records `/chat` once per navigation;
  the feature adds no manual duplicate pageview or chat-specific product events.

### 8.2 Manual matrix

Test each supported browser at desktop and mobile widths, in light and dark themes:

- direct `/chat` navigation, both **Try it out** links, browser Back/Forward, open in a
  new tab, reload, and the visible **Back to docs** link;
- mouse/touch, keyboard-only, and a screen reader;
- 100% and 200% zoom;
- switch before prompt, after prompt, after artifact creation, and after stopping a
  stream;
- Escape with no dialog open and with the switch-confirmation and OSS credits dialogs;
- OpenUI OSS success/quota/general failure;
- OpenUI Cloud success, token refresh, and disabled/configuration/token/storage/quota/
  general/stream failures all using the same unavailable state;
- report and presentation rendering;
- representative OSS starters render with `openuiChatLibrary` and Cloud starters render
  with Thesys `chatLibrary`, without unknown-component fallbacks;
- 320 px and mobile-browser viewport changes with the route header/mode row plus the
  required Cloud model/header row, with no clipped composer or horizontal page scroll;
- template model selection and web/image/artifact tool behavior;
- same-session Cloud persistence across route reload and shared-cookie tabs, plus
  isolation/non-recovery in a new clean/private browser session;
- slow network, explicit stop, browser Back, in-app navigation, and reload during a
  response; and
- standalone route theming and CSS isolation without either the marketing or docs
  navbar.

### 8.3 Required commands

From the repository root:

```bash
pnpm --filter @openuidev/docs types:check
pnpm --filter @openuidev/docs lint
pnpm --filter @openuidev/docs format:check
pnpm --filter @openuidev/docs build
```

Run the new focused test command as well once the selected test harness is added.

## 9. Acceptance criteria

- [ ] Direct navigation to `/chat` renders a standalone full-height page in OpenUI OSS
      mode, and the current OSS demo still works.
- [ ] Every new navigation/reload starts in OpenUI OSS and writes no mode cookie,
      local-storage value, or query parameter.
- [ ] Both existing demo entry points are semantic links to `/chat`; browser
      Back/Forward, open-in-new-tab, reload, and **Back to docs** work normally.
- [ ] `/chat` has an explicit title, canonical URL, and approved sitemap/robots policy,
      and it does not inherit the marketing or docs navbar.
- [ ] A visible, accessible switcher remounts the shared AgentInterface shell with the
      selected mode's complete configuration.
- [ ] The OSS AgentInterface uses `openuiChatLibrary` with implicit in-memory storage;
      the Cloud AgentInterface uses Thesys `chatLibrary`, Cloud storage, and the stable
      report/presentation artifact registry.
- [ ] The Cloud AgentInterface exposes the template model switcher/options in desktop
      and mobile headers, defaults to `google/gemini-3.1-pro-free`, and its server uses
      the template slides/report, web-search, image-search, and instruction setup while
      rejecting models outside the copied list.
- [ ] Before Cloud selection, only the same-origin availability check may run; no Cloud
      SDK bundle, frontend-token/storage call, or Cloud upstream call occurs.
- [ ] Switching after chat starts requires confirmation and starts a fresh destination
      thread. A switch into Cloud retains older persisted session-user conversations
      without selecting one as the fresh active chat.
- [ ] Switching is unavailable while streaming, and stopping the stream restores it.
- [ ] Navigating away, reloading, or otherwise unmounting `/chat` during generation
      aborts the client stream and upstream runner in either mode.
- [ ] No transcript, thread ID, tool call, or artifact crosses the mode boundary.
- [ ] Cloud persists every conversation/artifact with `store: true` under one anonymous
      Cloud user per browser cookie session; no shared public demo user is used.
- [ ] The signed production session cookie has the required `__Host-`, `Path=/`,
      `HttpOnly`, `Secure`, and `SameSite=Lax` attributes and no `Domain`, `Expires`, or
      `Max-Age`. The selected mode is never stored in it.
- [ ] The same valid cookie session derives the same Cloud user, a new session derives
      a different user, and a later session cannot list/recover/merge the prior
      session's retained conversations.
- [ ] The generation route authorizes every Cloud `threadId` for the current session
      user; knowing another session's thread ID does not grant access.
- [ ] Server master/provider keys never enter client code, responses, or logs.
- [ ] Every Cloud route enforces the feature gate and fails closed with sanitized,
      non-cacheable responses when required runtime configuration is absent.
- [ ] Public Cloud routes have shared rate limits and Cloud-org quota controls, and the
      existing OSS route no longer logs full cross-visitor conversations.
- [ ] Cloud reports and presentations render with the Cloud library and artifact
      registry.
- [ ] Existing OpenUI OSS credit handling remains OSS-only. Every Cloud configuration,
      token, storage, billing/quota, generation, and in-stream error shows only the
      sanitized inline **"OpenUI Cloud is unavailable."** state.
- [ ] Cloud can be disabled independently while its option remains visible and disabled
      with the unavailable explanation and OpenUI OSS remains operational.
- [ ] Existing PostHog history-change pageviews cover `/chat`; no duplicate manual
      pageview, chat-specific product event, or Cloud-session identity linkage is added.
- [ ] The route, control, and nested dialogs pass keyboard, screen-reader, mobile,
      dark-mode, zoom, and viewport-overflow checks without page-level dialog/focus-trap
      behavior.
- [ ] Typecheck, lint, formatting, build, and the focused automated tests pass.
