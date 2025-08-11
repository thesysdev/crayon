import clsx from "clsx";
import React, { forwardRef } from "react";
import { FormControlProvider } from "./context";
export interface FormControlProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  isError?: boolean;
}

const FormControl = forwardRef<HTMLDivElement, FormControlProps>((props, ref) => {
  const { children, className, style, isError = false } = props;
  return (
    <div ref={ref} className={clsx("crayon-form-control", className)} style={style}>
      <FormControlProvider value={{ isError }}>{children}</FormControlProvider>
    </div>
  );
});

FormControl.displayName = "FormControl";

export { FormControl };
