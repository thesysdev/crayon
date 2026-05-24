import clsx from "clsx";
import React from "react";
import { useFormControlContext } from "../FormControl/context";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
  hasError?: boolean;
}

const sizes = {
  small: "openui-input-small",
  medium: "openui-input-medium",
  large: "openui-input-large",
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", hasError, ...props }, ref) => {
    const ctx = useFormControlContext();
    const resolvedHasError = hasError ?? ctx?.hasError ?? false;
    return (
      <input
        autoComplete="off"
        ref={ref}
        className={clsx("openui-input", sizes[size], className, {
          "openui-input-error": resolvedHasError,
        })}
        style={styles}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
