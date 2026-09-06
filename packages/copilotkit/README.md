# `@openuidev/copilotkit`

Render streaming OpenUI Lang programs inside CopilotKit v2 tool calls. CopilotKit remains in charge of the chat shell, agent, transport, and tool lifecycle while OpenUI handles parsing, rendering, interaction state, and replay.

## Install

```bash
pnpm add @openuidev/copilotkit @copilotkit/react-core @openuidev/react-ui @openuidev/react-lang @openuidev/react-headless react react-dom zod zustand@^4.5.5
```

Import the CopilotKit and OpenUI styles once in the application:

```css
@import "@copilotkit/react-core/v2/styles.css";
@import "@openuidev/react-ui/layered/styles/index.css";
```

## Register the tools and instructions

```tsx
"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import { OpenUIProvider } from "@openuidev/copilotkit";

export function Chat() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <OpenUIProvider />
      <CopilotChat />
    </CopilotKit>
  );
}
```

The default integration registers two standalone tools:

- `present_openui` renders a complete card, table, chart, or other interface. `FollowUpBlock` clicks and optional list-item actions add one new user message and start one new CopilotKit agent run. The tool itself uses `followUp: false`, so a display-only response does not cause an empty model turn.
- `prompt_openui` renders a required form or choice as a CopilotKit human-in-the-loop tool. Its terminal OpenUI `@ToAssistant(...)` action calls `respond` once. `followUp: true` lets CopilotKit continue after that result.

`openuiIntegration` contains tools and an instruction string created from the same `openuiChatLibrary`, so the model and renderer share one component vocabulary.

`OpenUIProvider` must be mounted inside `CopilotKit`. It uses CopilotKit's `useFrontendTool`,
`useHumanInTheLoop`, and `useAgentContext` hooks. The hook registration is important for the prompt
tool because it installs CopilotKit's pending human-response bridge, not only a visual renderer.

## Customize the component library

Use the integration factory to keep custom libraries, tool names, and model instructions aligned:

```tsx
import { createOpenUIIntegration } from "@openuidev/copilotkit";
import { library } from "./library";

const openui = createOpenUIIntegration({
  library,
  presentToolName: "show_panel",
  promptToolName: "ask_panel",
  agentId: "support-agent",
  theme: { mode: "dark" },
});

// Inside <CopilotKit>:
<OpenUIProvider integration={openui} />;
```

The result exposes `frontendTools`, `humanInTheLoop`, `instructions`, and the resolved `toolNames`. The factory also accepts custom descriptions, prompt options, renderer props, availability, theming, error handling, and an error fallback.

If the application already has an OpenUI `ThemeProvider`, set `disableThemeProvider: true` and let the host provider own the theme.

## Instruction context

`OpenUIInstructions` uses CopilotKit's `useAgentContext` hook, so its value is included in the
agent run without coupling the server runtime to React component-library imports. Use
`createOpenUIInstructions` when a custom integration needs to derive another client-side context
string from its own library.

## Tool lifecycle

The `ui` argument is rendered while CopilotKit reports `status: "inProgress"`. Parser errors can be transient while the argument streams, so the default error fallback appears only after streaming finishes.

Completed `prompt_openui` results include the action type, human-friendly message, parameters, optional form name, and form state. Replayed tool calls hydrate the submitted form state automatically.
