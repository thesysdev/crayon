import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Cell,
  ScatterChart as RechartsScatterChart,
  Scatter,
  XAxis,
  YAxis,
} from "recharts";
import { useId } from "../../../polyfills";
import { ChartConfig, ChartContainer, ChartTooltip } from "../Charts";
import { SideBarChartData, SideBarTooltipProvider } from "../context/SideBarTooltipContext";
import { useYAxisLabelWidth } from "../hooks";
import ScatterDot from "../ScatterChart/ScatterDot";
import { CustomTooltipContent, YAxisTick } from "../shared";
import { get2dChartConfig } from "../utils/dataUtils";
import { PaletteName, useChartPalette } from "../utils/PalletUtils";
import { numberTickFormatter } from "../utils/styleUtils";
import { ScatterChartData, ScatterPoint } from "./types";
import {
  calculateScatterDomain,
  getScatterDatasets,
  transformScatterData,
} from "./utils/ScatterChartUtils";

export interface ScatterChartV2Props {
  data: ScatterChartData;
  theme?: PaletteName;
  xAxisDataKey?: string;
  yAxisDataKey?: string;
  yAxisLabel?: React.ReactNode;
  height?: number;
  width?: number;
  className?: string;
}
const X_AXIS_HEIGHT = 40;

export const ScatterChartV2 = ({
  data,
  theme = "ocean",
  xAxisDataKey = "x",
  yAxisDataKey = "y",
  yAxisLabel,
  height,
  width,
  className,
}: ScatterChartV2Props) => {
  const chartHeight = height ?? 296;
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [isSideBarTooltipOpen, setIsSideBarTooltipOpen] = useState(false);
  const [sideBarTooltipData, setSideBarTooltipData] = useState<SideBarChartData>({
    title: "",
    values: [],
  });

  const datasets = useMemo(() => {
    return getScatterDatasets(data);
  }, [data]);

  const colors = useChartPalette({
    chartThemeName: theme,
    themePaletteName: "lineChartPalette",
    dataLength: datasets.length,
  });

  const transformedData: ScatterPoint[] = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return transformScatterData(data, datasets, colors);
  }, [data, datasets, colors]);

  const chartConfig: ChartConfig = useMemo(() => {
    return get2dChartConfig(
      datasets,
      colors,
      datasets.reduce((acc, key) => ({ ...acc, [key]: key }), {}),
      undefined,
    );
  }, [datasets, colors]);

  const xDomain = useMemo(() => {
    return calculateScatterDomain(data, xAxisDataKey as "x" | "y");
  }, [data, xAxisDataKey]);

  const yDomain = useMemo(() => {
    return calculateScatterDomain(data, yAxisDataKey as "x" | "y");
  }, [data, yAxisDataKey]);

  const scatterName = datasets.join(", ");
  const { yAxisWidth, setLabelWidth } = useYAxisLabelWidth(transformedData, [yAxisDataKey]);

  const id = useId();

  return (
    <SideBarTooltipProvider
      isSideBarTooltipOpen={isSideBarTooltipOpen}
      setIsSideBarTooltipOpen={setIsSideBarTooltipOpen}
      data={sideBarTooltipData}
      setData={setSideBarTooltipData}
    >
      <div
        className={clsx("crayon-scatter-chart-container", className)}
        style={{
          width: width ? `${width}px` : undefined,
        }}
      >
        <div className="crayon-scatter-chart-container-inner" ref={chartContainerRef}>
          <ChartContainer
            config={chartConfig}
            style={{ width: "100%", height: chartHeight - X_AXIS_HEIGHT }}
          >
            <RechartsScatterChart
              key={`scatter-chart-${id}`}
              data={transformedData}
              margin={{
                top: 0,
                bottom: 15,
                left: 0,
              }}
            >
              <CartesianGrid />
              <XAxis
                type="number"
                height={X_AXIS_HEIGHT}
                tickLine={false}
                axisLine={false}
                tickFormatter={numberTickFormatter}
                tick={{ fontSize: 12 }}
                dataKey={xAxisDataKey}
                domain={xDomain}
              />
              <YAxis
                type="number"
                dataKey={yAxisDataKey}
                name={yAxisLabel as string}
                width={yAxisWidth}
                tickLine={false}
                axisLine={false}
                tick={<YAxisTick setLabelWidth={setLabelWidth} />}
                tickFormatter={numberTickFormatter}
                domain={yDomain}
              />
              <ChartTooltip
                content={<CustomTooltipContent parentRef={chartContainerRef} />}
                offset={15}
              />
              <Scatter
                key={`scatter-${id}`}
                name={scatterName}
                data={transformedData}
                shape={<ScatterDot variant="square" />}
                activeShape={<ScatterDot variant="square" active />}
              >
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry["color"] as string} />
                ))}
              </Scatter>
            </RechartsScatterChart>
          </ChartContainer>
        </div>
      </div>
    </SideBarTooltipProvider>
  );
};
