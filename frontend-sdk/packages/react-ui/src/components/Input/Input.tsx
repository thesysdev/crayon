import clsx from "clsx";
import React from "react";
import "./input.scss";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={clsx("crayon-input", `crayon-input-${size}`, className)}
        style={styles}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
