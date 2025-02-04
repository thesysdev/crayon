import clsx from "clsx";
import React, { CSSProperties, forwardRef, ReactElement, ReactNode } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";

export interface HeaderProps {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?:
    | ReactElement<ButtonProps | IconButtonProps>
    | ReactElement<ButtonProps | IconButtonProps>[];
  className?: string;
  styles?: CSSProperties;
}

export const Header = forwardRef<HTMLDivElement, HeaderProps>((props, ref) => {
  const { icon, title, subtitle, actions, className, styles, ...rest } = props;
  return (
    <div ref={ref} className={clsx("crayon-header", className)} style={styles} {...rest}>
      <div className="crayon-header-top">
        <div className="crayon-header-top-left">
          {icon && <span className="crayon-header-top-left-icon">{icon}</span>}
          {title}
        </div>
        <div className="crayon-header-top-right">
          {Array.isArray(actions)
            ? actions.map((action, index) => React.cloneElement(action, { key: index }))
            : actions}
        </div>
      </div>
      <div className="crayon-header-bottom">{subtitle}</div>
    </div>
  );
});

Header.displayName = "Header";
