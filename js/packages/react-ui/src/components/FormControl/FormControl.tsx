import clsx from "clsx";
import React, { forwardRef, useMemo } from "react";
import { FormControlProvider } from "./context";
export interface FormControlProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hasError?: boolean;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>((props, ref) => {
  const { children, className, style, hasError = false } = props;
  const formControlContextValue = useMemo(() => ({ hasError }), [hasError]);
  return (
    <div ref={ref} className={clsx("crayon-form-control", className)} style={style}>
      <FormControlProvider value={formControlContextValue}>{children}</FormControlProvider>
    </div>
  );
});

FormControl.displayName = "FormControl";

export { FormControl };
