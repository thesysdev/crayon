import clsx from "clsx";
import React from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "medium",
      iconLeft,
      iconRight,
      className,
      style,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "crayon-button-base",
          `crayon-button-base-${variant}`,
          `crayon-button-base-${size}`,
          className,
        )}
        style={style}
        {...props}
      >
        {iconLeft}
        {children}
        {iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";
