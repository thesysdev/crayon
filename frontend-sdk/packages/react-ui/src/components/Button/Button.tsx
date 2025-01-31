import clsx from "clsx";
import { forwardRef, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { children, variant = "primary", size = "medium", iconLeft, iconRight, className, ...props },
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
