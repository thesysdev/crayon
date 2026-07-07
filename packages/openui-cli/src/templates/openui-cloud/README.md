This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

```bash
cp .env.example .env.local   # fill THESYS_API_KEY and point the base URLs at your API
```

Required env: `THESYS_API_KEY`, `OPENUI_MODEL` (bare `provider/model`, e.g. `openai/gpt-5`), `DEMO_USER_ID`.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `src/app/api/route.ts` and improving your agent
by adding system prompts or tools.

## Switching Models

To switch the chat model used for the app, add an `OPENUI_MODEL` env var in your .env file. Thesys Server accepts a value in the `provider/model` format compliant with [models.dev](models.dev). Some of the models supported include:

| Provider | Model     | Model String |
|----------|-----------|--------------|
| Google | Gemini 3.1 Flash Lite | google/gemini-3.1-flash-lite-free |
| Google | Gemini 3.1 Pro | google/gemini-3.1-pro-free |
| Google | Gemini 3.5 Flash | google/gemini-3.5-flash-free |
| OpenAI | GPT 5.2 | openai/gpt-5.2 |
| OpenAI | GPT 5.5 | openai/gpt-5.5 | 
| OpenAI | GPT 5 |  openai/gpt-5.4|
| OpenAI | GPT 5 |  openai/gpt-5.4-mini|
| OpenAI | GPT 5 |  openai/gpt-5.1|
| OpenAI | GPT 5 |  openai/gpt-5|
| OpenAI | GPT 5 |  openai/gpt-5-mini|
| OpenAI | GPT 5 |  openai/gpt-5-nano|
| OpenAI | GPT 5 |  openai/gpt-4.1|
| OpenAI | GPT 5 |  openai/gpt-4.1-mini|
| OpenAI | GPT 5 |  openai/gpt-4o|
| Anthropic | Claude Sonnet  |  anthropic/claude-sonnet-5|
| Anthropic | Claude Opus  |  anthropic/claude-opus-4.7|
| Anthropic | Claude Sonnet  |  anthropic/claude-sonnet-4.6|
| Anthropic | Claude Sonnet  |  anthropic/claude-sonnet-4|
| Anthropic | Claude Haiku  |  anthropic/claude-haiku-4.5|



## SDK packages

- `@openuidev/thesys-server` — the server SDK (`artifactTool`,
  `createResponsesInstructions`) used by the `/api/chat` route.
- `@openuidev/thesys` — the React component library (`chatLibrary`, `Presentation`,
  `Report`) used by the client page and artifact renderers.
- `@openuidev/react-headless` / `@openuidev/react-ui` — the chat UI runtime
  (`AgentInterface`, storage/stream contracts, `defineArtifactRenderer`).

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
