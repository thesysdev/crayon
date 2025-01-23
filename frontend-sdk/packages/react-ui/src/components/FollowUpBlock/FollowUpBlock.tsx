import clsx from "clsx";
import React from "react";
import { FollowUpItemProps } from "../FollowUpItem";

export interface FollowUpBlockProps {
  children: React.ReactElement<FollowUpItemProps> | React.ReactElement<FollowUpItemProps>[];
  className?: string;
  style?: React.CSSProperties;
}

const FollowUpBlock = React.forwardRef<HTMLDivElement, FollowUpBlockProps>((props, ref) => {
  const { children, className, style } = props;
  return (
    <div ref={ref} className={clsx("crayon-follow-up-block", className)} style={style}>
      {children}
    </div>
  );
});

FollowUpBlock.displayName = "FollowUpBlock";

export { FollowUpBlock };
