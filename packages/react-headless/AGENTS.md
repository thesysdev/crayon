# react-headless — Agent Guide

## Build / Test / Lint

```bash
# From monorepo root:
pnpm --filter @openuidev/react-headless run build      # tsdown → dist/
pnpm --filter @openuidev/react-headless run test       # vitest run
pnpm --filter @openuidev/react-headless run typecheck  # tsc --noEmit
pnpm --filter @openuidev/react-headless run ci         # lint:check + format:check

# Or from this directory:
pnpm build && pnpm test
```

This package has no upstream workspace deps (runtime dep is only `@ag-ui/core`; `react` and `zustand` are peers), so it can always build independently. `react-ui` depends on it (`workspace:^`) — rebuild this package before verifying changes through `react-ui`.

## File Map

| Path                                                        | Purpose                                                                                                                                       |
| ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                              | Public API surface — every export consumers see. Check here first when adding/removing exports.                                               |
| **Adapters — `src/adapters/`**                              |                                                                                                                                                |
| `src/adapters/types.ts`                                     | Adapter contracts: `ChatLLM`, `ChatStorage`, `ThreadStorage`, `ArtifactStorage`, plus `Artifact`/`ArtifactSummary`/`ArtifactCategory` types.   |
| `src/adapters/fetchLLM.ts`                                  | `fetchLLM({ url, streamAdapter, messageFormat?, headers?, fetch? })` → `ChatLLM`. POSTs an AG-UI `RunAgentInput`-shaped body to `url`.        |
| `src/adapters/restStorage.ts`                               | `restStorage({ baseUrl, messageFormat?, headers?, fetch? })` → `ChatStorage` (thread channel only). REST conventions of the old `threadApiUrl`. |
| `src/adapters/_defaultStorage.ts`                           | In-memory `ChatStorage` used when `<ChatProvider>` gets no `storage`. Intentionally NOT exported.                                              |
| **Chat store — `src/store/`**                               |                                                                                                                                                |
| `src/store/createChatStore.ts`                              | Zustand store factory — thread-list + thread slices, `processMessage()` send path. This is the most critical file.                             |
| `src/store/ChatProvider.tsx`                                | React provider — creates the stores/registries once via lazy `useState` and nests six contexts.                                                |
| `src/store/ChatContext.ts`                                  | React context + `useChatStore()` internal hook.                                                                                                |
| `src/store/types.ts`                                        | `ChatStore`, `ChatProviderProps`, `Thread`, `CreateMessage`, state/action slices.                                                              |
| `src/store/toolActivity.ts`                                 | `pairToolActivity` / `partialJSONParse` — pairs tool calls with results into `ToolActivity[]` (status: streaming/executing/success/error).     |
| **Artifact + detailed-view stores — `src/store/`**          |                                                                                                                                                |
| `src/store/createDetailedViewStore.ts` (+ `detailedViewTypes.ts`) | Detailed-view store — one active view id globally, portal target element.                                                                |
| `src/store/createThreadContextStore.ts` (+ `threadContextTypes.ts`) | Per-thread artifact registry (`ArtifactEntry` by id/version). Reset when the selected thread changes.                                  |
| `src/store/ArtifactRenderersContext.ts` (+ `artifactRendererTypes.ts`) | Renderer registry — `defineArtifactRenderer`, lookup by `toolName` (live tool calls) or `type` (stored artifacts).                  |
| `src/store/ArtifactStorageContext.ts`                       | Context exposing `storage.artifact ?? null`.                                                                                                   |
| `src/store/ArtifactCategoriesContext.ts` (+ `artifactCategories.ts`) | Categories context + `defineArtifactCategories` helper.                                                                               |
| **Streaming — `src/stream/`**                               |                                                                                                                                                |
| `src/stream/processStreamedMessage.ts`                      | Consumes `AsyncIterable<AGUIEvent>` and drives message create/update callbacks (rAF-debounced) + tool-executing callbacks.                     |
| `src/stream/adapters/ag-ui.ts`                              | `agUIAdapter()` — AG-UI SSE (`data: {AGUIEvent}` lines). The default adapter in `processStreamedMessage`.                                      |
| `src/stream/adapters/openai-completions.ts`                 | `openAIAdapter()` — OpenAI Chat Completions SSE (`ChatCompletionChunk`).                                                                       |
| `src/stream/adapters/openai-responses.ts`                   | `openAIResponsesAdapter()` — OpenAI Responses API SSE (`ResponseStreamEvent`).                                                                 |
| `src/stream/adapters/openai-readable-stream.ts`             | `openAIReadableStreamAdapter()` — NDJSON from the OpenAI SDK's `Stream.toReadableStream()` (no SSE prefix).                                    |
| `src/stream/adapters/langgraph.ts`                          | `langGraphAdapter(options?)` — LangGraph named-SSE events (`messages`/`updates`/`error`/`end`), incl. `onInterrupt` callback.                  |
| `src/stream/adapters/_shared/sseLines.ts`                   | `sseLineIterator` (`@internal`) — cross-chunk SSE line buffering shared by the `data:`-line adapters.                                          |
| `src/stream/formats/openai-message-format.ts`               | `openAIMessageFormat` — `ChatCompletionMessageParam[]` ↔ AG-UI.                                                                               |
| `src/stream/formats/openai-conversation-message-format.ts`  | `openAIConversationMessageFormat` — Responses/Conversations API items ↔ AG-UI.                                                                |
| `src/stream/formats/langgraph-message-format.ts`            | `langGraphMessageFormat` — LangChain-style messages ↔ AG-UI.                                                                                  |
| **Hooks — `src/hooks/`**                                    |                                                                                                                                                |
| `src/hooks/useThread.ts`                                    | `useThread()` / `useThreadList()` — selector hooks over the chat store (`threadSelector` / `threadListSelector` live here).                    |
| `src/hooks/useMessage.tsx`                                  | `MessageContext` / `MessageProvider` / `useMessage` — per-message React context used by `react-ui`.                                            |
| `src/hooks/useToolActivities.ts`                            | Memoized `pairToolActivity` → `ToolActivity[]` for a message.                                                                                  |
| `src/hooks/useDetailedView.ts` / `useActiveDetailedView.ts` / `useDetailedViewPortalTarget.ts` | Detailed-view open/close controls, global "any view open?", portal target.                                  |
| `src/hooks/useArtifactList.ts` / `useArtifactRenderer.ts`   | Active thread's artifacts grouped by id; renderer-registry lookup by tool name.                                                                |
| **Shared types — `src/types/`**                             | `message.ts` (re-exports from `@ag-ui/core`), `messageFormat.ts` (`MessageFormat` + `identityMessageFormat`), `stream.ts` (`StreamProtocolAdapter`, `AGUIEvent`/`EventType` re-exports). |

## Key Patterns

### ChatProviderProps

```ts
interface ChatProviderProps {
  llm: ChatLLM; // required — drives message sending and stream parsing
  storage?: ChatStorage; // default: internal in-memory storage (no persistence)
  artifactRenderers?: ReadonlyArray<ArtifactRendererConfig<any>>; // captured at mount
  artifactCategories?: ArtifactCategory[];
  children: React.ReactNode;
}
```

Typical wiring uses the built-in adapter factories:

```tsx
<ChatProvider
  llm={fetchLLM({ url: "/api/chat", streamAdapter: openAIAdapter() })}
  storage={restStorage({ baseUrl: "/api/threads" })}
>
```

- `fetchLLM(...).send` POSTs `{ threadId, runId: crypto.randomUUID(), messages: messageFormat.toApi(messages), tools: [], context: [] }` and forwards the store's abort `signal`. `messageFormat` defaults to `identityMessageFormat`.
- `restStorage` reproduces the REST conventions of the removed `threadApiUrl` prop (`GET {base}/get`, `POST {base}/create`, `GET {base}/get/:id`, `PATCH {base}/update/:id`, `DELETE {base}/delete/:id`). Thread channel only — it provides no `storage.artifact`.
- **Stream adapters are factories** — pass `openAIAdapter()`, never the bare `openAIAdapter` function.

### How streaming works

`processMessage()` in the store → append optimistic `UserMessage` (and lazily `createThread` via storage when no thread is selected) → `llm.send({ threadId, messages, signal })` → a non-ok `Response` throws → `processStreamedMessage({ response, adapter: llm.streamProtocol, ... })` → `adapter.parse(response)` yields `AGUIEvent`s → one optimistic `AssistantMessage` accumulates text deltas and tool calls (`createMessage` on first event, rAF-debounced `updateMessage` after), `TOOL_CALL_RESULT` events upsert `ToolMessage`s by `toolCallId`, and `TOOL_CALL_END`/`TOOL_CALL_RESULT` drive the `executingToolCallIds` set. Errors become `threadError` unless the run was aborted (`cancelMessage()`).

### Adding a new store action

1. Add the type to the appropriate slice in `src/store/types.ts` (`ThreadActions` or `ThreadListActions`).
2. Implement it in `createChatStore.ts` inside the `createStore<ChatStore>(...)` call.
3. Add it to the selector in `src/hooks/useThread.ts` (`threadSelector` or `threadListSelector`).
4. Add tests in `src/store/__tests__/createChatStore.test.ts` (use the `makeStore` helper).
5. If it should be public, export the type from `src/index.ts`.

### Adding a new stream adapter

1. Create `src/stream/adapters/my-adapter.ts` exporting a **factory** `(options?) => StreamProtocolAdapter` (i.e. returns `{ async *parse(response): AsyncIterable<AGUIEvent> }`).
2. For `data:`-line SSE input, use `sseLineIterator` from `src/stream/adapters/_shared/sseLines.ts` so events split across network chunks are not dropped.
3. `src/stream/adapters/index.ts` re-exports with `export *`, so exporting from your file is enough there; also add the named export to `src/index.ts`.
4. Add tests in `src/stream/adapters/__tests__/`.

### Adding a new message format

1. Create a file in `src/stream/formats/` implementing the `MessageFormat` interface (`toApi` + `fromApi`, both array-to-array).
2. `src/stream/formats/index.ts` re-exports with `export *`; also add the named export to `src/index.ts`.
3. Message formats are consumed by both `fetchLLM` (outbound send) and `restStorage` (`createThread` outbound, `getMessages` inbound).

### Adding a new LLM or storage adapter

1. Create it in `src/adapters/`, returning a `ChatLLM` or `ChatStorage` (contracts in `src/adapters/types.ts`).
2. Export it (value + options type) from `src/adapters/index.ts` — explicit exports here, not `export *` — and from `src/index.ts`.
3. Add tests in `src/adapters/__tests__/`.

### OpenAI adapter types

The `openai` package is a **devDependency** only (for type imports). It is not bundled. The adapter files import types like `ChatCompletionChunk`, `ResponseStreamEvent`, etc. using `import type` so there is no runtime dependency.

## Testing

Tests use Vitest with no jsdom. Conventions:

- **Store tests inject mocks — no global `fetch` stubbing.** `src/store/__tests__/__helpers/makeStore.ts` builds a chat store with a `vi.fn()`-mocked `ChatStorage` + `ChatLLM`; override any storage method or `send`/`streamProtocol` per test.
- **Stream-pipeline tests** build adapters from in-memory `AGUIEvent` arrays and stub `requestAnimationFrame` (the debouncer needs it). **Protocol-adapter tests** wrap hand-crafted SSE payloads in `new Response(new ReadableStream(...))`.
- **`restStorage` tests** pass a `vi.fn()` through the factory's `fetch` option.
- Await async store updates with `flushPromises()` (a `setTimeout(0)` wrapper defined per suite).

| Suite                                                                         | Covers                                                                                   |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `src/store/__tests__/createChatStore.test.ts`                                 | Thread CRUD, message CRUD, `processMessage` streaming, cancellation, select-while-streaming |
| `src/store/__tests__/toolActivity.test.ts`                                    | `pairToolActivity` statuses, partial-JSON args parsing                                    |
| `src/store/__tests__/artifactRendererRegistry.test.ts`                        | Renderer registry build/lookup, duplicate handling                                        |
| `src/store/__tests__/createDetailedViewStore.test.ts` + `detailedViewThreadSwitch.test.ts` | Detailed-view store; reset on thread switch                                  |
| `src/store/__tests__/createThreadContextStore.test.ts` + `threadContextSwitch.test.ts` | Per-thread artifact registry; reset on thread switch                             |
| `src/stream/__tests__/processStreamedMessage.test.ts` + `processStreamedMessageToolStatus.test.ts` | Event loop, `TOOL_CALL_RESULT` upserts, executing-status callbacks   |
| `src/stream/adapters/__tests__/langgraph.test.ts`                             | LangGraph SSE → `AGUIEvent` mapping                                                      |
| `src/stream/adapters/__tests__/sseLines.test.ts`                              | Cross-chunk SSE line buffering                                                            |
| `src/adapters/__tests__/restStorage.test.ts`                                  | REST endpoint conventions, `messageFormat`/header handling, error propagation             |

```bash
pnpm test                    # run all tests
pnpm vitest run --reporter verbose  # verbose output
```

## Do NOT Change

- **Message types** — all message types (`Message`, `UserMessage`, `AssistantMessage`, etc.) come from `@ag-ui/core`. Do not redefine them; only re-export.
- **Store shape** — `ChatStore` is a flat Zustand store. Do not nest slices into sub-objects; hooks rely on the flat structure.
- **`identityMessageFormat`** — this is the default no-op format. It must remain `{ toApi: (m) => m, fromApi: (d) => d as Message[] }`.
- **`_abortController` / `_nextCursor`** — these are internal fields prefixed with `_`. Do not expose them in hooks or types.
- **`ChatProvider` mount-once creation** — the chat store, detailed-view store, thread-context store, renderer registry, and resolved storage are all created once via lazy `useState` initializers. Swapping `llm`/`storage`/`artifactRenderers` props after mount is intentionally ignored (dev-only warning for `artifactRenderers`).
- **`_defaultStorage` stays unexported** — it is internal to `ChatProvider` (see the comment in `src/adapters/index.ts`).
- **Adapter factories** — stream adapters (`agUIAdapter()`, etc.) are factory functions, not bare objects. Keep the factory signature; consumers already call them.
