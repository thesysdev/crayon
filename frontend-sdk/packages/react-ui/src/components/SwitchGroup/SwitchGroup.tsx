import clsx from "clsx";
import React, { forwardRef } from "react";
import { SwitchItemProps } from "../SwitchItem";

export interface SwitchGroupProps {
  children: React.ReactElement<SwitchItemProps> | React.ReactElement<SwitchItemProps>[];
  className?: string;
  style?: React.CSSProperties;
  variant?: "clear" | "card" | "sunk";
}

const SwitchGroup = forwardRef<HTMLDivElement, SwitchGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-switch-group", `crayon-switch-group-${variant}`, className)}
      style={style}
    >
      {children}
    </div>
  );
});

SwitchGroup.displayName = "SwitchGroup";

export { SwitchGroup };
