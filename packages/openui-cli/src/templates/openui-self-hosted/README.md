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
by adding system prompts or tools.

If you selected LangGraph or the Vercel AI SDK, the generated route includes a `get_weather`
example. Ask “What’s the weather in Berlin?” to exercise its native tool loop.

## Conversation storage

This starter does not configure durable conversation storage. `AgentInterface`
keeps messages in memory for the current page session and sends that history to
`/api/chat`; refreshing the page loses it. To persist conversations, pass a
storage implementation to `AgentInterface` and back it with your own database.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
