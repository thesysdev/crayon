This is an [OpenUI](https://openui.com) Cloud project bootstrapped with [`openui-cli`](https://openui.com/docs/chat/quick-start).

## Setup

```bash
cp .env.example .env.local   # fill THESYS_API_KEY and point the base URLs at your API
```

Required env: `THESYS_API_KEY`, `DEMO_USER_ID`.

Optional env: `OPENUI_MODEL` sets the server-side fallback model used before a user picks a model
in the app.

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

Use the model switcher in the chat header to choose a model for new messages. The starter keeps a
small curated model list in the frontend and sends the selected `provider/model` id to `/api/chat`.
The built-in list includes Gemini, GPT, Claude Sonnet, and Claude Opus options; free Gemini
variants are marked with a `Free` badge.

The built-in model ids are available on [models.dev's OpenRouter provider
list](https://models.dev/providers/openrouter/).

To set the initial server fallback, add `OPENUI_MODEL` to your `.env` file:

```bash
OPENUI_MODEL=google/gemini-3.1-pro-free
```

## SDK packages

- `@openuidev/thesys-server` — the server SDK (`artifactTool`,
  `createResponsesInstructions`) used by the `/api/chat` route.
- `@openuidev/thesys` — the React component library (`chatLibrary`, `Presentation`,
  `Report`) used by the client page and artifact renderers.
- `@openuidev/react-headless` / `@openuidev/react-ui` — the chat UI runtime
  (`AgentInterface`, storage/stream contracts, `defineArtifactRenderer`).

## Pseudonymous build telemetry

Projects scaffolded with CLI telemetry enabled contain a random project ID in
`.openui/telemetry.json`. After Next.js production compilation completes, the hook in
`next.config.ts` sends one best-effort event to OpenUI's PostHog project. This hook runs before type
checking and static generation, so the event means compilation completed, not that the full build
succeeded.

The event contains only the random project ID, template and framework identifiers, Next.js and Node
versions, platform and architecture, whether the build is running in CI, whether a Cloud key is
configured, and the telemetry schema version. It does not contain code, prompts, API keys, project
names or paths, repository metadata, environment-variable values, or build output.
Geo-IP enrichment and PostHog person-profile creation are disabled for this event.

Disable the event with either environment variable:

```bash
DO_NOT_TRACK=1 npm run build
OPENUI_TELEMETRY_DISABLED=1 npm run build
```

Projects originally created with `openui create --no-telemetry` do not receive a project ID, so the
build hook is a no-op.

## Learn More

To learn more about OpenUI, take a look at the following resources:

- [OpenUI Documentation](https://openui.com/docs) - learn about OpenUI features and API.
- [OpenUI GitHub repository](https://github.com/thesysdev/openui) - your feedback and contributions are welcome!
