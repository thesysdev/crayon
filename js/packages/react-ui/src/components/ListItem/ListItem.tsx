import clsx from "clsx";
import React, { CSSProperties, ReactNode } from "react";
import { Image } from "../Image";

export interface ListItemProps {
  className?: string;
  style?: CSSProperties;
  title?: ReactNode;
  subtitle?: ReactNode;
  actionIcon?: ReactNode;
  image: string;
  onClick?: () => void;
}

const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>((props, ref) => {
  const { className, style, title, subtitle, actionIcon, image, onClick, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-list-item", className)}
      style={style}
      onClick={onClick}
      {...rest}
    >
      <div className="crayon-list-item-image">
        <Image src={image} alt="List item image" aspectRatio="1:1" scale="fill" />
      </div>
      <div className="crayon-list-item-content">
        {title && <div className="crayon-list-item-title">{title}</div>}
        {subtitle && <div className="crayon-list-item-subtitle">{subtitle}</div>}
      </div>
      {actionIcon && <div className="crayon-list-item-content-action-icon">{actionIcon}</div>}
    </div>
  );
});

ListItem.displayName = "ListItem";

export { ListItem };
