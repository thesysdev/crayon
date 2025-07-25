import clsx from "clsx";
import { useMemo } from "react";
import { Area, AreaChart as RechartsAreaChart, XAxis } from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer } from "../Charts";
import { DATA_KEY, transformDataForChart } from "../utils/AreaAndLine/MiniAreaAndLineUtils";
import { useChartPalette, type PaletteName } from "../utils/PalletUtils";
import { get2dChartConfig } from "../utils/dataUtils";
import { MiniAreaChartData } from "./types";

export interface MiniAreaChartProps {
  data: MiniAreaChartData;
  theme?: PaletteName;
  customPalette?: string[];
  variant?: "linear" | "natural" | "step";
  opacity?: number;
  isAnimationActive?: boolean;
  onAreaClick?: (data: any) => void;
  size?: number | string;
  className?: string;
  areaColor?: string;
  useGradient?: boolean;
}

export const MiniAreaChart = ({
  data,
  theme = "ocean",
  customPalette,
  variant = "natural",
  opacity = 0.5,
  isAnimationActive = false,
  onAreaClick,
  size = "100%",
  className,
  areaColor,
  useGradient = true,
}: MiniAreaChartProps) => {
  // Transform the data to a consistent format for recharts
  const chartData = useMemo(() => {
    return transformDataForChart(data);
  }, [data]);

  const colors = useChartPalette({
    chartThemeName: theme,
    customPalette: customPalette || (areaColor ? [areaColor] : undefined),
    themePaletteName: "areaChartPalette",
    dataLength: 1,
  });

  const transformedKeys = useMemo(() => ({ [DATA_KEY]: DATA_KEY }), []);

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig([DATA_KEY], colors, transformedKeys);
  }, [colors, transformedKeys]);

  const id = useId();

  // Generate unique gradient ID to avoid conflicts when multiple charts are on the same page
  const gradientId = useMemo(() => `miniAreaGradient-${id}`, [id]);
  const color = `var(--color-${DATA_KEY})`;

  return (
    <ChartContainer
      config={chartConfig}
      style={{
        width: size,
        height: size,
        aspectRatio: 1 / 1,
        minHeight: 100,
        minWidth: 100,
      }}
      rechartsProps={{
        aspect: 1 / 1,
      }}
      onClick={onAreaClick}
      className={clsx("crayon-charts-mini-area-chart-container", className)}
    >
      <RechartsAreaChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 10,
        }}
      >
        {useGradient && (
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.6} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
        )}

        <XAxis dataKey="label" hide={true} />

        <Area
          dataKey={DATA_KEY}
          type={variant}
          stroke={color}
          fill={useGradient ? `url(#${gradientId})` : color}
          fillOpacity={useGradient ? 1 : opacity}
          isAnimationActive={isAnimationActive}
          strokeWidth={1.5}
        />
      </RechartsAreaChart>
    </ChartContainer>
  );
};
