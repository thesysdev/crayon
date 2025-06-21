import clsx from "clsx";
import { forwardRef, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "small" | "medium" | "large";
type ButtonAppearance = "normal" | "destructive";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  appearance?: ButtonAppearance;
}

const normalVariantMap: Record<ButtonVariant, string> = {
  primary: "crayon-button-base-primary",
  secondary: "crayon-button-base-secondary",
  tertiary: "crayon-button-base-tertiary",
};

const destructiveVariantMap: Record<ButtonVariant, string> = {
  primary: "crayon-button-base-destructive-primary",
  secondary: "crayon-button-base-destructive-secondary",
  tertiary: "crayon-button-base-destructive-tertiary",
};

const sizeMap: Record<ButtonSize, string> = {
  small: "crayon-button-base-small",
  medium: "crayon-button-base-medium",
  large: "crayon-button-base-large",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "medium",
      iconLeft,
      iconRight,
      className,
      appearance = "normal",
      ...props
    },
    ref,
  ) => {
    const variantMap = appearance === "destructive" ? destructiveVariantMap : normalVariantMap;
    return (
      <button
        ref={ref}
        className={clsx("crayon-button-base", variantMap[variant], sizeMap[size], className)}
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
