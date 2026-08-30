# `@openuidev/assistant-ui`

Render streaming OpenUI Lang programs as assistant-ui Tool UI. The package keeps assistant-ui in charge of the conversation and tool lifecycle while OpenUI handles parsing, rendering, interaction state, and replay.

## Install

```bash
pnpm add @openuidev/assistant-ui @assistant-ui/react @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless react react-dom zod zustand@^4.5.5
```

Import the OpenUI styles once in your app:

```css
@layer theme, base, openui, components, utilities;

@import "@openuidev/react-ui/layered/styles/index.css";
```

The layer declaration keeps OpenUI above Tailwind's reset and below application
components and utilities. The tool renderers include OpenUI's light
`ThemeProvider` by default so their design tokens match a light assistant-ui
shell.

## Register the tools and instructions

```tsx
"use client";

import {
  AssistantRuntimeProvider,
  AuiConfig,
  AuiProvider,
  Tools,
  useAui,
  useAssistantInstructions,
} from "@assistant-ui/react";
import { openuiIntegration } from "@openuidev/assistant-ui";

function OpenUIModelInstructions() {
  useAssistantInstructions(openuiIntegration.instructions);
  return null;
}

function OpenUIConfigProvider({ children }) {
  const aui = useAui();
  const config = AuiConfig({
    tools: Tools({ toolkit: openuiIntegration.toolkit }),
  });

  return (
    <AuiProvider extends={aui} config={config}>
      <OpenUIModelInstructions />
      {children}
    </AuiProvider>
  );
}

export function OpenUIRuntimeProvider({ runtime, children }) {
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <OpenUIConfigProvider>{children}</OpenUIConfigProvider>
    </AssistantRuntimeProvider>
  );
}
```

Mount the OpenUI config inside `AssistantRuntimeProvider`. This keeps the tool
schemas, renderers, and instructions on the runtime's model-context client so
`AssistantChatTransport` can forward both tools to the backend.

The default toolkit registers two standalone tools:

- `present_openui` is a frontend tool for complete cards, tables, charts, and other interfaces. Follow-up suggestions start a new user turn automatically, and list items can use optional `@ToAssistant` actions for drill-downs. The tool completes as soon as the streamed `ui` argument is available.
- `prompt_openui` is a human tool for forms and choices. It completes only when an OpenUI `@ToAssistant(...)` action submits a result.

`openuiIntegration` contains a toolkit and instruction string created from the
same `openuiChatLibrary`, so the model and renderer share one component
vocabulary. `openuiToolkit`, `openuiInstructions`, and the
`OpenUIInstructions` component remain available as default conveniences.

## Customize the component library

Use the integration factory to keep custom libraries and tool names aligned:

```tsx
import { createOpenUIIntegration } from "@openuidev/assistant-ui";
import { library } from "./library";

const openui = createOpenUIIntegration({
  library,
  presentToolName: "show_panel",
  promptToolName: "ask_panel",
});
```

The result exposes `toolkit`, `instructions`, and the resolved `toolNames`.
`createOpenUIIntegration` also accepts custom descriptions, prompt options,
renderer props, theming, error handling, and an error fallback. Pass theme props
through the integration factory to customize the rendered tools:

```tsx
const openui = createOpenUIIntegration({
  theme: { mode: "dark" },
});
```

If the application already wraps assistant-ui in an OpenUI `ThemeProvider`, set
`disableThemeProvider: true` and let the host provider own the theme.

## Human-tool continuation

OpenUI returns the submitted action, message, parameters, and form state through assistant-ui's `addResult`. Replayed messages hydrate the submitted form state automatically.

The core integration is not tied to the Vercel AI SDK. Its toolkit, renderers,
and instructions can be used with any assistant-ui runtime that forwards tool
schemas and results. A runtime adapter only needs to continue the conversation
after `prompt_openui` receives its result, while leaving a completed
`present_openui` call as the final display response. Runtime-specific helpers
can implement that policy using the runtime's continuation API.

For a Vercel AI SDK runtime, the package provides that policy as an optional
convenience helper. Install `ai` and import it from the `/ai-sdk` subpath:

The helper supports AI SDK 6 and 7. AI SDK 7 requires Node.js 22 or later and
an ESM application.

```tsx
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { shouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";

const runtime = useChatRuntime({
  sendAutomaticallyWhen: shouldContinueAfterOpenUIPrompt,
});
```

The predicate waits for every tool in the latest step to finish, then continues
only when that step contains a completed `prompt_openui` call. A completed
`present_openui` call is already the final display response and does not start
another model step.

Match a custom integration's prompt tool name with a custom predicate:

```tsx
import { createOpenUIIntegration } from "@openuidev/assistant-ui";
import { createShouldContinueAfterOpenUIPrompt } from "@openuidev/assistant-ui/ai-sdk";

const openui = createOpenUIIntegration({
  promptToolName: "ask_panel",
});
const shouldContinue = createShouldContinueAfterOpenUIPrompt({
  promptToolName: openui.toolNames.prompt,
});
```

Parser errors can be transient while the `ui` argument is streaming. The default error fallback appears only after streaming finishes. Use `onError` to observe the structured OpenUI errors or set `ErrorFallback: null` to suppress the fallback.
