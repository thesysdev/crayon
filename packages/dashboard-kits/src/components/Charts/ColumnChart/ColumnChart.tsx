import { BarChart } from "@openuidev/react-ui";
import clsx from "clsx";
import { useMemo } from "react";
import { useContainerSize } from "../hooks";
import { colorSeries } from "../shared";
import { FILL_MAX_HEIGHT, KIT_CHART_PREFIX } from "../utils/constants";
import { paletteInOrder } from "../utils/palette";
import type { ColumnChartProps } from "./types";

const P = `${KIT_CHART_PREFIX}-column-chart`;
const DEFAULT_HEIGHT = 260;

/**
 * Columns over time or categories, drawn by react-ui's `BarChart` — the
 * library's own bars, tooltip, hover band, and legend — with the kit's
 * series colors passed as its palette (theme tokens, so light and dark follow
 * the kit theme) and sized to fill its card like the kit's other charts.
 */
export function ColumnChart(props: ColumnChartProps) {
  const hasData = props.labels.length > 0 && props.series.some((s) => s.values.length > 0);
  if (!hasData) {
    return (
      <div className={clsx(`${P} ${P}--empty`, props.className)}>
        <span className={`${P}-empty-text`}>No data available</span>
      </div>
    );
  }
  return <ColumnChartImpl {...props} />;
}

function ColumnChartImpl({
  labels,
  series: seriesProp,
  stacked = false,
  yLabel,
  height = DEFAULT_HEIGHT,
  fill = false,
  maxHeight = FILL_MAX_HEIGHT,
  isAnimationActive = true,
  className,
}: ColumnChartProps) {
  const [frameRef, size] = useContainerSize<HTMLDivElement>(640, height);
  const series = useMemo(() => colorSeries(seriesProp.slice(0, 4)), [seriesProp]);
  const data = useMemo(
    () =>
      labels.map((label, i) => {
        const row: Record<string, string | number> = { category: label };
        for (const s of series) row[s.name] = s.values[i] ?? 0;
        return row;
      }),
    [labels, series],
  );
  const plotHeight = fill ? Math.min(maxHeight, Math.max(height, size.height)) : height;

  return (
    <div
      ref={frameRef}
      className={clsx(P, fill && `${P}--fill`, className)}
      data-kit-fill={fill ? "" : undefined}
      style={fill ? { minHeight: height, maxHeight } : undefined}
    >
      <BarChart
        data={data}
        categoryKey="category"
        variant={stacked ? "stacked" : "grouped"}
        customPalette={paletteInOrder(series.map((s) => s.color))}
        condensed
        height={plotHeight}
        legend={series.length > 1 || yLabel != null}
        yAxisLabel={yLabel}
        maxBarWidth={24}
        barRadius={4}
        isAnimationActive={isAnimationActive}
      />
    </div>
  );
}
