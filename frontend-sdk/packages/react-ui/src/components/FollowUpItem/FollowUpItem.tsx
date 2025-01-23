import clsx from "clsx";
import React from "react";

export interface FollowUpItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const FollowUpItem = React.forwardRef<HTMLButtonElement, FollowUpItemProps>((props, ref) => {
  const { className, style, text, icon, ...rest } = props;
  return (
    <button ref={ref} className={clsx("crayon-follow-up-item", className)} style={style} {...rest}>
      {text}
      {icon}
    </button>
  );
});

FollowUpItem.displayName = "FollowUpItem";

export { FollowUpItem };
