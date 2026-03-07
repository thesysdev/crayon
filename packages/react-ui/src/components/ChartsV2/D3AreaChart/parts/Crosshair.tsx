import type { ScaleLinear, ScalePoint } from "d3-scale";
import React, { useCallback } from "react";
import type { StackedData } from "../../hooks/useStackedData";
import { LineDotCrosshair } from "../../shared/LineDotCrosshair";

interface CrosshairProps {
  hoveredIndex: number | null;
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  categoryKey: string;
  colors: Record<string, string>;
  stackedData: StackedData | null;
  chartHeight: number;
}

export const Crosshair: React.FC<CrosshairProps> = ({
  hoveredIndex,
  xScale,
  yScale,
  data,
  dataKeys,
  categoryKey,
  colors,
  stackedData,
  chartHeight,
}) => {
  const getYValue = useCallback(
    (_row: Record<string, string | number>, key: string, seriesIndex: number) => {
      if (stackedData && hoveredIndex !== null) {
        const series = stackedData[seriesIndex];
        const point = series?.[hoveredIndex];
        return point ? point[1] : 0;
      }
      return Number(_row[key]) || 0;
    },
    [stackedData, hoveredIndex],
  );

  return (
    <LineDotCrosshair
      hoveredIndex={hoveredIndex}
      xScale={xScale}
      yScale={yScale}
      data={data}
      dataKeys={dataKeys}
      categoryKey={categoryKey}
      colors={colors}
      chartHeight={chartHeight}
      getYValue={getYValue}
      classPrefix="openui-d3-area-chart"
    />
  );
};
