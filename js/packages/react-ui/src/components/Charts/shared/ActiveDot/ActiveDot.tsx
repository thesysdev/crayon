import React from "react";

export interface ActiveDotProps {
  cx?: number;
  cy?: number;
  payload?: any;
  value?: any;
}

export const ActiveDot: React.FC<ActiveDotProps> = (props) => {
  const { cx, cy } = props;

  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r="4"
        fill="var(--crayon-container-fills)"
        stroke="var(--crayon-container-fills)"
        strokeWidth="1"
      />
      <circle
        cx={cx}
        cy={cy}
        r="2"
        fill="var(--crayon-inverted-fills)"
        stroke="var(--crayon-inverted-fills)"
        strokeWidth="0.5"
      />
    </g>
  );
};
