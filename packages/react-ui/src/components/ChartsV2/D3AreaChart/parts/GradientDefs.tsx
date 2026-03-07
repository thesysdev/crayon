import React from "react";
import { ClipDefs } from "../../shared/ClipDefs";

const GRADIENT_TOP_OPACITY = 0.6;
const GRADIENT_BOTTOM_OPACITY = 0;

interface GradientDefsProps {
  dataKeys: string[];
  transformedKeys: Record<string, string>;
  colors: Record<string, string>;
  chartId: string;
  chartWidth: number;
  chartHeight: number;
}

export const GradientDefs: React.FC<GradientDefsProps> = ({
  dataKeys,
  transformedKeys,
  colors,
  chartId,
  chartWidth,
  chartHeight,
}) => {
  return (
    <defs>
      <ClipDefs chartId={chartId} chartWidth={chartWidth} chartHeight={chartHeight} />
      {dataKeys.map((key) => {
        const transformedKey = transformedKeys[key];
        const color = colors[key] ?? "#000";
        return (
          <linearGradient
            key={key}
            id={`grad-${chartId}-${transformedKey}`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor={color} stopOpacity={GRADIENT_TOP_OPACITY} />
            <stop offset="95%" stopColor={color} stopOpacity={GRADIENT_BOTTOM_OPACITY} />
          </linearGradient>
        );
      })}
    </defs>
  );
};
