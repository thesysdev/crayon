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

import { AssistantRuntimeProvider, Tools, useAui } from "@assistant-ui/react";
import { OpenUIInstructions, openuiToolkit } from "@openuidev/assistant-ui";

export function OpenUIRuntimeProvider({ runtime, children }) {
  const aui = useAui({
    tools: Tools({ toolkit: openuiToolkit }),
  });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      <OpenUIInstructions />
      {children}
    </AssistantRuntimeProvider>
  );
}
```

The default toolkit registers two standalone tools:

- `present_openui` is a frontend tool for display-only cards, tables, charts, and other interfaces. It completes as soon as the streamed `ui` argument is available.
- `prompt_openui` is a human tool for forms and choices. It completes only when an OpenUI `@ToAssistant(...)` action submits a result.

`OpenUIInstructions` generates model instructions from the same `openuiChatLibrary` used by both renderers, so the model and renderer share one component vocabulary.

## Customize the component library

Create the toolkit and instruction string from the same library:

```tsx
import { createOpenUIInstructions, createOpenUIToolkit } from "@openuidev/assistant-ui";
import { useAssistantInstructions } from "@assistant-ui/react";
import { library } from "./library";

const toolkit = createOpenUIToolkit({ library });
const instructions = createOpenUIInstructions({ library });

function Instructions() {
  useAssistantInstructions(instructions);
  return null;
}
```

`createOpenUIToolkit` also accepts custom tool names, descriptions, renderer props, error handling, and an error fallback. Pass the same custom tool names to `createOpenUIInstructions`.

## Human-tool continuation

OpenUI returns the submitted action, message, parameters, and form state through assistant-ui's `addResult`. Replayed messages hydrate the submitted form state automatically.

If the runtime has an automatic tool-continuation predicate, continue only after a completed `prompt_openui` call. A completed `present_openui` call is already the final display response and should not start another model step.

Parser errors can be transient while the `ui` argument is streaming. The default error fallback appears only after streaming finishes. Use `onError` to observe the structured OpenUI errors or set `ErrorFallback: null` to suppress the fallback.
