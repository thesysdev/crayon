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

Caveats (inherent to terminal mouse tracking + natural-height layout):

- Hit-testing anchors to the bottom of the terminal (where the live region ends), so it's reliable for content that fills the screen — including a long form's visible fields. For a short exchange with empty space below, clicks may be slightly off; keyboard (Tab + number keys/arrows) is exact everywhere.
- While mouse tracking is active, the terminal's native click-drag **text selection/copy is disabled** (hold Shift in most terminals to bypass and select text).
- Run the app **directly in a terminal** so it receives mouse events; through tmux you must `set -g mouse on` (otherwise tmux captures the mouse). Keyboard is the fully-portable path.

## Supported components

`Card`, `CardHeader`, `TextContent`, `Callout` (colored banner), `TagBlock` (colored pills),
`Table`/`Col`, `BarChart`/`Series` (gradient bars), `FollowUpBlock`/`FollowUpItem`,
`Form`/`FormControl`/`Input`/`Select`/`Buttons`/`Button`.

Headings, chart bars and the header use a truecolor gradient; `ink-spinner` shows while
streaming and `ink-big-text` renders the welcome logo. Follow-ups, buttons and form submits
drive the assistant loop via the OpenUI `@ToAssistant` action.

## Test

```sh
pnpm --filter openui-tui-chat test        # vitest + ink-testing-library
pnpm --filter openui-tui-chat typecheck
```

## Chat UI

- A gradient header, a welcome splash (big-text logo) with example prompts, and a bordered composer with key hints.
- The current exchange renders at **natural height**. Content taller than the terminal (e.g. a long form) scrolls in the terminal's native scrollback rather than corrupting the layout — the composer stays intact and the app never "breaks". Short exchanges stay compact.
- User messages render as bubbles; the assistant turn renders as generative UI with an animated spinner while streaming.

## Limitations (POC)

- Read-oriented charts/tables render as ASCII; not pixel-faithful.
- On a form taller than the screen, upper fields scroll out of view — reach them with keyboard focus (Tab) or by scrolling the terminal; mouse clicks target the visible (on-screen) fields.
- Mouse hit-testing is best-effort for short exchanges (see caveats above); keyboard works everywhere.
- Only the current exchange is shown; there is no in-app multi-turn history log.
- Queries/`$state` two-way binding beyond simple form fields are out of scope for v1.
