# `@openuidev/assistant-ui`

Render streaming OpenUI Lang programs as assistant-ui Tool UI. The package keeps assistant-ui in charge of the conversation and tool lifecycle while OpenUI handles parsing, rendering, interaction state, and replay.

## Install

```bash
pnpm add @openuidev/assistant-ui @assistant-ui/react @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless react react-dom zod zustand@^4.5.5
```

Import the OpenUI styles once in your app:

```css
@import "@openuidev/react-ui/layered/styles/index.css";
```

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

- `present_openui` is a frontend tool for display-only cards, tables, charts, and other interfaces. It completes as soon as the streamed `ui` argument is available.
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
renderer props, error handling, and an error fallback.

## Human-tool continuation

OpenUI returns the submitted action, message, parameters, and form state through assistant-ui's `addResult`. Replayed messages hydrate the submitted form state automatically.

For a Vercel AI SDK runtime, install `ai` and use the optional helper subpath:

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
