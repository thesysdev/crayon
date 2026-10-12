# OpenUI x F1

A Formula 1 demo built on OpenUI: a "team radio" chat that answers with live charts, tables and F1 visuals, alongside Home, Standings, Drivers and Teams dashboards. All data comes from [OpenF1](https://openf1.org).

It grew out of the [conversational analytics cookbook](../../cookbooks/conversational-analytics). The cookbook stays small and matches its [walkthrough](https://www.openui.com/cookbooks/conversational-analytics); this app is the full demo that gets deployed.

## Run it

```bash
npm install
echo "THESYS_API_KEY=sk-th-..." > .env.local
npm run snapshot:f1   # optional: cache finished 2026 sessions so the tools work offline
npm run dev
```

Open http://127.0.0.1:3000.

| Variable            | Default            | Purpose                                                    |
| ------------------- | ------------------ | ---------------------------------------------------------- |
| `THESYS_API_KEY`    | (required)         | OpenUI Gateway key, used only on the server                |
| `OPENUI_MODEL`      | `openai/gpt-5.5`   | Model for the chat                                         |
| `DEMO_USER_ID`      | `demo-user`        | Gateway user that owns the threads (there is no sign-in)   |
| `APP_ID`            | `f1-dashboard`     | Keeps this app's threads apart from others on the same key |
| `OPENF1_PER_MINUTE` | `28`               | OpenF1 request budget per minute                           |

## Pages

| URL                               | What it shows                                    |
| --------------------------------- | ------------------------------------------------ |
| `/`, `/standings`, `/drivers`, `/teams` | Dashboards; picking anything starts a chat |
| `/new`                            | A new chat with suggested questions              |
| `/[threadId]`                     | An earlier chat, loaded from Gateway             |
| `/component`                      | Gallery of the F1 components and charts          |

Every app URL is drawn by `src/app/(radio)/layout.tsx` over one empty catch-all page, so the chat stays mounted while the URL moves to a new thread mid-answer.

## How a question is answered

1. The browser sends the thread id and the new question to `/api/chat`.
2. The route loads the thread's earlier turns from its Gateway conversation, with their tool calls and results.
3. Gateway's Chat Completions API picks F1 tools (`get_results`, `get_lap_times`, `get_standings`, …). The route runs them between completions (`src/lib/tool-loop.ts`) and streams AG-UI events, so each tool call shows its result live.
4. The answer streams back as OpenUI Lang and renders with the F1 component library (`src/library.ts`). Charts fetch their own rows from `/api/f1/[tool]`, so numbers never pass through the model.
5. The turn is stored in the Gateway conversation before the stream ends, so a follow-up sees it.

## Data

The tools (`src/lib/f1/tools`) call OpenF1 through one rate-limited client with a disk cache under `data/openf1`. Finished sessions are cached forever, and a stale copy is served if OpenF1 is down. `npm run snapshot:f1` fills that cache ahead of time; `npm run snapshot:f1 -- --year 2025 --light` adds last season.

The legacy `query_lap_times` tool over the 2024 Miami race is only sent to the model after `npm run prepare:data`.

## Deploying

`next.config.ts` bundles `data/**` into the API routes, so run `npm run snapshot:f1` before building. Hosts with a read-only filesystem keep new OpenF1 responses in memory only.

The app has no sign-in: the API routes accept only same-origin requests, and every visitor shares one Gateway user's threads. Add authentication, mint frontend tokens per user, and add rate limits before exposing it widely.
