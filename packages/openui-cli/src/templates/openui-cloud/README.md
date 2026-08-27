This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

The CLI writes `.env` for you. If you cloned the generated project elsewhere,
create `.env` with `THESYS_API_KEY`, `DEMO_USER_ID`, and `APP_ID`.

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/chat/route.ts` and improving your agent
by adding system prompts or tools. A LangGraph scaffold puts the Agent Server implementation in
`src/agent/agent.ts` instead.

## Deploy

From the project directory:

```bash
npx @openuidev/cli@latest deploy
npx @openuidev/cli@latest deploy --prod
```

Deploys to Vercel. Allowlisted keys from `.env` / `.env.local` (including `THESYS_API_KEY`) are
passed to that deployment unless you use `--skip-env`. Persist them on the Vercel project for later
deploys.

## Framework deployments

The Vercel AI SDK scaffold is a standard Next.js app: `streamText()` owns the
agent loop and UIMessage stream, so the whole project can be deployed to Vercel.

The LangGraph scaffold contains two deployables. `pnpm dev` runs Next.js and the
local Agent Server together. Deploy the Next.js frontend to Vercel, then point
`LANGGRAPH_API_URL` at wherever the Agent Server runs. That Agent Server needs
`THESYS_API_KEY` because the graph uses OpenUI Cloud as its model provider.

In both variants, your framework executes application tools. OpenUI Cloud
provides managed conversation storage and executes its provider tools: reports,
presentations, web search, image search, and configured MCP servers.

## Conversation storage

OpenUI Cloud is the only durable conversation and artifact store in every Cloud
variant. The browser connects directly through `useOpenuiCloudStorage()` with a
short-lived token from `/api/frontend-token`. The `threadId` sent to `/api/chat`
is the Cloud conversation id, and the route appends each model turn to it with
`conversation: threadId` and `store: true`.
Browser `localStorage` holds only the selected model, not conversation messages.

The Vercel AI SDK route does not create a second store. The LangGraph relay uses
a temporary Agent Server thread for each run and deletes it afterward, so
LangGraph is not the persistent chat-history store. Add a LangGraph
checkpointer separately only if the graph needs durable state, interrupts, or
resumable runs.

## Switching Models

Use the model switcher in the chat header to choose a model for new messages. The starter keeps a
small curated model list in `src/lib/models.tsx` and sends the selected `provider/model` id to
`/api/chat`, which validates it against the same list. The built-in list includes Gemini, GPT,
Claude Sonnet, and Claude Opus options; free Gemini variants are marked with a `Free` badge.

The built-in model ids are available on [models.dev's OpenRouter provider
list](https://models.dev/providers/openrouter/).

## SDK packages

- `@openuidev/thesys-server` — the server SDK (`artifactTool`,
  `generateSystemPrompt`) used by the `/api/chat` route.
- `@openuidev/thesys` — the React component library (`chatLibrary`, `Presentation`,
  `Report`) used by the client page and artifact renderers.
- `@openuidev/react-ui` — the chat UI runtime (`AgentInterface`, `fetchLLM`,
  `ModelSwitcher`, storage/stream contracts).

A devtools widget is available automatically in development.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
