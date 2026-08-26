# OpenUI React Native Example

A full-stack example that demonstrates using `@openuidev/react-lang` in a React Native (Expo) app with a Next.js API backend. The LLM streams responses in [OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) and the mobile client renders them as native components in real time.

<video src="../../../docs/public/videos/react-native-demo.mp4"
    noControls
    playsInline
    muted
    preload="metadata"
    className="h-[600px] rounded-lg m-auto"
    autoPlay
    loop
/>

## Architecture

```
┌─────────────────────────────┐        ┌──────────────────────────┐
│   React Native (Expo) app   │  HTTP  │   Next.js backend (API)  │
│                             │ ──────►│                          │
│  • Chat UI                  │        │  • /api/chat  (POST)     │
│  • <Renderer /> parsing     │◄────── │  • Streams OpenUI Lang   │
│    streamed OpenUI Lang      │  stream│    from GPT              │
│  • Native chart components  │        │  • CORS enabled          │
└─────────────────────────────┘        └──────────────────────────┘
```

## Project Structure

```
react-native/
├── backend/                  # Next.js API server
│   ├── package.json          # Standalone backend dependencies and scripts
│   ├── src/
│   │   ├── library.ts        # Component library definition (Node-compatible)
│   │   ├── generated/
│   │   │   └── system-prompt.txt # Generated locally from library.ts
│   │   └── app/api/chat/
│   │       └── route.ts      # Streaming chat endpoint
│   └── env.example
└── chat-app/                 # Standalone Expo application
    └── package.json
```

The backend and mobile client are separate install units, so either can be installed, verified, or copied without a workspace.

## Getting Started

### Prerequisites

- Node.js 18+
- npm, pnpm, or Bun
- An OpenAI API key

### 1. Install dependencies

From the `react-native/` example directory, install each standalone application:

```bash
(cd backend && npm install)
(cd chat-app && npm install)
```

### 2. Configure the backend

```bash
cp backend/env.example backend/.env.local
```

Add your key to `backend/.env.local`:

```
OPENAI_API_KEY=sk-...
```

### 3. Generate the system prompt

The [Prompt Generator](https://www.openui.com/docs/openui-lang/overview) compiles `library.ts` into an ignored `generated/system-prompt.txt` containing component signatures, syntax rules, and streaming guidelines for the LLM. The backend dev and build commands run this step automatically; run it directly when you only want to refresh the generated artifacts:

```bash
(cd backend && npm run generate:prompt)
```

### 4. Start the backend

```bash
(cd backend && npm run dev)
```

The API will be available at `http://localhost:3000`.

### 5. Start the mobile app

```bash
(cd chat-app && npm run start)
```

## What's in This Example

### `backend/src/library.ts`

Defines the custom component library using [`defineComponent`](https://www.openui.com/docs/openui-lang/overview) and `createLibrary`. This is a **Node-compatible** version (renderers set to `null`) used only by the CLI to generate the system prompt — the backend never renders components itself.

The library exposes five components:

| Component   | Description                                                |
| ----------- | ---------------------------------------------------------- |
| `Card`      | Root container — every response is wrapped in one          |
| `Text`      | Text with optional `heading`, `body`, or `caption` variant |
| `BarChart`  | Vertical bar chart for comparing discrete categories       |
| `LineChart` | Line chart for trends over time                            |
| `PieChart`  | Pie chart for part-to-whole proportions                    |

### `backend/src/app/api/chat/route.ts`

A Next.js Route Handler that:

1. Loads `system-prompt.txt` at startup
2. Forwards the conversation to the OpenAI streaming API
3. Returns raw `text/plain` chunks — intentionally simpler than SSE so React Native can consume the stream directly without a browser `EventSource`

### React Native app (`chat-app/`)

Uses the [`<Renderer />`](https://www.openui.com/docs/openui-lang/overview) component from `@openuidev/react-lang` to progressively parse and render the streamed OpenUI Lang output as native components.

## Scripts

| Directory   | Script                    | Description                                      |
| ----------- | ------------------------- | ------------------------------------------------ |
| `backend/`  | `npm run dev`             | Start the Next.js API server                     |
| `backend/`  | `npm run generate:prompt` | Regenerate `system-prompt.txt` from `library.ts` |
| `chat-app/` | `npm run start`           | Start the Expo dev server                        |

## Learn More

- [OpenUI Lang overview](https://www.openui.com/docs/openui-lang/overview) — core building blocks: Library, Prompt Generator, Parser, Renderer
- [`@openuidev/react-lang` package](../../../packages/react-lang)

## Verify

```bash
(cd backend && npm run verify)
(cd chat-app && npm run verify)
```
