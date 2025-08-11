import clsx from "clsx";
import React, { forwardRef } from "react";
import { useFormControlContext } from "../context";

export interface HintProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isError?: boolean;
}

const Hint = forwardRef<HTMLDivElement, HintProps>(
  ({ children, className, style, isError, ...props }, ref) => {
    const ctx = useFormControlContext();
    const resolvedIsError = isError ?? ctx?.isError ?? false;
    return (
      <div
        ref={ref}
        className={clsx("crayon-hint", className, {
          "crayon-hint-error": resolvedIsError,
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
