import { ArrowRight } from "lucide-react";
import Link from "next/link";
import styles from "./button.module.css";

interface ButtonProps {
  href: string;
  text: string;
  size?: "lg";
  variant?: "primary" | "secondary" | "tertiary";
}

export function Button({ href, text, size = "lg", variant = "primary" }: ButtonProps) {
  const sizeClasses = size === "lg" ? "openui-button-base-large" : "";
  const variantClasses = {
    primary: "openui-button-base-primary",
    secondary: "openui-button-base-secondary",
    tertiary: "openui-button-base-tertiary",
  }[variant];

  return (
    <Link
      href={href}
      className={`openui-button-base no-underline ${sizeClasses} ${variantClasses} ${
        variant === "tertiary" ? styles.tertiary : ""
      }`}
    >
      {text}
      {(variant === "primary" || variant === "tertiary") && (
        <ArrowRight className={variant === "tertiary" ? "h-4 w-4" : "ml-2 h-4 w-4"} />
      )}
    </Link>
  );
}
