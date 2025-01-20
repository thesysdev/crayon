import clsx from "clsx";
import React from "react";
import "./button.scss";

export type ButtonVariant = "primary" | "secondary" | "tertiary";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      text,
      variant = "primary",
      size = "medium",
      iconLeft,
      iconRight,
      className,
      style,
      onClick,
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
        onClick={onClick}
        {...props}
      >
        {iconLeft}
        {text}
        {iconRight}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
