import { useMemo } from "react";
import { Bar, BarChart, XAxis } from "recharts";
import { useTheme } from "../../../ThemeProvider";
import { ChartConfig, ChartContainer, keyTransform } from "../../Charts";
import { getDistributedColors, getPalette, PaletteName } from "../../utils/PalletUtils";
import { LineInBarShape } from "../BarChartV2/components/LineInBarShape";
import { type BarChartData } from "../types";
import { getChartConfig, getDataKeys } from "../utils/BarChartUtils";

export interface MiniBarChartProps<T extends BarChartData> {
  data: T;
  categoryKey: keyof T[number];
  theme?: PaletteName;

  radius?: number;
  isAnimationActive?: boolean;
  onBarsClick?: (data: any) => void;
  size?: number | string;
}

export const MiniBarChart = <T extends BarChartData>({
  data,
  categoryKey,
  theme = "ocean",
  radius = 1,
  isAnimationActive = true,
  onBarsClick,
  size = 160,
}: MiniBarChartProps<T>) => {
  // excluding the categoryKey
  const dataKeys = useMemo(() => {
    return getDataKeys(data, categoryKey as string);
  }, [data, categoryKey]);

  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, dataKeys.length);
  }, [theme, dataKeys.length]);

  const chartConfig: ChartConfig = useMemo(() => {
    return getChartConfig(dataKeys, colors);
  }, [dataKeys, colors]);

  const { mode } = useTheme();

  const barInternalLineColor = useMemo(() => {
    if (mode === "light") {
      return "rgba(255, 255, 255, 0.3)";
    }
    return "rgba(0, 0, 0, 0.3)";
  }, [mode]);

  return (
    <ChartContainer
      config={chartConfig}
      style={{ width: size, height: size }}
      onClick={onBarsClick}
    >
      <BarChart accessibilityLayer data={data}>
        <XAxis hide={true} />
        {dataKeys.map((key) => {
          const transformedKey = keyTransform(key);
          const color = `var(--color-${transformedKey})`;
          return (
            <Bar
              key={key}
              dataKey={key}
              fill={color}
              radius={[radius, radius, 0, 0]}
              isAnimationActive={isAnimationActive}
              maxBarSize={8}
              barSize={8}
              shape={
                <LineInBarShape internalLineWidth={1} internalLineColor={barInternalLineColor} />
              }
            />
          );
        })}
      </BarChart>
    </ChartContainer>
  );
};
