# ChartsV2 — Internal Developer Guide

D3-based chart components for OpenUI. Five chart types across two topologies (cartesian and polar) share a common infrastructure of hooks, components, and utilities.

### Cartesian Charts

| Chart         | File                          | Scale        | Variants                          |
| ------------- | ----------------------------- | ------------ | --------------------------------- |
| `D3AreaChart` | `D3AreaChart/D3AreaChart.tsx` | `scalePoint` | linear, natural, step (+ stacked) |
| `D3BarChart`  | `D3BarChart/D3BarChart.tsx`   | `scaleBand`  | grouped, stacked                  |
| `D3LineChart` | `D3LineChart/D3LineChart.tsx` | `scalePoint` | linear, natural, step             |

### Polar Charts

| Chart           | File                              | Topology | Variants                |
| --------------- | --------------------------------- | -------- | ----------------------- |
| `D3PieChart`    | `D3PieChart/D3PieChart.tsx`       | polar    | pie, donut (+ semi)     |
| `D3RadialChart` | `D3RadialChart/D3RadialChart.tsx` | polar    | circular, semiCircular  |

## Architecture

### Cartesian Charts

```text
┌──────────────────────────────────────────────────┐
│            D3[Type]Chart Component               │
│                                                  │
│  useChartScrollableOrchestrator  (hooks/cartesian)│
│  ├── useChartData         (keys, colors, legend) │
│  ├── useChartDimensions   (sizing, layout)       │
│  ├── useChartHover        (hover state, handlers)│
│  └── useChartScroll       (scroll state)         │
│                                                  │
│  + type-specific scale hook (useXScale or        │
│    useXBandScale) + useYScale + useStackedData   │
│                                                  │
│  Renders via ScrollableChartLayout:              │
│  ├── YAxis (separate SVG)                        │
│  ├── Main SVG (scrollable container)             │
│  │   ├── Grid, Series, Crosshair                 │
│  │   └── XAxis                                   │
│  ├── ScrollButtonsHorizontal                     │
│  ├── DefaultLegend                               │
│  └── ChartTooltip (portal)                       │
└──────────────────────────────────────────────────┘
```

### Polar Charts

```text
┌──────────────────────────────────────────────────┐
│         D3PieChart / D3RadialChart               │
│                                                  │
│  useCategoricalChartOrchestrator (hooks/polar)   │
│  ├── useCategoricalChartData  (slices, colors)   │
│  ├── useContainerSize         (responsive size)  │
│  ├── useLegendHeight          (legend measuring) │
│  └── usePrintContext          (print detection)  │
│                                                  │
│  + chart-specific geometry (arcs / radial bars)  │
│                                                  │
│  Renders:                                        │
│  ├── SVG with centered <g> transform             │
│  │   └── PieSlices / RadialBars (+ RadialGrid)   │
│  ├── DefaultLegend                               │
│  └── ChartTooltip (portal)                       │
└──────────────────────────────────────────────────┘
```

## Hooks Reference

Hooks are organized into three layers under `hooks/` and re-exported from `hooks/index.ts`:

```text
hooks/
  core/       — coordinate-agnostic (shared by all chart types)
  cartesian/  — cartesian-only (scales, axes, scroll, orchestrators)
  polar/      — polar-only (categorical orchestrator)
  index.ts    — barrel re-exporting all layers
```

### Orchestration

| Hook                                | Layer     | Signature                         | Description                                                                                                                                                                                                                                                           |
| ----------------------------------- | --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChartScrollableOrchestrator`    | cartesian | `(params) => OrchestrationResult` | Master hook that composes `useChartData`, `useChartDimensions`, `useChartHover`, and `useChartScroll`. Returns 40+ properties covering refs, data, dimensions, hover, scroll, legend, tooltip, styles, and a `createMouseHandlers` factory. Used by all three cartesian charts. |
| `useChartCondensedOrchestrator`     | cartesian | `(params) => OrchestrationResult` | Condensed variant orchestrator for cartesian charts. Similar composition but uses angled X-axis labels and no scroll. Used by `*Condensed` chart variants.                                                                                                            |
| `useCategoricalChartOrchestrator`   | polar     | `(params) => OrchestrationResult` | Orchestrator for categorical (single-series) polar charts. Composes `useCategoricalChartData`, `useContainerSize`, `useLegendHeight`, `usePrintContext`. Provides refs, slices, dimensions, hover, tooltip, and legend state. Used by D3PieChart and D3RadialChart.     |

### Data (core/)

| Hook                      | Signature                                                                                                           | Description                                                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChartData`            | `(params) => { dataKeys, colors, hiddenSeries, toggleSeries, legendItems, chartConfig, colorMap, chartStyle, ... }` | Extracts data keys, assigns palette colors, manages series visibility toggle, and builds legend items. Ensures at least one series stays visible. |
| `useCategoricalChartData` | `(params) => { slices, total, hiddenSlices, toggleSlice, legendItems, chartStyle, sortedData }`                     | Single-series categorical data hook for polar charts. Sorts by value, assigns colors, manages slice visibility.                                   |
| `useTransformedKeys`      | `(keys) => Record<string, string>`                                                                                  | Maps data keys to shorthand IDs (`tk-0`, `tk-1`, ...) for CSS custom property names. Maintains a persistent cache across renders.                 |
| `useTooltipPayload`       | `(hoveredIndex, data, dataKeys, catKey, chartConfig) => TooltipPayload \| null`                                     | Builds tooltip content from the hovered data row. Returns null when nothing is hovered.                                                           |

### Data (cartesian/)

| Hook             | Signature                                          | Description                                                                                                      |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `useStackedData` | `(data, dataKeys, stacked) => StackedData \| null` | Runs D3 `stack()` generator. Returns null when stacking is disabled. Used by AreaChart and BarChart (stacked).   |

### Scales (cartesian/)

| Hook            | Signature                                                                          | Charts     | Description                                                                                             |
| --------------- | ---------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------- |
| `useXScale`     | `(data, categoryKey, svgWidth, widthOfGroup) => ScalePoint<string>`                | Area, Line | D3 point scale — positions points centered within group width.                                          |
| `useXBandScale` | `(data, categoryKey, svgWidth, paddingInner?, paddingOuter?) => ScaleBand<string>` | Bar        | D3 band scale — maps categories to discrete bands (default padding: 0.2 inner, 0.1 outer).              |
| `useYScale`     | `(data, dataKeys, chartInnerHeight, stackedData) => ScaleLinear<number, number>`   | All        | D3 linear scale with auto-domain from data (handles stacked max). Applies `.nice()` for readable ticks. |

### Layout & Dimensions

| Hook                           | Layer     | Signature                                                                                                                                                                                 | Description                                                                                                                                                                   |
| ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useChartDimensions`           | cartesian | `(params) => { containerWidth, effectiveYAxisWidth, tickVariant, xAxisHeight, chartInnerHeight, totalHeight, svgWidth, dataWidth, widthOfGroup, needsScroll, labelInterval, MARGIN_TOP }` | Calculates all layout measurements. Determines scroll necessity, auto-switches tick variant at 300px breakpoint, accounts for legend height when `fitLegendInHeight` is true. |
| `useContainerSize`             | core      | `(ref, fixedWidth?, fixedHeight?) => { width, height }`                                                                                                                                   | Measures container via ResizeObserver. Supports fixed overrides that bypass measurement.                                                                                      |
| `useXAxisHeight`               | cartesian | `(data, categoryKey, tickVariant, widthOfGroup?) => number`                                                                                                                               | Measures required X-axis label height by rendering hidden DOM elements. Returns 30px for `singleLine` variant.                                                                |
| `useYAxisWidth`                | cartesian | `(data, dataKeys) => { yAxisWidth, setLabelWidth }`                                                                                                                                       | Measures Y-axis width from formatted numbers. Clamped between 20-200px. `setLabelWidth` allows runtime refinement.                                                            |
| `useMaxLabelWidth`             | cartesian | `(data, categoryKey) => number`                                                                                                                                                           | Measures maximum category label width in pixels via canvas context. Used by condensed orchestrator for angle calculation.                                                     |
| `useAutoAngleCalculation`      | cartesian | `(maxLabelWidth, enabled, availableWidth?) => { angle, height }`                                                                                                                          | Calculates optimal label rotation angle for condensed charts.                                                                                                                 |
| `useCanvasContextForLabelSize` | core      | `() => CanvasRenderingContext2D`                                                                                                                                                          | Returns a memoized canvas 2D context configured with theme font, used for text measurement.                                                                                   |
| `useLegendHeight`              | core      | `(ref, showLegend) => number`                                                                                                                                                             | Measures legend element height via ResizeObserver. Returns 0 when legend is hidden.                                                                                           |

### Interaction

| Hook             | Layer     | Signature                                                               | Description                                                                                                                                                                    |
| ---------------- | --------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useChartHover`  | core      | `(params) => { hoveredIndex, mousePos, createMouseHandlers }`           | Manages hover state. `createMouseHandlers(findIndex)` is a factory that returns `handleMouseMove`, `handleMouseLeave`, `handleTouchMove`, `handleTouchEnd`, and `handleClick`. |
| `useChartScroll` | cartesian | `(params) => { canScrollLeft, canScrollRight, handleScroll, scrollTo }` | Manages horizontal scroll state with snap-to-data-point behavior. `scrollTo('left' \| 'right')` uses smooth scrolling.                                                         |

### Context

| Hook              | Layer | Signature       | Description                                                                                 |
| ----------------- | ----- | --------------- | ------------------------------------------------------------------------------------------- |
| `usePrintContext` | core  | `() => boolean` | Detects print mode via `matchMedia("print")`. Useful for disabling animations during print. |

## Shared Components Reference

All components are in `shared/` and re-exported from `shared/index.ts`.

### Axis Components

| Component    | File                    | Key Props                                                                     | Description                                                                                                                                                                                                    |
| ------------ | ----------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `XAxis`      | `shared/XAxis.tsx`      | `scale`, `data`, `categoryKey`, `tickVariant`, `labelInterval`, `classPrefix` | Renders X-axis category labels in `<foreignObject>` elements. Supports `singleLine` and `multiLine` variants. Handles label interval skipping; last label always shows. Works with both point and band scales. |
| `AngledXAxis`| `shared/AngledXAxis.tsx`| `data`, `categoryKey`, `chartAreaWidth`, `angle`, `classPrefix`               | Renders angled X-axis labels for condensed charts. Rotates labels to fit within constrained widths.                                                                                                            |
| `YAxis`      | `shared/YAxis.tsx`      | `scale`, `width`, `chartHeight`                                               | Renders Y-axis tick labels. Formats numbers with K/M/B/T abbreviations via `numberTickFormatter`. Auto-calculates tick count (40px min spacing).                                                               |
| `XAxisLabel` | `shared/XAxisLabel.tsx` | `label`, `tickVariant`, `width`, `multiLineClassName`, `singleLineClassName`  | Individual X-axis label with auto-truncation detection. Shows `LabelTooltip` only when text overflows.                                                                                                         |

### Visual Components

| Component          | File                          | Key Props                                                                                                   | Description                                                                                            |
| ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `Grid`             | `shared/Grid.tsx`             | `yScale`, `chartWidth`, `chartHeight`                                                                       | Horizontal grid lines based on Y-axis ticks. 40px minimum spacing between lines.                       |
| `ClipDefs`         | `shared/ClipDefs.tsx`         | `chartId`, `chartWidth`, `chartHeight`                                                                      | SVG `<clipPath>` to prevent chart content overflow. ID format: `clip-{chartId}`. Adds 6px top padding. |
| `LineDotCrosshair` | `shared/LineDotCrosshair.tsx` | `hoveredIndex`, `xScale`, `yScale`, `data`, `dataKeys`, `categoryKey`, `colors`, `chartHeight`, `getYValue` | Vertical crosshair line with colored dots at each series intersection. Used by Area and Line charts.   |

### Layout Components

| Component               | File                              | Key Props                                                                           | Description                                                                                                               |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `ScrollableChartLayout` | `shared/ScrollableChartLayout.tsx`| `orch`, `yScale`, `mouseHandlers`, `series`, `xAxis`, `classPrefix`, `showYAxis`, ... | Shared layout for scrollable cartesian charts. Handles Y-axis, scrollable SVG, scroll buttons, legend, and tooltip.       |
| `CondensedChartLayout`  | `shared/CondensedChartLayout.tsx` | `orch`, `yScale`, `mouseHandlers`, `series`, `xAxis`, `classPrefix`, `showYAxis`, ... | Shared layout for condensed cartesian charts. Single non-scrollable SVG with angled labels. Same legend/tooltip pattern.  |

### Tooltip Components

| Component              | File                                    | Key Props                                           | Description                                                                                                                            |
| ---------------------- | --------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `ChartTooltip`         | `shared/PortalTooltip/ChartTooltip.tsx` | `label`, `items: TooltipItem[]`, `viewportPosition` | Floating tooltip rendered via portal. Uses floating-ui for auto-positioning. Shows first 5 items if >10 with "Click to view all" text. |
| `LabelTooltipProvider` | `shared/LabelTooltip/LabelTooltip.tsx`  | `children`, `delayDuration?`                        | Radix UI tooltip provider — wraps chart root.                                                                                          |
| `LabelTooltip`         | `shared/LabelTooltip/LabelTooltip.tsx`  | `children`, `content`, `side?`, `disabled?`         | Tooltip wrapper for truncated labels. Returns child directly when disabled.                                                            |

### Legend & Navigation

| Component                 | File                                                         | Key Props                                                                                                           | Description                                                                                                                                                                               |
| ------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `DefaultLegend`           | `shared/DefaultLegend/DefaultLegend.tsx`                     | `items: LegendItem[]`, `isExpanded`, `setIsExpanded`, `onItemClick?`, `hiddenSeries?`, `xAxisLabel?`, `yAxisLabel?` | Bottom legend with color indicators or custom icons. Supports expand/collapse ("Show N more"). Hidden series shown at 0.3 opacity. Uses `useDefaultLegend` hook for intelligent wrapping. |
| `ScrollButtonsHorizontal` | `shared/ScrollButtonsHorizontal/ScrollButtonsHorizontal.tsx` | `dataWidth`, `effectiveWidth`, `canScrollLeft`, `canScrollRight`, `onScrollLeft`, `onScrollRight`                   | Left/right chevron buttons for horizontal scrolling. Hidden when data fits within container.                                                                                              |

### Shared Hook

| Hook             | File                       | Signature          | Description                                                                                    |
| ---------------- | -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------- |
| `useIsTruncated` | `shared/useIsTruncated.ts` | `(ref) => boolean` | Returns true if element overflows (width or height). Uses ResizeObserver for reactive updates. |

## Utilities

All utilities are in `utils/` and re-exported from `utils/index.ts`.

| Module         | File                    | Key Exports                                                                                | Description                                                                                                                                    |
| -------------- | ----------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `dataUtils`    | `utils/dataUtils.ts`    | `getDataKeys()`, `get2dChartConfig()`, `getLegendItems()`, `getColorForDataKey()`          | Data key extraction, chart config building, legend item generation.                                                                            |
| `paletteUtils` | `utils/paletteUtils.ts` | `useChartPalette()`, `getPalette()`, `getDistributedColors()`, `PaletteName`               | 6 color palettes (ocean, orchid, emerald, spectrum, sunset, vivid) with 11 colors each. Distributes colors around midpoint for visual balance. |
| `mouseUtils`   | `utils/mouseUtils.ts`   | `findNearestDataIndex()`, `findBandIndex()`                                                | Index lookup from mouse position — point scale (nearest) vs band scale (positional).                                                           |
| `scrollUtils`  | `utils/scrollUtils.ts`  | `getWidthOfData()`, `getWidthOfGroup()`, `getSnapPositions()`, `findNearestSnapPosition()` | Width calculation and snap-to-point scrolling. `ELEMENT_SPACING = 72px` per data group.                                                        |
| `styleUtils`   | `utils/styleUtils.ts`   | `numberTickFormatter()`                                                                    | Formats numbers with K/M/B/T abbreviations for axis ticks.                                                                                     |
| `polarUtils`   | `utils/polarUtils.ts`   | `sortByValueDescending()`, `getSliceStyle()`, `formatPercentage()`                         | Polar chart helpers — value sorting, hover opacity styling, percentage formatting.                                                             |

## Adding a New Chart

### Cartesian Chart (e.g., `D3ScatterChart`)

1. **Create the directory** following the existing pattern:

   ```text
   D3ScatterChart/
   ├── D3ScatterChart.tsx
   ├── types.ts
   ├── index.ts
   ├── parts/
   │   ├── ScatterSeries.tsx
   │   └── Crosshair.tsx
   └── stories/
       └── d3ScatterChart.stories.tsx
   ```

2. **Define types** in `types.ts` — extend `BaseChartProps<T>` from `types/common.ts` and add chart-specific props (e.g., `dotRadius`, `variant`).

3. **Use `useChartScrollableOrchestrator`** (from `hooks/cartesian/`) as the primary hook — it provides data, dimensions, hover, scroll, legend, and tooltip state out of the box. For condensed variants, use `useChartCondensedOrchestrator`.

4. **Pick the right scale hook** — `useXScale` (point) for continuous positioning, `useXBandScale` (band) for discrete categories.

5. **Build series component** in `parts/` — receives scale, data, and style props. Render SVG elements.

6. **Use `ScrollableChartLayout`** (or `CondensedChartLayout`) for the render pattern — handles Y-axis, scrollable SVG, scroll buttons, legend, and tooltip.

7. **Export** from `D3ScatterChart/index.ts` and add to `ChartsV2/index.ts`.

### Polar Chart (e.g., `D3RadarChart`)

1. **Create the directory** following the pie/radial pattern.

2. **Use `useCategoricalChartOrchestrator`** (from `hooks/polar/`) for single-series categorical data — it provides refs, slices, dimensions, hover, tooltip, and legend. For multi-series polar charts (e.g., radar), create a new orchestrator in `hooks/polar/` composing `useChartData` from `hooks/core/`.

3. **Add chart-specific geometry** — the orchestrator handles shared concerns; you only implement the SVG rendering (arcs, bars, spokes, etc.).

4. **Export** from the chart's `index.ts` and add to `ChartsV2/index.ts`.
