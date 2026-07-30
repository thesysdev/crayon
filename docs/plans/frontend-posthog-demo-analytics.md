# Frontend PostHog Analytics Plan

## Goal

Capture model-attributed PostHog events whenever a user sends an accepted
prompt or triggers an agent-directed action in every hosted demo. Most turns
emit one event; `/compare` emits one per visible panel.

## Scope

Instrument the four demos in the website navigation:

- `/compare`
- `/demo/github`
- `/chat`
- `/demos`

Standalone `examples/*` apps remain out of scope because downstream developers
can run them locally.

## Event contract

Event name:

```text
demo_agent_interaction
```

Properties:

```ts
type DemoAgentInteraction = {
  demo: "compare" | "github_dashboard" | "openui_chat" | "openui_vs_json";
  variant?: string;
  model: string;
  interaction_source: "composer" | "starter" | "rendered_action";
};
```

Variant meanings:

| Demo               | Variant                                   |
| ------------------ | ----------------------------------------- |
| `compare`          | Visible panel: `markdown`, `oss`, `cloud` |
| `openui_chat`      | `oss` or `cloud`                          |
| `github_dashboard` | Omit                                      |
| `openui_vs_json`   | Omit                                      |

`model` is the canonical provider/model ID requested for that interaction.

## Counting rules

Capture once when an interaction passes validation and is about to be
dispatched.

Count:

- Typed prompt submission
- Starter that submits immediately
- GitHub connect-time starter prompt
- Follow-up prompt
- Generated `continue_conversation` action

Do not count:

- Empty or blocked submissions
- Typing, focus, or scrolling
- Starter chips that only prefill an input
- Loaded conversation history
- Local form, tab, or component-state changes

A `/compare` submission emits two events, one for each available mode in the
selected visible pair. The third hidden controller still receives the prompt in
the background but is not counted as a visible user interaction. A rendered
action emits one event for the panel where it was triggered.

## Implementation

### 1. Add a shared demo analytics helper

Create `docs/lib/demo-analytics.ts`.

It will:

- Define the event and property types.
- Validate the bounded `demo`, `variant`, `model`, and `interaction_source`
  values.
- Call the existing helper in `docs/lib/analytics.ts`.
- Remain browser-only, fire-and-forget, and fail-open.
- Never initialize a second PostHog client.

### 2. Expose neutral AgentInterface interaction hooks

Add an optional, analytics-neutral callback to `AgentInterface` for accepted
user turns.

Built-in paths should identify their source as:

- Composer: `composer`
- Immediate starter: `starter`
- Generated `continue_conversation`: `rendered_action`

No PostHog code belongs in `react-ui` or `react-headless`. Those packages only
expose the callback; analytics is enabled exclusively by the owned docs site.

### 3. Instrument each demo

| Demo           | Capture point                                                                                                                                                                                                                |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/demos`       | Capture in `docs/app/demos/page.tsx::handleSubmit`, after validation and before `fetch`. Starter chips remain prefill-only.                                                                                                  |
| `/demo/github` | Extend the central `docs/app/demo/github/page.tsx::send` function to accept `interaction_source`. Propagate it through connect-time starters, regular starters, the composer, and rendered actions.                          |
| `/chat`        | Pass the neutral callback to the OSS and Cloud `AgentInterface` instances in `docs/app/chat/_components/agent-surfaces/`. Set `variant` to `oss` or `cloud` and report the requested model.                                  |
| `/compare`     | Capture shared prompts once per visible mode in `docs/app/compare/_components/compare-page-client.tsx::submitToAll`. Use the `AgentInterface` callback only for rendered actions that target an individual comparison panel. |

### 4. Preserve privacy boundaries

Never add these values as custom event properties:

- Prompt or message content
- Generated UI, code, or output
- Action labels, context, or form state
- GitHub usernames
- URLs
- Thread or Cloud user IDs
- Tool arguments
- Raw errors

PostHog may still attach the SDK's standard page context to the event.

### 5. Preserve anonymous-to-authenticated attribution

Keep demo visitors anonymous in OpenUI. When they follow a `thesys.dev` link,
forward PostHog's current anonymous distinct ID and session ID as dedicated
query parameters; do not add either value to the custom event payload.

Before initializing PostHog, the receiving console must validate and consume
those parameters, bootstrap the forwarded distinct ID with
`isIdentifiedID: false`, and remove both parameters from the address bar. The
console's existing `posthog.identify(user.id)` call then merges the earlier
anonymous demo events into the authenticated person. OpenUI and the console
must use the same PostHog project, and logout must call `posthog.reset()`.

## Validation

Add tests covering:

- One valid non-compare submission produces one event.
- Empty and blocked submissions produce no event.
- Composer, starter, and rendered-action sources are correct.
- `/compare` emits exactly two events for a healthy selected pair.
- Chat variants report `oss` and `cloud`.
- Every event reports an allowlisted canonical model ID.
- No prohibited content enters the event payload.
- PostHog failures never interrupt the user interaction.
- A valid forwarded anonymous ID is bootstrapped as anonymous and the handoff
  parameters are scrubbed without removing unrelated query parameters.
- Malformed, duplicate, stale, or future handoff values are rejected.

Run:

```bash
pnpm --filter @openuidev/docs types:check
pnpm --filter @openuidev/docs lint
pnpm --filter @openuidev/docs format:check
pnpm --filter @openuidev/docs build
pnpm --filter @openuidev/react-headless test
pnpm --filter @openuidev/react-ui test
```

Finally, smoke-test all four routes and verify their payloads in PostHog Live
Events.

## Acceptance criteria

- Every accepted user turn outside `/compare` emits one
  `demo_agent_interaction` event.
- A healthy `/compare` prompt emits exactly two events, one per visible mode;
  rendered actions emit one event for their target panel.
- `demo`, `variant`, `model`, and `interaction_source` use only documented
  bounded values.
- Custom event properties contain no prompt, identity, generated-content, or
  action payload data.
- Anonymous demo history merges into the console's canonical user after
  authentication without exposing identity IDs as event properties.
- Analytics loading or capture failures cannot break a demo interaction.
