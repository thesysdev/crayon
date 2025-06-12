import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";

type TagSize = "md" | "lg";
type TagVariant = "neutral" | "info" | "success" | "warning" | "danger";

const sizeMap: Record<TagSize, string> = {
  md: "crayon-tag-md",
  lg: "crayon-tag-lg",
};

const variantMap: Record<TagVariant, string> = {
  neutral: "crayon-tag-neutral",
  info: "crayon-tag-info",
  success: "crayon-tag-success",
  warning: "crayon-tag-warning",
  danger: "crayon-tag-danger",
};

export interface TagProps {
  className?: string;
  styles?: CSSProperties;
  icon?: ReactNode;
  text: ReactNode;
  size?: TagSize;
  variant?: TagVariant;
}

export const Tag = forwardRef<HTMLDivElement, TagProps>((props, ref) => {
  const { className, styles, icon, text, size = "md", variant = "neutral", ...rest } = props;
  return (
    <div
      ref={ref}
      className={clsx("crayon-tag", sizeMap[size], variantMap[variant], className)}
      style={styles}
      {...rest}
    >
      {icon && <span className="crayon-tag-icon">{icon}</span>}
      <span className="crayon-tag-text">{text}</span>
    </div>
  );
});

Tag.displayName = "Tag";
