# OpenUI Chat Demo Plan

Status: implemented locally
Scope: the hosted `/chat` demo in `docs`
Date: 2026-08-04

## Outcome

Turn `/chat` into a focused Cloud demo while preserving the unused OSS implementation for now:

1. Remove the user-facing OpenUI OSS/OpenUI Cloud toggle and pin the rendered chat to OpenUI Cloud.
2. The OpenUI Cloud sidebar has an always-visible, data-driven **Demo threads** section with one thread row per curated use case.
3. The page navbar can resize the same live chat between representative mobile and desktop widths.

The unused OSS surface, `ChatMode` type, shared `/api/chat` route, and supporting credit code remain in the repository for now; this plan does not delete or refactor them. Compare, existing user-created Cloud conversations, model selection, artifacts, and the Build for free CTA continue to work.

The implemented demo resolves the current published chat package baseline: `@openuidev/react-ui@0.13.3`, `@openuidev/react-headless@0.9.4`, and `@openuidev/thesys@0.3.1`.

The empty/new-chat shell is also aligned with the generated OpenUI Cloud template: the same welcome copy, prompt templates, starters, artifact-category icons, model persistence, theme handoff, and OpenUI mascot are used. The model menu follows the latest hosted Cloud baseline with paid Gemini 3.6 as the default, no stale free-model badge, and the exact provider logo assets from the template. After the latest template moved model selection and HTTP transport into shared packages, the hosted demo now uses the shared `ModelSwitcher` and `fetchLLM` adapters too. The hosted demo adds the curated **Demo threads** section and read-only continuation controls around that shared baseline; its small transport wrapper exists only to send an immutable fixture transcript once when a visitor continues a demo.

## Product decisions

### 1. Use immutable demo responses as the seed for interactive conversations

Store curated conversations as checked-in fixtures and render them through the same `chatLibrary` as live Cloud responses. The fixture messages are immutable and selecting an example must not issue a model-generation request. This gives every visitor the same immediate, reviewed result and prevents latency, model drift, or demo-credit usage from changing the initial showcase.

Demo conversations should be visually separated from the visitor's Cloud-backed conversation history:

- **Demo threads**: always-visible, read-only source threads owned by the demo. Each row uses the same visual language as a normal thread and carries a small `Demo` badge.
- **Your conversations**: threads returned by `useOpenuiCloudStorage`.

The source demo rows remain in the sidebar at all times. Selecting, continuing, or deleting a private fork must never remove, rename, reorder, or otherwise mutate its source demo row. Keep the corresponding demo row selected only while the read-only source is open; selecting or creating a private continuation moves selection to that user-owned thread.

The source demo thread is intentionally non-interactive:

- The curated user and assistant messages are the read-only seed; they cannot be edited, deleted, or overwritten.
- The composer is disabled and shows **Demo conversation is read-only**.
- The model switcher is disabled in both desktop and mobile headers, with an accessible explanation that the example uses a fixed recorded model.
- A separate **Continue in a new chat** action is available below the transcript. It is not part of the disabled composer.

Do not send follow-ups against a shared or synthetic fixture ID. Selecting a demo loads only the local immutable fixture. When the visitor chooses **Continue in a new chat**, materialize a private Cloud thread, map it to the immutable fixture, select that real thread, and enable the normal composer and model switcher. On the first user prompt in the private continuation, send the complete seed transcript plus the new prompt to that Cloud conversation. After Cloud has been seeded, later turns send only the new input through the normal conversation flow.

This creates a fork rather than mutating the source example:

1. Selecting a use case loads its read-only checked-in fixture without creating a Cloud thread or running the model.
2. **Continue in a new chat** creates a private Cloud thread and places it in **Your conversations** with a continuation title.
3. The private continuation loads the same immutable seed, but enables the composer and model switcher.
4. The first visitor prompt seeds the private Cloud conversation with the fixture plus that prompt and streams a live response.
5. Later prompts use the stored Cloud history normally.
6. The source demo thread remains visible and reusable; existing continuations remain ordinary user-owned conversations and can be deleted normally.

Recommended first set, pending content sign-off:

| Use case                  | Capability to demonstrate                   | Constraint                                      |
| ------------------------- | ------------------------------------------- | ----------------------------------------------- |
| Business health dashboard | Inline status, chart, and operating table   | Keep the response in-chat for the first release |
| Travel planner            | Responsive destination cards and comparison | Use reviewed, non-time-sensitive sample data    |
| Product comparison        | Tabs, recommendation, and feature matrix    | Avoid factual claims that can become stale      |

Keep the registry generic so the product team can change the titles, order, icons, prompts, and fixture messages without changing sidebar code. Keep each seed below the existing request input limit. Slides and reports can be added later, after their separate artifact records are included in the fixture/storage overlay; the first release should not imply that a message-only fixture fully reproduces a stored Cloud artifact.

### 2. Remove the toggle but preserve the dormant OSS implementation

Remove the OSS/Cloud toggle from the navbar and make Cloud the only reachable `/chat` mode. Do not delete the OSS surface, `chat-types.ts`, shared `/api/chat`, or related demo-credit support in this iteration.

Implementation boundary:

- Pin the chat client to `cloud` rather than exposing a mode setter through the header.
- It is acceptable to retain the existing typed mode branch internally with a fixed Cloud value so the dormant OSS branch continues to compile.
- Remove only mode-switch UI, callbacks, and announcements that become genuinely unused.
- Leave the OSS surface and its existing starters unchanged and unrendered.
- The viewport preset resizes the Cloud surface and must not reset its active conversation.

The navbar contains the viewport control, not a replacement Cloud/OSS selector. Show Mobile/Desktop labels where space allows and collapse them to Smartphone/Monitor icons with tooltips and accessible names on narrow screens.

### 3. Resize the existing component instead of embedding another page

`AgentInterface` measures its own container with `ResizeObserver` and applies its mobile layout below 768px. The chat page already overrides the library's `100dvw` container width to `100%`. The demo can therefore place the Cloud surface inside a centered frame whose width is controlled by the navbar.

MVP presets:

| Preset  |  Width | Navbar label                                |
| ------- | -----: | ------------------------------------------- |
| Mobile  |  390px | Smartphone icon + `Mobile` accessible label |
| Desktop | `100%` | Monitor icon + `Desktop` accessible label   |

Define presets in one typed array so tablet or other widths can be added without rewriting the control. Default to Desktop on the hosted page. On a browser narrower than the desktop target, cap the frame at the available width rather than scaling the UI; scaling would make text and pointer targets unrepresentative.

Changing the preset must only change frame width. Do not key or remount `CloudAgentSurface`, so its selected thread, generated response, artifact view, and selected model survive a viewport change.

## Current implementation seams

- `docs/app/chat/_components/chat-page-client.tsx` currently starts in `oss` and swaps the OSS and Cloud surfaces. Pin this route to Cloud while retaining the dormant typed branch if keeping it avoids unnecessary code deletion.
- `docs/app/chat/_components/chat-page-header.tsx` contains the centered `OpenUI OSS`/`OpenUI Cloud` toggle. Remove that control and use its navbar space for the viewport control.
- `docs/app/chat/_components/agent-surfaces/cloud-agent-surface.tsx` already contains the Cloud LLM, Cloud storage, model switcher, artifact renderers, starters, and Cloud-specific headers.
- `docs/app/chat/_components/agent-surfaces/oss-agent-surface.tsx` remains in the repository unchanged but is no longer user-reachable from `/chat`.
- `AgentInterface.Sidebar`, `SidebarContent`, `SidebarItem`, `ArtifactNav`, `NewChatButton`, and `ThreadList` provide the supported composition points for adding a use-case group without changing `@openuidev/react-ui`.
- `useThreadList().selectThread(id)` can load a curated fixture through a small `ChatStorage` wrapper while normal IDs continue to use Cloud storage.
- `cloudStorage.thread.createThread()` and `updateThread()` provide the user-owned thread needed to fork a demo without changing the shared fixture.
- `createCloudChatLLM` currently sends only `messages.slice(-1)`. It needs an optional, Cloud-chat-only seeding policy that sends the full message list once for a newly materialized demo fork, while retaining the current behavior for ordinary Chat and Compare threads.
- `docs/app/api/chat/route.ts` remains shared by the OSS, Compare, and component demos and is out of scope.

## Proposed structure

```text
ChatPageClient
├── ChatPageHeader
│   ├── Back
│   ├── Mobile / Desktop viewport toggle
│   └── Build for free
└── Demo canvas (selected width)
    └── CloudAgentSurface
        └── AgentInterface
            ├── Custom sidebar
            │   ├── Sidebar header
            │   ├── New chat
            │   ├── Artifact navigation
            │   ├── Demo threads (always-visible immutable source rows)
            │   └── Your conversations (private Cloud forks + normal threads)
            ├── Demo-aware mobile/thread header
            ├── Source demo: immutable messages
            │   ├── Disabled model switcher
            │   ├── Disabled composer
            │   └── Continue in a new chat
            ├── Private fork: immutable seed + live continuation
            │   ├── Enabled model switcher
            │   └── Enabled composer
            └── Workspace / artifacts
```

## Implementation phases

### Phase 1: Remove the mode toggle, pin Cloud, and retain dormant code

1. Remove the OSS/Cloud `ToggleGroup` from `ChatPageHeader` and remove its `mode`/`onModeChange` props.
2. Pin `ChatPageClient` to Cloud. A fixed `ChatMode = "cloud"` may retain the existing surface branch and OSS credit wiring without making OSS reachable; remove only now-unused setter/announcement code required for clean lint and type checks.
3. Keep the dynamic Cloud import, loading state, and Cloud error boundary.
4. Update `/chat` metadata and accessible labels to describe the Cloud demo rather than an OSS/Cloud comparison.
5. Add viewport preset state and pass it to the header and Cloud demo canvas.
6. Do not delete or refactor the shared `/api/chat` route, `DemoCreditsDialog`, `oss-agent-surface.tsx`, `chat-types.ts`, OSS starters, or any Compare surface.

### Phase 2: Add curated use-case conversations

1. Add a typed `DemoConversation` registry with stable source IDs, sidebar title, icon key, short description, source prompt/model metadata, and `Message[]` payload. Use an unmistakable reserved prefix such as `demo_` for fixture source IDs.
2. Capture each fixture from an approved OpenUI Cloud result, then:
   - remove personal/customer data and unstable timestamps;
   - preserve the exact assistant message structure required by `chatLibrary`;
   - use stable message IDs so hydration and rendering are repeatable;
   - record the source prompt and model as fixture metadata for maintenance, without showing claims that the current model generated it live.
3. Add a small client-side demo-fork registry keyed by the real, private Cloud thread ID. It records the source fixture ID and whether the full seed has been sent to Cloud. Keep the live map in memory and persist only unseeded thread-to-fixture mappings in namespaced local storage so a refresh before the first follow-up still reloads the continuation. Never persist duplicate fixture content.
4. On a demo-thread click:
   - select the fixture's synthetic source ID and navigate to a controlled `demo/<source-id>` path;
   - load its messages through the fixture branch of the storage overlay;
   - do not create a Cloud thread or call the LLM;
   - render the disabled composer, disabled model switcher, and **Continue in a new chat** action.
5. On **Continue in a new chat**:
   - call `useThreadList().createThread()` with the fixture's first user message so the real thread is merged into the visible user thread list;
   - request `useThreadList().updateThread()` with a title such as `<use case> — continuation`;
   - register the returned real thread ID as an unseeded fork of the fixture;
   - select the real thread and clear the controlled demo path;
   - enable the normal composer and model switcher;
   - do not call the LLM until the visitor submits their first prompt.
6. Wrap `cloudStorage.thread.getMessages`:
   - for a synthetic source ID, always return a cloned `Message[]` from its immutable fixture;
   - while a private fork is unseeded, return a cloned `Message[]` from its source fixture;
   - after the first successful seeded request, delegate that thread to Cloud normally;
   - delegate every unrelated thread and every other storage method to Cloud unchanged;
   - clear any local fork mapping when its real thread is deleted;
   - never add source fixture IDs to `listThreads`; only the real user-owned forks appear there.
7. Extend `createCloudChatLLM` with an optional seed policy used only by the `/chat` Cloud surface:
   - unseeded demo fork: serialize the full fixture transcript plus the new visitor prompt;
   - ordinary or already-seeded thread: preserve the current `messages.slice(-1)` behavior;
   - mark the fork seeded only after Cloud accepts the request;
   - keep Compare's call site on the default last-message behavior.
8. Replace the default Cloud sidebar with the supported compound components. Add an always-visible **Demo threads** group of `SidebarItem`s above `ThreadList`, while retaining `SidebarHeader`, `NewChatButton`, and `ArtifactNav`. Render one row per registry entry with a `Demo` badge; do not condition this group on Cloud thread-list loading or whether the visitor already created a fork.
9. Keep `AgentInterface.path` controlled in `CloudAgentSurface`. The `demo/<source-id>` path keeps the source demo row selected and closes the drawer on mobile. Clear that path when **Continue in a new chat**, an ordinary thread, or New chat is selected.
10. Add demo-aware header and composer slots:
    - source demo: render the model switcher in a disabled state and replace the standard composer with a read-only notice plus **Continue in a new chat**;
    - private continuation or ordinary thread: render the existing enabled model switcher and standard composer unchanged.
11. If creating the private Cloud continuation fails, keep the read-only demo selected and show a retryable error. Do not navigate away or fall back to sending a prompt against the fixture source ID.
12. Add a development-time fixture validation step. Production should exclude a malformed or oversized fixture from the registry rather than expose a broken item.

Suggested files:

- Add `docs/app/chat/_components/demo-conversations.ts`
- Add `docs/app/chat/_components/demo-conversation-storage.ts`
- Add `docs/app/chat/_components/demo-conversation-list.tsx`
- Add `docs/app/chat/_components/demo-fork-registry.ts`
- Add `docs/app/chat/_components/demo-aware-chat-controls.tsx`
- Update `docs/app/chat/_components/agent-surfaces/cloud-agent-surface.tsx`
- Update `docs/lib/openui-cloud/chat-llm.ts`
- Update `docs/app/chat/chat-page.module.css`

### Phase 3: Add the navbar viewport toggle

1. Add a `ViewportPreset` type and the Mobile/Desktop preset registry near the chat page components.
2. Replace the former navbar mode-control space with an accessible viewport single-select toggle using Smartphone and Monitor icons. Retain visible text where space allows and tooltips/`aria-label`s in the compact navbar.
3. Store the selected preset in `ChatPageClient`; pass it to both the header and demo canvas.
4. Add a centered canvas/frame around `CloudAgentSurface` and set its inline size through a CSS custom property or preset data attribute.
5. Keep height at the available page height and allow the outer canvas to absorb unused space. Add a subtle border/radius only when the frame is narrower than the canvas so Mobile reads as a device-width preview without imitating hardware chrome.
6. Add a short width transition and turn it off under `prefers-reduced-motion`.
7. Verify that resizing crosses the library's `<768px` mobile boundary, opens conversations through the mobile drawer, and does not remount `CloudAgentSurface`.

Suggested files:

- Update `docs/app/chat/_components/chat-page-client.tsx`
- Update `docs/app/chat/_components/chat-page-header.tsx`
- Update `docs/app/chat/chat-page.module.css`
- Optionally add `docs/app/chat/_components/viewport-presets.ts` if the registry is more than a few lines

### Phase 4: Polish and release

1. Make sidebar section labels and fixture titles work in expanded, collapsed, and mobile-drawer states.
2. Ensure the navbar remains usable at narrow browser widths: prioritize Back, compact viewport icons, and the existing CTA menu without horizontal overflow.
3. Add bounded analytics only if the team wants success measurement. Suggested events are `chat_demo_use_case_selected` with `use_case_id` and `chat_demo_viewport_selected` with `viewport`; do not send prompts, message content, thread IDs, or user content.
4. Refresh `/nav/chat-light.webp` and `/nav/chat-dark.webp` only if the navigation preview is visibly inaccurate after the redesign.

## Validation

No new test runner or dependency is needed for this docs-only change.

### Static checks

```bash
pnpm --filter @openuidev/docs format:check
pnpm --filter @openuidev/docs lint
pnpm --filter @openuidev/docs types:check
pnpm --filter @openuidev/docs build
git diff --check
```

### Browser matrix

Test light and dark themes at a minimum of:

| Browser viewport | Selected demo preset | Expected AgentInterface layout                   |
| ---------------: | -------------------- | ------------------------------------------------ |
|           1440px | Desktop              | Expanded/collapsible desktop sidebar             |
|           1440px | Mobile               | Mobile header and drawer inside a 390px frame    |
|            390px | Mobile               | Full available width, no horizontal overflow     |
|            768px | Desktop              | Frame caps to available width and remains usable |

For every case, verify:

- `/chat` has no visible OSS/Cloud toggle and opens directly in OpenUI Cloud.
- The retained OSS implementation is not user-reachable from `/chat`.
- The Cloud surface resizes correctly from the navbar viewport control.
- Each Cloud demo-thread item loads the exact fixture without creating a Cloud thread or requesting a model response.
- Every source demo thread remains visible in the sidebar before and after private continuations are created or deleted.
- The fixture messages are visibly read-only, and both the composer and model switcher are disabled while the source demo is selected.
- **Continue in a new chat** creates and selects a private user thread, where the composer and model switcher become enabled.
- The first custom prompt sends the full seed plus the prompt once; later prompts send only the new input.
- The source fixture never changes, while the user's fork appears in and persists through **Your conversations**.
- Refreshing before the first custom prompt restores the fixture from the unseeded mapping; refreshing after seeding reloads the conversation from Cloud.
- User Cloud threads still load, create, stream, rename/delete where supported, and persist.
- The model switcher controls live follow-up responses and survives viewport changes.
- Mobile sidebar selection closes the drawer and shows the chosen example.
- Viewport changes preserve the active thread, messages, artifact state, and selected model.
- Keyboard focus order, selected state, tooltips, screen-reader labels, and reduced motion are correct.
- The Cloud unavailable/loading state still fills the selected frame cleanly.

## Acceptance criteria

- `/chat` has no OSS/Cloud toggle and OpenUI Cloud is the only reachable surface.
- The OSS surface, `ChatMode` type, OSS starters, shared `/api/chat`, and related support code remain in the repository unchanged for now.
- At least three approved use cases appear as always-visible demo thread rows in a dedicated sidebar group and load deterministic, reviewed conversations.
- Demo source rows remain present and unchanged when private continuations are created, selected, or deleted.
- Curated source responses remain immutable and cannot be deleted or modified from the UI.
- The composer and model switcher are disabled on source demo threads.
- Users can choose **Continue in a new chat**, then submit their own prompts and receive live Cloud responses using the selected model in the private continuation.
- Every interactive continuation uses a private, real Cloud thread and never a source/synthetic fixture ID.
- The full seed is sent only once per private fork; normal last-message conversation behavior resumes afterward.
- Existing Cloud-backed conversation history and artifacts remain available below the curated group, including the user's demo forks.
- Mobile and Desktop can be selected from the navbar, and the actual AgentInterface responsive layout changes accordingly.
- Toggling viewport does not remount the chat or lose state.
- Compare, the dormant OSS implementation, component demos, and the shared `/api/chat` route are unchanged.
- Docs format, lint, typecheck, build, and the browser matrix pass.

## Follow-ups before release

1. Approve or replace the three initial use cases, their sidebar order, and their checked-in conversation content.
2. Replace or revoke the temporary test key before sharing or deploying the environment; the key is process-only and is not stored in the repository.
3. Decide whether to add the optional bounded analytics events or refresh the navigation preview images in a follow-up.
