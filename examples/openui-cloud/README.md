# openui-cloud — OpenUI Cloud integration example

A Next.js app showing how an external app integrates with OpenUI Cloud using its
**two-plane** model:

- **Generation plane (master key, server-side):** `/api/chat` forwards
  `{ threadId, input }` to `POST /v1/embed/responses` with the org master key
  (`conversation: threadId`, `store:true`, `stream:true`, `tools:[artifactTool()]`,
  `instructions: createResponsesInstructions()`) and pipes the SSE stream back
  unchanged. `/api/frontend-token` proxies `POST /v1/frontend-tokens` so the
  browser gets a short-lived `fct_` token **without ever seeing the master key**.
- **Read/edit plane (fct_, browser-direct):** the client page wires
  `<AgentInterface llm storage componentLibrary artifactRenderers />` against a
  `ChatStorage` from `openuiCloud()` (browser → `/v1/conversations` +
  `/v1/artifacts` via the `x-thesys-frontend-token` header, single-flight refresh
  + 401 retry) and the presentation/report artifact renderers
  (`Presentation`/`Report` from `@openuidev/thesys`).

## Setup

```bash
cp .env.example .env.local   # fill THESYS_MASTER_API_KEY and point the base URLs at your API
```

Required env (see `.env.example`): `THESYS_MASTER_API_KEY`, `OPENUI_CLOUD_BASE_URL`,
`OPENUI_MODEL` (bare `provider/model`, e.g. `openai/gpt-5`), `DEMO_USER_ID`,
`NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL`.

## Run

```bash
pnpm dev      # http://localhost:3300
```

Point `OPENUI_CLOUD_BASE_URL` / `NEXT_PUBLIC_OPENUI_CLOUD_BASE_URL` at your OpenUI
Cloud API origin.

## Typecheck

```bash
pnpm exec tsc --noEmit
```

## SDK packages

- `@openuidev/thesys-server` — the server SDK (`artifactTool`,
  `createResponsesInstructions`) used by the `/api/chat` route.
- `@openuidev/thesys` — the React component library (`chatLibrary`, `Presentation`,
  `Report`) used by the client page and artifact renderers.
- `@openuidev/react-headless` / `@openuidev/react-ui` — the chat UI runtime
  (`AgentInterface`, storage/stream contracts, `defineArtifactRenderer`).
