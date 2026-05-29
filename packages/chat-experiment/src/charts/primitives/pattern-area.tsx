"use client";

import { curveMonotoneX } from "@visx/curve";
import { AreaClosed } from "@visx/shape";
import { useChartStable } from "../core/chart-context";

// biome-ignore lint/suspicious/noExplicitAny: d3 curve factory type
type CurveFactory = any;

export interface PatternAreaProps {
  /** Key in data to use for y values */
  dataKey: string;
  /** Fill color or pattern URL (e.g. `url(#pattern-id)`) */
  fill: string;
  /** Curve function. Default: curveMonotoneX */
  curve?: CurveFactory;
  /** @deprecated Pattern fill is not clip-revealed; only the stroke `Area` animates. */
  animate?: boolean;
}

/**
 * Filled area using an SVG pattern (`url(#id)`).
 * Pair with `PatternLines` in `AreaChart` children and an `Area` with `fillOpacity={0}` for the stroke line.
 */
export function PatternArea({ dataKey, fill, curve = curveMonotoneX }: PatternAreaProps) {
  const { data, xScale, yScale, xAccessor } = useChartStable();

  return (
    <AreaClosed
      curve={curve}
      data={data}
      fill={fill}
      x={(d) => xScale(xAccessor(d)) ?? 0}
      y={(d) => {
        const v = d[dataKey];
        return typeof v === "number" ? (yScale(v) ?? 0) : 0;
      }}
      yScale={yScale}
    />
  );
}

PatternArea.displayName = "PatternArea";

export default PatternArea;
