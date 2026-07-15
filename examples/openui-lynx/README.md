# OpenUI Lynx Chat

A full-stack chat application that streams model-generated
[OpenUI Lang](https://www.openui.com/docs/openui-lang/overview) into a native ReactLynx UI.
It follows the architecture of the React Native example while using Lynx's official built-in
OpenUI component library.

## Architecture

```text
┌──────────────────────────────┐       ┌──────────────────────────────┐
│ ReactLynx chat app           │ HTTP  │ Next.js model backend        │
│                              │ POST  │                              │
│ • Native message list        │──────▶│ • Validates chat history     │
│ • Starters + composer        │       │ • Builds Lynx OpenUI prompt  │
│ • Streaming fetch reader     │◀──────│ • Streams raw OpenUI Lang    │
│ • <OpenUiRenderer />         │ text  │ • Keeps API keys server-side │
│ • @ToAssistant round-trips   │       │ • CORS for web preview       │
└──────────────────────────────┘       └──────────────────────────────┘
           :8080                                  :3001
```

The server generates its system instruction with
`buildOpenUiSystemPrompt()` and the client renders with `createOpenUiLibrary()`. Both come
from the same `@lynx-js/genui` version, so the model and renderer share one component contract.

## Run it

Prerequisites: Node.js 22.12+, pnpm, an OpenAI API key, and
[Lynx Explorer](https://lynxjs.org/guide/start/quick-start.html#preview-on-mobile) for a native
device preview.

From the repository root:

```bash
pnpm install
cp examples/openui-lynx/backend/env.example examples/openui-lynx/backend/.env.local
```

Add your API key to `backend/.env.local`, then start both processes:

```bash
pnpm --filter openui-lynx dev
```

- Backend status: <http://localhost:3001>
- Web preview: <http://localhost:8080/__web_preview?casename=main.web.bundle>
- Native preview: scan the QR code printed by Rspeedy in Lynx Explorer

You can also run the processes independently:

```bash
pnpm --filter openui-lynx dev:backend
pnpm --filter openui-lynx dev:app
```

## Device networking

Rspeedy automatically compiles the first non-internal LAN address into the development bundle,
for example `http://192.168.1.10:3001/api/chat`. This matters because `localhost` on a phone is
the phone, not the development machine.

Override auto-detection from `app/.env` when using a simulator, tunnel, or remote backend:

```bash
PUBLIC_OPENUI_API_URL=https://your-tunnel.example/api/chat
```

Or pass a shell-only override before starting Rspeedy:

```bash
OPENUI_API_URL=http://10.0.2.2:3001/api/chat pnpm --filter openui-lynx dev:app
```

Only variables prefixed with `PUBLIC_` are bundled into the app. Never put the provider API key
in the client environment.

## Project structure

```text
examples/openui-lynx/
├── package.json                    # Full-stack convenience scripts
├── backend/
│   ├── env.example                # Provider configuration
│   └── src/app/
│       ├── page.tsx               # Backend status page
│       └── api/chat/route.ts       # Validated raw-text model stream
└── app/
    ├── lynx.config.ts              # Web/native builds + LAN API URL
    └── src/
        ├── App.tsx                 # Native chat shell and action handling
        ├── App.css                 # Chat and OpenUI renderer styles
        ├── config.ts               # Backend URL selection
        ├── useStreamingChat.ts     # Cross-platform Lynx stream reader
        └── types.ts                # View and API message types
```

## What the client demonstrates

- A virtualized, non-recycling Lynx message list so generated component state remains mounted
- A native Lynx composer, starter prompts, stop, and clear controls
- Cumulative raw OpenUI Lang passed to `<OpenUiRenderer />` while each response streams
- `@ToAssistant(...)` actions sent back as real user turns with the existing conversation history
- Safe fallback UI for network, provider, and renderer failures
- `@OpenUrl(...)` surfaced to the host so an embedding app can connect its own navigation bridge

The app requests standard response-body streaming from Lynx with
`lynxExtension: { useStreaming: true }`. Embedded Lynx hosts should enable standard Fetch API
streaming in their page configuration; current Lynx Explorer builds already provide the required
network service.

## Configure the model

`backend/.env.local` accepts:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.5
# OPENAI_BASE_URL=https://api.openai.com/v1
```

`OPENAI_BASE_URL` makes the route usable with compatible gateways. The route deliberately returns
raw `text/plain` chunks rather than SSE because that maps directly to Lynx's streaming body reader.

## Verify production builds

```bash
pnpm --filter openui-lynx check:all
pnpm --filter openui-lynx build:all
```

## Learn more

- [Official Lynx OpenUI guide](https://lynxjs.org/next/react/genui/openui.html)
- [Lynx networking and streaming Fetch](https://lynxjs.org/guide/interaction/networking)
- [OpenUI Lang v0.5 specification](https://www.openui.com/docs/openui-lang/specification-v05)
- [React Native full-stack example](../openui-react-native)
