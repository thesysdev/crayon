import { arc } from "d3-shape";
import React, { useCallback, useMemo } from "react";
import type { CategoricalSlice } from "../../hooks";
import { getSliceStyle } from "../../utils/polarUtils";

interface RadialBarsProps<T> {
  slices: CategoricalSlice[];
  maxValue: number;
  maxRadius: number;
  minRadius: number;
  startAngle: number;
  endAngle: number;
  cornerRadius: number;
  barGap: number;
  hoveredIndex: number | null;
  isAnimationActive: boolean;
  isPrinting: boolean;
  data: T[];
  onMouseMove: (event: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  onClick?: (row: T, index: number) => void;
}

export function RadialBars<T>({
  slices,
  maxValue,
  maxRadius,
  minRadius,
  startAngle,
  endAngle,
  cornerRadius,
  barGap,
  hoveredIndex,
  isAnimationActive,
  isPrinting,
  data,
  onMouseMove,
  onMouseLeave,
  onClick,
}: RadialBarsProps<T>) {
  const handleClick = useCallback(
    (index: number) => {
      if (onClick) {
        onClick(data[index]!, index);
      }
    },
    [onClick, data],
  );

  const animate = isAnimationActive && !isPrinting;
  const totalSweep = endAngle - startAngle;
  const barThickness = (maxRadius - minRadius) / slices.length;

  const bars = useMemo(
    () =>
      slices.map((slice, i) => {
        const barInner = minRadius + i * barThickness + barGap;
        const barOuter = minRadius + (i + 1) * barThickness;
        const sweepAngle = maxValue > 0 ? (slice.value / maxValue) * totalSweep : 0;

        const arcGen = arc<null>()
          .innerRadius(barInner)
          .outerRadius(barOuter)
          .startAngle(startAngle)
          .endAngle(startAngle + sweepAngle)
          .cornerRadius(cornerRadius);

        return {
          path: arcGen(null) as string,
          color: slice.color,
          label: slice.label,
        };
      }),
    [slices, maxValue, minRadius, startAngle, totalSweep, cornerRadius, barGap, barThickness],
  );

  return (
    <g>
      {bars.map((bar, i) => (
        <path
          key={bar.label}
          d={bar.path}
          fill={bar.color}
          className={animate ? "openui-d3-radial-chart-bar--animated" : undefined}
          style={{
            ...getSliceStyle(i, hoveredIndex),
            cursor: onClick ? "pointer" : undefined,
            animationDelay: animate ? `${i * 60}ms` : undefined,
            transition: "opacity 0.2s ease, filter 0.2s ease",
          }}
          onMouseMove={(e) => onMouseMove(e, i)}
          onMouseLeave={onMouseLeave}
          onClick={() => handleClick(i)}
        />
      ))}
    </g>
  );
}
