# OpenUI + DeepAgents Chat

A generative-UI chat app where the responses are produced by a
[deepagents](https://www.npmjs.com/package/deepagents) agent and rendered live
with [OpenUI](https://openui.com).

The agent has mock **weather**, **finance**, and **research** tools. Its
LangGraph protocol stream is transformed locally into AG-UI events on a custom
`openui` channel, so the browser can use OpenUI's AG-UI stream adapter.

```
browser ──fetch /api/chat──▶ Next.js route ──protocol v2──▶ LangGraph server
   ▲                              │                          (deepagent + tools
   └────── SSE (AG-UI) ◀──────────┘                           + custom:openui)
        parsed by agUIAdapter()
```

## How it connects

| Piece | File | Role |
| --- | --- | --- |
| Frontend | `src/app/page.tsx` | `<AgentInterface llm={fetchLLM({ url: "/api/chat", streamAdapter: agUIAdapter() })}>` using the AG-UI stream protocol. |
| Proxy | `src/app/api/chat/route.ts` | Converts AG-UI messages to LangChain messages, starts a protocol-v2 run, and relays `custom:openui` as AG-UI SSE. Keeps the API key + deployment URL server-side. |
| Graph | `src/agent/agent.ts` | `createDeepAgent` with the generated OpenUI system prompt, the mock tools, and the local stream transformer. |
| Transformer | `src/agent/openui-transformer.ts` | Maps root LangGraph protocol `messages` events into AG-UI events and emits them as `custom:openui`. |
| Stream helper | `src/lib/stream-openui.ts` | Talks to `/threads/:id/stream/events` and `/threads/:id/commands` using raw fetch. |
| Tools | `src/agent/tools.ts` | Mock `get_weather` / `get_stock_price` / `search_web` (no external keys needed). |
| Component library | `src/library.ts` | The OpenUI components the model is allowed to render. `pnpm generate:prompt` turns it into `src/generated/system-prompt.txt`. |

The transformer is intentionally local to this example for now. It mimics the
LangGraph protocol types instead of adding new toolkit dependencies, making it
easy to extract later if the OpenUI team wants to publish a shared integration.

## Getting started (local)

This example runs **two processes**: the LangGraph server (runs the model) and
the Next.js app (serves the UI). The default dev script starts both.

1. Create a `.env` from the template:

   ```bash
   cp .env.example .env
   ```

   ```env
   OPENAI_API_KEY=sk-your-key-here
   OPENAI_MODEL=gpt-5.5
   LANGGRAPH_API_URL=http://localhost:2024
   LANGGRAPH_ASSISTANT_ID=agent
   ```

2. Start the LangGraph server and Next.js app together:

   ```bash
   pnpm dev
   ```

   This generates the OpenUI prompt once, starts the LangGraph server on
   `:2024`, and starts Next.js on `:3000`.

   If you prefer separate terminals, run:

   ```bash
   pnpm langgraph:dev
   # in another terminal
   pnpm exec next dev
   ```

Open [http://localhost:3000](http://localhost:3000) and try a starter such as
"Weather in Tokyo" or "AAPL stock price".

> `OPENAI_API_KEY` is read by the **LangGraph server** (it runs the LLM), so it
> belongs in `.env` next to `langgraph.json`. The Next.js app only needs the
> `LANGGRAPH_*` variables.

## Using LangGraph Cloud / Platform

Deploy the graph (this folder already has a `langgraph.json`) and point the app
at the deployment instead of localhost — no app code changes:

```env
LANGGRAPH_API_URL=https://your-deployment.us.langgraph.app
LANGGRAPH_ASSISTANT_ID=agent        # graph name, or a created assistant id
LANGSMITH_API_KEY=lsv2-...          # auth for the deployment
```

`LANGSMITH_API_KEY` is sent as `x-api-key` from the server side only.
Restart `pnpm dev` after changing `.env`.

## Customizing

- **Change agent behavior:** update the deepagent prompt or tool list in
  `src/agent/agent.ts`.
- **Use real tools:** replace the mock bodies in `src/agent/tools.ts` with real
  API calls.
- **Change what the model can render:** edit `src/library.ts`, then re-run
  `pnpm generate:prompt` (the dev scripts do this for you).

## Learn more

- [OpenUI docs](https://openui.com/docs) and the [Agent Interface adapters guide](https://www.openui.com/docs/agent/reference/adapters-and-formats)
- [DeepAgents](https://www.npmjs.com/package/deepagents) and [LangGraph.js docs](https://langchain-ai.github.io/langgraphjs/)
