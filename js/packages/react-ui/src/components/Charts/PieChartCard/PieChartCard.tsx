import clsx from "clsx";
import { debounce } from "lodash-es";
import { useEffect, useRef, useState } from "react";
import { Cell, Pie, PieChart as RechartsPieChart } from "recharts";
import { useLayoutContext } from "../../../context/LayoutContext";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "../Charts";
import { getDistributedColors, getPalette } from "../utils/PalletUtils";

export type PieChartCardData = Array<Record<string, string | number>>;

export interface PieChartCardProps<T extends PieChartCardData> {
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

const layoutMap: Record<string, string> = {
  mobile: "crayon-pie-chart-container-mobile",
  fullscreen: "crayon-pie-chart-container-fullscreen",
  tray: "crayon-pie-chart-container-tray",
  copilot: "crayon-pie-chart-container-copilot",
};

// Helper function to calculate percentage
const calculatePercentage = (value: number, total: number): number => {
  if (total === 0) {
    return 0;
  }
  return Number(((value / total) * 100).toFixed(2));
};

export const PieChartCard = <T extends PieChartCardData>({
  data,
  categoryKey,
  dataKey,
  theme = "ocean",
  variant = "pie",
  format = "number",
  legend = false,
  label = true,
  isAnimationActive = true,
}: PieChartCardProps<T>) => {
  const { layout } = useLayoutContext();
  const [calculatedOuterRadius, setCalculatedOuterRadius] = useState(120);
  const [calculatedInnerRadius, setCalculatedInnerRadius] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate dynamic radius based on layout
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(
      debounce((entries: any) => {
        const { width } = entries[0].contentRect;

        // Calculate outer radius
        let newOuterRadius = 120; // default
        if (layout === "mobile") {
          newOuterRadius = label ? (width > 300 ? 85 : 75) : width > 300 ? 95 : 80;
        } else if (layout === "fullscreen") {
          newOuterRadius = 120;
        } else if (layout === "tray" || layout === "copilot") {
          newOuterRadius = 90;
        }

        // Calculate inner radius for donut
        let newInnerRadius = 0;
        if (variant === "donut") {
          if (layout === "mobile") {
            newInnerRadius = label ? (width > 300 ? 50 : 30) : width > 300 ? 60 : 50;
          } else {
            newInnerRadius = 60;
          }
        }

        setCalculatedOuterRadius(newOuterRadius);
        setCalculatedInnerRadius(newInnerRadius);
      }, 100),
    );

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [layout, label, variant]);

  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + Number(item[dataKey]), 0);

  // Transform data with percentages
  const transformedData = data.map((item) => ({
    ...item,
    percentage: calculatePercentage(Number(item[dataKey as string]), total),
    originalValue: item[dataKey as string],
  })) as (T[number] & { percentage: number; originalValue: string | number })[];

  // Get color palette and distribute colors
  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, data.length);

  // Create chart configuration
  const chartConfig = data.reduce<ChartConfig>(
    (config, item, index) => ({
      ...config,
      [String(item[categoryKey])]: {
        label: String(item[categoryKey as string]),
        color: colors[index],
      },
    }),
    {},
  );

  // Custom label renderer
  const renderCustomLabel = ({ payload, cx, cy, x, y, textAnchor, dominantBaseline }: any) => {
    if (payload.percentage <= 10) return null;
    const displayValue = format === "percentage" ? payload.percentage : payload[dataKey];
    const formattedValue =
      String(displayValue).length > 7 ? `${String(displayValue).slice(0, 7)}...` : displayValue;

    return (
      <g>
        <text
          cx={cx}
          cy={cy}
          x={x}
          y={y}
          textAnchor={textAnchor}
          dominantBaseline={dominantBaseline}
          className="crayon-pie-chart-label"
        >
          {formattedValue}
          {format === "percentage" ? "%" : ""}
        </text>
      </g>
    );
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "row" }}>
      <ChartContainer
        ref={containerRef}
        config={chartConfig}
        className={clsx("crayon-pie-chart-container", layoutMap[layout])}
      >
        <RechartsPieChart>
          <ChartTooltip
            content={<ChartTooltipContent showPercentage={format === "percentage"} />}
          />
          {legend && (
            <ChartLegend
              align="right"
              content={<ChartLegendContent nameKey={String(categoryKey)} />}
            />
          )}
          <Pie
            data={transformedData}
            dataKey={format === "percentage" ? "percentage" : String(dataKey)}
            nameKey={String(categoryKey)}
            labelLine={false}
            outerRadius={calculatedOuterRadius}
            innerRadius={calculatedInnerRadius}
            label={label ? renderCustomLabel : false}
            isAnimationActive={isAnimationActive}
          >
            {Object.entries(chartConfig).map(([key, config]) => (
              <Cell key={key} fill={config.color} />
            ))}
          </Pie>
        </RechartsPieChart>
      </ChartContainer>
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        {transformedData.map((item, index) => (
          <div
            key={String(item[categoryKey])}
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
              padding: "4px 8px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                backgroundColor: colors[index],
                marginRight: "8px",
                borderRadius: "2px",
              }}
            />
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <div style={{ fontWeight: 500 }}>{item[categoryKey]}</div>
              <div style={{ fontSize: "0.875rem", color: "#666" }}>
                {format === "percentage" ? `${item.percentage}%` : item.originalValue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
