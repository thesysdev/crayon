import clsx from "clsx";
import { cloneElement, CSSProperties, forwardRef, ReactElement, ReactNode } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  icon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?:
    | ReactElement<ButtonProps | IconButtonProps>
    | ReactElement<ButtonProps | IconButtonProps>[];
  className?: string;
  styles?: CSSProperties;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { icon, title, subtitle, actions, className, styles, ...rest } = props;
  return (
    <div ref={ref} className={clsx("openui-header", className)} style={styles} {...rest}>
      <div className="openui-header-top">
        <div className="openui-header-top-left">
          {icon && <span className="openui-header-top-left-icon">{icon}</span>}
          {title}
        </div>
        <div className="openui-header-top-right">
          {Array.isArray(actions)
            ? actions.map((action, index) => cloneElement(action, { key: index }))
            : actions}
        </div>
      </div>
      {subtitle && <div className="openui-header-bottom">{subtitle}</div>}
    </div>
  );
});

CardHeader.displayName = "CardHeader";
