import type { ScalePoint } from "d3-scale";
import React from "react";
import { XAxisLabel } from "../../shared/XAxisLabel";
import { XAxisTickVariant } from "../../types";

const X_AXIS_TOP_GAP = 4;

interface XAxisProps {
  scale: ScalePoint<string>;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  tickVariant: XAxisTickVariant;
  widthOfGroup: number;
  labelHeight: number;
  labelInterval?: number;
}

export const XAxis: React.FC<XAxisProps> = ({
  scale,
  data: _data,
  categoryKey: _categoryKey,
  tickVariant,
  widthOfGroup,
  labelHeight,
  labelInterval = 1,
}) => {
  const domain = scale.domain();

  return (
    <g className="openui-d3-area-chart-x-axis">
      {domain.map((category, i) => {
        const x = scale(category) ?? 0;
        const label = String(category);
        const showLabel = labelInterval <= 1 || i % labelInterval === 0 || i === domain.length - 1;

        return (
          <foreignObject
            key={category}
            x={x - widthOfGroup / 2}
            y={X_AXIS_TOP_GAP}
            width={widthOfGroup}
            height={labelHeight}
          >
            {showLabel && (
              <XAxisLabel
                label={label}
                tickVariant={tickVariant}
                width={widthOfGroup}
                multiLineClassName="openui-d3-area-chart-x-tick-multi-line"
                singleLineClassName="openui-d3-area-chart-x-tick-single-line"
              />
            )}
          </foreignObject>
        );
      })}
    </g>
  );
};
