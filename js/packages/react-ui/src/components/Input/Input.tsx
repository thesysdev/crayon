import clsx from "clsx";
import React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
}

const sizes = {
  small: "crayon-input-small",
  medium: "crayon-input-medium",
  large: "crayon-input-large",
} as const;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx("crayon-input", sizes[size], className)}
        style={styles}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
