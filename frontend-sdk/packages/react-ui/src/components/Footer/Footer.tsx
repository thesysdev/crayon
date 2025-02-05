import clsx from "clsx";
import { CSSProperties, forwardRef, HTMLAttributes, ReactElement } from "react";
import { ButtonProps } from "../Button";
import { IconButtonProps } from "../IconButton";

type FooterVariant = "vertical" | "horizontal";

export interface FooterProps extends HTMLAttributes<HTMLDivElement> {
  variant?: FooterVariant;
  children:
    | ReactElement<ButtonProps | IconButtonProps>
    | ReactElement<ButtonProps | IconButtonProps>[];
  className?: string;
  style?: CSSProperties;
}

const variantMap: Record<FooterVariant, string> = {
  vertical: "crayon-footer-vertical",
  horizontal: "crayon-footer-horizontal",
};

export const Footer = forwardRef<HTMLDivElement, FooterProps>((props, ref) => {
  const { className, style, variant = "horizontal", children, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-footer", variantMap[variant], className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});

Footer.displayName = "Footer";
