import clsx from "clsx";
import React from "react";
import "./input.scss";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  styles?: React.CSSProperties;
  className?: string;
  size?: "small" | "medium" | "large";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, styles, size, iconLeft, iconRight, ...props }, ref) => {
    return (
      <div className={clsx("input-container", className)} style={styles}>
        {iconLeft}
        <input ref={ref} className={clsx("input")} {...props} />
        {iconRight}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
