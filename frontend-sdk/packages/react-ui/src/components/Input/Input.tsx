import clsx from "clsx";
import React from "react";
import "./input.scss";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size = "medium", disabled, ...props }, ref) => {
    return (
      <div
        className={clsx(
          "crayon-input-container",
          `crayon-input-container-${size}`,
          {
            "crayon-input-container-disabled": disabled,
          },
          className,
        )}
        style={styles}
      >
        <input ref={ref} className={clsx("crayon-input")} disabled={disabled} {...props} />
      </div>
    );
  },
);

Input.displayName = "Input";
