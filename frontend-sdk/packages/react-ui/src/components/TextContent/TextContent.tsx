import clsx from "clsx";
import React from "react";

export interface TextContentProps {
  children: React.ReactNode;
  variant?: "clear" | "card" | "sunk";
  className?: string;
  style?: React.CSSProperties;
}

const TextContent = (props: TextContentProps) => {
  const { children, variant = "sunk", className, style } = props;

  return (
    <div className={clsx("text-content", `text-content-${variant}`, className)} style={style}>
      {children}
    </div>
  );
};

export { TextContent };
