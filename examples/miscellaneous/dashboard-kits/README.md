# Dashboard kits

Two kits for the OpenUI dashboard artifact. A kit is everything a model needs to build dashboards for one domain: the dashboard artifact's base components plus the kit's own components, read-only data tools, prompt rules, and worked examples. Both kits are modeled on the dashboards teams already use, with the same metric names and definitions.

- **E-commerce**, for Sundial Goods, a direct-to-consumer brand. It is modeled on Shopify, Triple Whale, and GA4, and covers:
  - sales and the total sales breakdown;
  - marketing efficiency (blended ROAS, MER, new-customer CPA) by channel;
  - contribution profit;
  - first-order LTV cohorts and RFM segments;
  - product performance, inventory, and the purchase and checkout journeys.
- **Product analytics**, for Relay, a team workspace app. It is modeled on PostHog, Amplitude, and Mixpanel, and covers:
  - active users and lifecycle;
  - activation funnel, retention cohorts, and curves by plan;
  - the power user curve, the engagement matrix, and activity by hour;
  - first-session paths, A/B test results, and paying-account health.

Each kit has four dashboards, 16–19 data tools, and its own components. Both share a chart family (`HeroMetric`, `TrendChart`, `ColumnChart`, `BarList`, `ShareBar`, `GoalPace`) and five blocks: `KpiStrip`, `InsightList`, `ConversionFunnel`, `CohortGrid`, and `Tracker`.

The kits themselves live in the [`@openuidev/dashboard-kits`](../../../packages/dashboard-kits) package. This app is the playground: it installs the package, renders its galleries, and serves its prompts and tools.

The app has three views for each kit:

- **Gallery** renders the kit's hand-written dashboards with live sample data. It needs no model or key.
- **Generate** asks a model for a dashboard and streams it in.
- **Prompt** shows the system prompt the kit sends, with its components and tools.

[DESIGN.md](./DESIGN.md) explains how kits extend the base library, the data contract, how kits are served, and the open questions.

## Run

Requirements: Node.js 22.13+, npm, and pnpm, with `pnpm install` run once at the repository root (it builds the kit package).

```bash
npm run kits:pack
npm run dev
```

`kits:pack` builds `packages/dashboard-kits` with the monorepo's pnpm, packs it into `.kits/`, and installs the tarball with the app's other dependencies. Run it again after changing the package. (npm cannot install the workspace package directly: its manifest uses pnpm `catalog:` versions.)

Open http://localhost:3000. The gallery and the Prompt view work without credentials. For Generate, put one key in `.env.local`, then restart:

- `THESYS_API_KEY`: an inference key from the [Thesys Console](https://console.thesys.dev/keys), sent to OpenUI Gateway
- `OPENAI_API_KEY`: any OpenAI-compatible key; set `OPENAI_BASE_URL` for another provider

`OPENUI_MODEL` optionally picks the model. The defaults are `openai/gpt-5.5` on Gateway and `gpt-5.5` on OpenAI.

## How it works

1. `npm run generate` writes each kit library's spec to `src/generated/`.
2. `/api/generate` builds the kit's system prompt from that spec, the kit's tools, rules, and examples, and streams the model's openui-lang back.
3. The browser renders it with the same kit library. Each `Query()` runs through the Renderer's `toolProvider` to `/api/tools/<kit>/<tool>`, which validates the arguments and the result against the tool's schemas.
4. Filters are `$bindings`: changing one re-runs every Query that reads it.

The base components come from `dashboardLibrary` in `@openuidev/thesys`, the library behind the dashboard artifact. `createEcommerceLibrary(dashboardLibrary)` and `createAnalyticsLibrary(dashboardLibrary)` add a kit's components and widen `MediumCard` and `LargeCard` so the prompt lists the new components as valid children.

## Files

The kits, their components, charts, prompts, tools, sample data, and styles are in `packages/dashboard-kits` (its README has the layout). This app holds only the glue:

| File                               | Purpose                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------- |
| `src/kits/libraries.ts`            | Each kit's library: `dashboardLibrary` plus the kit                             |
| `src/kits/*-library.ts`            | Spec entries for `openui generate`                                              |
| `src/kits/index.ts`                | Kit definitions, re-exported from the package's server entry                    |
| `src/kits/client.ts`               | Kit libraries for the Renderer, and the package's tool provider                 |
| `src/kits/server.ts`               | Library specs from `src/generated/`, prompt assembly, and the sample-data tools |
| `src/app/api/*`                    | The generate, prompt, and tools routes                                          |
| `src/app/styles.css`               | The app's chrome, on the kit theme tokens                                       |
| `src/components/kit-workspace.tsx` | Kit picker and the Gallery, Generate, and Prompt views                          |
| `scripts/check-kits.ts`            | Contract check for every kit                                                    |

## Verify

```bash
npm run verify
```

This runs the kit contract check, then a production build. The check parses every gallery dashboard against its kit's library, rejects Queries to unknown tools, calls every tool with every value of every enum argument and validates each result, and builds every prompt. Run the check alone with `npm run check`.

## Notes

- The app uses `@openuidev/react-ui` and `@openuidev/react-headless` 0.17.1. `@openuidev/thesys` 0.14.0 asks for ^0.14, so `overrides` in `package.json` points it at 0.17.1; all eight dashboards render with no errors. See finding 9 in DESIGN.md.
- `next.config.ts` turns off Turbopack minification: re-minifying the `@openuidev/thesys` bundle produces invalid JavaScript. See finding 6 in DESIGN.md.
- The package's theme lets the base `FilterBar` wrap on phones. See finding 4 in DESIGN.md.
- The kits use react-ui's `BarChart`, `HeatmapChart`, and `SegmentedBar` where they fit, and draw the charts react-ui lacks. See "Visual design" in DESIGN.md.

## Add a kit

Add the kit to `packages/dashboard-kits` (copy `src/analytics`, write the tools, handlers, components, and `kit.ts`, and add an entry point), then create its library in `src/kits/libraries.ts` here, register it in `client.ts` and `server.ts`, and add it to the `generate` script. `npm run check` tells you when it is consistent. DESIGN.md has the details.
