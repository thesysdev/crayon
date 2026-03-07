import type { ScaleBand, ScalePoint } from "d3-scale";
import React from "react";
import type { XAxisTickVariant } from "../types";
import { XAxisLabel } from "./XAxisLabel";

const X_AXIS_TOP_GAP = 4;

type XAxisScale = ScalePoint<string> | ScaleBand<string>;

interface XAxisProps {
  scale: XAxisScale;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  tickVariant: XAxisTickVariant;
  widthOfGroup?: number;
  labelHeight: number;
  labelInterval?: number;
  classPrefix: string;
}

function isBandScale(scale: XAxisScale): scale is ScaleBand<string> {
  return typeof (scale as ScaleBand<string>).paddingInner === "function";
}

export const XAxis: React.FC<XAxisProps> = ({
  scale,
  data: _data,
  categoryKey: _categoryKey,
  tickVariant,
  widthOfGroup,
  labelHeight,
  labelInterval = 1,
  classPrefix,
}) => {
  const domain = scale.domain();
  const band = isBandScale(scale);
  const labelWidth = band ? (scale as ScaleBand<string>).bandwidth() : (widthOfGroup ?? 0);

  return (
    <g className={`${classPrefix}-x-axis`}>
      {domain.map((category, i) => {
        const rawX = scale(category) ?? 0;
        const x = band ? rawX : rawX - labelWidth / 2;
        const label = String(category);
        const showLabel = labelInterval <= 1 || i % labelInterval === 0 || i === domain.length - 1;

        return (
          <foreignObject
            key={category}
            x={x}
            y={X_AXIS_TOP_GAP}
            width={labelWidth}
            height={labelHeight}
          >
            {showLabel && (
              <XAxisLabel
                label={label}
                tickVariant={tickVariant}
                width={labelWidth}
                multiLineClassName={`${classPrefix}-x-tick-multi-line`}
                singleLineClassName={`${classPrefix}-x-tick-single-line`}
              />
            )}
          </foreignObject>
        );
      })}
    </g>
  );
};
