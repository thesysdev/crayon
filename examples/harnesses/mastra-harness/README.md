# OpenUI + Mastra Harness

A generative-UI chat application backed by Mastra's new `Harness` API. The app keeps the normal
OpenUI `<FullScreen />` chat surface, while the backend runs a persistent Mastra Harness session
with modes, LibSQL-backed threads/state, and tool activity streamed into OpenUI as AG-UI events.

## How it works

```text
Browser / OpenUI FullScreen
  |  localStorage thread list + transcript
  |  POST /api/chat { threadId, modeId, messages }
  v
Next.js route (nodejs runtime)
  |  threadId -> Mastra resourceId
  |  getOrCreate Harness Session
  |  session.sendMessage(latest user turn)
  v
Mastra Harness
  |  modes + storage + safe mock tools
  |  message/tool events
  v
Harness-to-AG-UI adapter
  |  SSE data: { AG-UI event }
  v
OpenUI renderer
```

## What this demonstrates

- Mastra `Harness` from `@mastra/core/harness`, with one shared Harness and one Session per OpenUI
  chat thread.
- LibSQL persistence for Harness threads and state, keyed by each OpenUI thread id.
- Harness modes (`Assist` and `Brief`) configured on the same backing agent, with a composer
  picker that switches the active Harness mode before the next user turn.
- Safe mock Mastra tools (`get_weather`, `get_stock_price`) surfaced in OpenUI's behind-the-scenes
  tool panel.
- A small adapter that maps Harness events (`message_update`, `tool_start`, `tool_input_delta`,
  `tool_end`, `error`) to AG-UI SSE events consumed by `agUIAdapter()`.

## Run locally

Install monorepo dependencies from the repository root:

```bash
pnpm install
```

Create an env file in this example:

```bash
cd examples/harnesses/mastra-harness
cp .env.example .env.local
```

Set `OPENAI_API_KEY`, then run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

| Environment variable   | Default                                      | Purpose                                |
| ---------------------- | -------------------------------------------- | -------------------------------------- |
| `OPENAI_API_KEY`       | unset                                        | API key for the configured model       |
| `OPENAI_MODEL`         | `openai/gpt-5.5`                             | Mastra model id                        |
| `OPENAI_BASE_URL`      | `https://api.openai.com/v1`                  | OpenAI-compatible endpoint             |
| `MASTRA_HARNESS_DB_URL` | `file:./.mastra-harness/openui-harness.db` | LibSQL database for Harness state      |

The `dev` and `build` scripts regenerate `src/generated/system-prompt.txt` from `src/library.ts`
before starting Next, so the backend prompt and frontend OpenUI renderer stay aligned.

## Notes

- This example uses safe read-only mock tools and grants the Harness `read` category in each
  session. It disables `ask_user`, `submit_plan`, and `subagent` because OpenUI's stock chat
  surface does not include a Harness approval/resume UI.
- Browser thread metadata and transcripts are stored in `localStorage`; Mastra Harness state is
  stored server-side in LibSQL. The OpenUI thread id is used as the Mastra `resourceId`, so a server
  restart can reattach to the most recent Harness thread for that resource.
