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
- **Enter** — activate the focused follow-up/button (also confirms the highlighted Select option).
- **↑ / ↓** or **number keys** — choose an option in a focused Select; the highlighted option is selected immediately.
- **Mouse click** — click a dropdown option to select it, a button/follow-up to activate it, or a text field to focus it (see caveats below).
- **Ctrl+C** — quit.

### Mouse support (form elements)

Clicking targets the **latest** turn's interactive elements (dropdown options, buttons, follow-ups, text fields). It uses click-only SGR mouse tracking (`?1000`/`?1006`) enabled once at the root; clicks are hit-tested against the live region using Yoga layout offsets.

Caveats (inherent to terminal mouse tracking + the scrollback layout):

- Click hit-testing is **best-effort**: it's reliable once the conversation has filled the screen (so the live region sits at the bottom). On the very first short turn — when there's empty space below the live region — clicks may miss; use the keyboard (Tab + number keys/arrows) there. Getting pixel-perfect mouse on every turn would require a full-screen layout that gives up scrollback history — see below.
- While mouse tracking is active, the terminal's native click-drag **text selection/copy is disabled** (hold Shift in most terminals to bypass and select text).
- Run the app **directly in a terminal** so it receives mouse events; through tmux you must `set -g mouse on` (otherwise tmux captures the mouse). Keyboard is the fully-portable path.

### History vs. reliable mouse (design trade-off)

Ink can't cleanly give all three of rendered scrollback history, zero typing flicker, and pixel-perfect mouse at once. This example prioritizes **history + smooth typing**, with best-effort mouse. A full-screen (alternate-screen) layout could make mouse pixel-perfect everywhere, but it gives up terminal scrollback history.

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

## Chat UI

- A header, a welcome/empty state with example prompts, and a bordered composer with key hints.
- Completed turns are written to the terminal scrollback via Ink's `<Static>`, so the full conversation history stays on screen (scroll up to see earlier turns) while the latest assistant turn renders live and interactive at the bottom. Typing is smooth (the live region is small, so Ink updates it without repainting the whole screen).
- User messages render as bubbles; the assistant turn renders as generative UI. An animated spinner shows while streaming.

## Limitations (POC)

- Read-oriented charts/tables render as ASCII; not pixel-faithful.
- Mouse hit-testing is best-effort (see the trade-off above); keyboard works everywhere.
- Queries/`$state` two-way binding beyond simple form fields are out of scope for v1.
