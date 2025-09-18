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
  small: "crayon-input-small",
  medium: "crayon-input-medium",
  large: "crayon-input-large",
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", hasError, ...props }, ref) => {
    const ctx = useFormControlContext();
    const resolvedHasError = hasError ?? ctx?.hasError ?? false;
    return (
      <input
        autoComplete="off"
        ref={ref}
        className={clsx("crayon-input", sizes[size], className, {
          "crayon-input-error": resolvedHasError,
        })}
        style={styles}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
