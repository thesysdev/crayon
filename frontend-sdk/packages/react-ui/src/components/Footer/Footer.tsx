import clsx from "clsx";
import React from "react";
import { Button } from "../Button";
import { IconButton } from "../IconButton";

export type FooterVariant = "vertical" | "horizontal";

export interface FooterProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: FooterVariant;
  children:
    | React.ReactElement<typeof Button | typeof IconButton>
    | React.ReactElement<typeof Button | typeof IconButton>[];
  className?: string;
  style?: React.CSSProperties;
}

export const Footer = React.forwardRef<HTMLDivElement, FooterProps>((props, ref) => {
  const { className, style, variant, children, ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-footer", `crayon-footer-${variant}`, className)}
      style={style}
      {...rest}
    >
      {children}
    </div>
  );
});

Footer.displayName = "Footer";
