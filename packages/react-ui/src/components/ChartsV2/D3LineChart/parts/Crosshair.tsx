import type { ScaleLinear, ScalePoint } from "d3-scale";
import React, { useCallback } from "react";
import { LineDotCrosshair } from "../../shared/LineDotCrosshair";

interface CrosshairProps {
  hoveredIndex: number | null;
  xScale: ScalePoint<string>;
  yScale: ScaleLinear<number, number>;
  data: Array<Record<string, string | number>>;
  dataKeys: string[];
  categoryKey: string;
  colors: Record<string, string>;
  chartHeight: number;
}

export const Crosshair: React.FC<CrosshairProps> = (props) => {
  const getYValue = useCallback(
    (row: Record<string, string | number>, key: string) => Number(row[key]) || 0,
    [],
  );

  return <LineDotCrosshair {...props} getYValue={getYValue} classPrefix="openui-d3-line-chart" />;
};
