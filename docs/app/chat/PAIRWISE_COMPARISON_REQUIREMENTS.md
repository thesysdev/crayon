# OpenUI Chat Pairwise Comparison

Status: implementation-ready

Target: `docs/app/chat` (`/chat`)

Reference: `/Users/zahle/github/composition/packages/chat/src/features/Crayon/layout/Compare`

## Goal

Turn `/chat` into a product-capability comparison with exactly two visible panels and three available response modes:

1. Rendered Markdown
2. OpenUI OSS
3. OpenUI Cloud

The page compares product experiences, not scientifically controlled model output. All three providers stay mounted and receive every assistant-bound action; the pair switcher only changes which two transcripts are visible.

## Confirmed decisions

| Topic                | Decision                                                         |
| -------------------- | ---------------------------------------------------------------- |
| Visible layout       | Exactly two panels                                               |
| Pair selection       | One global switcher with three fixed pairs                       |
| Default pair         | Rendered Markdown vs OpenUI OSS                                  |
| Markdown             | Rendered Markdown, never raw source                              |
| Prompt fanout        | Typed, suggested, and generated follow-ups go to all three modes |
| Cloud model selector | Hidden; use the configured fixed model                           |
| Cloud artifacts      | Enabled in a full-page view                                      |
| Cloud storage        | Existing persistence retained                                    |
| Narrow screens       | Accessible tabs for the selected pair                            |
| Turn limit           | No UI-enforced cap                                               |
| Suggestions          | Match the supplied comparison screenshot                         |

## Pair switcher

The global switcher offers only these presets, in this order:

1. **Markdown vs OSS**
2. **OSS vs Cloud**
3. **Markdown vs Cloud**

Requirements:

- Default to **Markdown vs OSS**.
- Switching a pair only changes visibility; it never resets a conversation or starts a request.
- Keep all three mode surfaces mounted, including the mode not in the selected pair.
- Preserve each mode's transcript, stream, errors, and scroll position while hidden.
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

- Retain the current `/chat` product header and its docs/run-locally actions.
- Replace the OSS/Cloud toggle with the global three-preset pair switcher.
- Desktop layout, top to bottom:
  1. two equal-width panels separated by a 1px divider;
  2. the screenshot-style shared suggestion row;
  3. the shared composer with send/stop and reset controls.
- Give each panel a labelled header, centered empty state, independent transcript scrolling, and mode-local status/error presentation.
- Hide per-mode sidebars, thread lists, mobile headers, embedded composers, starter rows, and new-chat controls.
- Prevent Markdown, tables, code, charts, and generated UI from widening a panel; reflow or scroll content internally.
- Preserve existing OpenUI tokens, light/dark themes, focus visibility, reduced motion, and mobile safe-area spacing.

### Empty-state copy

- Rendered Markdown: **AI responses rendered as standard Markdown.**
- OpenUI OSS: **Interactive responses rendered with the open-source OpenUI library.**
- OpenUI Cloud: **Managed generative responses with tools and artifacts.**

## Screenshot starter prompts

Match the supplied screenshot's rounded suggestion-card styling, icon colors, spacing, order, labels, and prompts:

1. **Exciting stocks to look out for this year**

   `Show me a chart of the top 5 US stocks outperforming the market in 2025 with key trendlines.`

2. **Hidden travel gems to explore**

   `Give me travel ideas for underrated destinations with notable landmarks and cultural highlights.`

3. **Greatest blockbusters of all time**

   `Show me a chart of the highest-grossing movies of all time with key milestones and release details.`

4. **Tell me about global street food**

   `Give me a world map of street foods with charts of popularity and regional highlights.`

Show suggestions only before the first submitted turn. On narrow screens, make the row horizontally scrollable.

## Responsive behavior

- At 900px and wider, show both selected panels side by side.
- Below 900px, show a two-tab accessible tab list for the selected pair and one full-width transcript at a time.
- Pair changes update the two tab labels while preserving a valid active tab.
- The non-active selected panel and unselected third mode remain mounted and continue streaming.
- Hidden surfaces must not expose focusable controls to keyboard users.
- Expose each mode's generating and error state in panel/tab labelling.
- Keep the pair switcher and shared composer reachable without scrolling the whole page.

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
- Give pair options, mobile tabs, send, stop-all, reset, artifact close, and relevant retry controls explicit accessible names and at least 44px targets.
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
- The global switcher changes cleanly among **Markdown vs OSS**, **OSS vs Cloud**, and **Markdown vs Cloud**.
- Exactly two panels are visible while all three providers remain mounted.
- Switching pairs never resets, regenerates, or loses in-flight output.
- One typed prompt or starter produces one aligned user turn and three independently streamed responses.
- Generated assistant follow-ups reach all three modes exactly once.
- Markdown is rendered; OSS and Cloud generated UI remains interactive.
- The Cloud model selector is absent, while Cloud storage and artifact persistence continue working.
- Cloud artifacts open full page and return to the intact comparison; Browser Back closes them first.
- Stop and reset safely affect all three modes, including hidden streams.
- There is no UI-enforced turn cap.
- A Cloud failure leaves Markdown and OSS operational and visibly reports the Cloud error.
- Below 900px, the selected pair is navigable as accessible tabs while every mode continues streaming.
- Starter prompts and shared-control styling visually match the supplied screenshot in light and dark themes.
- Desktop, mobile, keyboard-only, reduced-motion, type-check, lint, build, and targeted stream/fanout tests pass.
