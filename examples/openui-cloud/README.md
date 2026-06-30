# openui-cloud — OpenUI Cloud integration example

A minimal **Next.js (App Router)** app that hosts OpenUI Cloud: a generative-UI chat that streams and persists them to your OpenUI Cloud org.

## Prerequisites

- Node + `pnpm`.
- An **OpenUI Cloud org master key** (`THESYS_API_KEY`).

## Setup

```bash
pnpm install
cp .env.example .env.local   # then fill THESYS_API_KEY
```

| Var              | Required | Default                       | Purpose                                                          |
| ---------------- | -------- | ----------------------------- | ---------------------------------------------------------------- |
| `THESYS_API_KEY` | yes      | —                             | Org master key. **Server-side only**; never reaches the browser. |
| `OPENUI_MODEL`   | no       | `anthropic/claude-sonnet-4.6` | Bare `provider/model` id for generation.                         |
| `DEMO_USER_ID`   | no       | `demo-user`                   | End-user identity stamped into the frontend token.               |

`.env.local` is gitignored. Restart `pnpm dev` after editing env.

## Run

```bash
pnpm dev      # http://localhost:3300
```

Open the app, pick a starter prompt ("Quarterly deck" / "Market report"), and watch the artifact render live as it streams.

## Scripts

```bash
pnpm dev        # dev server on :3300
pnpm build      # production build (output: standalone)
pnpm start      # serve the production build on :3300
pnpm typecheck  # tsc --noEmit
pnpm lint       # eslint
pnpm test       # vitest run
```
