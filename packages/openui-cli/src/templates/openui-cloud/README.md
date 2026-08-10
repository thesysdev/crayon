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
by adding system prompts or tools. A LangGraph scaffold puts the deployable agent in
`src/agent/agent.ts` instead.

## Framework deployments

The Vercel AI SDK scaffold is a standard Next.js app: `streamText()` owns the
agent loop and UIMessage stream, so the whole project can be deployed to Vercel.

The LangGraph scaffold contains two deployables. `pnpm dev` runs Next.js and the
local Agent Server together. Deploy `langgraph.json` to LangSmith, deploy the
Next.js frontend separately, then set `LANGGRAPH_API_URL` and
`LANGSMITH_API_KEY` on the frontend deployment. Set `THESYS_API_KEY` on the
LangSmith deployment because the graph uses OpenUI Cloud as its model provider.

In both variants, your framework executes application tools. OpenUI Cloud
provides managed conversation storage and executes its provider tools: reports,
presentations, web search, image search, and configured MCP servers.

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
- `@openuidev/devtools` — dev-only widget surfacing errors and the credits notice
  (rendered only in development).

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
