import React from "react";

const GRADIENT_TOP_OPACITY = 0.6;
const GRADIENT_BOTTOM_OPACITY = 0;
/** Extra space above/below the clip rect so strokes and dots at the chart edges aren't clipped. */
const CLIP_OVERFLOW = 6;

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
      <clipPath id={`clip-${chartId}`}>
        <rect y={-CLIP_OVERFLOW} width={chartWidth} height={chartHeight + CLIP_OVERFLOW} />
      </clipPath>
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
