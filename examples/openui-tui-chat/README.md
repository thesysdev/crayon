# OpenUI TUI Chat (Ink)

A proof-of-concept **terminal** chat client that renders streamed **OpenUI Lang**
as an interactive TUI, built with [Ink](https://github.com/vadimdemedes/ink)
(React for the terminal).

It demonstrates that OpenUI Lang is renderer-agnostic: the same language,
prompt, parser, and headless chat runtime that power the browser SDK also drive
a terminal UI — you just swap the view layer.

```
you ──▶ prompt
     ──▶ OpenAI-compatible stream (react-headless)
     ──▶ createStreamingParser().set(text)   (lang-core, incremental)
     ──▶ evaluateElementProps                (lang-core runtime/store)
     ──▶ Ink components  (Card→box, BarChart→ASCII, Table→grid, Form→inputs)
```

## What it reuses

- **`@openuidev/lang-core`** — `createStreamingParser`, `evaluateElementProps`, and the runtime store. No React/DOM.
- **`@openuidev/react-headless`** — `ChatProvider` chat state + `openAIReadableStreamAdapter` streaming. DOM-free (Ink is React).
- **New here** — an Ink component library (`src/genui/`) that maps `typeName → Ink component`, and a small tree walker (`RenderValue`) that mirrors react-lang's renderer.

## Run

Requires Node 20+ and an OpenAI-compatible key.

```sh
export OPENAI_API_KEY=sk-...
# optional: export OPENAI_BASE_URL=... OPENAI_MODEL=...
pnpm --filter openui-tui-chat dev
```

Then type a prompt, e.g. _"Compare the 4 largest countries by population as a bar chart"_
or _"Build a contact form with name, email and a topic dropdown"_.

### Controls

- Type + **Enter** — send a message.
- **Tab / Shift+Tab** — move focus between the composer and interactive UI (follow-ups, buttons, form fields).
- **Enter** — activate the focused follow-up/button, or (in a Select) choose the highlighted option.
- **↑ / ↓** — move within a focused Select.
- **Ctrl+C** — quit.

## Supported components (v1)

`Card`, `CardHeader`, `TextContent`, `Table`/`Col`, `BarChart`/`Series`,
`FollowUpBlock`/`FollowUpItem`, `Form`/`FormControl`/`Input`/`Select`/`Buttons`/`Button`.

Follow-ups, buttons and form submits drive the assistant loop via the OpenUI
`@ToAssistant` action.

## Test

```sh
pnpm --filter openui-tui-chat test        # vitest + ink-testing-library
pnpm --filter openui-tui-chat typecheck
```

## Limitations (POC)

- Read-oriented charts/tables render as ASCII; not pixel-faithful.
- Interactivity targets the latest assistant message; prior turns show as compact prompt lines.
- Queries/`$state` two-way binding beyond simple form fields are out of scope for v1.
