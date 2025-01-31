import clsx from "clsx";
import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "clear" | "card" | "sunk";
  width?: "standard" | "full";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, children, variant = "card", width = "standard", ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-card", className, `crayon-card-${variant}`, `crayon-card-${width}`)}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
