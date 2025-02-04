import clsx from "clsx";
import { CSSProperties, ReactNode } from "react";

export type TextContentVariant = "clear" | "card" | "sunk";

export interface TextContentProps {
  children: ReactNode;
  variant?: TextContentVariant;
  className?: string;
  style?: CSSProperties;
}

const variants: Record<TextContentVariant, string> = {
  clear: "text-content-clear",
  card: "text-content-card",
  sunk: "text-content-sunk",
};

const TextContent = (props: TextContentProps) => {
  const { children, variant = "sunk", className, style } = props;

  return (
    <div className={clsx("text-content", variants[variant], className)} style={style}>
      {children}
    </div>
  );
};

export { TextContent };
