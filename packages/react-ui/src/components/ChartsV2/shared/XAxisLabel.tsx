import React, { useRef } from "react";
import type { XAxisTickVariant } from "../types";
import { LabelTooltip } from "./LabelTooltip/LabelTooltip";
import { useIsTruncated } from "./useIsTruncated";

interface XAxisLabelProps {
  label: string;
  tickVariant: XAxisTickVariant;
  width: number;
  multiLineClassName: string;
  singleLineClassName: string;
}

export const XAxisLabel: React.FC<XAxisLabelProps> = ({
  label,
  tickVariant,
  width,
  multiLineClassName,
  singleLineClassName,
}) => {
  const labelRef = useRef<HTMLDivElement>(null);
  const isTruncated = useIsTruncated(labelRef);

  const className = tickVariant === "multiLine" ? multiLineClassName : singleLineClassName;

  return (
    <LabelTooltip content={label} disabled={!isTruncated}>
      <div ref={labelRef} className={className} style={{ maxWidth: width }}>
        {label}
      </div>
    </LabelTooltip>
  );
};
