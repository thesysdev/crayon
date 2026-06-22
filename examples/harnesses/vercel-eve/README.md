# OpenUI + Vercel Eve Harness

A generative-UI chat application backed by a [Vercel Eve](https://github.com/vercel/eve)
agent. Eve keeps its native session and resumable-streaming protocol, while a small adapter
translates Eve events into AG-UI events that OpenUI renders as live React components.

## Prerequisites

- Node.js 24
- pnpm 9
- An API key for an OpenAI-compatible model provider

## Run locally

1. Install the monorepo dependencies from the repository root:

   ```bash
   pnpm install
   ```

2. Enter the example directory:

   ```bash
   cd examples/harnesses/vercel-eve
   ```

3. Copy the example environment file and add your provider configuration:

   ```bash
   cp .env.example .env
   ```

   Set `LLM_API_KEY` in `.env`. `LLM_MODEL` and `LLM_BASE_URL` select the model and any
   OpenAI-compatible endpoint. `OPENAI_API_KEY`, `OPENAI_MODEL`, and `OPENAI_BASE_URL` are
   accepted as aliases.

4. Start the Next.js application and embedded Eve development server:

   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) and start a conversation.

## How it works

```text
Browser / OpenUI FullScreen
  │
  ├─ POST /eve/v1/session or /eve/v1/session/:id
  ├─ GET  /eve/v1/session/:id/stream?startIndex=N
  │
  ▼
Eve HTTP channel ──► Eve agent ──► model + tools
  │
  ▼
Eve session events ──► AG-UI adapter ──► OpenUI renderer
```

- `src/app/page.tsx` renders OpenUI's `<FullScreen>` chat with the built-in component library.
- `src/eve-chat.ts` delivers turns through Eve's HTTP session protocol and persists session
  cursors per OpenUI thread.
- `src/eve-stream.ts` converts Eve text, tool-call, and failure events into AG-UI events.
- `agent/instructions/openui.ts` injects the generated OpenUI Lang prompt when an Eve session
  starts.
- `src/thread-store.ts` stores thread metadata, transcripts, continuation tokens, and stream
  positions in browser `localStorage`.

## Configuration

| Environment variable | Default                                          | Purpose                                        |
| -------------------- | ------------------------------------------------ | ---------------------------------------------- |
| `LLM_API_KEY`        | `OPENAI_API_KEY`                                 | API key sent to the configured model provider. |
| `LLM_MODEL`          | `OPENAI_MODEL` or `gpt-5.5`                      | Model used by the Eve agent.                   |
| `LLM_BASE_URL`       | `OPENAI_BASE_URL` or `https://api.openai.com/v1` | OpenAI-compatible API endpoint.                |

## Eve commands

The normal development command is `pnpm dev`. The package also exposes Eve directly:

```bash
pnpm eve:dev
pnpm eve:build
pnpm eve:start
```

For a production-style Next.js run:

```bash
pnpm build
pnpm start
```

## Project layout

```text
examples/harnesses/vercel-eve/
|- agent/agent.ts                    # Eve model and build configuration
|- agent/channels/eve.ts             # Eve HTTP session channel
|- agent/instructions/openui.ts      # Generated OpenUI Lang instructions
|- agent/tools/get_current_time.ts   # Example Eve tool
|- src/app/page.tsx                  # OpenUI FullScreen chat
|- src/eve-chat.ts                   # Eve session transport and persistence
|- src/eve-stream.ts                 # Eve-to-AG-UI event mapping
|- src/thread-store.ts               # Browser thread and transcript storage
|- next.config.ts                    # Installs Eve through withEve()
```

## Security

The example uses Eve's `none()` channel authentication for local development. Do not expose it
publicly in that form. Configure an authenticated Eve channel, restrict network access, and apply
the provider and tool permissions appropriate for your deployment.
