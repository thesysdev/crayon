import clsx from "clsx";
import React, { CSSProperties, forwardRef } from "react";

export interface ListWithIconProps {
  className?: string;
  style?: CSSProperties;
  icon: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export const ListWithIcon = forwardRef<HTMLDivElement, ListWithIconProps>((props, ref) => {
  const { className, style, icon, title, subtitle, ...rest } = props;
  return (
    <div ref={ref} className={clsx("crayon-list-with-icon", className)} style={style} {...rest}>
      <div className="crayon-list-with-icon-icon-container">
        <div className="crayon-list-with-icon-icon">{icon}</div>
      </div>
      <div className="crayon-list-with-icon-content-container">
        <div className="crayon-list-with-icon-title">{title}</div>
        <div className="crayon-list-with-icon-subtitle">{subtitle}</div>
      </div>
    </div>
  );
});
