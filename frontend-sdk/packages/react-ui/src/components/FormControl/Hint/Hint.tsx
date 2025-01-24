import clsx from "clsx";
import React, { forwardRef } from "react";

export interface HintProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Hint = forwardRef<HTMLDivElement, HintProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <div ref={ref} className={clsx("crayon-hint", className)} style={style} {...props}>
        {children}
      </div>
    );
  },
);

Hint.displayName = "Hint";

export { Hint };
