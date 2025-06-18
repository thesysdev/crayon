import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useMemo, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../Charts";
import { createGradientDefinitions } from "../components/PieChartRenderers";
import {
  PieChartData,
  calculateTwoLevelChartDimensions,
  createAnimationConfig,
  createChartConfig,
  createEventHandlers,
  createSectorStyle,
  getHoverStyles,
  transformDataWithPercentages,
  useChartHover,
} from "../utils/PieChartUtils";

export type TwoLevelPieChartData = PieChartData;

interface GradientColor {
  start?: string;
  end?: string;
}

export interface TwoLevelPieChartProps<T extends TwoLevelPieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  format?: "percentage" | "number";
  appearance?: "circular" | "semiCircular";
  legend?: boolean;
  isAnimationActive?: boolean;
  cornerRadius?: number;
  paddingAngle?: number;
  useGradients?: boolean;
  gradientColors?: GradientColor[];
  onMouseEnter?: (data: any, index: number) => void;
  onMouseLeave?: () => void;
  onClick?: (data: any, index: number) => void;
  height?: number;
  width?: number;
  className?: string;
}

export const TwoLevelPieChart = <T extends TwoLevelPieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  format = "number",
  appearance = "circular",
  legend = true,
  isAnimationActive = true,
  cornerRadius = 0,
  paddingAngle = 0.5,
  useGradients = false,
  gradientColors,
  onMouseEnter,
  onMouseLeave,
  onClick,
  className,
  height,
  width,
}: TwoLevelPieChartProps<T>) => {
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

  // Calculate dynamic radius
  const { outerRadius, middleRadius, innerRadius } = useMemo(() => {
    return calculateTwoLevelChartDimensions(chartSize);
  }, [chartSize]);

  useEffect(() => {
    // Only set up ResizeObserver if dimensions are not provided
    if ((width && height) || !chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver(
      debounce((entries) => {
        for (const entry of entries) {
          const newWidth = entry.contentRect.width;
          const newHeight = entry.contentRect.height;
          setContainerWidth(newWidth);
          setContainerHeight(newHeight);
        }
      }, 100),
    );

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

              {useGradients && (
                <defs>
                  {createGradientDefinitions(
                    transformedData,
                    Object.values(chartConfig)
                      .map((config) => config.color)
                      .filter((color): color is string => color !== undefined),
                    gradientColors,
                  )}
                </defs>
              )}

              {/* Inner Pie */}
              <Pie
                data={transformedData}
                dataKey={format === "percentage" ? "percentage" : String(dataKey)}
                nameKey={String(categoryKey)}
                labelLine={false}
                innerRadius={innerRadius}
                outerRadius={middleRadius}
                label={false}
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
                  const fill = useGradients ? `url(#gradient-${index})` : "lightgray";

                  return (
                    <Cell key={`inner-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
                  );
                })}
              </Pie>

              {/* Outer Pie */}
              <Pie
                data={transformedData}
                dataKey={format === "percentage" ? "percentage" : String(dataKey)}
                nameKey={String(categoryKey)}
                labelLine={false}
                innerRadius={middleRadius}
                outerRadius={outerRadius}
                label={false}
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
                  const fill = useGradients ? `url(#gradient-${index})` : config?.color;

                  return (
                    <Cell key={`outer-cell-${index}`} fill={fill} {...hoverStyles} stroke="none" />
                  );
                })}
              </Pie>
            </RechartsPieChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};
