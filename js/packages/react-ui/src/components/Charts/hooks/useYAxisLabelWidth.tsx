import { useMemo } from "react";

import { AreaChartData } from "../AreaChart";
import { BarChartData } from "../BarChart";
import { LineChartData } from "../LineChart";
import { numberTickFormatter } from "../utils";
import { useCanvasContext } from "./useCanvasContext";

const DEFAULT_Y_AXIS_WIDTH = 40;
const MIN_Y_AXIS_WIDTH = 20;
const MAX_Y_AXIS_WIDTH = 200;

export const useYAxisLabelWidth = (
  data: AreaChartData | LineChartData | BarChartData,
  dataKeys: string[],
) => {
  const context = useCanvasContext();

  const maxLabelWidth = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0 || !dataKeys.length) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    if (!context) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    let maxWidth = 0;

    // Measure all possible Y-axis values
    dataKeys.forEach((key) => {
      // Get all unique values for this data key we basically want to get the max width of the values
      const values = [
        ...new Set(data.map((item) => item[key]).filter((v) => v != null && typeof v === "number")),
      ];

      values.forEach((value) => {
        const displayValue = numberTickFormatter(value);
        const textWidth = context.measureText(displayValue).width;
        maxWidth = Math.max(maxWidth, textWidth);
      });
    });

    // Add padding for better visual appearance
    const totalWidth = Math.ceil(maxWidth) + 10; // 5px padding on each side

    // Clamp the width between MIN and MAX values
    return Math.max(MIN_Y_AXIS_WIDTH, Math.min(MAX_Y_AXIS_WIDTH, totalWidth));
  }, [data, dataKeys, context]);

  return maxLabelWidth;
};
