This is an [OpenUI](https://openui.com) Self Hosted Chat project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

Create `.env.local` with your OpenAI credentials:

```bash
OPENAI_API_KEY=...
# Optional:
OPENAI_MODEL=gpt-5.2
```

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/chat/route.ts` and improving your agent
by adding system prompts or tools. A LangGraph scaffold puts the standalone Agent
Server implementation in `src/agent/agent.ts` instead.

If you selected LangGraph or the Vercel AI SDK, the generated route includes a `get_weather`
example. Ask “What’s the weather in Berlin?” to exercise its native tool loop.

## Framework deployments

The Vercel AI SDK scaffold runs its backend inside the Next.js API route, so the
frontend and backend can be deployed together as one Next.js project.

The LangGraph scaffold makes the backend independently deployable. `pnpm dev`
starts the local Agent Server and Next.js together. Run
`pnpm run deploy:langgraph` to deploy only the backend, then set
`LANGGRAPH_API_URL` and `LANGSMITH_API_KEY`
wherever the Next.js frontend runs. Configure `OPENAI_API_KEY`, `OPENAI_MODEL`,
and optional `OPENAI_BASE_URL` on the Agent Server deployment.

## Conversation storage

This starter does not configure durable conversation storage. `AgentInterface`
keeps messages in memory for the current page session and sends that history to
`/api/chat`; refreshing the page loses it. The LangGraph relay creates and
deletes a temporary Agent Server thread for each run, so it does not provide
chat persistence by itself. To persist conversations, pass a storage
implementation to `AgentInterface` and back it with your own database. Add a
LangGraph checkpointer separately only for graph-specific durable state.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
