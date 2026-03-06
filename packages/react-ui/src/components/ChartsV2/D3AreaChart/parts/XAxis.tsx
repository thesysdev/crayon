import type { ScalePoint } from "d3-scale";
import React, { useRef } from "react";
import { LabelTooltip } from "../../shared/LabelTooltip/LabelTooltip";
import { XAxisTickVariant } from "../../types";

interface XAxisProps {
  scale: ScalePoint<string>;
  data: Array<Record<string, string | number>>;
  categoryKey: string;
  tickVariant: XAxisTickVariant;
  widthOfGroup: number;
  labelHeight: number;
}

export const XAxis: React.FC<XAxisProps> = ({
  scale,
  data,
  categoryKey,
  tickVariant,
  widthOfGroup,
  labelHeight,
}) => {
  const domain = scale.domain();

  return (
    <g className="openui-d3-area-chart-x-axis">
      {domain.map((category) => {
        const x = scale(category) ?? 0;
        const label = String(category);

        return (
          <foreignObject
            key={category}
            x={x - widthOfGroup / 2}
            y={4}
            width={widthOfGroup}
            height={labelHeight}
          >
            <XAxisLabel
              label={label}
              tickVariant={tickVariant}
              width={widthOfGroup}
            />
          </foreignObject>
        );
      })}
    </g>
  );
};

const XAxisLabel: React.FC<{
  label: string;
  tickVariant: XAxisTickVariant;
  width: number;
}> = ({ label, tickVariant, width }) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const isTruncated = useIsTruncated(labelRef);

  const className =
    tickVariant === "multiLine"
      ? "openui-d3-area-chart-x-tick-multi-line"
      : "openui-d3-area-chart-x-tick-single-line";

  return (
    <LabelTooltip content={label} disabled={!isTruncated}>
      <div
        ref={labelRef}
        className={className}
        style={{ maxWidth: width }}
      >
        {label}
      </div>
    </LabelTooltip>
  );
};

function useIsTruncated(ref: React.RefObject<HTMLElement | null>): boolean {
  const [truncated, setTruncated] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setTruncated(el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight);
  });

  return truncated;
}
