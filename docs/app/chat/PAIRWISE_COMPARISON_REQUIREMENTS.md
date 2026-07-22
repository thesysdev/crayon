# OpenUI Chat Pairwise Comparison

Status: implemented — kept in sync with the shipped `/chat` design

Target: `docs/app/chat` (`/chat`)

Reference: `/Users/zahle/github/composition/packages/chat/src/features/Crayon/layout/Compare`

## Goal

Turn `/chat` into a product-capability comparison with exactly two visible panels and three available response modes:

1. Rendered Markdown
2. OpenUI OSS
3. OpenUI Cloud

The page compares product experiences, not scientifically controlled model output. All three providers stay mounted and receive every assistant-bound action; switching the visible pair resets the demo to a fresh, empty comparison.

## Confirmed decisions

| Topic                | Decision                                                         |
| -------------------- | ---------------------------------------------------------------- |
| Visible layout       | Exactly two panels                                                |
| Pair selection       | A centred "Change" dropdown listing the three fixed pairs         |
| Default pair         | Rendered Markdown vs OpenUI OSS                                   |
| Switching pairs      | Resets the demo to its empty state                                |
| Markdown             | Rendered Markdown, never raw source                               |
| Prompt fanout        | Typed, suggested, and generated follow-ups go to all three modes  |
| Cloud model selector | Hidden; use the configured fixed model                            |
| Cloud artifacts      | Enabled in a full-page view                                       |
| Cloud storage        | Existing persistence retained                                     |
| Narrow screens       | Accessible tabs for the selected pair                             |
| Turn limit           | No UI-enforced cap                                                |
| Suggestions          | One stacked starter card; Cloud-only rows disabled without Cloud  |

## Pair switcher

A compact "Change" chip sits centred in the top bar and opens a dropdown of the
three presets, each shown as an "A vs B" title (mode names with chips) above a
short description that reveals on hover. Menu order:

1. **Markdown vs OpenUI OSS** (default)
2. **Markdown vs OpenUI Cloud**
3. **OpenUI OSS vs OpenUI Cloud**

Requirements:

- Default to **Markdown vs OSS**.
- Selecting a different pair resets the demo to its empty state: active streams
  are aborted, fresh threads are created, and the three comparison histories
  are cleared. It must not delete previously persisted Cloud conversations or
  artifacts. Re-selecting the current pair is a no-op.
- After a switch, a centred "Loading…" indicator covers a panel only while its
  surface is still initialising.
- Keep all three mode surfaces mounted, including the mode not in the selected
  pair.
- While the dropdown is open, the page below the top bar is blurred; the top
  bar and its bottom stroke stay sharp.
- Pair selection is session-local and does not need to survive reload.

## Shared conversation

- One suggestion row and one composer serve all three modes.
- Every typed prompt and starter suggestion is submitted concurrently to Markdown, OSS, and Cloud.
- Every LLM-bound generated follow-up, including `ContinueConversation` and submitted generated forms, is normalized to a human-readable prompt and broadcast exactly once to all three modes.
- Local response interactions remain local, including tabs, accordions, unsent form edits, and external links.
- Each mode owns an independent thread, history, stream, cancellation state, loading state, error state, and scroll position.
- Block another submission while any mode is running; the send control becomes **Stop all responses**.
- Stop aborts every running stream and preserves partial output.
- Reset aborts active streams, creates fresh threads, clears the three active comparison histories, and restores composer focus. It must not delete previously persisted Cloud conversations or artifacts.
- Do not impose a client-side turn cap. Existing server limits, rate limits, and budget controls still apply.

## Mode requirements

### Rendered Markdown

- Use `AgentInterface` without a component library so its standard safe Markdown renderer handles the answer.
- Add a server-owned, validated Markdown generation mode; do not accept arbitrary browser-supplied system prompts.
- Render headings, lists, links, block quotes, tables, and code within panel bounds.
- Never display OpenUI Lang source as the Markdown answer.

### OpenUI OSS

- Keep `openuiChatLibrary`, the generated OpenUI Lang system prompt, and the existing Chat Completions stream adapter.
- Keep OSS history in memory for the browser session.
- Generated components remain interactive inside their panel.

### OpenUI Cloud

- Keep Cloud `chatLibrary`, Responses streaming, existing Cloud storage, and report/presentation artifact renderers.
- Hide the model selector and use the configured fixed Cloud model.
- Retain Cloud conversation and artifact persistence.
- Keep Cloud available as a switcher option when unavailable, with an explicit mode-local error; Markdown and OSS must remain usable.

## Layout

- Single top bar, left to right: an icon-only back button (arrow), the left
  panel's title, the centred "Change" switcher chip, the right panel's title,
  and a "Build for free" text button whose dropdown lists copyable
  package-manager setup commands (pnpx / bunx / yarn dlx / npx).
- Panel titles live in the top bar over their panels: **Markdown** (with a
  "Without OpenUI" chip), **OpenUI** with an "OSS" chip, and **OpenUI** with an
  inverted "Cloud" chip. Status appears beside the title only for loading,
  generating, and error states — the idle "Ready" state is not shown.
- A "View comparison" chip hangs centred below the bar and expands a tray with
  a per-pair feature table: feature names in a centre column (left-aligned
  text), green ticks and grey crosses under each mode. The chip rides at the
  tray's bottom and toggles to "Hide comparison".
- Desktop layout, top to bottom:
  1. two equal-width panels separated by a 1px divider (the divider fades out
     toward the bottom while the demo is empty);
  2. one stacked starter card;
  3. the shared composer, centred on the screen at the starter card's width,
     with send/stop inside and a borderless reset icon button outside its
     right edge.
- Give each panel a centered empty state, independent transcript scrolling, and mode-local status/error presentation.
- Hide per-mode sidebars, thread lists, mobile headers, embedded composers, starter rows, and new-chat controls.
- Prevent Markdown, tables, code, charts, and generated UI from widening a panel; reflow or scroll content internally.
- Preserve existing OpenUI tokens, light/dark themes, focus visibility, reduced motion, and mobile safe-area spacing.

### Empty-state copy

- Rendered Markdown: **AI responses rendered as standard Markdown.**
- OpenUI OSS: **Interactive responses rendered with the open-source OpenUI library.**
- OpenUI Cloud: **Managed generative responses with tools and artifacts.**

## Starter prompts

One white card with end-to-end separators between four rows. Each row has a
colored icon and reveals a trailing arrow on hover/focus. Rows whose output
requires OpenUI Cloud carry a right-aligned "On Cloud only" tag and are
disabled — dimmed, icon greyed — whenever the selected pair does not include
Cloud:

1. **Exciting stocks to look out for this year**

   `Show me a chart of the top 5 US stocks outperforming the market in 2025 with key trendlines.`

2. **Hidden travel gems to explore**

   `Give me travel ideas for underrated destinations with notable landmarks and cultural highlights.`

3. **Create a report on Electric vehicles** — On Cloud only

   `Create a report on electric vehicles covering adoption trends, key manufacturers, and market outlook.`

4. **Create a presentation on coffee culture** — On Cloud only

   `Create a presentation on global coffee culture covering regions, brewing styles, and cafe trends.`

Show suggestions only before the first submitted turn.

## Responsive behavior

- At 900px and wider, show both selected panels side by side.
- Below 900px, show a two-tab accessible tab list for the selected pair and one full-width transcript at a time.
- Pair changes update the two tab labels while preserving a valid active tab.
- The non-active selected panel and unselected third mode remain mounted and continue streaming.
- Hidden surfaces must not expose focusable controls to keyboard users.
- Expose each mode's generating and error state in panel/tab labelling.
- Keep the pair switcher and shared composer reachable without scrolling the whole page.

### Mobile top bar and menu (below 900px)

- The top bar reduces to an icon-only back button, the centred "View
  comparison" chip, and a hamburger menu button; the "Change" switcher chip
  and panel titles are hidden.
- The hamburger opens a full-width sheet built on the homepage mobile tray
  component, with a "Comparison" section (the three pairs as plain-text rows
  — no chips or active badge; `aria-checked` still marks the current pair),
  a "Preferences" section (Reset chats, then a dark/light mode row), and the
  GitHub star CTA as the footer. Selecting a pair closes the menu and resets
  the demo, same as desktop.
- Both the menu and the comparison tray open as edge-to-edge sheets directly
  under the bar, over a darker blurred backdrop; the top bar and its bottom
  stroke stay sharp, and only one stroke separates bar from sheet.
- The composer spans the full width of the controls area; reset and the
  theme toggle live in the hamburger menu instead of flanking it.
- Starter rows share one uniform height with top-aligned content; the
  "Only on Cloud" tag renders as plain grey text on its own line beneath a
  full-width label, and the feature tray narrows its icon columns so feature
  names fit on one line.

## Full-page Cloud artifacts

- Reports and presentations open above the comparison as a true full-page overlay or route.
- Opening an artifact preserves the selected pair, all transcripts, scroll positions, and active streams.
- Closing returns focus to the invoking control and restores the unchanged comparison.
- Browser Back closes the artifact before leaving `/chat`.

## Errors and accessibility

- Isolate loading, streaming, renderer, unavailable, credit, and request errors to the affected mode.
- One slow or failed mode must not block completed output in another mode.
- Preserve completed and partial output after later failures; do not hide Cloud thread errors in CSS.
- Disable the first submission until required controllers are registered. A definitively unavailable Cloud mode must not prevent Markdown and OSS from working.
- Use one page `<h1>` and two visible labelled `<section>` landmarks.
- Label the composer **Ask Rendered Markdown, OpenUI OSS, and OpenUI Cloud** and disclose that submission starts three requests.
- Give pair options, mobile tabs, send, stop-all, reset, artifact close, and relevant retry controls explicit accessible names. Core action controls (send, stop-all, reset, starter rows) keep at least 44px targets; the compact header chips trade target size for a denser bar and expose their full context via accessible names.
- Track `aria-busy` per mode and announce lifecycle transitions without announcing streamed tokens.

## Implementation plan

1. Add server-validated `markdown | openui` output modes to the shared chat streaming route.
2. Add a Markdown surface using the default Markdown assistant renderer.
3. Adapt OSS and Cloud surfaces to register invisible mode controllers while suppressing their embedded navigation, starters, and composers.
4. Add a comparison coordinator that keeps all three surfaces mounted and fans out submit, stop, reset, and generated actions.
5. Replace conditional OSS/Cloud mounting with the global pair switcher and two visible panel slots.
6. Add desktop split-pane, mobile-tab, shared-control, and hidden-surface styling.
7. Route Cloud artifact detailed views into the full-page experience without unmounting the comparison.
8. Update tests, metadata, docs, and the comparison preview as needed.

## Acceptance criteria

- Desktop initially shows **Rendered Markdown vs OpenUI OSS** in two equal panels.
- The "Change" dropdown switches cleanly among **Markdown vs OSS**, **Markdown vs Cloud**, and **OSS vs Cloud**.
- Exactly two panels are visible while all three providers remain mounted.
- Switching pairs resets the demo to its empty state (streams aborted, comparison histories cleared) without deleting persisted Cloud conversations or artifacts; re-selecting the current pair changes nothing.
- One typed prompt or starter produces one aligned user turn and three independently streamed responses.
- Generated assistant follow-ups reach all three modes exactly once.
- Markdown is rendered; OSS and Cloud generated UI remains interactive.
- The Cloud model selector is absent, while Cloud storage and artifact persistence continue working.
- Cloud artifacts open full page and return to the intact comparison; Browser Back closes them first.
- Stop and reset safely affect all three modes, including hidden streams.
- There is no UI-enforced turn cap.
- A Cloud failure leaves Markdown and OSS operational and visibly reports the Cloud error.
- Below 900px, the selected pair is navigable as accessible tabs while every mode continues streaming.
- Starter prompts render as one stacked card with hover arrows, and the Cloud-only rows are disabled (greyed, including icons) whenever the selected pair excludes OpenUI Cloud.
- The "View comparison" tray opens with the feature table for the selected pair and closes via its chip, Escape, or an outside click.
- Desktop, mobile, keyboard-only, reduced-motion, type-check, lint, build, and targeted stream/fanout tests pass.
