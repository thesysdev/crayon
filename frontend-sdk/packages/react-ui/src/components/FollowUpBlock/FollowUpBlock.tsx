import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { FollowUpItemProps } from "../FollowUpItem";

export interface FollowUpBlockProps {
  children: ReactElement<FollowUpItemProps> | ReactElement<FollowUpItemProps>[];
  className?: string;
  style?: CSSProperties;
}

const FollowUpBlock = forwardRef<HTMLDivElement, FollowUpBlockProps>((props, ref) => {
  const { children, className, style } = props;
  return (
    <div ref={ref} className={clsx("crayon-follow-up-block", className)} style={style}>
      {children}
    </div>
  );
});

FollowUpBlock.displayName = "FollowUpBlock";

export { FollowUpBlock };
