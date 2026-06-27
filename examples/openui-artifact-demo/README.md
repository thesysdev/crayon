# OpenUI Artifact Demo

A demo application showcasing the new `defineAppRenderer` API: tool calls map to
custom inline previews + a resizable detailed-view side panel.

## Features

- **Code blocks via tool calls**: AI emits a `create_code_block` tool call instead of an openui-lang component.
- **Inline preview**: Compact code preview rendered in the chat for each call.
- **Detailed-view side panel**: Click "View Code" to open the full code with syntax highlighting.
- **Artifacts registry**: Each rendered code block registers in ThreadContext (artifacts list) keyed by filename.
- **Multiple files per response**: One tool call per file; multiple calls render multiple panels.

## Getting Started

```bash
# Install dependencies (from repo root)
pnpm install

# Generate the system prompt
pnpm --filter openui-artifact-demo generate:prompt

# Start the development server
pnpm --filter openui-artifact-demo dev
```

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your-key-here
```

## How It Works

1. User asks for code (e.g., "Build me a React login form")
2. AI emits a `create_code_block` tool call with `{ language, title, codeString }`
3. Backend's agentic loop (`runTools`) executes the (declarative) tool — it just returns `{ ok: true }`
4. Backend forwards the tool call + result to the client over SSE, with the result enriched into the args envelope as `{ _request, _response }`
5. Client's `enrichedArgsAdapter` unpacks the envelope into proper `TOOL_CALL_ARGS` + `TOOL_CALL_RESULT` events
6. `processStreamedMessage` creates a `ToolMessage` for the result
7. `ToolMessageRenderer` matches `create_code_block` against the `appRenderers` array, dispatches to `codeBlockRenderer`
8. The renderer's `parser` validates the args, `meta` registers the entry in ThreadContext, `preview` renders the inline card, `actual` renders the side panel content via `DetailedViewPanel`

## Architecture

- `src/lib/codeBlockRenderer.tsx` — `defineAppRenderer` config wiring parser + meta + preview + actual
- `src/lib/enrichedArgsAdapter.ts` — Custom stream adapter that splits the example's `{_request, _response}` envelope into standard events
- `src/components/ArtifactCodeBlock/InlinePreview.tsx` — Inline preview component (reused as the renderer's `preview`)
- `src/components/ArtifactCodeBlock/ArtifactView.tsx` — Side-panel content (reused as the renderer's `actual`)
- `src/library.ts` — Re-exports the standard chat library + adds prompt rules instructing the LLM to use the `create_code_block` tool
- `src/app/page.tsx` — `AgentInterface` wired with `artifactRenderers={[codeBlockRenderer]}` and the custom stream adapter (passed via `llm`)
- `src/app/api/chat/route.ts` — OpenAI route with `create_code_block` registered as a tool
