import React from "react";

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
        <rect width={chartWidth} height={chartHeight} />
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
            <stop offset="5%" stopColor={color} stopOpacity={0.6} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        );
      })}
    </defs>
  );
};
