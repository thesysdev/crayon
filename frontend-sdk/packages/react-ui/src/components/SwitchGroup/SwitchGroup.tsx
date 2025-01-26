import clsx from "clsx";
import React from "react";
import { SwitchItemProps } from "../SwitchItem";

export interface SwitchGroupProps {
  children: React.ReactElement<SwitchItemProps> | React.ReactElement<SwitchItemProps>[];
  className?: string;
  style?: React.CSSProperties;
  variant?: "clear" | "card" | "sunk";
}

const SwitchGroup = (props: SwitchGroupProps) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      className={clsx("crayon-switch-group", `crayon-switch-group-${variant}`, className)}
      style={style}
    >
      {children}
    </div>
  );
};

export { SwitchGroup };
