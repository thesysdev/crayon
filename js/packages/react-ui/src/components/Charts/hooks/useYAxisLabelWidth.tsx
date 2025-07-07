import { useMemo } from "react";

import { useTheme } from "../../ThemeProvider";
import { AreaChartData } from "../AreaChart";
import { BarChartData } from "../BarChart";
import { LineChartData } from "../LineChart";
import { getCanvasContext, numberTickFormatter } from "../utils";

const DEFAULT_Y_AXIS_WIDTH = 40;
const MIN_Y_AXIS_WIDTH = 30;
const MAX_Y_AXIS_WIDTH = 120;

export const useYAxisLabelWidth = (
  data: AreaChartData | LineChartData | BarChartData,
  dataKeys: string[],
) => {
  const { theme: userTheme } = useTheme();

  const maxLabelWidth = useMemo(() => {
    if (typeof window === "undefined" || !data || data.length === 0 || !dataKeys.length) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    const context = getCanvasContext();
    if (!context) {
      return DEFAULT_Y_AXIS_WIDTH;
    }

    // Set font to match Y-axis tick styling
    const font = userTheme.fontLabelExtraSmall ?? "400 10px/12px Inter";
    context.font = font;

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
    const totalWidth = Math.ceil(maxWidth) + 10; // 6px padding on each side

    // Clamp the width between MIN and MAX values
    return Math.max(MIN_Y_AXIS_WIDTH, Math.min(MAX_Y_AXIS_WIDTH, totalWidth));
  }, [data, dataKeys, userTheme.fontLabelExtraSmall]);

  return maxLabelWidth;
};
