import type { ScaleBand } from "d3-scale";
import React from "react";
import { XAxisLabel } from "../../shared/XAxisLabel";
import { XAxisTickVariant } from "../../types";

const X_AXIS_TOP_GAP = 4;

interface XAxisProps {
  scale: ScaleBand<string>;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  tickVariant: XAxisTickVariant;
  labelHeight: number;
  labelInterval?: number;
}

export const XAxis: React.FC<XAxisProps> = ({
  scale,
  data: _data,
  categoryKey: _categoryKey,
  tickVariant,
  labelHeight,
  labelInterval = 1,
}) => {
  const domain = scale.domain();
  const bandWidth = scale.bandwidth();

  return (
    <g className="openui-d3-bar-chart-x-axis">
      {domain.map((category, i) => {
        const x = scale(category) ?? 0;
        const label = String(category);
        const showLabel = labelInterval <= 1 || i % labelInterval === 0 || i === domain.length - 1;

        return (
          <foreignObject
            key={category}
            x={x}
            y={X_AXIS_TOP_GAP}
            width={bandWidth}
            height={labelHeight}
          >
            {showLabel && (
              <XAxisLabel
                label={label}
                tickVariant={tickVariant}
                width={bandWidth}
                multiLineClassName="openui-d3-bar-chart-x-tick-multi-line"
                singleLineClassName="openui-d3-bar-chart-x-tick-single-line"
              />
            )}
          </foreignObject>
        );
      })}
    </g>
  );
};
