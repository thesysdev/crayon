import clsx from "clsx";
import React from "react";

export interface ListItemProps {
  className?: string;
  style?: React.CSSProperties;
  decorativeIcon?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionIcon?: React.ReactNode;
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
      {actionIcon && actionIcon}
    </div>
  );
});

ListItem.displayName = "ListItem";

export { ListItem };
