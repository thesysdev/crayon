import clsx from "clsx";
import { useMemo } from "react";
import { getDistributedColors, getPalette, PaletteName } from "../utils/PalletUtils";

export type ProgressBarData = Array<number>;

export interface ProgressBarProps {
  data: ProgressBarData;
  theme?: PaletteName;
  className?: string;
  animated?: boolean;
}

export const ProgressBar = ({
  data,
  theme = "ocean",
  className,
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

  // Custom styles for dynamic values
  const customStyles = useMemo(() => {
    const styles: any = {};

    return styles;
  }, []);

  // Segmented progress bar
  return (
    <div className={clsx("crayon-progress-bar-container", className)} style={customStyles}>
      <div className="crayon-progress-bar-track">
        {segments.map((segment, index) => {
          const isFirst = index === 0;
          const isLast = index === segments.length - 1;
          const isSingle = segments.length === 1;

          return (
            <div
              key={`segment-${index}`}
              className={clsx("crayon-progress-bar-segment", {
                "crayon-progress-bar-segment--first": isFirst && !isSingle,
                "crayon-progress-bar-segment--last": isLast && !isSingle,
                "crayon-progress-bar-segment--single": isSingle,
                "crayon-progress-bar-animated": animated,
              })}
              style={{
                width: `${segment.percentage}%`,
                backgroundColor: colors[index % colors.length],
              }}
              title={`${segment.value}`}
            ></div>
          );
        })}
      </div>
    </div>
  );
};
