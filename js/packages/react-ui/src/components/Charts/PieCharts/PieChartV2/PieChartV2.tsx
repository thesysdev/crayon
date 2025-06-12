import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { createGradientDefinitions } from "../components/PieChartRenderers";
import {
  PieChartData,
  createAnimationConfig,
  createChartConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  transformDataWithPercentages,
  useChartHover,
} from "../utils/PieChartUtils";

export type PieChartV2Data = PieChartData;

interface GradientColor {
  start?: string;
  end?: string;
}

export interface PieChartV2Props<T extends PieChartV2Data> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  isAnimationActive?: boolean;
  appearance?: "circular" | "semiCircular";
  cornerRadius?: number;
  paddingAngle?: number;
  useGradients?: boolean;
  gradientColors?: GradientColor[];
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  className?: string;
  height?: number;
  width?: number;
}

export const PieChartV2 = <T extends PieChartV2Data>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  legend = true,
  isAnimationActive = true,
  appearance = "circular",
  cornerRadius = 0,
  paddingAngle = 0,
  useGradients = false,
  gradientColors,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  height,
  width,
}: PieChartV2Props<T>) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();

  // Use provided dimensions or observed dimensions
  const effectiveWidth = useMemo(() => {
    return width ?? containerWidth;
  }, [width, containerWidth]);

  const effectiveHeight = useMemo(() => {
    return height ?? containerHeight;
  }, [height, containerHeight]);

  // Calculate chart dimensions based on the smaller dimension
  const chartSize = useMemo(() => {
    const size = Math.min(effectiveWidth, effectiveHeight);
    return Math.max(200, Math.min(size, 800)); // Min 200px, max 800px
  }, [effectiveWidth, effectiveHeight]);

  // Transform data and create configurations
  const transformedData = transformDataWithPercentages(data, dataKey);
  const chartConfig = createChartConfig(data, categoryKey, theme);
  const animationConfig = createAnimationConfig({ isAnimationActive });
  const eventHandlers = createEventHandlers(onMouseEnter, onMouseLeave, onClick);
  const sectorStyle = createSectorStyle(cornerRadius, paddingAngle);

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  // Create gradient definitions if gradients are enabled
  const gradientDefinitions = useGradients ? (
    <defs>{createGradientDefinitions(transformedData, colors, gradientColors)}</defs>
  ) : null;

  useEffect(() => {
    // Only set up ResizeObserver if dimensions are not provided
    if ((width && height) || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        const newHeight = entry.contentRect.height;
        setContainerWidth(newWidth);
        setContainerHeight(newHeight);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [width, height]);

  return (
    <div
      className={clsx("crayon-pie-chart-container", className)}
      style={{
        width: width ? `${width}px` : "100%",
        height: height ? `${height}px` : "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="crayon-pie-chart-container-inner"
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: chartSize,
            height: chartSize,
          }}
        >
          <ChartContainer
            config={chartConfig}
            className="crayon-pie-chart"
            rechartsProps={{
              width: chartSize,
              height: chartSize,
            }}
          >
            <RechartsPieChart>
              <ChartTooltip
                content={<ChartTooltipContent showPercentage={format === "percentage"} />}
              />

              {gradientDefinitions}
              <Pie
                data={transformedData}
                dataKey={format === "percentage" ? "percentage" : String(dataKey)}
                nameKey={String(categoryKey)}
                outerRadius="90%"
                innerRadius={variant === "donut" ? "60%" : 0}
                activeIndex={activeIndex ?? undefined}
                {...animationConfig}
                {...eventHandlers}
                {...sectorStyle}
                startAngle={appearance === "semiCircular" ? 0 : 0}
                endAngle={appearance === "semiCircular" ? 180 : 360}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {transformedData.map((entry, index) => {
                  const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
                  const config = chartConfig[categoryValue];
                  const hoverStyles = getHoverStyles(index, activeIndex);
                  const fill = useGradients
                    ? `url(#gradient-${index})`
                    : config?.color || colors[index];

                  return <Cell key={`cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />;
                })}
              </Pie>
            </RechartsPieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};
