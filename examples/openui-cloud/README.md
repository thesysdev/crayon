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
  `<AgentInterface llm storage componentLibrary artifactRenderers artifactCategories />`
  against a `ChatStorage` from the **`useOpenuiCloudStorage()`** hook (browser →
  `/v1/conversations` + `/v1/artifacts` via the `x-thesys-frontend-token` header,
  single-flight refresh + 401 retry) and the presentation/report artifact
  renderers (`artifactRenderers` / `artifactCategories` from `@openuidev/thesys`).

## Local dependency wiring (do this first)

`@openuidev/thesys` is **not published** — this app consumes it from a sibling
**genui-sdk** checkout via a vendored tarball, and `@openuidev/thesys-server` via a
vendored build. **Both `vendor/` artifacts are gitignored**, so after cloning you
must produce them yourself.

Prereq: `genui-sdk` cloned as a **sibling of `openui`** (so `../../../genui-sdk`
resolves from this dir), on branch **`ap-server`**.

```bash
# 1. Build the SDK packages in genui-sdk (on ap-server).
cd /path/to/genui-sdk
git checkout ap-server && git pull && pnpm install
pnpm --filter @openuidev/thesys build
pnpm --filter @openuidev/thesys-server build

# 2. Vendor both into openui-cloud.
VENDOR=/path/to/openui/examples/openui-cloud/vendor
( cd packages/c1 && pnpm pack --pack-destination "$VENDOR" )   # → openuidev-thesys-0.1.0.tgz
mkdir -p "$VENDOR/c1-server" && cp packages/c1-server/dist/index.* "$VENDOR/c1-server/"

# 3. Install this app (force — the tgz filename is stable, so pnpm caches it).
cd /path/to/openui/examples/openui-cloud
pnpm install --force
```

Re-run these whenever you change `c1` / `c1-server` in genui-sdk. `next.config.ts`
aliases `@openuidev/thesys-server` → `vendor/c1-server/index.mjs` (Turbopack won't
follow the cross-repo symlink) and stubs `lucide-react/dynamic`.

## Setup (env)

```bash
cp .env.example .env.local   # fill THESYS_API_KEY and point the base URLs at your API
```

Required env (see `.env.example`): `THESYS_API_KEY`, `OPENUI_CLOUD_BASE_URL`,
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
- `@openuidev/thesys` — the React SDK: `useOpenuiCloudStorage` (browser storage
  hook), `artifactRenderers` / `artifactCategories`, `chatLibrary`, and the
  `Presentation` / `Report` viewers, used by the client page. **Not published** —
  vendored from genui-sdk (see "Local dependency wiring").
- `@openuidev/react-headless` / `@openuidev/react-ui` — the chat UI runtime
  (`AgentInterface`, storage/stream contracts, `defineArtifactRenderer`).
