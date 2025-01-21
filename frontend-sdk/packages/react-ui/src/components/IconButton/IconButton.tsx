import clsx from "clsx";
import React from "react";

export type IconButtonVariant = "primary" | "secondary" | "tertiary";
export type IconButtonSize = "extra-small" | "small" | "medium" | "large";
export type IconButtonShape = "square" | "circle";

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  shape?: IconButtonShape;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>((props, ref) => {
  const {
    className,
    style,
    icon,
    variant = "primary",
    size = "medium",
    shape = "square",
    onClick,
    ...rest
  } = props;

  return (
    <button
      ref={ref}
      className={clsx(
        "crayon-icon-button",
        `crayon-icon-button-${variant}`,
        `crayon-icon-button-${size}`,
        `crayon-icon-button-${shape}`,
        className,
      )}
      style={style}
      onClick={onClick}
      {...rest}
    >
      {icon}
    </button>
  );
});

IconButton.displayName = "IconButton";
