import { Bar } from "recharts";
import { LineInBarShape } from "./components/LineInBarShape";
import { BarChartVariant } from "./types";
import { BAR_WIDTH, getRadiusArray } from "./utils/BarChartUtils";

const BAR_INTERNAL_LINE_WIDTH = 1;

export interface BarSeriesProps {
  dataKeys: string[];
  transformedKeys: Record<string, string>;
  variant: BarChartVariant;
  radius: number;
  isAnimationActive: boolean;
  barInternalLineColor: string;
  hoveredCategory: string | number | null;
  categoryKey: string;
}

export const BarSeries = ({
  dataKeys,
  transformedKeys,
  variant,
  radius,
  isAnimationActive,
  barInternalLineColor,
  hoveredCategory,
  categoryKey,
}: BarSeriesProps) => {
  return (
    <>
      {dataKeys.map((key, index) => {
        const transformedKey = transformedKeys[key];
        const color = `var(--color-${transformedKey})`;
        const isFirstInStack = index === 0;
        const isLastInStack = index === dataKeys.length - 1;

        return (
          <Bar
            key={`main-${key}`}
            dataKey={key}
            fill={color}
            radius={getRadiusArray(
              variant,
              radius,
              variant === "stacked" ? isFirstInStack : undefined,
              variant === "stacked" ? isLastInStack : undefined,
            )}
            stackId={variant === "stacked" ? "a" : undefined}
            isAnimationActive={isAnimationActive}
            maxBarSize={BAR_WIDTH}
            barSize={BAR_WIDTH}
            shape={
              <LineInBarShape
                internalLineColor={barInternalLineColor}
                internalLineWidth={BAR_INTERNAL_LINE_WIDTH}
                isHovered={hoveredCategory !== null}
                hoveredCategory={hoveredCategory}
                categoryKey={categoryKey}
                variant={variant}
              />
            }
          />
        );
      })}
    </>
  );
};
