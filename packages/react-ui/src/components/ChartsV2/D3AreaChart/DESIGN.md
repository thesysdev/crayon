# D3 AreaChart — Design Document

> **Status**: Draft
> **Package**: `@openuidev/react-ui` — `ChartsV2/D3AreaChart` > **Depends on**: `d3@^7`, React 19, existing OpenUI design tokens

---

## 1. Why D3 Instead of Recharts

The existing `Charts/AreaChart` wraps Recharts. This creates several pain points:

- **Limited SVG control** — Recharts owns the entire SVG tree; customizing individual elements (gradients, crosshairs, clipping) requires hacks.
- **Bundle weight** — Recharts pulls in its own layout engine; D3 sub-packages are tree-shakeable and already installed as transitive deps.
- **Stacking flexibility** — Recharts `stackId` is all-or-nothing; D3's `d3.stack()` can be toggled per-render.
- **Animation control** — CSS transitions on D3-computed `d` attributes are simpler than Recharts' internal animation system.

The V2 approach: **React owns the DOM (JSX `<svg>`), D3 computes data (scales, paths, ticks, stacking).**

---

## 2. Directory Structure

```
ChartsV2/
├── D3AreaChart/
│   ├── DESIGN.md                      ← this document
│   ├── D3AreaChart.tsx                 ← main component
│   ├── d3AreaChart.scss                ← component styles
│   ├── types.ts                        ← props + data types
│   ├── index.ts                        ← public exports
│   ├── stories/
│   │   └── d3AreaChart.stories.tsx
│   └── parts/
│       ├── AreaSeries.tsx              ← <path> elements for each series
│       ├── XAxis.tsx                   ← D3-computed X-axis ticks + labels
│       ├── YAxis.tsx                   ← D3-computed Y-axis ticks + labels
│       ├── Grid.tsx                    ← horizontal grid lines
│       ├── Crosshair.tsx              ← vertical hover line + active dots
│       └── GradientDefs.tsx           ← <defs> with <linearGradient> per series
│
├── shared/                             ← copied & adapted from Charts/shared
│   ├── DefaultLegend/                  ← legend with expand/collapse
│   │   ├── DefaultLegend.tsx
│   │   ├── defaultLegend.scss
│   │   └── hooks/
│   │       └── useDefaultLegend.ts
│   ├── PortalTooltip/                  ← @floating-ui tooltip
│   │   ├── ChartTooltip.tsx           ← virtual-element tooltip (replaces CustomTooltipContent + FloatingUIPortal)
│   │   ├── portalTooltip.scss
│   │   └── utils/index.ts
│   ├── ScrollButtonsHorizontal/
│   │   ├── ScrollButtonsHorizontal.tsx
│   │   └── scrollButtonsHorizontal.scss
│   ├── LabelTooltip/
│   │   └── LabelTooltip.tsx
│   └── index.ts
│
├── utils/
│   ├── paletteUtils.ts                 ← palette definitions + useChartPalette
│   ├── dataUtils.ts                    ← getDataKeys, getLegendItems, etc.
│   ├── styleUtils.ts                   ← numberTickFormatter
│   ├── scrollUtils.ts                  ← snap positions, findNearestSnap
│   └── index.ts
│
├── hooks/
│   ├── useContainerSize.ts             ← ResizeObserver wrapper
│   ├── useYAxisWidth.ts                ← measure max Y-axis label width
│   ├── useXAxisHeight.ts               ← measure max X-axis label height
│   ├── useTransformedKeys.ts           ← stable UUID mapping for CSS vars
│   └── index.ts
│
├── types/
│   ├── common.ts                       ← LegendItem, XAxisTickVariant, etc.
│   └── index.ts
│
├── chartsV2.scss                       ← forwards all V2 chart SCSS
└── index.ts                            ← public ChartsV2 barrel export
```

**Key principle**: everything is local to `ChartsV2`. No import paths reach back into `Charts/`. When we copy shared pieces, they become V2's own code to evolve independently.

---

## 3. Props Interface

```typescript
// D3AreaChart/types.ts

export type D3AreaChartData = Array<Record<string, string | number>>;

export type D3AreaChartVariant = "linear" | "natural" | "step";

export type XAxisTickVariant = "singleLine" | "multiLine";

export interface D3AreaChartProps<T extends D3AreaChartData> {
  /** Array of data objects. Each must have a category field + numeric fields. */
  data: T;

  /** Key in data objects to use for X-axis categories. */
  categoryKey: keyof T[number];

  /** Color palette theme. Ignored when customPalette is provided. */
  theme?: PaletteName; // "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid"

  /** Custom color array. Overrides theme. */
  customPalette?: string[];

  /** Curve interpolation. Default: "natural" */
  variant?: D3AreaChartVariant;

  /** X-axis label display mode. Default: "multiLine" */
  tickVariant?: XAxisTickVariant;

  /** Whether areas are stacked or overlapping. Default: true */
  stacked?: boolean;

  /** Show cartesian grid lines. Default: true */
  grid?: boolean;

  /** Show legend. Default: true */
  legend?: boolean;

  /** Icon map for legend items. */
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;

  /** Enable initial draw animation. Default: false */
  isAnimationActive?: boolean;

  /** Show Y-axis. Default: true */
  showYAxis?: boolean;

  /** X-axis descriptive label shown in legend footer. */
  xAxisLabel?: React.ReactNode;

  /** Y-axis descriptive label shown in legend footer. */
  yAxisLabel?: React.ReactNode;

  /** Additional CSS class. */
  className?: string;

  /** Chart height. Number = px, string = CSS value (e.g. "100%", "50vh"). Defaults to 296. */
  height?: number | string;

  /** Chart width. Number = px, string = CSS value (e.g. "100%", "500px"). Defaults to fill container. */
  width?: number | string;
}
```

The API is intentionally a superset of the existing `AreaChartProps` — the only addition is `stacked?: boolean`.

---

## 4. D3 Rendering Strategy

### 4.1 Scales

```
X-axis (categorical):  d3.scalePoint()
  .domain(data.map(d => d[categoryKey]))
  .range([paddingLeft, chartWidth - paddingRight])
  .padding(0.5)

Y-axis (linear):       d3.scaleLinear()
  .domain([0, maxValue])           // non-stacked
  .domain([0, maxStackedValue])    // stacked
  .range([chartInnerHeight, 0])
  .nice()
```

`scalePoint` is used rather than `scaleBand` because area/line charts plot at point centers, not across bar widths.

### 4.2 Area Generator

```typescript
import { area, curveLinear, curveMonotoneX, curveStepAfter } from "d3-shape";

const curveMap = {
  linear: curveLinear,
  natural: curveMonotoneX, // smooth monotone — matches Recharts "monotone"
  step: curveStepAfter,
};

const areaGenerator = area<DataPoint>()
  .x((d) => xScale(d[categoryKey]))
  .y0((d) => yScale(d._y0 ?? 0)) // baseline (0 for non-stacked, stack baseline for stacked)
  .y1((d) => yScale(d._y1 ?? d[seriesKey]))
  .curve(curveMap[variant]);
```

### 4.3 Stacking

When `stacked={true}`:

```typescript
import { stack, stackOrderNone, stackOffsetNone } from "d3-shape";

const stackGenerator = stack<DataRow>()
  .keys(dataKeys)
  .order(stackOrderNone)
  .offset(stackOffsetNone);

const stackedData = stackGenerator(data);
// stackedData[seriesIndex][dataPointIndex] = [y0, y1]
```

When `stacked={false}`:

Each series renders independently from `y0 = 0` to `y1 = value`. The Y-axis domain uses the global max across all series.

### 4.4 SVG Structure

```
<svg viewBox="0 0 {totalWidth} {totalHeight}">
  <defs>
    <linearGradient id="grad-{key}" .../>   ← one per series
    <clipPath id="clip-chart-area">
      <rect ... />                           ← clips to chart inner area
    </clipPath>
  </defs>

  <g class="y-axis" transform="translate({yAxisWidth}, 0)">
    <!-- Y-axis ticks + labels -->
  </g>

  <g class="chart-body" transform="translate({yAxisWidth}, {marginTop})"
     clip-path="url(#clip-chart-area)">

    <g class="grid">
      <!-- horizontal grid lines -->
    </g>

    <g class="areas">
      <path class="area area-{key}" d="..." fill="url(#grad-{key})" />
      <path class="area-line area-line-{key}" d="..." stroke="..." />
    </g>

    <g class="crosshair" visibility="hidden">
      <line class="crosshair-line" ... />
      <circle class="active-dot" ... />  ← one per visible series
    </g>
  </g>

  <g class="x-axis" transform="translate({yAxisWidth}, {chartInnerHeight + marginTop})">
    <!-- X-axis ticks + labels via foreignObject -->
  </g>
</svg>
```

### 4.5 Why React JSX, Not D3 DOM Manipulation

D3 is used **only** for math: scales, path generation, tick calculation, stacking. The actual SVG elements are rendered by React JSX. This means:

- React reconciliation handles updates efficiently.
- No `d3.select().append()` — avoids fighting with React's virtual DOM.
- Hooks (`useMemo`, `useCallback`) cache expensive D3 computations.
- Easier to test: components are pure functions of props.

---

## 5. Component Decomposition

### 5.1 `D3AreaChart` (main orchestrator)

Responsibilities:

- Parse data: `getDataKeys(data, categoryKey)` to extract numeric series keys.
- Build color palette via `useChartPalette`.
- Build chart config for tooltip via `get2dChartConfig`.
- Compute `containerWidth` via `useContainerSize` (ResizeObserver).
- Compute `yAxisWidth` via `useYAxisWidth`.
- Compute `xAxisHeight` via `useXAxisHeight`.
- Decide if horizontal scroll is needed: `dataWidth > containerWidth`.
- Manage hover state: `hoveredIndex: number | null`.
- Manage legend expand/collapse state.
- Render the SVG tree + legend + scroll buttons + tooltip.

### 5.2 `parts/AreaSeries`

Props: `data`, `dataKeys`, `xScale`, `yScale`, `variant`, `stacked`, `colors`, `transformedKeys`, `gradientId`.

Renders one `<path class="area">` + one `<path class="area-line">` per series key. Uses `d3.area()` and `d3.line()` generators. The area path uses the gradient fill; the line path uses a solid stroke.

### 5.3 `parts/XAxis`

Props: `scale`, `data`, `categoryKey`, `tickVariant`, `widthOfGroup`, `labelHeight`.

Computes tick positions from `xScale.domain()`. Renders `<g>` elements with `<foreignObject>` containing HTML labels (same approach as existing `XAxisTick`). Handles truncation via CSS (`-webkit-line-clamp` for multiLine, `text-overflow: ellipsis` for singleLine). Wraps truncated labels in `<LabelTooltip>`.

### 5.4 `parts/YAxis`

Props: `scale`, `width`.

Calls `yScale.ticks()` to get nice tick values. Renders `<text>` elements with `numberTickFormatter`. Reports max label width back via callback (for dynamic Y-axis sizing).

### 5.5 `parts/Grid`

Props: `yScale`, `chartWidth`.

Renders horizontal `<line>` elements at each Y-axis tick position. Uses `openui-chart-cartesian-grid` class for consistent styling with existing charts.

### 5.6 `parts/Crosshair`

Props: `hoveredIndex`, `xScale`, `yScale`, `data`, `dataKeys`, `colors`, `stacked`, `chartHeight`.

When `hoveredIndex !== null`:

- Renders a vertical `<line>` at the hovered X position.
- Renders `<circle>` active dots at each series' Y position.
- Active dot style: outer ring (4px radius, foreground color) + inner dot (2px radius, series color).

### 5.7 `parts/GradientDefs`

Props: `dataKeys`, `transformedKeys`.

Renders `<defs>` containing one `<linearGradient>` per series. Gradient goes from 60% opacity at top to 0% opacity at bottom (matching current chart gradient: `stopOpacity={0.6}` at 5%, `stopOpacity={0}` at 95%).

---

## 6. Interaction Design

### 6.1 Hover / Tooltip

```
User mouses over chart body
  → onMouseMove handler
  → compute nearest data index from mouse X:
      const mouseX = d3.pointer(event)[0]
      const domain = xScale.domain()
      const nearestIndex = d3.bisector(...)
            OR iterate domain and find closest xScale(category)
  → set hoveredIndex state
  → Crosshair renders at that index
  → Tooltip renders via FloatingUIPortal at mouse position
```

The tooltip payload is constructed by the `useTooltipPayload` hook:

```typescript
interface TooltipItem {
  name: string;   // series key
  value: number;  // series value at hovered index
  color: string;  // series color
}

interface TooltipPayload {
  label: string;        // category value at hovered index
  items: TooltipItem[];
}
```

The tooltip is positioned using viewport coordinates (`event.clientX`, `event.clientY`). `ChartTooltip` uses Floating UI's virtual element API (`getBoundingClientRect`) — no phantom DOM div — with `offset`, `flip`, and `shift` middleware. It portals to `document.body` with the theme class from `useTheme()`.

**Touch support**: Same `touchstart`/`touchmove` handlers, with `touchend` clearing the hover state.

### 6.2 Legend Toggle (New Feature)

Clicking a legend item hides/shows the corresponding series. This requires:

- `hiddenSeries: Set<string>` state in the main component.
- Filter `dataKeys` to exclude hidden series before computing stack/areas.
- Legend items show as dimmed when hidden.

### 6.3 Scroll Behavior

When `dataWidth > effectiveContainerWidth`:

- The SVG is rendered at full `dataWidth` inside a scroll container.
- The Y-axis is rendered in a separate fixed container to the left (same pattern as current chart).
- `ScrollButtonsHorizontal` appears below the chart.
- Snap positions computed from `getSnapPositions(data)`.
- Scroll events update `canScrollLeft` / `canScrollRight` button states.

Layout:

```
┌──────────────────────────────────────────────┐
│ ┌─────────┐ ┌─────────────────────────────┐  │
│ │ Y-Axis  │ │  Scrollable Chart Body      │  │
│ │ (fixed) │ │  (overflow-x: auto)         │  │
│ │         │ │  SVG width = dataWidth       │  │
│ └─────────┘ └─────────────────────────────┘  │
│                 [◀] ─────────────── [▶]       │
│ ┌──────────────────────────────────────────┐  │
│ │ Legend (with expand/collapse)             │  │
│ └──────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

## 7. Responsiveness

### 7.1 Container Width

```typescript
// hooks/useContainerSize.ts
export function useContainerSize(
  ref: React.RefObject<HTMLElement>,
  fixedWidth?: number,
): { width: number } {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (fixedWidth || !ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(ref.current);
    setWidth(ref.current.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, [fixedWidth]);

  return { width: fixedWidth ?? width };
}
```

### 7.2 Adaptive Layout

| Container width | Behavior                                                    |
| --------------- | ----------------------------------------------------------- |
| `>= dataWidth`  | No scroll. SVG fills container.                             |
| `< dataWidth`   | Horizontal scroll enabled. Scroll buttons appear.           |
| `< 300px`       | X-axis switches to `singleLine` tick variant automatically. |

### 7.3 Chart Height

```
chartHeight = height ?? (296 + xAxisLabelHeight)
```

The 296px default matches the current chart. `xAxisLabelHeight` is measured dynamically via `useXAxisHeight`.

---

## 8. Theming & Styling

### 8.1 Design Tokens

All styles use `cssUtils` tokens per the project's styling rule:

```scss
@use "../../../../cssUtils" as cssUtils;

.openui-d3-area-chart {
  // Container
  &-container {
    width: 100%;
  }

  &-container-inner {
    display: flex;
    width: 100%;
  }

  &-y-axis-container {
    flex-shrink: 0;
  }

  &-main-container {
    width: 100%;
    overflow-x: auto;
    &::-webkit-scrollbar {
      display: none;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
}

// Grid lines
.openui-d3-area-chart-grid line {
  stroke: cssUtils.$border-default;
  stroke-dasharray: 3 3;
}

// Axis ticks
.openui-d3-area-chart-y-tick {
  @include cssUtils.typography(label, extra-small);
  fill: cssUtils.$text-neutral-secondary;
}

.openui-d3-area-chart-x-tick-multi-line {
  @include cssUtils.typography(label, extra-small);
  color: cssUtils.$text-neutral-secondary;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-align: center;
  word-break: break-word;
}

.openui-d3-area-chart-x-tick-single-line {
  @include cssUtils.typography(label, extra-small);
  color: cssUtils.$text-neutral-secondary;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}

// Crosshair
.openui-d3-area-chart-crosshair-line {
  stroke: cssUtils.$border-default;
  stroke-width: 1;
  stroke-dasharray: 4 4;
}

// Area paths
.openui-d3-area-chart-area-path {
  transition: opacity 0.2s ease;
}

.openui-d3-area-chart-area-line {
  fill: none;
  stroke-width: 2;
}
```

### 8.2 Series Colors via CSS Variables

Same pattern as existing charts. The main component injects CSS variables:

```typescript
const chartStyle = dataKeys.reduce(
  (styles, key) => {
    const transformedKey = transformedKeys[key];
    const color = chartConfig[key]?.color;
    return {
      ...styles,
      [`--color-${transformedKey}`]: color,
    };
  },
  {} as Record<string, string>,
);
```

Area paths reference these variables: `stroke: var(--color-{transformedKey})`.

### 8.3 Palette System

Copied from `Charts/utils/PalletUtils.ts` into `ChartsV2/utils/paletteUtils.ts`. Six palettes:

| Name       | Character                      |
| ---------- | ------------------------------ |
| `ocean`    | Blues: `#0D47A1` → `#EFF8FF`   |
| `orchid`   | Purples: `#3A365B` → `#F7EFFF` |
| `emerald`  | Greens: `#10451D` → `#DCFFE5`  |
| `spectrum` | Blue-to-red diverging          |
| `sunset`   | Purple → orange → yellow       |
| `vivid`    | Multi-hue rainbow              |

`getDistributedColors(palette, dataLength)` picks evenly-spaced colors centered on the palette midpoint.

---

## 9. Hooks Reference

### `useContainerSize(ref, fixedWidth?)`

Returns `{ width }`. Uses `ResizeObserver` when no `fixedWidth` is provided.

### `useYAxisWidth(data, dataKeys)`

Measures the widest formatted Y-axis label using a hidden `<canvas>` for text measurement. Returns `{ yAxisWidth, setLabelWidth }`. Clamps between 20px and 200px.

**Source**: Adapted from `Charts/hooks/useYAxisLabelWidth.tsx`.

### `useXAxisHeight(data, categoryKey, tickVariant, widthOfGroup)`

Measures the tallest X-axis label by creating a hidden DOM element and reading its `getBoundingClientRect`. Returns pixel height.

**Source**: Adapted from `Charts/hooks/useMaxLabelHeight.tsx`.

### `useTransformedKeys(keys)`

Maps each data key to a stable UUID for use in CSS variable names and gradient IDs. Cached in a ref so UUIDs persist across re-renders.

**Source**: Copied from `Charts/hooks/useTransformKey.tsx`.

### `useChartPalette({ chartThemeName, customPalette, dataLength })`

Returns an array of colors for the data series. Reads the theme context palette first, falls back to built-in palettes.

**Source**: Adapted from `Charts/utils/PalletUtils.ts`.

---

## 10. Shared Components to Copy

Each of these is copied from `Charts/shared/` into `ChartsV2/shared/` with modifications noted:

### `DefaultLegend`

- **Source**: `Charts/shared/DefaultLegend/`
- **Changes**: Remove recharts dependency. Add `onItemClick(key)` callback prop for legend toggle. Dimmed style for hidden series.
- **Files**: `DefaultLegend.tsx`, `defaultLegend.scss`, `hooks/useDefaultLegend.ts`

### `PortalTooltip`

- **Source**: `Charts/shared/PortalTooltip/`
- **Changes**: Replaced `CustomTooltipContent` + `FloatingUIPortal` with a single `ChartTooltip` component using Floating UI's virtual element API. Accepts viewport coordinates directly, no phantom DOM div or manual scroll-clipping.
- **Files**: `ChartTooltip.tsx`, `portalTooltip.scss`, `utils/index.ts`

### `ScrollButtonsHorizontal`

- **Source**: `Charts/shared/ScrollButtonsHorizontal/`
- **Changes**: Remove `isSideBarTooltipOpen` prop (SideBarTooltip is deferred). Otherwise identical.
- **Files**: `ScrollButtonsHorizontal.tsx`, `scrollButtonsHorizontal.scss`

### `LabelTooltip`

- **Source**: `Charts/shared/LabelTooltip/`
- **Changes**: None — pure Radix tooltip wrapper, no recharts dependency.
- **Files**: `LabelTooltip.tsx`

---

## 11. Utility Functions to Copy

### `dataUtils.ts`

From `Charts/utils/dataUtils.ts`. Functions:

- `getDataKeys(data, categoryKey)` — extract numeric keys from first data row.
- `get2dChartConfig(dataKeys, colors, transformedKeys, secondaryColors?, icons?)` — build config map.
- `getLegendItems(dataKeys, colors, icons?)` — build legend item array.
- `getColorForDataKey(dataKey, dataKeys, colors)` — lookup color by key.

### `styleUtils.ts`

From `Charts/utils/styleUtils.ts`. Functions:

- `numberTickFormatter(value)` — formats large numbers as K/M/B/T.

### `scrollUtils.ts`

From `Charts/utils/AreaAndLine/AreaAndLineUtils.ts`. Functions:

- `getWidthOfGroup(data)` — returns 72px (fixed element spacing).
- `getWidthOfData(data, containerWidth)` — total data width or container width (whichever is larger).
- `getSnapPositions(data)` — array of scroll snap offsets.
- `findNearestSnapPosition(snapPositions, currentScroll, direction)` — for scroll button navigation.

---

## 12. Animation Strategy

### 12.1 Initial Draw Animation (`isAnimationActive`)

**Approach**: CSS `stroke-dasharray` / `stroke-dashoffset` reveal.

```scss
.openui-d3-area-chart-area-line--animated {
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw-line 1s ease-out forwards;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

.openui-d3-area-chart-area-path--animated {
  opacity: 0;
  animation: fade-in 0.6s ease-out 0.4s forwards;
}

@keyframes fade-in {
  to {
    opacity: 1;
  }
}
```

The `--path-length` CSS variable is set via `ref.current.getTotalLength()` after mount.

### 12.2 Data Update Transitions

When data changes, area `d` attributes update. CSS transitions handle the interpolation:

```scss
.openui-d3-area-chart-area-path {
  transition:
    d 0.3s ease-out,
    opacity 0.2s ease;
}
```

Note: CSS `transition` on `d` is supported in modern browsers (Chrome 114+, Firefox 97+, Safari 17.5+). For older browsers, the change is instant (progressive enhancement).

---

## 13. Data Flow Diagram

```
Props (data, categoryKey, theme, stacked, variant, ...)
  │
  ▼
┌─────────────────────────────────────────────────┐
│ D3AreaChart (main component)                     │
│                                                   │
│  dataKeys = getDataKeys(data, categoryKey)        │
│  colors = useChartPalette(theme, dataKeys.length) │
│  transformedKeys = useTransformedKeys(dataKeys)   │
│  containerWidth = useContainerSize(ref, width)    │
│  yAxisWidth = useYAxisWidth(data, dataKeys)       │
│  xAxisHeight = useXAxisHeight(data, categoryKey)  │
│                                                   │
│  xScale = d3.scalePoint(...)                      │
│  yScale = d3.scaleLinear(...)                     │
│  stackedData = stacked ? d3.stack()(...) : null   │
│                                                   │
│  dataWidth = getWidthOfData(data, containerWidth) │
│  needsScroll = dataWidth > containerWidth         │
│                                                   │
│  [hoveredIndex, setHoveredIndex] = useState(null) │
│  [hiddenSeries, setHiddenSeries] = useState(new Set) │
│  [isLegendExpanded, setIsLegendExpanded] = useState(false) │
└─────────────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────────┐
│ Render Tree                                  │
│                                              │
│  <div .openui-d3-area-chart-container>       │
│    <div .container-inner>                    │
│      <svg .y-axis-svg>                       │  ← fixed left
│        <YAxis scale={yScale} />              │
│      </svg>                                  │
│      <div .main-container (scroll)>          │  ← scrollable
│        <svg width={dataWidth} height={...}>  │
│          <GradientDefs ... />                │
│          <Grid yScale={yScale} />            │
│          <AreaSeries ... />                  │
│          <XAxis scale={xScale} />            │
│          <Crosshair hoveredIndex={...} />    │
│        </svg>                                │
│      </div>                                  │
│    </div>                                    │
│    <ScrollButtonsHorizontal ... />           │
│    <DefaultLegend ... />                     │
│    <ChartTooltip ... />                       │  ← portal tooltip (virtual element)
│  </div>                                      │
└─────────────────────────────────────────────┘
```

---

## 14. Mapping: Recharts AreaChart → D3 AreaChart

| Recharts Concept                     | D3 Equivalent                                        | Notes                                    |
| ------------------------------------ | ---------------------------------------------------- | ---------------------------------------- |
| `<AreaChart data={...}>`             | `d3.stack()` + `d3.area()` computed in `useMemo`     | React renders `<svg>`, D3 does math only |
| `<Area dataKey="..." stackId="a">`   | `<path d={areaGenerator(seriesData)}>`               | One `<path>` per series                  |
| `<XAxis dataKey="..." interval={0}>` | `xScale.domain().map(...)` → `<foreignObject>` ticks | Same HTML-in-SVG approach for text       |
| `<YAxis>`                            | `yScale.ticks()` → `<text>` elements                 | Simpler, no foreignObject needed         |
| `<CartesianGrid>`                    | `yScale.ticks()` → `<line>` elements                 | Horizontal lines only                    |
| `<ChartTooltip content={...}>`       | `onMouseMove` → `ChartTooltip` (virtual element)     | Decoupled from recharts context          |
| `<ResponsiveContainer>`              | `useContainerSize()` hook                            | `ResizeObserver` directly                |
| `activeDot={<ActiveDot />}`          | `<Crosshair>` component                              | Renders dots at hovered index            |
| `<linearGradient>` in `<defs>`       | Same — `<GradientDefs>` component                    | Identical SVG pattern                    |
| `ChartContainer` + `ChartStyle`      | CSS vars injected via `style` prop                   | No recharts `ChartContext` needed        |

---

## 15. Testing Plan

### Unit Tests

- `dataUtils`: verify `getDataKeys`, `getLegendItems` with various data shapes.
- `scrollUtils`: verify snap positions, nearest snap finding.
- `numberTickFormatter`: verify K/M/B/T formatting.
- D3 computations: verify scale domains/ranges, stacked vs non-stacked area paths.

### Component Tests (React Testing Library)

- Renders correct number of area `<path>` elements.
- Y-axis tick labels formatted correctly.
- X-axis labels truncated when exceeding group width.
- Hover triggers crosshair and tooltip.
- Legend expand/collapse behavior.
- Legend toggle hides/shows series.
- Scroll buttons appear when data overflows.

### Visual Tests (Storybook)

- All stories from existing AreaChart replicated (DataExplorer, BigLabels, DenseTimeline, etc.).
- New stories: stacked vs overlapping comparison, legend toggle demo.

---

## 16. Migration Path

1. **Phase 1** (this document): Design and architecture.
2. **Phase 2**: Implement core — `D3AreaChart` with scales, area paths, axes, grid. No tooltip or legend.
3. **Phase 3**: Add tooltip (copy + adapt `PortalTooltip`), crosshair, active dots.
4. **Phase 4**: Add legend (copy + adapt `DefaultLegend`), legend toggle.
5. **Phase 5**: Add scroll behavior (copy `ScrollButtonsHorizontal`), snap positions.
6. **Phase 6**: Animation, polish, Storybook stories.
7. **Phase 7**: Export from `ChartsV2/index.ts`, add to main package exports.

Each phase is independently testable and deployable.

---

## 17. Open Questions

- **Accessibility**: Should the chart include ARIA labels for screen readers? The current Recharts chart uses `accessibilityLayer`. We should add `role="img"` with `aria-label` at minimum.
- **Print context**: The current chart disables animation in print mode via `usePrintContext`. Should V2 support this from day one?
- **Export data**: The current chart supports `data-openui-chart` attribute for PPTX export. Include in V2?

---

## Appendix A: D3 Imports

Only the specific D3 sub-packages needed (tree-shakeable):

```typescript
// Scales
import { scaleLinear, scalePoint } from "d3-scale";

// Shape generators
import { area, line, stack, stackOrderNone, stackOffsetNone } from "d3-shape";

// Curves
import { curveLinear, curveMonotoneX, curveStepAfter } from "d3-shape";

// Interaction
import { pointer, bisector } from "d3-selection";

// Formatting (optional — we have our own numberTickFormatter)
import { format } from "d3-format";
```

These are all already installed as transitive dependencies of `d3@^7`.

---

## Appendix B: Existing File References

These are the source files from `Charts/` that this design is based on. Agents implementing this design should read these for reference:

| File                                                                | Purpose                                               |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| `Charts/AreaChart/AreaChart.tsx`                                    | Main component — rendering logic, state management    |
| `Charts/AreaChart/areaChart.scss`                                   | Layout styles                                         |
| `Charts/AreaChart/types/index.ts`                                   | Data and variant types                                |
| `Charts/Charts.tsx`                                                 | ChartContainer, ChartConfig, ChartStyle, ChartTooltip |
| `Charts/utils/PalletUtils.ts`                                       | Palette definitions, useChartPalette                  |
| `Charts/utils/dataUtils.ts`                                         | getDataKeys, get2dChartConfig, getLegendItems         |
| `Charts/utils/styleUtils.ts`                                        | numberTickFormatter                                   |
| `Charts/utils/AreaAndLine/AreaAndLineUtils.ts`                      | Scroll/snap utilities                                 |
| `Charts/shared/DefaultLegend/DefaultLegend.tsx`                     | Legend component                                      |
| `Charts/shared/PortalTooltip/CustomTooltipContent.tsx`              | Tooltip content                                       |
| `Charts/shared/PortalTooltip/FloatingUIPortal.tsx`                  | Portal positioning                                    |
| `Charts/shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal.tsx` | Scroll buttons                                        |
| `Charts/shared/XAxisTick/XAxisTick.tsx`                             | X-axis label rendering                                |
| `Charts/shared/YAxisTick/YAxisTick.tsx`                             | Y-axis label rendering                                |
| `Charts/shared/ActiveDot/ActiveDot.tsx`                             | Hover dot rendering                                   |
| `Charts/hooks/useYAxisLabelWidth.tsx`                               | Y-axis width calculation                              |
| `Charts/hooks/useMaxLabelHeight.tsx`                                | X-axis height calculation                             |
| `Charts/hooks/useTransformKey.tsx`                                  | Stable UUID mapping                                   |
| `Charts/hooks/useCanvasContextForLabelSize.ts`                      | Canvas text measurement                               |
