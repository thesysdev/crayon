"use client";

import type { Transition } from "motion/react";
import {
  Children,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useMemo,
  useRef,
} from "react";
import { cn } from "../../../lib/utils";
import type { LineConfig, Margin } from "../../core/chart-context";
import { ParentSize } from "../../core/responsive-parent-size";
import { TimeSeriesChartInner } from "../../core/time-series-chart-shell";
import { Area, type AreaProps } from "../area/area";
import { SeriesBar, type SeriesBarProps } from "../bar/series-bar";
import { Line, type LineProps } from "../line/line";

export interface ComposedChartProps {
  /** Data array — each row typically has a date and multiple numeric series */
  data: Record<string, unknown>[];
  /** Key for the x-axis (time). Default: "date" */
  xDataKey?: string;
  margin?: Partial<Margin>;
  animationDuration?: number;
  animationEasing?: string;
  enterTransition?: Transition;
  /** Signature of motion URL state — triggers reveal replay when it changes. */
  revealSignature?: string;
  aspectRatio?: string;
  className?: string;
  children: ReactNode;
  /** Target bar width in px (Recharts-style `barSize`). */
  barSize?: number;
  /** Maximum bar width in px (`maxBarSize`). */
  maxBarSize?: number;
  /** Gap between grouped `SeriesBar` series in px. Default: 4 */
  barGap?: number;
  /** Stack `SeriesBar` segments in child order at each x (line/area are not stacked). */
  stacked?: boolean;
  /** Gap in px between stacked segments. Default: 0 */
  stackGap?: number;
}

const DEFAULT_MARGIN: Margin = { top: 40, right: 40, bottom: 40, left: 40 };

function getChildComponentName(child: ReactElement): string {
  const childType = child.type as { displayName?: string; name?: string };
  return typeof child.type === "function" ? childType.displayName || childType.name || "" : "";
}

function upsertLineConfig(lines: LineConfig[], config: LineConfig): void {
  const index = lines.findIndex((line) => line.dataKey === config.dataKey);
  if (index === -1) {
    lines.push(config);
    return;
  }
  // Area+Line pairs share a dataKey — keep the later config (Line over Area).
  lines[index] = config;
}

function tryAppendSeriesBar(
  child: ReactElement,
  lines: LineConfig[],
  barDataKeys: string[],
): boolean {
  const name = getChildComponentName(child);
  if (!(child.type === SeriesBar || name === "SeriesBar")) {
    return false;
  }
  const props = child.props as SeriesBarProps;
  if (!props.dataKey) {
    return true;
  }
  barDataKeys.push(props.dataKey);
  upsertLineConfig(lines, {
    dataKey: props.dataKey,
    stroke: props.stroke || props.fill || "var(--chart-line-primary)",
    strokeWidth: 0,
  });
  return true;
}

function tryAppendLine(child: ReactElement, lines: LineConfig[]): boolean {
  const name = getChildComponentName(child);
  if (!(child.type === Line || name === "Line")) {
    return false;
  }
  const props = child.props as LineProps;
  if (props.dataKey) {
    upsertLineConfig(lines, {
      dataKey: props.dataKey,
      stroke: props.stroke || "var(--chart-line-primary)",
      strokeWidth: props.strokeWidth ?? 2.5,
    });
  }
  return true;
}

function tryAppendArea(child: ReactElement, lines: LineConfig[]): boolean {
  const name = getChildComponentName(child);
  if (!(child.type === Area || name === "Area")) {
    return false;
  }
  const props = child.props as AreaProps;
  if (props.dataKey) {
    upsertLineConfig(lines, {
      dataKey: props.dataKey,
      stroke: props.stroke || props.fill || "var(--chart-line-primary)",
      strokeWidth: props.strokeWidth ?? 2,
    });
  }
  return true;
}

function extractComposedSeries(children: ReactNode): {
  lines: LineConfig[];
  barDataKeys: string[];
} {
  const lines: LineConfig[] = [];
  const barDataKeys: string[] = [];

  Children.forEach(children, (child) => {
    if (!isValidElement(child)) {
      return;
    }
    if (tryAppendSeriesBar(child, lines, barDataKeys)) {
      return;
    }
    if (tryAppendLine(child, lines)) {
      return;
    }
    tryAppendArea(child, lines);
  });

  return { lines, barDataKeys };
}

function computeComposedYScaleDomainMax(
  data: Record<string, unknown>[],
  lines: LineConfig[],
  barDataKeys: string[],
): number | undefined {
  const barSet = new Set(barDataKeys);
  let max = 0;
  for (const d of data) {
    let barSum = 0;
    for (const k of barDataKeys) {
      const v = d[k];
      if (typeof v === "number") {
        barSum += v;
      }
    }
    let rowMaxOther = 0;
    for (const line of lines) {
      if (barSet.has(line.dataKey)) {
        continue;
      }
      const v = d[line.dataKey];
      if (typeof v === "number") {
        rowMaxOther = Math.max(rowMaxOther, v);
      }
    }
    max = Math.max(max, barSum, rowMaxOther);
  }
  return max > 0 ? max : undefined;
}

interface ChartInnerProps {
  width: number;
  height: number;
  data: Record<string, unknown>[];
  xDataKey: string;
  margin: Margin;
  animationDuration: number;
  animationEasing?: string;
  enterTransition?: Transition;
  revealSignature?: string;
  children: ReactNode;
  containerRef: React.RefObject<HTMLDivElement | null>;
  barSize?: number;
  maxBarSize?: number;
  barGap?: number;
  stacked?: boolean;
  stackGap?: number;
}

function ChartInner({
  width,
  height,
  data,
  xDataKey,
  margin,
  animationDuration,
  animationEasing,
  enterTransition,
  revealSignature,
  children,
  containerRef,
  barSize,
  maxBarSize,
  barGap,
  stacked = false,
  stackGap = 0,
}: ChartInnerProps) {
  const { lines, barDataKeys } = useMemo(() => extractComposedSeries(children), [children]);

  const composedStackOffsets = useMemo(() => {
    if (!(stacked && barDataKeys.length > 0)) {
      return undefined;
    }
    const offsets = new Map<number, Map<string, number>>();
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      if (!d) {
        continue;
      }
      const pointOffsets = new Map<string, number>();
      let cumulative = 0;
      for (const key of barDataKeys) {
        pointOffsets.set(key, cumulative);
        const v = d[key];
        if (typeof v === "number") {
          cumulative += v;
        }
      }
      offsets.set(i, pointOffsets);
    }
    return offsets;
  }, [data, barDataKeys, stacked]);

  const yScaleDomainMax = useMemo(
    () =>
      stacked && barDataKeys.length > 0
        ? computeComposedYScaleDomainMax(data, lines, barDataKeys)
        : undefined,
    [data, lines, barDataKeys, stacked],
  );

  return (
    <TimeSeriesChartInner
      animationDuration={animationDuration}
      animationEasing={animationEasing}
      clipPathId="composed-chart-grow-clip"
      composedBarDataKeys={barDataKeys.length > 0 ? barDataKeys : undefined}
      composedBarGap={barGap}
      composedBarSize={barSize}
      composedMaxBarSize={maxBarSize}
      composedStacked={stacked}
      composedStackGap={stackGap}
      composedStackOffsets={composedStackOffsets}
      containerRef={containerRef}
      data={data}
      enterTransition={enterTransition}
      height={height}
      lines={lines}
      margin={margin}
      revealSignature={revealSignature}
      width={width}
      xDataKey={xDataKey}
      yScaleDomainMax={yScaleDomainMax}
    >
      {children}
    </TimeSeriesChartInner>
  );
}

export function ComposedChart({
  data,
  xDataKey = "date",
  margin: marginProp,
  animationDuration = 1100,
  animationEasing,
  enterTransition,
  revealSignature,
  aspectRatio = "2 / 1",
  className = "",
  children,
  barSize,
  maxBarSize,
  barGap = 4,
  stacked = false,
  stackGap = 0,
}: ComposedChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const margin = { ...DEFAULT_MARGIN, ...marginProp };

  return (
    <div
      className={cn("ce-composed-chart-root", className)}
      ref={containerRef}
      style={{ aspectRatio, touchAction: "none" }}
    >
      <ParentSize debounceTime={10}>
        {({ width, height }) => (
          <ChartInner
            animationDuration={animationDuration}
            animationEasing={animationEasing}
            barGap={barGap}
            barSize={barSize}
            containerRef={containerRef}
            data={data}
            enterTransition={enterTransition}
            height={height}
            margin={margin}
            maxBarSize={maxBarSize}
            revealSignature={revealSignature}
            stacked={stacked}
            stackGap={stackGap}
            width={width}
            xDataKey={xDataKey}
          >
            {children}
          </ChartInner>
        )}
      </ParentSize>
    </div>
  );
}

ComposedChart.displayName = "ComposedChart";

export default ComposedChart;
