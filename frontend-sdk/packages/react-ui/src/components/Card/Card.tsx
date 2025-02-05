import clsx from "clsx";
import React from "react";

type CardVariant = "clear" | "card" | "sunk";
type CardWidth = "standard" | "full";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  width?: CardWidth;
}

const variantMap: Record<CardVariant, string> = {
  clear: "crayon-card-clear",
  card: "crayon-card-card",
  sunk: "crayon-card-sunk",
};

const widthMap: Record<CardWidth, string> = {
  standard: "crayon-card-standard",
  full: "crayon-card-full",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const { className, children, variant = "card", width = "standard", ...rest } = props;

  return (
    <div
      ref={ref}
      className={clsx("crayon-card", className, variantMap[variant], widthMap[width])}
      {...rest}
    >
      {children}
    </div>
  );
});

Card.displayName = "Card";
