import clsx from "clsx";
import React, { CSSProperties, ReactNode } from "react";

export interface ListItemProps {
  className?: string;
  style?: CSSProperties;
  decorativeIcon?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actionIcon?: ReactNode;
  onClick?: () => void;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>((props, ref) => {
  const { className, style, decorativeIcon, title, subtitle, actionIcon, onClick, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-list-item", className)}
      style={style}
      onClick={onClick}
      {...rest}
    >
      <div className="crayon-list-item-content">
        {decorativeIcon && decorativeIcon}
        {title && <div className="crayon-list-item-title">{title}</div>}
        {subtitle && <div className="crayon-list-item-subtitle">{subtitle}</div>}
      </div>
      {actionIcon && <div className="crayon-list-item-content-action-icon">{actionIcon}</div>}
    </div>
  );
});

ListItem.displayName = "ListItem";

export { ListItem };
