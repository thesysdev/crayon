# OpenUI + pi Agent Harness

A generative-UI frontend where you chat with the **pi coding agent** and get **generative UI**
answers — live React components instead of plain markdown — rendered with
[OpenUI](https://openui.com).

The App-Router route `src/app/api/chat/route.ts` _is_ the backend bridge to the pi SDK
([`@earendil-works/pi-coding-agent`](https://www.npmjs.com/package/@earendil-works/pi-coding-agent)),
so there's no second server and no CORS. Unlike the other examples, the "agent" here is a real
coding agent with `read` / `bash` / `edit` / `write` tools that act on a workspace you choose at
launch — see **Security** below.

## How it works

```
 Browser (src/app/page.tsx)
   FullScreen chat  ──POST /api/chat ({ systemPrompt, messages })──►  route.ts (runtime=nodejs)
   + openuiLibrary       x-conversation-id: <threadId>                     │
   renderer  ◄──NDJSON OpenAI chunks (delta.content = OpenUI Lang)─────────┤
                                                                           ▼
                                                          src/lib/pi-session.ts
                                                          Map<threadId, AgentSession>
                                                                           │
                                          createAgentSession({ resourceLoader with
                                          appendSystemPrompt: [openui prompt] })
                                                                           │
                                          session.subscribe() → text/thinking/tool events
                                          session.prompt(lastUserText)     ▼
                                                            pi SDK (read/bash/edit/write)
                                                            operating on the server cwd
```

- **Transport:** the frontend's `openAIReadableStreamAdapter()` parses **NDJSON** OpenAI
  `chat.completion.chunk`s (one JSON object per line). The route translates pi's `text_delta`
  events into `delta.content`, and pi's reasoning + tool executions into `delta.tool_calls`.
- **System prompt:** `page.tsx` generates the OpenUI Lang prompt client-side
  (`openuiLibrary.prompt(openuiPromptOptions)`) and sends it in the request body; the route
  injects it into pi via `DefaultResourceLoader({ appendSystemPrompt: [...] })`, so the backend
  prompt and the frontend renderer always reference the same component library.
- **Sessions:** each chat thread (a stable id sent as the `x-conversation-id` header) maps to
  one persistent pi `AgentSession`, so multi-turn context is preserved.

## Prerequisites

All you need is a **model provider API key**. You do **not** need the pi CLI installed — this app
embeds the pi SDK and reads credentials directly. Pick one of:

1. **An API key (recommended — no pi required).** Copy `.env.example` to `.env` and set a provider
   key, e.g. `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, or `GEMINI_API_KEY`. With just a key and no
   other config, the SDK resolves that provider's default model.
2. **An existing pi login.** If you already use the pi CLI, the app automatically picks up your
   `~/.pi/agent` auth and settings (model, provider, thinking level) — no `.env` needed.

If neither resolves, the chat still streams but opens with the SDK's "no models available" notice.

> **Note:** a Claude _subscription_ OAuth token (from `pi` login) lives in `~/.pi/agent` and relies
> on pi's refresh flow. For a self-contained deployment, prefer a plain **API key**.

## Run

From the repo root, install workspace deps once:

```bash
pnpm install
```

Then, from this example, set a provider key and point the agent at a project to work on:

```bash
cd examples/pi-agent-harness
cp .env.example .env   # set a provider API key (skip if using an existing pi login)

# Point the agent at the project you want it to work on:
pnpm dev -- /path/to/your/project
```

`pnpm dev` (no path) prompts you for the workspace; `PI_AGENT_CWD=/path pnpm dev` sets it without a
prompt. The launcher prints the resolved workspace before the server starts. (`build` doesn't need
a workspace — the agent only runs at request time, i.e. under `dev`/`start`.)

Then open the printed URL (default http://localhost:3000). Try:

- "Show me a card summarizing the files in this directory" → renders live OpenUI components.
- "Read package.json and list its scripts" → pi's `read` tool runs (you'll see a tool card).

Production:

```bash
pnpm build && pnpm start
```

## Configuration

| Env var        | Default         | Purpose                                              |
| -------------- | --------------- | ---------------------------------------------------- |
| `PI_AGENT_CWD` | `process.cwd()` | Workspace directory the coding agent reads/writes in |
| `PI_WEB_TOOLS` | `full`          | Set to `read-only` to disable `bash`/`edit`/`write`  |
| `PORT`         | `3000`          | Dev/prod server port                                 |

## Thinking states

The model's reasoning (a streaming "Thinking" card) and each tool run (`read`/`bash`/`edit`/`write`
with its input) are forwarded as `tool_calls` and render in OpenUI's collapsible "behind the
scenes" section, like the pi CLI. The "Thinking" card only appears when your model emits
reasoning. Tool _results_ (command output) aren't shown yet — OpenUI's streaming path renders
tool calls but not inline results; surfacing those needs a custom adapter/renderer.

## Why `--webpack`

The pi SDK is an **ESM-only** package (its `exports` map has no `require` entry) and a Node-only
chain that spawns bash, uses `import.meta`, and reads its own prompt/skill/theme files from disk —
it must run as a real Node module at runtime, never bundled. `src/lib/pi-session.ts` loads it via
a native dynamic `import()`, and `next.config.ts` marks it as an external so the bundler keeps it
that way. The dev/build scripts use `--webpack` because this external setup is the most reliable;
you can experiment with the default Turbopack + `serverExternalPackages` if you prefer.

## Notes & limitations

- **One turn at a time per conversation.** A second request on a conversation whose turn is still
  streaming gets a "please wait" notice rather than interrupting the in-flight turn.
- **In-memory, single-instance sessions.** They're pinned to `globalThis` (so they survive dev
  hot-reload) but reset on a full restart and aren't shared across server processes.

## Security

**This endpoint runs a real coding agent and is unauthenticated.** By default the agent has the
full toolset (`read`, `bash`, `edit`, `write`) and tools execute with **no human approval** (the
interactive approval prompt only exists in the pi TUI). It runs with the launching user's
permissions on `PI_AGENT_CWD`, and `bash` is **not** confined to that directory. Treat the
ability to reach this port as remote code execution.

- **Local, single-user use** (the default) is equivalent to running the pi CLI yourself — fine.
- **Any networked / shared / multi-user exposure requires protection.** At minimum:
  - set `PI_WEB_TOOLS=read-only` to disable `bash`/`edit`/`write`;
  - put it behind authentication / a reverse proxy and bind to loopback
    (`next start -H 127.0.0.1`) instead of the default `0.0.0.0`;
  - run the agent in an OS-level sandbox/container with dropped privileges and no network.

`PI_AGENT_CWD` is a discovery root, **not** a security boundary — `bash` can escape it.
