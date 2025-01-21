import clsx from "clsx";
import React, { forwardRef } from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";

export interface HeaderProps {
  icon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions:
    | React.ReactElement<typeof Button | typeof IconButton>
    | React.ReactElement<typeof Button | typeof IconButton>[];
  className?: string;
  styles?: React.CSSProperties;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>((props, ref) => {
  const { icon, title, subtitle, actions, className, styles, ...rest } = props;
  return (
    <div ref={ref} className={clsx("crayon-header", className)} style={styles} {...rest}>
      <div className="crayon-header-top">
        <div className="crayon-header-top-left">
          {icon}
          {title}
        </div>
        <div className="crayon-header-top-right">{actions}</div>
      </div>
      <div className="crayon-header-bottom">{subtitle}</div>
    </div>
  );
});

Header.displayName = "Header";
