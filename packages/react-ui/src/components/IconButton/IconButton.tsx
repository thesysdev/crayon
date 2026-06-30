import { Slot, Slottable } from "@radix-ui/react-slot";
import clsx from "clsx";
import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";

type IconButtonVariant = "primary" | "secondary" | "tertiary";
type IconButtonSize =
  | "3-extra-small"
  | "2-extra-small"
  | "extra-small"
  | "small"
  | "medium"
  | "large";
type IconButtonShape = "square" | "circle";
type IconButtonAppearance = "normal" | "destructive";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  className?: string;
  appearance?: IconButtonAppearance;
  /**
   * Render as the provided child element instead of a `<button>`. Useful when the
   * icon button is nested inside another interactive element (e.g. an accordion
   * trigger) where a nested `<button>` would be invalid HTML.
   */
  asChild?: boolean;
}

const normalIconButtonVariants = {
  primary: "openui-icon-button-primary",
  secondary: "openui-icon-button-secondary",
  tertiary: "openui-icon-button-tertiary",
} as const;

const destructiveIconButtonVariants = {
  primary: "openui-icon-button-destructive-primary",
  secondary: "openui-icon-button-destructive-secondary",
  tertiary: "openui-icon-button-destructive-tertiary",
} as const;

const iconButtonSizes = {
  "3-extra-small": "openui-icon-button-3-extra-small",
  "2-extra-small": "openui-icon-button-2-extra-small",
  "extra-small": "openui-icon-button-extra-small",
  small: "openui-icon-button-small",
  medium: "openui-icon-button-medium",
  large: "openui-icon-button-large",
} as const;

const iconButtonShapes = {
  square: "openui-icon-button-square",
  circle: "openui-icon-button-circle",
} as const;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    className,
    icon,
    variant = "primary",
    size = "medium",
    shape = "square",
    appearance = "normal",
    asChild = false,
    children,
    ...rest
  } = props;

  const iconButtonVariants =
    appearance === "normal" ? normalIconButtonVariants : destructiveIconButtonVariants;

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={ref}
      className={clsx(
        "openui-icon-button",
        iconButtonVariants[variant],
        iconButtonSizes[size],
        iconButtonShapes[shape],
        className,
      )}
      {...rest}
    >
      <Slottable>{children}</Slottable>
      {icon && <span className="openui-icon-button-icon">{icon}</span>}
    </Comp>
  );
});

IconButton.displayName = "IconButton";
