# OpenUI Rust TUI (ratatui) — via a Node bridge

A **Rust/[ratatui](https://ratatui.rs)** terminal client that renders streamed
**OpenUI Lang** as a native, mouse-driven, scrollable TUI. OpenUI stays canonical
in JavaScript: a small **Node "bridge"** runs `@openuidev/lang-core` to parse the
streamed OpenUI Lang and emits a serialized render tree; the Rust process is a
pure renderer + input handler.

This is a sibling to the Ink example (`examples/openui-tui-chat`), exploring the
same idea on a Rust stack. It exists because ratatui is *immediate-mode* — you own
every widget's `Rect` — which makes the things that are hard in Ink easy:

- **Pixel-perfect mouse.** Clicks hit-test against exact widget rects, even when the content is scrolled.
- **Real scrolling / clipping.** A form taller than the screen lives in a scrollable viewport (with a scroll indicator and auto-scroll to the focused field) instead of corrupting the layout.
- **No flicker.** ratatui double-buffers and diffs cells.

```
you ─▶ prompt
     ─▶ (Rust) write {"type":"send","content":...} to bridge stdin
     ─▶ (Node bridge) @openuidev/lang-core streaming parse + evaluate
     ─▶ emit {"type":"render","root":<ElementNode>} JSON on stdout
     ─▶ (Rust/ratatui) render tree → widgets, handle keyboard + mouse + scroll
     ─▶ actions (button/select/submit) ─▶ back to the bridge
```

## Architecture

| Piece | Role |
| --- | --- |
| `bridge/` (Node/TS) | The OpenUI brain. `@openuidev/lang-core` defines the component library + system prompt, streams from an OpenAI-compatible model, parses/evaluates OpenUI Lang, and emits a JSON render tree over stdio. |
| `src/main.rs` (Rust) | Spawns the bridge, reads the render tree, draws it with ratatui, and handles keyboard/mouse/scroll + the action loop. Form field state lives here and is sent back on submit. |

Protocol (newline-delimited JSON): Rust→bridge `{"type":"send","content":"…"}`;
bridge→Rust `{"type":"ready"}`, `{"type":"render","root":<node|null>,"streaming":bool}`, `{"type":"error","message":"…"}`.

## Run

Requires **Rust** (a recent stable — ratatui 0.29's deps need rustc ≥ 1.88; a
`rust-toolchain.toml` selects `stable`), **Node 20+**, and an OpenAI-compatible key.

```sh
# from the repo root: build the workspace packages the bridge depends on
pnpm install

export OPENAI_API_KEY=sk-...          # optional: OPENAI_BASE_URL / OPENAI_MODEL
cd examples/openui-rust-tui
cargo run                              # spawns the Node bridge automatically
```

Then type a prompt (e.g. _"a success callout, some tags, and a bar chart"_ or
_"a long registration form"_).

### Controls

- Type + **Enter** — send a message.
- **Tab / Shift+Tab** — move focus (composer ↔ interactive elements). Focus auto-scrolls into view.
- **Enter / click** — activate the focused follow-up/button, or choose a Select option.
- **↑ / ↓** or **number keys** — choose a Select option; **↑ / ↓** also scroll when the composer is focused.
- **Mouse click** — focus/activate any visible element; **scroll wheel** scrolls the viewport.
- **Ctrl+C** — quit (restores your terminal via the alternate screen).

## Supported components

`Card`, `CardHeader`, `TextContent`, `Callout`, `TagBlock`, `Table`/`Col`,
`BarChart`/`Series`, `FollowUpBlock`/`FollowUpItem`,
`Form`/`FormControl`/`Input`/`Select`/`Buttons`/`Button`. Follow-ups, buttons and
form submits drive the assistant loop via the OpenUI `@ToAssistant` action.

## Notes / limitations (POC)

- Charts/tables render as text/ASCII; not pixel-faithful.
- The bridge is spawned with an absolute path baked at compile time (`CARGO_MANIFEST_DIR`), so run the built binary from this checkout.
- Only the current exchange is shown (no multi-turn transcript log); the viewport scrolls a single long response.
