# Crayon SDK Redesign — Session Summary

## What is Crayon?

Crayon is a React SDK for building AI chat interfaces. It's split into two packages:

- **`@crayonai/react-core`** — State management hooks (`useThreadManager`, `useThreadListManager`), types, and stream processing
- **`@crayonai/react-ui`** — UI components (`CrayonChat`, `Composer`, `Messages`, etc.) with SCSS-based styling
- **`@crayonai/stream`** — Streaming utilities and format converters (OpenAI, etc.)

## What We're Doing

We're redesigning the SDK's developer-facing API. The current SDK works but has DX issues: too much boilerplate, hardcoded protocols/formats, no support for modern agent patterns (thinking, tool use, HITL), and mixed concerns in the main component. We discussed and documented all improvements — **no code changes have been made yet**, only design docs.

## Decisions Made

### 1. Unified `useChat` Hook

**Problem:** Developers must manually wire `useThreadManager` + `useThreadListManager` together (~40 lines of boilerplate).

**Decision:** Create a single `useChat` hook that composes both internally. It handles thread creation on first message, stream processing, and returns a `ChatManager` object. The lower-level hooks remain as escape hatches.

Key detail: `useChat` calls `processStreamedMessage` internally — the developer just returns a `Response` from `processMessage`.

### 2. Pluggable Protocol & Message Format

**Problem:** Streaming protocol (Crayon SSE) and message format are hardcoded. No way to integrate with AG-UI, Vercel AI SDK, or other backends without forking.

**Decision:** Two abstraction layers, both frontend-only (no backend utilities):

- **`StreamProtocolAdapter`** — Parses server responses into `CrayonStreamEvent`s. Bundled adapters: Crayon SSE (default), AG-UI, Vercel AI SDK, Plain Text SSE.
- **`MessageFormatConverter`** — Converts messages to/from external formats. Bundled converters: identity (default), OpenAI-compatible.

### 3. New Message Format (AG-UI Aligned)

**Problem:** Only `user` and `assistant` roles. Can't represent system messages, tool calls, reasoning, activities, or HITL status.

**Decision:** Expand to 6 message roles aligned with [AG-UI](https://docs.ag-ui.com/concepts/messages):

- `user` — with `string | InputContent[]` for multimodal support
- `assistant` — with `content?: string`, `toolCalls?: ToolCall[]`, `status?: "streaming" | "complete" | "awaiting_input"`
- `system` — system prompt messages
- `tool` — tool call results (references `ToolCall.id`)
- `reasoning` — thinking/reasoning (separate message, not a content block)
- `activity` — frontend-only UI state (progress, search indicators, etc.)

Crayon-specific extensions: `isVisuallyHidden`, `context`, `isThinking`.

**Breaking change:** `message` field renamed to `content`, `type: "prompt"` removed from user messages. No backward compatibility needed.

### 4. No Response Templates

**Decision:** Response templates are removed entirely. `AssistantMessage.content` is a plain `string` (not an array of blocks). No `template` SSE events, no `responseTemplates` param on `useChat`. This simplifies the format to align cleanly with AG-UI.

### 5. `CrayonChat` Props Cleanup

**Problem:** `CrayonChat` mixes state management config props (`processMessage`, `createThread`, etc.) with UI props (`logoUrl`, `theme`, etc.) and internally creates default hook instances.

**Decision:** `CrayonChat` becomes a pure UI component:

- Accepts `chat: ChatManager` (from `useChat`) for all state
- Only has UI/behavioral props: `type`, `theme`, `logoUrl`, `agentName`, `scrollVariant`, `welcomeMessage`, `conversationStarters`, etc.
- No internal hook instantiation

### 6. HITL via Status Field

Human-in-the-loop is handled via `AssistantMessage.status: "awaiting_input"`. When set, the composer is disabled and a visual indicator shows the agent is waiting for user confirmation.

## Files Created

| File                         | Description                                                                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SDK_IMPROVEMENTS.md`        | Full design doc covering all 4 improvement areas with type definitions, SSE events, AG-UI mapping, and examples                                                        |
| `SDK_USAGE_EXAMPLES.md`      | Concrete code examples: minimal, persistence, AG-UI, Vercel AI, plain text SSE, OpenAI converter, combined, copilot/bottom-tray layouts, escape hatch, fully custom UI |
| `docs/docs/docs_summary.mdx` | Summary of the existing SDK documentation (created before the redesign discussion)                                                                                     |
