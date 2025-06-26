import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart as RechartsRadarChart } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  keyTransform,
} from "../../Charts";
import { DefaultLegend } from "../../shared";
import { LegendItem } from "../../types";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { getChartConfig, getDataKeys, getLegendItems } from "../../utils/dataUtils";

export type RadarChartV2Data = Array<Record<string, string | number>>;

export interface RadarChartV2Props<T extends RadarChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "line" | "area";
  grid?: boolean;
  legend?: boolean;
  strokeWidth?: number;
  areaOpacity?: number;
  icons?: Partial<Record<keyof T[number], React.ComponentType>>;
  isAnimationActive?: boolean;
  size?: number;
}

export const RadarChartV2 = <T extends RadarChartV2Data>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "line",
  grid = true,
  legend = true,
  strokeWidth = 2,
  areaOpacity = 0.5,
  icons = {},
  isAnimationActive = true,
  size,
}: RadarChartV2Props<T>) => {
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  // Create Config
  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors, undefined, icons);
  }, [dataKeys, icons, colors]);

  const legendItems: LegendItem[] = useMemo(() => {
    return getLegendItems(dataKeys, colors, icons);
  }, [dataKeys, colors, icons]);

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    // Only set up ResizeObserver if width is not provided
    if (size || !rootRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      // there is only one entry in the entries array because we are observing the chart container
      for (const entry of entries) {
        setContainerDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(rootRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    console.log("containerDimensions", containerDimensions);
  }, [containerDimensions]);

  return (
    <div className="crayon-radar-chart-v2-container" ref={rootRef}>
      <ChartContainer
        config={chartConfig}
        style={{
          width: Math.min(containerDimensions.width, containerDimensions.height),
          height: Math.min(containerDimensions.width, containerDimensions.height),
          //   width: "100%",
          //   height: "100%",
          aspectRatio: 1,
          overflow: "visible",
        }}
        rechartsProps={{
          aspect: 1,
        }}
      >
        <RechartsRadarChart
          data={data}
          margin={{ top: 10, right: 40, bottom: 10, left: 20 }}
          height={200}
          width={200}
        >
          {grid && <PolarGrid className="crayon-chart-polar-grid" stroke="currentColor" />}
          <PolarAngleAxis dataKey={categoryKey as string} />

          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
          {dataKeys.map((key) => {
            const transformedKey = keyTransform(key);
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
                />
              );
            } else {
              return (
                <Radar
                  key={key}
                  dataKey={key}
                  fill={color}
                  fillOpacity={areaOpacity}
                  isAnimationActive={isAnimationActive}
                />
              );
            }
          })}
        </RechartsRadarChart>
      </ChartContainer>
      {legend && (
        <DefaultLegend
          items={legendItems}
          containerWidth={containerDimensions.width}
          isExpanded={isLegendExpanded}
          setIsExpanded={setIsLegendExpanded}
          style={{ paddingTop: 0 }}
        />
      )}
    </div>
  );
};
