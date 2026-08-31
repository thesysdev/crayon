# Google ADK

An [OpenUI](https://openui.com) example showing how to wire a
[Google Agent Development Kit (ADK)](https://github.com/google/adk-js) agent
(TypeScript) to OpenUI Cloud.

## What this demonstrates

- A Google ADK `Agent` with a `FunctionTool` (weather) running inside a Next.js
  API route via an `InMemorySessionService` + `Runner`
- The model is OpenUI Cloud (Gemini over the OpenAI-compatible embed API). ADK
  JS has no first-party OpenAI client, so `adk-llm-bridge`'s `Custom()` adapter
  supplies a `BaseLlm`
- Bridging ADK's `runAsync` event stream into OpenAI-style chat-completion SSE
  chunks so OpenUI's `openAIAdapter()` can parse them
- Rendering streamed OpenUI Lang with `<AgentInterface />` and Cloud's
  `chatLibrary`

## Getting started

1. Create a `.env.local` file with your OpenUI Cloud key
   (https://console.thesys.dev/keys):

   ```bash
   echo "THESYS_API_KEY=sk-th-your-key-here" > .env.local
   ```

2. Install dependencies from this example directory:

   ```bash
   pnpm install --ignore-workspace
   ```

3. Run the dev server from this directory:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) and try a starter such as
"What's the weather like in Tokyo right now?".

## How it works

- `src/agent.ts` defines the `get_weather` tool and a `createAgent()` builder.
  The instruction is Cloud's `generateSystemPrompt()`. The model is Cloud's
  Gemini (`google/gemini-3.6-flash-free` by default; override with `OPENUI_MODEL`).
- `src/app/api/chat/route.ts` runs the agent with a `Runner`, keys ADK sessions
  by chat `threadId` (so multi-turn history is preserved), and streams the
  assistant text as OpenAI chat-completion SSE chunks.
- `src/app/page.tsx` renders `<AgentInterface />`, sending `{ messages, threadId }`
  to `/api/chat` and parsing the stream with `openAIAdapter()`.

To add more tools, define them with `FunctionTool` in `src/agent.ts` and pass
them to the `Agent`.

## Learn more

- [OpenUI documentation](https://openui.com/docs)
- [Google ADK for TypeScript](https://github.com/google/adk-js)

## Verify

```bash
pnpm verify
```
