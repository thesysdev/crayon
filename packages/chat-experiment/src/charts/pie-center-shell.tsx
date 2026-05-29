"use client";

import { pie as d3Pie } from "d3-shape";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PieCenter, type PieCenterProps } from "./pie-center";
import {
  defaultPieColors,
  type PieArcData,
  type PieContextValue,
  type PieData,
  PieProvider,
} from "./pie-context";

const SHELL_HOVER_OFFSET = 10;

export type PieCenterShellProps = Omit<PieCenterProps, "children"> & {
  /** Value shown with NumberFlow (same role as pie total when not hovering) */
  centerValue: number;
  /** Square reference size for pie context (matches `PieChart` `size`) */
  contextSize: number;
  /** Inner radius in px — must be > 0 so `PieCenter` renders */
  innerRadiusPx: number;
  /**
   * When true (default), the first paint uses `0` then updates to `centerValue`
   * on the next frame so NumberFlow can run an entrance transition. Subsequent
   * `centerValue` updates animate as usual.
   */
  animateEntrance?: boolean;
};

/**
 * Renders {@link PieCenter} with a minimal {@link PieProvider} so you can reuse
 * the same center layout as a donut pie without mounting slices or a full {@link PieChart}.
 */
export function PieCenterShell({
  centerValue,
  contextSize,
  innerRadiusPx,
  animateEntrance = true,
  ...pieCenterProps
}: PieCenterShellProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const introStartedRef = useRef(false);

  const [flowTotal, setFlowTotal] = useState(() => (animateEntrance ? 0 : centerValue));

  useEffect(() => {
    if (!animateEntrance) {
      setFlowTotal(centerValue);
      return undefined;
    }

    if (!introStartedRef.current) {
      introStartedRef.current = true;
      setFlowTotal(0);
      let innerRaf = 0;
      const outerRaf = requestAnimationFrame(() => {
        innerRaf = requestAnimationFrame(() => setFlowTotal(centerValue));
      });
      return () => {
        cancelAnimationFrame(outerRaf);
        cancelAnimationFrame(innerRaf);
        introStartedRef.current = false;
      };
    }

    setFlowTotal(centerValue);
    return undefined;
  }, [animateEntrance, centerValue]);

  const data: PieData[] = useMemo(
    () => [{ label: "_pieCenterShell", value: Math.max(flowTotal, 0) }],
    [flowTotal],
  );

  const totalValue = flowTotal;

  const arcs = useMemo((): PieArcData[] => {
    const v = data[0]?.value ?? 0;
    if (v > 0) {
      const pieGenerator = d3Pie<PieData>()
        .value((d) => d.value)
        .startAngle(-Math.PI / 2)
        .endAngle((3 * Math.PI) / 2)
        .padAngle(0)
        .sort(null);
      const computed = pieGenerator(data);
      return computed.map((arc, index) => ({
        data: arc.data,
        index,
        startAngle: arc.startAngle,
        endAngle: arc.endAngle,
        padAngle: arc.padAngle,
        value: arc.value,
      })) as PieArcData[];
    }
    const d0 = data[0];
    if (!d0) {
      return [];
    }
    return [
      {
        data: d0,
        index: 0,
        startAngle: -Math.PI / 2,
        endAngle: (3 * Math.PI) / 2,
        padAngle: 0,
        value: 0,
      },
    ];
  }, [data]);

  const getColor = useCallback((index: number) => {
    return defaultPieColors[index % defaultPieColors.length] as string;
  }, []);

  const getFill = useCallback(
    (index: number) => {
      const item = data[index];
      if (item?.fill) {
        return item.fill;
      }
      return getColor(index);
    },
    [data, getColor],
  );

  const center = contextSize / 2;
  const outerRadius = center - SHELL_HOVER_OFFSET;

  const contextValue: PieContextValue = useMemo(
    () => ({
      data,
      arcs,
      size: contextSize,
      center,
      outerRadius,
      innerRadius: innerRadiusPx,
      padAngle: 0,
      cornerRadius: 0,
      hoverOffset: SHELL_HOVER_OFFSET,
      hoveredIndex: null,
      setHoveredIndex: () => undefined,
      animationKey: 0,
      isLoaded: true,
      enterStaggerScale: 1,
      containerRef,
      totalValue,
      getColor,
      getFill,
    }),
    [data, arcs, contextSize, center, outerRadius, innerRadiusPx, totalValue, getColor, getFill],
  );

  return (
    <PieProvider value={contextValue}>
      <PieCenter {...pieCenterProps} />
    </PieProvider>
  );
}

PieCenterShell.displayName = "PieCenterShell";
