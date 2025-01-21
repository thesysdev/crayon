import clsx from "clsx";
import React from "react";

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  variant?: "clear" | "card" | "sunk";
  width?: "standard" | "full";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, style, children, variant = "card", width = "standard", ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-card", className, `crayon-card-${variant}`, `crayon-card-${width}`)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
