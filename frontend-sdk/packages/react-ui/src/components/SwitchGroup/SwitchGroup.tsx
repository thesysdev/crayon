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
  clear: "crayon-switch-group-clear",
  card: "crayon-switch-group-card",
  sunk: "crayon-switch-group-sunk",
};

const SwitchGroup = forwardRef<HTMLDivElement, SwitchGroupProps>((props, ref) => {
  const { children, className, style, variant = "clear" } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-switch-group", variants[variant], className)}
      style={style}
    >
      {children}
    </div>
  );
});

SwitchGroup.displayName = "SwitchGroup";

export { SwitchGroup };
