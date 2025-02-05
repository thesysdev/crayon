import clsx from "clsx";
import React from "react";
import { CheckBoxItemProps } from "../CheckBoxItem";

type CheckBoxGroupVariant = "clear" | "card" | "sunk";

interface CheckBoxGroupProps {
  children: React.ReactElement<CheckBoxItemProps> | React.ReactElement<CheckBoxItemProps>[];
  className?: string;
  style?: React.CSSProperties;
  variant?: CheckBoxGroupVariant;
}

const variantMap: Record<CheckBoxGroupVariant, string> = {
  clear: "crayon-checkbox-group-clear",
  card: "crayon-checkbox-group-card",
  sunk: "crayon-checkbox-group-sunk",
};

const CheckBoxGroup = React.forwardRef<HTMLDivElement, CheckBoxGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-checkbox-group", variantMap[variant], className)}
      style={style}
    >
      {children}
    </div>
  );
});

CheckBoxGroup.displayName = "CheckBoxGroup";

export { CheckBoxGroup, type CheckBoxGroupProps };
