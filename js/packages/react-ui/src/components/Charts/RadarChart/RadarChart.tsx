import clsx from "clsx";
import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
} from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useTransformedKeys } from "../hooks/useTransformKey";
import { ActiveDot, CustomTooltipContent, DefaultLegend } from "../shared";
import { LegendItem } from "../types";
import { useChartPalette } from "../utils/PalletUtils";
import { get2dChartConfig, getDataKeys, getLegendItems } from "../utils/dataUtils";
import { AxisLabel } from "./components/AxisLabel";
import { RadarChartData } from "./types";

const MIN_CHART_SIZE = 150;
const MAX_CHART_SIZE = 296;

export interface RadarChartProps<T extends RadarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  customPalette?: string[];
  variant?: "line" | "area";
  grid?: boolean;
  legend?: boolean;
  strokeWidth?: number;
  areaOpacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  height?: number;
  width?: number;
}

const RadarChartComponent = <T extends RadarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  customPalette,
  variant = "line",
  grid = true,
  legend = true,
  strokeWidth = 2,
  areaOpacity = 0.2,
  icons = {},
  isAnimationActive = false,
  height,
  width,
}: RadarChartProps<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const transformedKeys = useTransformedKeys(dataKeys);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette,
    themePaletteName: "radarChartPalette",
    dataLength: dataKeys.length,
  });

  // Create Config
  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(dataKeys, colors, transformedKeys, undefined, icons);
  }, [dataKeys, icons, colors, transformedKeys]);

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [wrapperRect, setWrapperRect] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWrapperRect({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  const chartSize = useMemo(() => {
    const effectiveWidth = wrapperRect.width;
    const effectiveHeight = wrapperRect.height;
    let charts = Math.min(effectiveWidth, effectiveHeight);
    charts = Math.min(charts, MAX_CHART_SIZE);
    return Math.max(MIN_CHART_SIZE, charts);
  }, [wrapperRect]);

  const chartSizeStyle = useMemo(() => ({ width: chartSize, height: chartSize }), [chartSize]);
  const rechartsProps: Omit<React.ComponentProps<typeof ResponsiveContainer>, "children"> = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      minWidth: 1,
      minHeight: 1,
      initialDimension: { width: 1, height: 1 },
    }),
    [],
  );

  const radars = useMemo(() => {
    return dataKeys.map((key) => {
      const transformedKey = transformedKeys[key];
      const color = `var(--color-${transformedKey})`;
      if (variant === "line") {
        return (
          <Radar
            key={key}
            dataKey={key}
            fill={color}
            fillOpacity={0}
            stroke={color}
            strokeWidth={strokeWidth}
            isAnimationActive={isAnimationActive}
            activeDot={<ActiveDot />}
          />
        );
      } else {
        return (
          <Radar
            key={key}
            dataKey={key}
            fill={color}
            stroke={color}
            strokeWidth={strokeWidth}
            fillOpacity={areaOpacity}
            isAnimationActive={isAnimationActive}
            activeDot={<ActiveDot />}
          />
        );
      }
    });
  }, [dataKeys, transformedKeys, variant, strokeWidth, areaOpacity, isAnimationActive]);

  const wrapperClassName = useMemo(
    () =>
      clsx("crayon-radar-chart-container-wrapper", {
        "layout-column": true,
      }),
    [],
  );

  const wrapperStyle = useMemo(() => {
    if (typeof width === "string" && typeof height === "string") {
      return {
        width,
        height,
      };
    } else if (typeof width === "string" && typeof height === "number") {
      return {
        width,
        height: `${height}px`,
      };
    } else if (typeof width === "number" && typeof height === "string") {
      return {
        width: `${width}px`,
        height,
      };
    } else if (typeof width === "number" && typeof height === "number") {
      return {
        width: `${width}px`,
        height: `${height}px`,
      };
    } else if (typeof width === "string" && typeof height === "undefined") {
      return {
        width,
      };
    } else if (typeof width === "undefined" && typeof height === "string") {
      return {
        height,
      };
    } else if (typeof width === "undefined" && typeof height === "number") {
      return {
        height: `${height}px`,
      };
    } else {
      return {};
    }
  }, [width, height]);

  return (
    <SideBarTooltipProvider
      isSideBarTooltipOpen={false}
      setIsSideBarTooltipOpen={() => {}}
      data={undefined}
      setData={() => {}}
    >
      <div ref={wrapperRef} className={wrapperClassName} style={wrapperStyle}>
        <div className="crayon-radar-chart-container">
          <div className="crayon-radar-chart-container-inner">
            <div style={chartSizeStyle}>
              <ChartContainer
                config={chartConfig}
                className="crayon-radar-chart"
                rechartsProps={rechartsProps}
              >
                <RechartsRadarChart
                  data={data}
                  margin={{
                    left: 10,
                    right: 10,
                    top: 10,
                    bottom: 10,
                  }}
                >
                  {grid && <PolarGrid className="crayon-chart-polar-grid" stroke="currentColor" />}
                  <PolarAngleAxis
                    dataKey={categoryKey as string}
                    tick={<AxisLabel portalContainerRef={wrapperRef} />}
                  />

                  <ChartTooltip
                    cursor={false}
                    content={<CustomTooltipContent parentRef={wrapperRef} />}
                  />
                  {/* rendering the radars here */}
                  {radars}
                </RechartsRadarChart>
              </ChartContainer>
            </div>
          </div>
        </div>
        {legend && (
          <DefaultLegend
            items={legendItems}
            containerWidth={wrapperRect.width}
            isExpanded={isLegendExpanded}
            setIsExpanded={setIsLegendExpanded}
            style={{ paddingTop: 0 }}
          />
        )}
      </div>
    </SideBarTooltipProvider>
  );
};

export const RadarChart = memo(RadarChartComponent);

RadarChart.displayName = "RadarChart";
