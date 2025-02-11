import clsx from "clsx";
import { CSSProperties, forwardRef, HTMLAttributes, ReactElement } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";

type ButtonsVariant = "vertical" | "horizontal";

export interface ButtonsProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ButtonsVariant;
  children:
    | ReactElement<ButtonProps | IconButtonProps>
    | ReactElement<ButtonProps | IconButtonProps>[];
  className?: string;
  style?: CSSProperties;
}

const variantMap: Record<ButtonsVariant, string> = {
  vertical: "crayon-buttons-vertical",
  horizontal: "crayon-buttons-horizontal",
};

export const Buttons = forwardRef<HTMLDivElement, ButtonsProps>((props, ref) => {
  const { className, style, variant = "horizontal", children, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-buttons", variantMap[variant], className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});

Buttons.displayName = "Buttons";
