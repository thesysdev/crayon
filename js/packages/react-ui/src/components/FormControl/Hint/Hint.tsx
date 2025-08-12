import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../context";

export interface HintProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasError?: boolean;
}

const Hint = forwardRef<HTMLDivElement, HintProps>(
  ({ children, className, style, hasError, ...props }, ref) => {
    const ctx = useFormControlContext();
    const resolvedHasError = hasError ?? ctx?.hasError ?? false;
    return (
      <div
        ref={ref}
        className={clsx("crayon-hint", className, {
          "crayon-hint-error": resolvedHasError,
        })}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Hint.displayName = "Hint";

export { Hint };
