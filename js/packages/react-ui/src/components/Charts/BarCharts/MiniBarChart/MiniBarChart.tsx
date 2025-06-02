import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { ChartConfig, ChartContainer, keyTransform } from "../../Charts";
import { getDistributedColors, getPalette } from "../../utils/PalletUtils";
import { getPadding, getWidthOfData } from "../utils/BarChartUtils";

export type MiniBarChartData = Array<Record<string, string | number>>;

export type Variant = "grouped" | "stacked";

export interface MiniBarChartProps<T extends MiniBarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: "ocean" | "orchid" | "emerald" | "sunset" | "spectrum" | "vivid";
  variant?: Variant;
  radius?: number;
  isAnimationActive?: boolean;
  onBarsClick?: (data: any) => void;
}

export const MiniBarChart = <T extends MiniBarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  variant = "grouped",
  radius = 4,
  isAnimationActive = true,
  onBarsClick,
}: MiniBarChartProps<T>) => {
  // excluding the categoryKey
  const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);

  const palette = getPalette(theme);
  const colors = getDistributedColors(palette, dataKeys.length);

  // Create Config
  const chartConfig: ChartConfig = dataKeys.reduce(
    (config, key, index) => ({
      ...config,
      [key]: {
        label: key,
        color: colors[index],
      },
    }),
    {},
  );

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  useEffect(() => {
    if (!chartContainerRef.current) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(chartContainerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const padding = getPadding(data, categoryKey as string, containerWidth, variant);
  const width = getWidthOfData(data, categoryKey as string, variant);

  // Helper function to calculate total
  // const calculateTotal = <T extends MiniBarChartData>(
  //   data: T,
  //   categoryKey: keyof T[number],
  // ): number => {
  //   const dataKeys = Object.keys(data[0] || {}).filter((key) => key !== categoryKey);
  //   return data.reduce((sum, item) => {
  //     return sum + dataKeys.reduce((keySum, key) => keySum + Number(item[key] || 0), 0);
  //   }, 0);
  // };

  return (
    <ChartContainer
      config={chartConfig}
      ref={chartContainerRef}
      style={{ width, minWidth: "100%" }}
      onClick={onBarsClick}
    >
      <BarChart accessibilityLayer data={data}>
        <XAxis padding={padding} hide={true} />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;
          return (
            <Bar
              key={key}
              dataKey={key}
              fill={color}
              radius={radius}
              stackId={variant === "stacked" ? "a" : undefined}
              isAnimationActive={isAnimationActive}
              maxBarSize={8}
            />
          );
        })}
      </BarChart>
    </ChartContainer>
  );
};
