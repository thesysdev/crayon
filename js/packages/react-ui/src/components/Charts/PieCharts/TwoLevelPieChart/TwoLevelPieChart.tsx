import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartContainer } from "../../Charts";
import {
  PieChartData,
  calculateTwoLevelChartDimensions,
  createChartConfig,
  getHoverStyles,
  layoutMap,
  transformDataWithPercentages,
  useChartHover,
} from "../utils/PieChartUtils";

export type TwoLevelPieChartData = PieChartData;

export interface TwoLevelPieChartProps<T extends TwoLevelPieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  format?: "percentage" | "number";
  appearance?: "circular" | "semiCircular";
  legend?: boolean;
  label?: boolean;
  isAnimationActive?: boolean;
}

export const TwoLevelPieChart = <T extends TwoLevelPieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  format = "number",
  appearance = "circular",
  label = true,
  isAnimationActive = true,
}: TwoLevelPieChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(160);
  const [calculatedMiddleRadius, setCalculatedMiddleRadius] = useState(140);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(40);
  const { activeIndex, handleMouseEnter, handleMouseLeave } = useChartHover();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;
        const { outerRadius, middleRadius, innerRadius } = calculateTwoLevelChartDimensions(
          width,
          label,
        );

        setCalculatedOuterRadius(outerRadius);
        setCalculatedMiddleRadius(middleRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [label]);

  const transformedData = transformDataWithPercentages(data, dataKey);
  const chartConfig = createChartConfig(data, categoryKey, theme);

  return (
    <ChartContainer
      ref={containerRef}
      config={chartConfig}
      className={clsx("crayon-pie-chart-container", layoutMap[layout])}
    >
      <RechartsPieChart>
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          innerRadius={calculatedInnerRadius}
          outerRadius={calculatedMiddleRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          paddingAngle={0.5}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            // const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const hoverStyles = getHoverStyles(index, activeIndex);
            return <Cell key={`inner-cell-${index}`} fill={"lightgray"} {...hoverStyles} />;
          })}
        </Pie>
        <Pie
          data={transformedData}
          dataKey={format === "percentage" ? "percentage" : String(dataKey)}
          nameKey={String(categoryKey)}
          labelLine={false}
          innerRadius={calculatedMiddleRadius}
          outerRadius={calculatedOuterRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          paddingAngle={0.5}
          startAngle={appearance === "semiCircular" ? 0 : 0}
          endAngle={appearance === "semiCircular" ? 180 : 360}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {transformedData.map((entry, index) => {
            const categoryValue = String(entry[categoryKey as keyof typeof entry] || "");
            const config = chartConfig[categoryValue];
            const hoverStyles = getHoverStyles(index, activeIndex);

            return <Cell key={`outer-cell-${index}`} fill={config?.color} {...hoverStyles} />;
          })}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
