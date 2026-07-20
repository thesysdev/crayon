# react-headless — Agent Guide

## Build / Test / Lint

```bash
# From monorepo root:
pnpm --filter @openuidev/react-headless run build    # tsdown → dist/
pnpm --filter @openuidev/react-headless run test     # vitest
pnpm --filter @openuidev/react-headless run ci       # lint:check + format:check

# Or from this directory:
pnpm build && pnpm test
```

Build order: **`react-headless`** → `react-lang` → `react-ui`. This package has no upstream workspace deps (only `@ag-ui/core` from npm), so it can always build independently.

## File Map

| Path                                                        | Purpose                                                                                                                                     |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/index.ts`                                              | Public API surface — every export consumers see. Check here first when adding/removing exports.                                             |
| `src/store/createChatStore.ts`                              | Zustand store factory. All state + actions live here. This is the most critical file.                                                       |
| `src/store/ChatProvider.tsx`                                | React provider — thin wrapper that creates the store once via `useState`.                                                                   |
| `src/store/ChatContext.ts`                                  | React context + `useChatStore()` internal hook.                                                                                             |
| `src/hooks/useThread.ts`                                    | `useThread()` / `useThreadList()` — selector hooks over the store.                                                                          |
| `src/store/types.ts`                                        | All store types: `ChatStore`, `ChatProviderProps`, `Thread`, state/action slices.                                                           |
| `src/store/__tests__/createChatStore.test.ts`               | Comprehensive test suite for the store (thread CRUD, message CRUD, `processMessage` streaming, cancellation, select-while-streaming).       |
| `src/stream/processStreamedMessage.ts`                      | Consumes `AsyncIterable<AGUIEvent>` and drives message create/update callbacks (rAF-debounced) plus tool-executing callbacks.               |
| `src/stream/adapters/ag-ui.ts`                              | Default SSE adapter — parses `data: {json}\n` lines.                                                                                        |
| `src/stream/adapters/openai-completions.ts`                 | Adapter for OpenAI Chat Completions streaming (`ChatCompletionChunk`).                                                                      |
| `src/stream/adapters/openai-responses.ts`                   | Adapter for OpenAI Responses API streaming (`ResponseStreamEvent`).                                                                         |
| `src/stream/adapters/openai-readable-stream.ts`             | Adapter for OpenAI SDK's `Stream.toReadableStream()` — parses NDJSON (no SSE prefix) `ChatCompletionChunk` objects.                         |
| `src/stream/formats/openai-message-format.ts`               | `MessageFormat` for OpenAI Completions (`ChatCompletionMessageParam[]` ↔ AG-UI).                                                           |
| `src/stream/formats/openai-conversation-message-format.ts`  | `MessageFormat` for OpenAI Responses/Conversations API (`ResponseInputItem[]` ↔ AG-UI).                                                    |
| `src/types/`                                                | Shared types: `message.ts` (re-exports from `@ag-ui/core`), `messageFormat.ts`, `stream.ts`.                                                |
| `src/hooks/useMessage.tsx`                                  | `MessageContext` / `MessageProvider` / `useMessage` — per-message React context used by `react-ui`.                                         |

## Key Patterns

### Adding a new store action

1. Add the type to the appropriate slice in `src/store/types.ts` (`ThreadActions` or `ThreadListActions`).
2. Implement it in `createChatStore.ts` inside the `createStore<ChatStore>(...)` call.
3. Add it to the selector in `src/hooks/useThread.ts` (`threadSelector` or `threadListSelector`).
4. Add tests in `src/store/__tests__/createChatStore.test.ts`.
5. If it should be public, export the type from `src/index.ts`.

### Adding a new stream adapter

1. Create `src/stream/adapters/my-adapter.ts` exporting a **factory** `(options?) => StreamProtocolAdapter` (i.e. returns `{ async *parse(response): AsyncIterable<AGUIEvent> }`).
2. Export it from `src/stream/adapters/index.ts`.
3. Export it from `src/index.ts`.

### Adding a new message format

1. Create a file in `src/stream/formats/` implementing the `MessageFormat` interface (`toApi` + `fromApi`).
2. Export it from `src/stream/formats/index.ts` and `src/index.ts`.

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

- **Stream adapters are factories** — pass `openAIAdapter()`, never the bare `openAIAdapter` function.

### How streaming works

`processMessage()` in the store → `llm.send({ threadId, messages, signal })` → a non-ok `Response` throws → `processStreamedMessage({ response, adapter: llm.streamProtocol, … })` → `adapter.parse(response)` yields `AGUIEvent`s → text deltas and tool calls accumulate into an `AssistantMessage`, calling `createMessage` on first event and `updateMessage` on subsequent events.

### OpenAI adapter types

The `openai` package is a **devDependency** only (for type imports). It is not bundled. The adapter files import types like `ChatCompletionChunk`, `ResponseStreamEvent`, etc. using `import type` so there is no runtime dependency.

## Testing

Tests use Vitest and inject mocks rather than stubbing globals — store tests build a store with mocked `ChatLLM`/`ChatStorage` via the `makeStore` helper (`src/store/__tests__/__helpers/makeStore.ts`), and `restStorage.test.ts` passes a `vi.fn()` through the factory's `fetch` option. Streaming tests create `ReadableStream` instances with hand-crafted SSE payloads. Use `flushPromises()` (a `setTimeout(0)` wrapper) to await async store updates.

```bash
pnpm test                    # run all tests
pnpm vitest run --reporter verbose  # verbose output
```

## Do NOT Change

- **Message types** — all message types (`Message`, `UserMessage`, `AssistantMessage`, etc.) come from `@ag-ui/core`. Do not redefine them; only re-export.
- **Store shape** — `ChatStore` is a flat Zustand store. Do not nest slices into sub-objects; hooks rely on the flat structure.
- **`identityMessageFormat`** — this is the default no-op format. It must remain `{ toApi: (m) => m, fromApi: (d) => d as Message[] }`.
- **`_abortController` / `_nextCursor`** — these are internal fields prefixed with `_`. Do not expose them in hooks or types.
- **`ChatProvider` store creation** — the store is created once via `useState(() => createChatStore(config))`. It intentionally does not react to config changes after mount.
