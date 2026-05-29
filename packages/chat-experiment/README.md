# @openuidev/chat-experiment

Experimental, animated chart components for OpenUI — a faithful local reproduction of
[bklit-ui](https://ui.bklit.com/)'s chart interactions, built on the same engine
(Visx + Motion + d3 + NumberFlow) but adapted to OpenUI conventions (SCSS styling,
the OpenUI build pipeline). Not a dependency on bklit's published package.

> Status: work in progress. This package is `private` and intended for experimentation.

## Styling

Import the compiled stylesheet once:

```ts
import "@openuidev/chat-experiment/charts.css";
```

Charts are themed via `--chart-*` CSS custom properties (see `src/styles/chart-vars.scss`).

## Development

```bash
pnpm --filter @openuidev/chat-experiment build      # css + js (cjs/esm/dts)
pnpm --filter @openuidev/chat-experiment typecheck
```
