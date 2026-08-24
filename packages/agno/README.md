# `@openuidev/agno`

Connect an Agno AgentOS to OpenUI without copying transport or persistence glue.

The integration is intentionally complementary:

- **AgentOS handles everything behind the UI:** agents, teams, models, tools,
  memory, knowledge, sessions, authorization, execution, and deployment.
- **OpenUI handles the UI:** component instructions, streamed OpenUI Lang,
  rendering, interactions, forms, charts, theming, and the chat surface.
- **AG-UI is the boundary** between the two systems.

## Install

```bash
pnpm add @openuidev/agno @openuidev/react-ui
```

Import OpenUI styles once:

```css
@import "@openuidev/react-ui/layered/styles/index.css";
```

## Connect AgentInterface to AgentOS

```tsx
import { createAgnoLLM, agnoStorage } from "@openuidev/agno";
import { AgentInterface } from "@openuidev/react-ui";

const llm = createAgnoLLM({
  url: "http://localhost:7777/agui",
  forwardedProps: { user_id: "demo-user" },
});

const storage = agnoStorage({
  baseUrl: "http://localhost:7777",
  entityType: "agent",
  entityId: "openui-assistant",
  userId: "demo-user",
});

export function Chat() {
  return <AgentInterface llm={llm} storage={storage} />;
}
```

For an authenticated AgentOS, pass a scoped bearer token through `token` and
omit `userId`/`forwardedProps.user_id`; AgentOS derives identity from the token.

## What the package owns

- `createAgnoLLM()` adds AgentOS's AG-UI extension containers and configures
  the Agno-aware stream adapter.
- `agnoAGUIAdapter()` removes non-chat lifecycle/state events and Agno's empty
  tool-parent text envelope while retaining streamed text, tools, and errors.
- `agnoStorage()` maps OpenUI threads to AgentOS `/sessions` APIs and reloads
  messages from AgentOS `chat_history`.
- The mapping is deliberately 1:1: the OpenUI `thread.id` is the AgentOS
  `session_id`, so chat, persistence, inspection, and operational tooling all
  address the same conversation without a translation table.
- `agnoHistoryToMessages()` exposes the tolerant history conversion separately
  for custom storage implementations.

The package does not run an agent, proxy model keys, or create a second source
of conversation truth.

## AgentOS backend

The backend remains normal Agno Python code. Generate the OpenUI component
prompt from the frontend library, then include it in the agent instructions:

```python
from agno.agent import Agent
from agno.db.sqlite import SqliteDb
from agno.models.openai import OpenAIResponses
from agno.os import AgentOS
from agno.os.interfaces.agui import AGUI

agent = Agent(
    id="openui-assistant",
    model=OpenAIResponses(id="gpt-5.5"),
    db=SqliteDb(id="openui", db_file="tmp/openui.db"),
    instructions=[openui_system_prompt],
    add_history_to_context=True,
)

agent_os = AgentOS(agents=[agent], interfaces=[AGUI(agent=agent)])
app = agent_os.get_app()
```

The local `examples/agno-chat` workspace contains a runnable client, a real
AgentOS server, and a deterministic no-key development harness.

## Current scope

This first local implementation supports streamed OpenUI responses, backend
tool timelines, authentication headers, agents/teams, and AgentOS-backed
conversation persistence. Native rendering and resumption of Agno HITL/client
tools is the next integration layer rather than something this package claims
to support already.
