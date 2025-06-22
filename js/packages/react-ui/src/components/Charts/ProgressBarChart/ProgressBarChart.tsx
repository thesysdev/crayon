import clsx from "clsx";
import { useMemo } from "react";
import { ProgressBarData } from ".";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils";

export interface ProgressBarProps {
  data: ProgressBarData;
  theme?: PaletteName;
  className?: string;
  style?: React.CSSProperties;
  animated?: boolean;
}

export const ProgressBar = ({
  data,
  theme = "ocean",
  className,
  style,
  animated = true,
}: ProgressBarProps) => {
  // Calculate percentages
  const segments = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    const total = data.reduce((acc, value) => acc + value, 0);

    return data.map((value, index) => ({
      value,
      index,
      percentage: total > 0 ? (value / total) * 100 : 0,
    }));
  }, [data]);

  // Get theme colors for each segment
  const colors = useMemo(() => {
    const palette = getPalette(theme);
    return getDistributedColors(palette, Math.max(segments.length, 1));
  }, [theme, segments.length]);

  // Segmented progress bar
  return (
    <div className={clsx("crayon-progress-bar-chart", className)} style={style}>
      {segments.map((segment, index) => {
        return (
          <div
            key={`segment-${index}`}
            className={clsx("crayon-progress-bar-chart-segment", {
              "crayon-progress-bar-chart-animated": animated,
            })}
            style={{
              width: `${segment.percentage}%`,
              backgroundColor: colors[index % colors.length],
            }}
            title={`${segment.value}`}
          />
        );
      })}
    </div>
  );
};
