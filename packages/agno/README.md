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
pnpm add @openuidev/agno @openuidev/react-headless @openuidev/react-lang @openuidev/react-ui react
```

Import OpenUI styles once:

```css
@import "@openuidev/react-ui/layered/styles/index.css";
```

## Connect AgentInterface to AgentOS

```tsx
import { agnoOpenUIPromptRenderer, createAgnoLLM, agnoStorage } from "@openuidev/agno";
import { AgentInterface, openuiChatLibrary } from "@openuidev/react-ui";

const llm = createAgnoLLM({
  url: "http://localhost:7777/agui",
  forwardedProps: { user_id: "demo-user" },
  context: [{ description: "openui_client", value: "true" }],
});

const storage = agnoStorage({
  baseUrl: "http://localhost:7777",
  entityType: "agent",
  entityId: "openui-assistant",
  userId: "demo-user",
});

export function Chat() {
  return (
    <AgentInterface
      llm={llm}
      storage={storage}
      componentLibrary={openuiChatLibrary}
      artifactRenderers={[agnoOpenUIPromptRenderer]}
    />
  );
}
```

For an authenticated AgentOS, pass a scoped bearer token through `token` and
omit `userId`/`forwardedProps.user_id`; AgentOS derives identity from the token.

## What the package owns

- `createAgnoLLM()` adds AgentOS's AG-UI extension containers and configures
  the Agno-aware stream adapter.
- `agnoAGUIAdapter()` removes non-chat lifecycle/state events and Agno's empty
  tool-parent text envelope while retaining streamed text, tools, and errors.
  When assistant text is fenced as `openui`, it removes only that wrapper
  incrementally so OpenUI receives the inner language as progressive deltas.
- `agnoStorage()` maps OpenUI threads to AgentOS `/sessions` APIs and reloads
  messages from AgentOS `chat_history`. It removes the same optional wrapper
  during history conversion, so a reloaded thread follows the live render path.
- The mapping is deliberately 1:1: the OpenUI `thread.id` is the AgentOS
  `session_id`, so chat, persistence, inspection, and operational tooling all
  address the same conversation without a translation table.
- `agnoHistoryToMessages()` exposes the tolerant history conversion separately
  for custom storage implementations.
- `agnoOpenUIPromptRenderer` renders the Agno `prompt_openui` HITL tool.
  Submissions become AG-UI tool results that resume the paused AgentOS run.

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
from agno.tools import tool

@tool(external_execution=True, external_execution_silent=True)
def prompt_openui(ui: str, fallback_markdown: str) -> str:
    """Render a form or choice and wait for its submission."""
    return fallback_markdown

def instructions(run_context=None):
    dependencies = getattr(run_context, "dependencies", None) or {}
    if dependencies.get("openui_client") is True:
        return [
            openui_system_prompt,
            """For complete visual answers, return exactly one Markdown fence labeled
            openui. Put root first and do not add text outside the fence. Use
            prompt_openui only when a user action must pause and resume the run;
            its ui argument is raw OpenUI Lang without a fence.""",
        ]
    return ["Respond in ordinary text or Markdown. Do not call prompt_openui."]

agent = Agent(
    id="openui-assistant",
    model=OpenAIResponses(id="gpt-5.5"),
    db=SqliteDb(id="openui", db_file="tmp/openui.db"),
    tools=[prompt_openui],
    instructions=instructions,
    add_history_to_context=True,
)

agent_os = AgentOS(agents=[agent], interfaces=[AGUI(agent=agent)])
app = agent_os.get_app()
```

The fence is a single, lossless payload. AgentOS stores and displays it as a
readable Markdown code block; it does not need to render the interface. The
Agno adapter drops only the opening and closing fence as bytes arrive, so the
same payload progressively renders in OpenUI and reloads from session history.

`prompt_openui` is reserved for a real human-in-the-loop boundary: AgentOS
persists a paused run, OpenUI collects the required action and form state, and
the package submits a trailing tool message to resume that same run. A database
is required for AgentOS to reload and resume paused runs. Current AgentOS emits
the prompt tool arguments after the call is complete, so the prompt interface
appears as one tool payload rather than progressively. Its subsequent assistant
answer uses the normal fenced streaming path.

For one agent shared by OpenUI and native AgentOS chat, use a callable Agno
instruction function. The example marks AG-UI requests with the transient
`openui_client` context dependency: those runs receive the generated component
prompt, fenced output rule, and HITL tool rule; native AgentOS runs receive
ordinary Markdown rules and do not call the UI tool.

The local `examples/agent-frameworks/agno` workspace contains a runnable client, a real
AgentOS server, and a deterministic no-key development harness.

## Current scope

This local implementation supports progressively streamed assistant OpenUI
Lang, paused human tools and resumption, backend tool timelines,
authentication headers, agents/teams, and
AgentOS-backed conversation persistence. The stock AgentOS web app does not render
OpenUI Lang; it can inspect the fenced source while native AgentOS chat stays on
the ordinary text/Markdown path.
