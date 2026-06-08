# OpenUI + LangGraph Chat

A generative-UI chat app where the responses are produced by a **multi-agent
[LangGraph](https://langchain-ai.github.io/langgraphjs/) graph** and rendered
live with [OpenUI](https://openui.com).

A supervisor routes each message to one of three specialists — **weather**,
**finance**, or **research** — and the chosen agent streams its answer as
[OpenUI Lang](https://www.openui.com/docs/openui-lang/overview), which the
renderer turns into cards, tables, and charts as the tokens arrive.

```
browser ──fetch /api/chat──▶ Next.js route ──@langchain/langgraph-sdk──▶ LangGraph server
   ▲                              │                                          (router → specialist
   └────── SSE (LangGraph) ───────┘                                           → tools → OpenUI Lang)
        parsed by langGraphAdapter()
```

## How it connects

| Piece | File | Role |
| --- | --- | --- |
| Frontend | `src/app/page.tsx` | `<FullScreen>` with `streamProtocol={langGraphAdapter()}`; converts messages with `langGraphMessageFormat.toApi`. |
| Proxy | `src/app/api/chat/route.ts` | Opens a stateless run on the LangGraph server and forwards its SSE. Keeps the API key + deployment URL server-side. |
| Graph | `src/agent/graph.ts` | Supervisor + specialist ReAct loops. Each specialist shares the generated OpenUI system prompt, so its output is OpenUI Lang. |
| Tools | `src/agent/tools.ts` | Mock `get_weather` / `get_stock_price` / `search_web` (no external keys needed). |
| Component library | `src/library.ts` | The OpenUI components the model is allowed to render. `pnpm generate:prompt` turns it into `src/generated/system-prompt.txt`. |

The graph streams in `messages-tuple` mode; the proxy normalizes those events to
`event: messages`, which is exactly what `langGraphAdapter()` consumes.

## Getting started (local)

This example runs **two processes**: the LangGraph server (runs the model) and
the Next.js app (serves the UI). Run them in two terminals.

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

2. **Terminal 1 — LangGraph server** (hot-reloads the graph on `:2024`):

   ```bash
   pnpm langgraph:dev
   ```

3. **Terminal 2 — Next.js app**:

   ```bash
   pnpm dev
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

`LANGSMITH_API_KEY` is sent as `x-api-key` by the SDK from the server side only.
Restart `pnpm dev` after changing `.env`.

## Customizing

- **Add a specialist:** extend the `SPECIALISTS` map in `src/agent/graph.ts` and
  add the matching `*_agent` / `*_tools` node pair in the graph wiring.
- **Use real tools:** replace the mock bodies in `src/agent/tools.ts` with real
  API calls.
- **Change what the model can render:** edit `src/library.ts`, then re-run
  `pnpm generate:prompt` (the dev scripts do this for you).

## Learn more

- [OpenUI docs](https://openui.com/docs) and the [LangGraph provider guide](https://www.openui.com/docs/chat/providers)
- [LangGraph.js docs](https://langchain-ai.github.io/langgraphjs/)
