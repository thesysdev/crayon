import type { Arc, PieArcDatum } from "d3-shape";
import React, { useCallback } from "react";
import type { CategoricalSlice } from "../../hooks";
import { getSliceStyle } from "../../utils/polarUtils";

interface PieSlicesProps<T> {
  arcs: PieArcDatum<CategoricalSlice>[];
  arcGenerator: Arc<unknown, PieArcDatum<CategoricalSlice>>;
  slices: CategoricalSlice[];
  hoveredIndex: number | null;
  isAnimationActive: boolean;
  isPrinting: boolean;
  data: T[];
  onMouseMove: (event: React.MouseEvent, index: number) => void;
  onMouseLeave: () => void;
  onClick?: (row: T, index: number) => void;
}

export function PieSlices<T>({
  arcs,
  arcGenerator,
  slices,
  hoveredIndex,
  isAnimationActive,
  isPrinting,
  data,
  onMouseMove,
  onMouseLeave,
  onClick,
}: PieSlicesProps<T>) {
  const handleClick = useCallback(
    (index: number) => {
      if (onClick) {
        onClick(data[index]!, index);
      }
    },
    [onClick, data],
  );

  const animate = isAnimationActive && !isPrinting;

  return (
    <g>
      {arcs.map((arc, i) => {
        const slice = slices[i];
        if (!slice) return null;
        const pathD = arcGenerator(arc);
        if (!pathD) return null;

        return (
          <path
            key={slice.label}
            d={pathD}
            fill={slice.color}
            className={animate ? "openui-d3-pie-chart-slice--animated" : undefined}
            style={{
              ...getSliceStyle(i, hoveredIndex),
              cursor: onClick ? "pointer" : undefined,
              animationDelay: animate ? `${i * 50}ms` : undefined,
              transition: "opacity 0.2s ease, filter 0.2s ease",
            }}
            onMouseMove={(e) => onMouseMove(e, i)}
            onMouseLeave={onMouseLeave}
            onClick={() => handleClick(i)}
          />
        );
      })}
    </g>
  );
}
