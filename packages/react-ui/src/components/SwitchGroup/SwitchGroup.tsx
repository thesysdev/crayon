import clsx from "clsx";
import { CSSProperties, forwardRef, ReactElement } from "react";
import { SwitchItemProps } from "../SwitchItem";

type SwitchGroupVariant = "clear" | "card" | "sunk";
export interface SwitchGroupProps {
  children: ReactElement<SwitchItemProps> | ReactElement<SwitchItemProps>[];
  className?: string;
  style?: CSSProperties;
  variant?: SwitchGroupVariant;
}

const variants: Record<SwitchGroupVariant, string> = {
  clear: "openui-switch-group-clear",
  card: "openui-switch-group-card",
  sunk: "openui-switch-group-sunk",
};

const SwitchGroup = forwardRef<HTMLDivElement, SwitchGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      ref={ref}
      className={clsx("openui-switch-group", variants[variant], className)}
      style={style}
    >
      {children}
    </div>
  );
});

SwitchGroup.displayName = "SwitchGroup";

export { SwitchGroup };
