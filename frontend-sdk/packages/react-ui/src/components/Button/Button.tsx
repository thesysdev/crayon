import React from "react";
import "./button.scss";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text: React.ReactNode;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "small" | "medium" | "large";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  return (
    <button
      ref={ref}
      className={`crayon-button-base ${props.className}`}
      style={props.style}
      onClick={props.onClick}
    >
      {props.iconLeft}
      {props.text}
      {props.iconRight}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
