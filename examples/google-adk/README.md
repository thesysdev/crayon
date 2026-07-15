# google-adk-chat

An [OpenUI](https://openui.com) example showing how to wire a
[Google Agent Development Kit (ADK)](https://github.com/google/adk-js) agent
(TypeScript) to OpenUI's generative UI frontend.

## What this demonstrates

- A Google ADK `Agent` with a `FunctionTool` (weather) running inside a Next.js
  API route via an `InMemorySessionService` + `Runner`
- Bridging ADK's `runAsync` event stream into OpenAI-style chat-completion SSE
  chunks so OpenUI's `openAIAdapter()` can parse them
- Rendering the streamed OpenUI Lang with OpenUI's `<AgentInterface />` and the
  built-in `openuiChatLibrary`

The ADK agent is prompted with OpenUI's generated system prompt
(`src/generated/system-prompt.txt`), so its replies are OpenUI Lang that the
frontend renders as live generative UI (cards, tables, forms, charts…).

## Getting started

1. Create a `.env.local` file with your Gemini key
   (get a free one at https://aistudio.google.com/apikey):

   ```bash
   echo "GEMINI_API_KEY=your-key-here" > .env.local
   ```

2. Install dependencies from the monorepo root:

   ```bash
   pnpm install
   ```

3. Run the dev server from this directory:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) and try a starter such as
"What's the weather like in Tokyo right now?".

## How it works

- `src/agent.ts` defines the `get_weather` tool and a `createAgent()` builder
  that appends OpenUI's generated system prompt to the agent's instruction.
- `src/app/api/chat/route.ts` runs the agent with a `Runner`, keys ADK sessions
  by chat `threadId` (so multi-turn history is preserved), and streams the
  assistant text as OpenAI chat-completion SSE chunks.
- `src/app/page.tsx` renders `<AgentInterface />`, sending `{ messages, threadId }`
  to `/api/chat` and parsing the stream with `openAIAdapter()`.

The `dev` script regenerates `src/generated/system-prompt.txt` from
`src/library.ts` before starting Next.js (`pnpm generate:prompt`). Re-run it
after changing the component library.

To add more tools, define them with `FunctionTool` in `src/agent.ts` and pass
them to the `Agent`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Google ADK for TypeScript](https://github.com/google/adk-js)
