# StreamingComparison

The same prompt answered twice, streamed live side by side: plain text on the
left, generative UI on the right. Built in HTML (no screenshots), so it stays
sharp, themes with the site, and is easy to reuse.

```tsx
import { StreamingComparison } from "./components/StreamingComparison/StreamingComparison";
import { PARIS_HOTELS } from "./components/StreamingComparison/examples/parisHotels";

<StreamingComparison example={PARIS_HOTELS} />;
```

## Adding an example

Copy `examples/parisHotels.tsx`, change the prompt and the blocks, and pass the
new config in. Each side is `{ label, stream?, blocks }`:

- `stream`: `"lines"` (default; each line blurs into focus) or
  `"characters"` (types out letter by letter).
- `follow`: keep the newest output in view once it outgrows the panel (off by
  default; the left side turns it on).
- Text blocks stream: `heading`, `subheading`, `paragraph`, `muted`, `bullets`.
- UI blocks pop in one piece at a time: `cards` (image, badge, title,
  description, action), `facts` (icon, label, value), `divider`.
- `custom` takes any element (`node`) plus an optional `cost` in characters,
  for anything the built-in blocks don't cover.

Both sides share one clock (`CHARS_PER_SECOND`), so the longer answer takes
longer. It plays once when scrolled into view and rests on the finished
answers, which reduced motion shows straight away. In narrow spaces the
"Without" side shrinks to a small preview tucked behind a full-size "With"
panel.
