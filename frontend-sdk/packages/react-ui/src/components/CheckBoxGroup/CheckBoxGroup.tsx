import clsx from "clsx";
import React from "react";
import { CheckBoxItemProps } from "../CheckBoxItem";

interface CheckBoxGroupProps {
  children: React.ReactElement<CheckBoxItemProps> | React.ReactElement<CheckBoxItemProps>[];
  className?: string;
  style?: React.CSSProperties;
  variant?: "clear" | "card" | "sunk";
}

const CheckBoxGroup = React.forwardRef<HTMLDivElement, CheckBoxGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-checkbox-group", `crayon-checkbox-group-${variant}`, className)}
      style={style}
    >
      {children}
    </div>
  );
});

CheckBoxGroup.displayName = "CheckBoxGroup";

export { CheckBoxGroup, type CheckBoxGroupProps };
