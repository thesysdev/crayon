import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../../context/LayoutContext";
import { ChartContainer } from "../../Charts";
import {
  PieChartData,
  calculateChartDimensions,
  createChartConfig,
  layoutMap,
  transformDataWithPercentages,
} from "../utils/PieChartUtils";

export type MiniPieChartData = PieChartData;

export interface MiniPieChartProps<T extends MiniPieChartData> {
  data: T;
  categoryKey: keyof T[number];
  dataKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: "pie" | "donut";
  format?: "percentage" | "number";
  legend?: boolean;
  label?: boolean;
  isAnimationActive?: boolean;
}

export const MiniPieChart = <T extends MiniPieChartData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  label = true,
  isAnimationActive = true,
}: MiniPieChartProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(120);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;
        const { outerRadius, innerRadius } = calculateChartDimensions(width, variant, label);
        setCalculatedOuterRadius(outerRadius);
        setCalculatedInnerRadius(innerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [variant, label]);

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
          outerRadius={calculatedOuterRadius}
          innerRadius={calculatedInnerRadius}
          label={false}
          isAnimationActive={isAnimationActive}
          startAngle={0}
          endAngle={180}
          cx="50%"
          cy="100%"
        >
          {Object.entries(chartConfig).map(([key, config]) => (
            <Cell key={key} fill={config.color} />
          ))}
        </Pie>
      </RechartsPieChart>
    </ChartContainer>
  );
};
