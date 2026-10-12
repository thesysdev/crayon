# @openuidev/dashboard-kits

Dashboard kits for OpenUI. A kit is everything a model needs to build dashboards for one domain on top of a base dashboard library:

- **components**, placed into the base cards;
- a **prompt**: preamble, definitions, rules, and worked gallery dashboards;
- a **data contract**: read-only tools with zod input and output schemas, called with `Query()`;
- **sample data**: tool handlers over one coherent demo business.

Two kits ship today: **e-commerce** (Sundial Goods, modeled on Shopify, Triple Whale, and GA4) and **product analytics** (Relay, modeled on PostHog, Amplitude, and Mixpanel).

## Entry points

| Import                                 | Side   | What it has                                                                                                 |
| -------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| `@openuidev/dashboard-kits`            | client | The shared blocks (openui-lang definitions and plain React views), `createKitLibrary`, `createToolProvider` |
| `@openuidev/dashboard-kits/ecommerce`  | client | `createEcommerceLibrary(base)` and the e-commerce components                                                |
| `@openuidev/dashboard-kits/analytics`  | client | `createAnalyticsLibrary(base)` and the product analytics components                                         |
| `@openuidev/dashboard-kits/server`     | server | Kit definitions, tool contracts, sample-data handlers, `buildSystemPrompt`, `runTool`. No React             |
| `@openuidev/dashboard-kits/styles.css` | —      | The kit theme (light and dark) and every component's styles                                                 |

## Use

```tsx
// Client: a kit library is a base dashboard library plus the kit's components.
import { createEcommerceLibrary } from "@openuidev/dashboard-kits/ecommerce";
import { createToolProvider } from "@openuidev/dashboard-kits";
import { ecommerceKit } from "@openuidev/dashboard-kits/server";
import { dashboardLibrary } from "@openuidev/thesys";
import "@openuidev/react-ui/components.css";
import "@openuidev/dashboard-kits/styles.css";

const library = createEcommerceLibrary(dashboardLibrary);

<div className="kit-theme" data-mode="light">
  <Renderer library={library} response={program} toolProvider={createToolProvider(ecommerceKit)} />
</div>;
```

```ts
// Server: prompt assembly and tool execution against the sample data.
import {
  buildSystemPrompt,
  ecommerceKit,
  runTool,
  SAMPLE_HANDLERS,
} from "@openuidev/dashboard-kits/server";
import spec from "./ecommerce.spec.json"; // openui generate <library file> --spec

const prompt = buildSystemPrompt(ecommerceKit, spec);
const result = runTool(ecommerceKit, "get_store_kpis", { range: "30d" }, SAMPLE_HANDLERS.ecommerce);
```

The base library is passed in, so the kits do not depend on one dashboard implementation. `createToolProvider` posts each `Query()` to `/api/tools/<kit>/<tool>` by default; the example app in `examples/miscellaneous/dashboard-kits` has the matching route.

## Layout

The package follows react-ui's structure: plain React components with typed props, and thin openui-lang definitions over them.

```
src/
  components/            plain React components (no openui-lang)
    Charts/              the kit charts, built like react-ui's charts
      TrendChart/        TrendChart.tsx, types.ts, parts/, trendGeometry.ts (+ tests), trendChart.scss
      GoalPace/          gauge + pace chart, goalGeometry.ts (+ tests)
      Tracker/           status strip, trackerUtils.ts (+ tests)
      Sparkline/         KPI sparkline
      ColumnChart/       react-ui's BarChart, sized and themed for the kits
      shared/            tooltip, legend, crosshair, d3 series geometry, AnimatedPath, spring (ported from react-ui)
      hooks/ utils/      container size, chart hover, series focus, scales, pointer → index, formats, palette order
    HeroMetric/ KpiStrip/ InsightList/ ConversionFunnel/ CohortGrid/ BarList/ ShareBar/ …
  genui-lib/             openui-lang definitions of the shared blocks, Pending, createKitLibrary
  core/                  schemas, formats, kit types, prompt assembly, tool provider, sample-data helpers
  ecommerce/ analytics/  each kit: components, library, tools, kit (prompt and gallery), sample data
  styles/                theme tokens, shared primitives, each kit's component styles
```

**Charts reuse react-ui where it fits.** Column charts, the lifecycle chart, and the power user curve are react-ui's `BarChart`; the activity heatmap is `HeatmapChart`; the share bar is `SegmentedBar`. The kit adds charts react-ui does not have — the period-over-period `TrendChart` (shaded gap, events, goal lines and benchmark bands, in-progress tail), `GoalPace`, `Tracker`, the KPI `Sparkline`, and the analytics `EngagementMatrix` — with react-ui's architecture: a hook-free empty-state dispatcher, an implementation with parts, d3 scales and d3-shape curves (react-ui's "natural" monotone curve), pure geometry with unit tests, react-ui's motion (a spring data morph so data changes glide, mounted hover followers so the crosshair, dots, and tooltip glide between points, and draw-on entrances), and a stylesheet per chart under the `kit` class prefix. Charts measure before their first paint and snap on resize, so only data changes animate.

Where a react-ui chart was close but not a fit, the kit keeps its own:

| Kit chart          | Closest react-ui chart       | Why the kit keeps its own                                                                                                                                       |
| ------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Sparkline`        | `MiniAreaChart`              | `MiniAreaChart` keeps one point per 20px, so an 84px cell shows 5 of 30 days, and its range starts at zero, which flattens a KPI that moves between 40K and 45K |
| `ConversionFunnel` | `FunnelChart`                | The kit funnel shows what continues and drops off between steps, the median time between them, and the change against the prior period                          |
| `EngagementMatrix` | `ScatterChart`               | The matrix needs median quadrant lines, quadrant names, bubble sizes, and a label per feature                                                                   |
| `GoalPace` gauge   | `RadialChart` (semicircular) | The gauge marks where the pace says the month should be                                                                                                         |
| `TrendChart`       | `LineChart`, `AreaChart`     | The trend needs the prior period, the shaded gap, events, goal lines, benchmark bands, and the in-progress last point                                           |

## Develop

```sh
pnpm --filter @openuidev/dashboard-kits build
pnpm --filter @openuidev/dashboard-kits test
pnpm --filter @openuidev/dashboard-kits lint:check
```

`examples/miscellaneous/dashboard-kits` is the playground: `npm run kits:pack` there builds this package, packs it, and installs it.
