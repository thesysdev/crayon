# OpenUI with CopilotKit

A runnable Next.js example showing `@openuidev/copilotkit` inside the CopilotKit v2 chat shell.

CopilotKit owns the agent, runtime endpoint, chat UI, streaming lifecycle, and follow-up runs. The OpenUI package contributes model instructions, a frontend display tool, a human-in-the-loop prompt tool, and renderers for the streamed `ui` argument.

## Run it

```bash
pnpm install --ignore-workspace
cp .env.example .env.local
```

Set `OPENAI_API_KEY` in `.env.local`. You can also change `OPENAI_MODEL`, which defaults to
`gpt-4.1-mini`. Then run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Acceptance prompts

Paste these prompts into the chat to exercise each integration path:

1. Ask for a quarterly revenue comparison to render a chart and follow-up suggestions.
2. Click a follow-up to add one user message and start one new CopilotKit agent run.
3. Ask for event registration to render a human-in-the-loop form, enter values, and submit it once.
4. Ask for project plans to render a table with an optional list-item drill-down action.

The client mounts `OpenUIProvider` inside `CopilotKit`. That component registers the display tool,
the interactive human-in-the-loop handler, and the matching model vocabulary through CopilotKit's
v2 hooks. The server route stays focused on the CopilotKit runtime and model.
