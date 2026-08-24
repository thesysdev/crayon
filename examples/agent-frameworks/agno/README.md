# Agno × OpenUI

This example demonstrates the complementary boundary:

```text
AgentOS: agents · teams · tools · memory · knowledge · sessions · auth · execution
                                      │
                                    AG-UI
                                      │
OpenUI: component contract · streaming parser · renderer · interactions · chat UI
```

The browser uses `@openuidev/agno` for both channels expected by
`AgentInterface`:

- `createAgnoLLM()` streams an AgentOS AG-UI run.
- `agnoStorage()` stores the sidebar and message history in AgentOS sessions.

## Run without a model key

The Vite development server includes a deterministic AgentOS-compatible
harness. It exercises session CRUD, Agno's empty tool-parent envelope, a backend
tool result, streamed OpenUI Lang, follow-ups, and a validated form.

```bash
pnpm dev
```

Open `http://127.0.0.1:4173` and try both starters.

## Run with AgentOS

Configure the required model credential outside the repository, then:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
pnpm generate:prompt
python server.py
```

In another terminal, point the Vite proxy at AgentOS:

```bash
AGNO_API_URL=http://127.0.0.1:7777 pnpm dev
```

The React application does not change.

The Python server is deliberately ordinary Agno code: it owns the model, tool,
database, history, and AG-UI interface. The component library and all rendering
remain in the OpenUI frontend.
