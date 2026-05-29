"use client";

import { useId } from "react";
import { useChartStable } from "./chart-context";
import { SeriesMarkers, type SeriesMarkersProps } from "./series-markers";

export interface ScatterProps extends Omit<SeriesMarkersProps, "animate"> {
  /** Whether to animate points with clip reveal. Default: true */
  animate?: boolean;
  /**
   * Color each dot by its vertical position using a chart-space linear gradient.
   * Lower values use `from`; higher values use `to`. Default stops: red (bottom) → green (top).
   */
  yGradient?: boolean | { from?: string; to?: string };
}

const DEFAULT_Y_GRADIENT_FROM = "var(--color-red-500)";
const DEFAULT_Y_GRADIENT_TO = "var(--color-emerald-500)";

export function Scatter({
  dataKey,
  fill,
  stroke,
  strokeWidth = 2,
  ringGap = 2,
  outlineWidth = 0,
  outlineColor,
  radius = 5,
  animate = true,
  fadeOnHover = true,
  inactiveOpacity = 0.5,
  inactiveBlur = 2,
  enterBlur = 2,
  showActiveHighlight = true,
  yGradient,
}: ScatterProps) {
  const { innerHeight } = useChartStable();

  const yGradientConfig = (() => {
    if (!yGradient) {
      return null;
    }
    if (yGradient === true) {
      return { from: DEFAULT_Y_GRADIENT_FROM, to: DEFAULT_Y_GRADIENT_TO };
    }
    return {
      from: yGradient.from ?? DEFAULT_Y_GRADIENT_FROM,
      to: yGradient.to ?? DEFAULT_Y_GRADIENT_TO,
    };
  })();

  const yGradientId = `scatter-y-gradient-${useId().replace(/:/g, "")}`;
  const gradientFill = yGradientConfig ? `url(#${yGradientId})` : undefined;

  const resolvedFill = gradientFill ?? fill;
  const resolvedStroke = stroke ?? (gradientFill ? gradientFill : undefined);

  return (
    <>
      {yGradientConfig ? (
        <defs>
          <linearGradient
            gradientUnits="userSpaceOnUse"
            id={yGradientId}
            x1={0}
            x2={0}
            y1={innerHeight}
            y2={0}
          >
            <stop offset="0%" stopColor={yGradientConfig.from} />
            <stop offset="100%" stopColor={yGradientConfig.to} />
          </linearGradient>
        </defs>
      ) : null}
      <SeriesMarkers
        animate={animate}
        dataKey={dataKey}
        enterBlur={enterBlur}
        fadeOnHover={fadeOnHover}
        fill={resolvedFill}
        inactiveBlur={inactiveBlur}
        inactiveOpacity={inactiveOpacity}
        outlineColor={outlineColor}
        outlineWidth={outlineWidth}
        radius={radius}
        ringGap={ringGap}
        showActiveHighlight={showActiveHighlight}
        stroke={resolvedStroke}
        strokeWidth={strokeWidth}
      />
    </>
  );
}

Scatter.displayName = "Scatter";

export default Scatter;
