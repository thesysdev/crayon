import React from "react";

const CLIP_OVERFLOW = 6;

interface ClipDefsProps {
  chartId: string;
  chartWidth: number;
  chartHeight: number;
}

export const ClipDefs: React.FC<ClipDefsProps> = ({ chartId, chartWidth, chartHeight }) => {
  return (
    <clipPath id={`clip-${chartId}`}>
      <rect y={-CLIP_OVERFLOW} width={chartWidth} height={chartHeight + CLIP_OVERFLOW} />
    </clipPath>
  );
};
