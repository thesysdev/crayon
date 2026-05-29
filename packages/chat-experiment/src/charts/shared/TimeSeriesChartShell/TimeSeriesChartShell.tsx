"use client";

import { scaleLinear, scaleTime } from "@visx/scale";
import { bisector, extent } from "d3-array";
import type { Transition } from "motion/react";
import {
  Children,
  cloneElement,
  isValidElement,
  memo,
  type ReactElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  computeSeriesBarRevealClipPadding,
  computeSeriesBarWidth,
} from "../../BarChart/utils/seriesBarLayout";
import { ChartProvider, type LineConfig, type Margin } from "../../context/ChartContext";
import { useChartInteraction } from "../../hooks/useChartInteraction";
import { DEFAULT_ANIMATION_EASING } from "../../utils/animation";
import { isGradientDefComponent, isPatternDefComponent } from "../../utils/chartDefs";
import { shortDateFmt } from "../../utils/chartFormatters";
import { decimateTimeSeries, maxRenderPointsForWidth } from "../../utils/decimateTimeSeries";
import { ChartRevealClip } from "../ChartRevealClip/ChartRevealClip";

function collectNumericExtents(data: Record<string, unknown>[], dataKeys: string[]) {
  let minValue = Number.POSITIVE_INFINITY;
  let maxValue = Number.NEGATIVE_INFINITY;

  for (const d of data) {
    for (const key of dataKeys) {
      const value = d[key];
      if (typeof value === "number") {
        if (value < minValue) {
          minValue = value;
        }
        if (value > maxValue) {
          maxValue = value;
        }
      }
    }
  }

  if (minValue === Number.POSITIVE_INFINITY) {
    return { minValue: 0, maxValue: 100 };
  }

  return { minValue, maxValue };
}

function resolveTimeSeriesYDomain(
  data: Record<string, unknown>[],
  dataKeys: string[],
  yScaleDomainMax: number | undefined,
): [number, number] {
  if (yScaleDomainMax != null && yScaleDomainMax > 0) {
    return [0, yScaleDomainMax * 1.1];
  }

  const { minValue, maxValue } = collectNumericExtents(data, dataKeys);

  if (minValue >= 0) {
    const top = maxValue <= 0 ? 100 : maxValue * 1.1;
    return [0, top];
  }

  const padding = (maxValue - minValue) * 0.05 || 1;
  return [minValue - padding, maxValue + padding];
}

/** Markers render after the interaction overlay so they stay clickable. */
export function isPostOverlayComponent(child: ReactElement): boolean {
  const childType = child.type as {
    displayName?: string;
    name?: string;
    __isChartMarkers?: boolean;
  };

  if (childType.__isChartMarkers) {
    return true;
  }

  const componentName =
    typeof child.type === "function" ? childType.displayName || childType.name || "" : "";

  return componentName === "ChartMarkers" || componentName === "MarkerGroup";
}

function ensureChildKey(child: ReactElement, index: number): ReactElement {
  if (child.key != null) {
    return child;
  }
  return cloneElement(child, { key: `chart-child-${index}` });
}

export interface TimeSeriesChartInnerProps {
  width: number;
  height: number;
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: Margin;
  animationDuration: number;
  animationEasing?: string;
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers reveal replay when it changes. */
  revealSignature?: string;
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** Series keys driving y-domain and tooltip (Line / Area / SeriesBar configs). */
  lines: LineConfig[];
  /** SVG clipPath id for grow animation. */
  clipPathId: string;
  /** Optional ComposedChart bar layout (forwarded into context). */
  composedBarDataKeys?: string[];
  composedBarSize?: number;
  composedMaxBarSize?: number;
  composedBarGap?: number;
  composedStacked?: boolean;
  composedStackOffsets?: Map<number, Map<string, number>>;
  composedStackGap?: number;
  /** When set, drives the y-axis max instead of scanning `lines` (e.g. stacked bar totals). */
  yScaleDomainMax?: number;
}

export function TimeSeriesChartInner(props: TimeSeriesChartInnerProps) {
  const { width, height } = props;
  if (width < 10 || height < 10) {
    return null;
  }
  return <TimeSeriesChartCore {...props} />;
}

const TimeSeriesChartCore = memo(function TimeSeriesChartCore({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing = DEFAULT_ANIMATION_EASING,
  enterTransition,
  revealSignature = "",
  children,
  containerRef,
  lines,
  clipPathId,
  composedBarDataKeys,
  composedBarSize,
  composedMaxBarSize,
  composedBarGap,
  composedStacked,
  composedStackOffsets,
  composedStackGap,
  yScaleDomainMax,
}: TimeSeriesChartInnerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [revealEpoch, setRevealEpoch] = useState(0);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xAccessor = useCallback(
    (d: Record<string, unknown>): Date => {
      const value = d[xDataKey];
      return value instanceof Date ? value : new Date(value as string | number);
    },
    [xDataKey],
  );

  const bisectDate = useMemo(
    () => bisector<Record<string, unknown>, Date>((d) => xAccessor(d)).left,
    [xAccessor],
  );

  const xScale = useMemo(() => {
    const timeExtent = extent(data, (d) => xAccessor(d).getTime());
    const minTime = timeExtent[0] ?? 0;
    const maxTime = timeExtent[1] ?? minTime;

    return scaleTime({
      range: [0, innerWidth],
      domain: [minTime, maxTime],
    });
  }, [innerWidth, data, xAccessor]);

  const renderData = useMemo(() => {
    const valueKeys = lines.map((line) => line.dataKey);
    return decimateTimeSeries(data, maxRenderPointsForWidth(innerWidth), valueKeys);
  }, [data, innerWidth, lines]);

  const columnWidth = useMemo(() => {
    if (data.length < 2) {
      return 0;
    }
    return innerWidth / (data.length - 1);
  }, [innerWidth, data.length]);

  const yScale = useMemo(() => {
    const dataKeys = lines.map((line) => line.dataKey);
    const domain = resolveTimeSeriesYDomain(data, dataKeys, yScaleDomainMax);

    return scaleLinear({
      range: [innerHeight, 0],
      domain,
      nice: true,
    });
  }, [innerHeight, data, lines, yScaleDomainMax]);

  const dateLabels = useMemo(
    () => data.map((d) => shortDateFmt.format(xAccessor(d))),
    [data, xAccessor],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: revealSignature
  useEffect(() => {
    setRevealEpoch((n) => n + 1);
    setIsLoaded(false);
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, animationDuration);
    return () => clearTimeout(timer);
  }, [animationDuration, revealSignature]);

  const canInteract = isLoaded;

  const {
    tooltipData,
    setTooltipData,
    selection,
    clearSelection,
    interactionHandlers,
    interactionStyle,
  } = useChartInteraction({
    xScale,
    yScale,
    data,
    lines,
    margin,
    xAccessor,
    bisectDate,
    canInteract,
  });

  const defsChildren: ReactElement[] = [];
  const preOverlayChildren: ReactElement[] = [];
  const postOverlayChildren: ReactElement[] = [];

  Children.forEach(children, (child, index) => {
    if (!isValidElement(child)) {
      return;
    }

    const keyedChild = ensureChildKey(child, index);

    if (isGradientDefComponent(keyedChild)) {
      defsChildren.push(keyedChild);
    } else if (isPatternDefComponent(keyedChild)) {
      // Keep pattern defs in the plot <g> (same as main) — hoisting breaks url(#id) fills.
      preOverlayChildren.push(keyedChild);
    } else if (isPostOverlayComponent(keyedChild)) {
      postOverlayChildren.push(keyedChild);
    } else {
      preOverlayChildren.push(keyedChild);
    }
  });

  const contextValue = useMemo(
    () => ({
      data,
      renderData,
      xScale,
      yScale,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      setTooltipData,
      containerRef,
      lines,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      xAccessor,
      dateLabels,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap,
    }),
    [
      data,
      renderData,
      xScale,
      yScale,
      width,
      height,
      innerWidth,
      innerHeight,
      margin,
      columnWidth,
      tooltipData,
      setTooltipData,
      containerRef,
      lines,
      isLoaded,
      animationDuration,
      animationEasing,
      enterTransition,
      revealEpoch,
      xAccessor,
      dateLabels,
      selection,
      clearSelection,
      composedBarDataKeys,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      composedStacked,
      composedStackOffsets,
      composedStackGap,
    ],
  );

  // Single shared reveal clip for every series. Replaces the per-<Line> /
  // per-<Area> `<ChartRevealClip>` motion.rects: one motion-driven attribute
  // animation instead of N, with all series referencing the same `<clipPath>`.
  // The wipe semantics (left-to-right unveil of static path geometry) are
  // identical to the previous per-series clips.
  // animationDuration === 0 truly disables the reveal (no clipPath wrapper),
  // so consumers can opt out without having to also pass enterTransition.
  const showReveal = renderData.length > 1 && innerWidth > 0 && animationDuration > 0;
  // If the consumer didn't pass an explicit enterTransition, derive one from
  // animationDuration so clipRevealTransition picks up the override instead
  // of falling back to its 1100ms default.
  const effectiveEnterTransition: Transition = enterTransition ?? {
    type: "tween",
    duration: animationDuration / 1000,
  };

  const revealClipPadding = useMemo(() => {
    if (!composedBarDataKeys?.length) {
      return 0;
    }
    const barWidth = computeSeriesBarWidth({
      innerWidth,
      dataLength: data.length,
      columnWidth,
      seriesCount: composedBarDataKeys.length,
      composedBarSize,
      composedMaxBarSize,
      composedBarGap,
      stacked: composedStacked,
    });
    return computeSeriesBarRevealClipPadding({
      barWidth,
      seriesCount: composedBarDataKeys.length,
      gap: composedBarGap,
      stacked: composedStacked,
    });
  }, [
    columnWidth,
    composedBarDataKeys,
    composedBarGap,
    composedBarSize,
    composedMaxBarSize,
    composedStacked,
    data.length,
    innerWidth,
  ]);

  return (
    <ChartProvider value={contextValue}>
      <svg aria-hidden="true" height={height} width={width}>
        <defs>
          {defsChildren}
          {showReveal ? (
            <ChartRevealClip
              clipPathId={clipPathId}
              enterTransition={effectiveEnterTransition}
              height={innerHeight + 20}
              padding={revealClipPadding}
              revealEpoch={revealEpoch}
              targetWidth={innerWidth}
            />
          ) : null}
        </defs>

        <rect fill="transparent" height={height} width={width} x={0} y={0} />

        <g
          {...interactionHandlers}
          style={interactionStyle}
          transform={`translate(${margin.left},${margin.top})`}
        >
          <rect fill="transparent" height={innerHeight} width={innerWidth} x={0} y={0} />

          {showReveal ? (
            <g clipPath={`url(#${clipPathId})`}>{preOverlayChildren}</g>
          ) : (
            preOverlayChildren
          )}
          {postOverlayChildren}
        </g>
      </svg>
    </ChartProvider>
  );
});
