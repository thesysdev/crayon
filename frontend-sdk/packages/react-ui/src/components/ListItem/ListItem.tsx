import clsx from "clsx";
import { type LucideIcon } from "lucide-react";
import React from "react";

export interface ListItemProps {
  className?: string;
  style?: React.CSSProperties;
  decorativeIcon?: LucideIcon;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actionIcon?: LucideIcon;
  onClick?: () => void;
}

const ListItem = (props: ListItemProps) => {
  const {
    className,
    style,
    decorativeIcon: DecorativeIcon,
    title,
    subtitle,
    actionIcon: ActionIcon,
    onClick,
    ...rest
  } = props;
  return (
    <div className={clsx("crayon-list-item", className)} style={style} onClick={onClick} {...rest}>
      <div className="crayon-list-item-content">
        {DecorativeIcon && <DecorativeIcon size={16} />}
        {title && <div className="crayon-list-item-title">{title}</div>}
        {subtitle && <div className="crayon-list-item-subtitle">{subtitle}</div>}
      </div>
      {ActionIcon && <ActionIcon size={16} />}
    </div>
  );
};

export { ListItem };
