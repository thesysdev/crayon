import type { ScaleLinear } from "d3-scale";
import { scaleLinear } from "d3-scale";
import { useMemo } from "react";
import type { ChartData } from "../../types";
import type { StackedData } from "./useStackedData";

export const useYScale = (
  data: ChartData,
  dataKeys: string[],
  chartInnerHeight: number,
  stackedData: StackedData | null,
): ScaleLinear<number, number> => {
  return useMemo(() => {
    let maxVal = 0;

    if (stackedData) {
      stackedData.forEach((series) => {
        series.forEach((point) => {
          maxVal = Math.max(maxVal, point[1]);
        });
      });
    } else {
      data.forEach((row) => {
        dataKeys.forEach((key) => {
          const val = Number(row[key]) || 0;
          maxVal = Math.max(maxVal, val);
        });
      });
    }

    return scaleLinear().domain([0, maxVal]).range([chartInnerHeight, 0]).nice();
  }, [data, dataKeys, stackedData, chartInnerHeight]);
};
