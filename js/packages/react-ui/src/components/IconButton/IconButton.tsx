import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type IconButtonVariant = "primary" | "secondary" | "tertiary";
type IconButtonSize = "extra-small" | "small" | "medium" | "large";
type IconButtonShape = "square" | "circle";
type IconButtonAppearance = "normal" | "destructive";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  className?: string;
  appearance?: IconButtonAppearance;
}

const normalIconButtonVariants = {
  primary: "crayon-icon-button-primary",
  secondary: "crayon-icon-button-secondary",
  tertiary: "crayon-icon-button-tertiary",
} as const;

const destructiveIconButtonVariants = {
  primary: "crayon-icon-button-destructive-primary",
  secondary: "crayon-icon-button-destructive-secondary",
  tertiary: "crayon-icon-button-destructive-tertiary",
} as const;

const iconButtonSizes = {
  "extra-small": "crayon-icon-button-extra-small",
  small: "crayon-icon-button-small",
  medium: "crayon-icon-button-medium",
  large: "crayon-icon-button-large",
} as const;

const iconButtonShapes = {
  square: "crayon-icon-button-square",
  circle: "crayon-icon-button-circle",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    className,
    icon,
    variant = "primary",
    size = "medium",
    shape = "square",
    appearance = "normal",
    ...rest
  } = props;

  const iconButtonVariants =
    appearance === "normal" ? normalIconButtonVariants : destructiveIconButtonVariants;

  return (
    <button
      ref={ref}
      className={clsx(
        "crayon-icon-button",
        iconButtonVariants[variant],
        iconButtonSizes[size],
        iconButtonShapes[shape],
        className,
      )}
      {...rest}
    >
      {icon && <span className="crayon-icon-button-icon">{icon}</span>}
    </button>
  );
});

IconButton.displayName = "IconButton";
