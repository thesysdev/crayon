# assistant-ui + OpenUI example

This example runs assistant-ui against the local `@openuidev/assistant-ui`
workspace package. OpenUI renders the tool UI while assistant-ui owns the chat
runtime, messages, and tool lifecycle.

## Run locally

From the OpenUI repository root:

```bash
cp examples/assistant-ui-chat/.env.example examples/assistant-ui-chat/.env.local
# Add a valid OPENAI_API_KEY to .env.local

pnpm install
pnpm --filter @openuidev/assistant-ui... build
pnpm --filter assistant-ui-chat dev
```

Open [http://localhost:3000](http://localhost:3000), then choose **Trip summary
with follow-ups**. Clicking a rendered follow-up should append its label as a
new user message and start the next assistant-ui turn.

For a deterministic check that does not call a model, open
[http://localhost:3000/fixture](http://localhost:3000/fixture). That route
seeds a completed `present_openui` tool call. Clicking either follow-up uses
the real package renderer to append a user turn, and a local adapter confirms
the received message.

The example deliberately uses `workspace:*` for every OpenUI package, so it
does not require `@openuidev/assistant-ui@0.0.2` to be published.
