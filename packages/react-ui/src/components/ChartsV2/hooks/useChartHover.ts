import { pointer } from "d3-selection";
import React, { useCallback, useState } from "react";

import type { ChartData } from "../types";

export interface UseChartHoverParams<T extends ChartData> {
  data: T;
  onClick?: (row: T[number], index: number) => void;
}

export function useChartHover<T extends ChartData>({ data, onClick }: UseChartHoverParams<T>) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  const createMouseHandlers = useCallback(
    (findIndex: (mouseX: number) => number) => {
      const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
        const [mouseX] = pointer(event.nativeEvent, event.currentTarget);
        setHoveredIndex(findIndex(mouseX));
        setMousePos({ x: event.clientX, y: event.clientY });
      };

      const handleMouseLeave = () => {
        setHoveredIndex(null);
        setMousePos(null);
      };

      const handleTouchMove = (event: React.TouchEvent<SVGSVGElement>) => {
        const touch = event.touches[0];
        if (!touch) return;
        const svgRect = event.currentTarget.getBoundingClientRect();
        const mouseX = touch.clientX - svgRect.left;
        setHoveredIndex(findIndex(mouseX));
        setMousePos({ x: touch.clientX, y: touch.clientY });
      };

      const handleTouchEnd = () => {
        setHoveredIndex(null);
        setMousePos(null);
      };

      const handleClick = onClick
        ? (event: React.MouseEvent<SVGSVGElement>) => {
            const [mouseX] = pointer(event.nativeEvent, event.currentTarget);
            const idx = findIndex(mouseX);
            if (idx >= 0 && idx < data.length) {
              onClick(data[idx]!, idx);
            }
          }
        : undefined;

      return { handleMouseMove, handleMouseLeave, handleTouchMove, handleTouchEnd, handleClick };
    },
    [onClick, data],
  );

  return {
    hoveredIndex,
    mousePos,
    createMouseHandlers,
  };
}
