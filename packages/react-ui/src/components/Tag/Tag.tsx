import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";

export type TagSize = "sm" | "md" | "lg";
export type TagVariant = "neutral" | "info" | "success" | "warning" | "danger";

const sizeMap: Record<TagSize, string> = {
  sm: "openui-tag-sm",
  md: "openui-tag-md",
  lg: "openui-tag-lg",
};

const variantMap: Record<TagVariant, string> = {
  neutral: "openui-tag-neutral",
  info: "openui-tag-info",
  success: "openui-tag-success",
  warning: "openui-tag-warning",
  danger: "openui-tag-danger",
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
      className={clsx("openui-tag", sizeMap[size], variantMap[variant], className)}
      style={styles}
      {...rest}
    >
      {icon && <span className="openui-tag-icon">{icon}</span>}
      <span className="openui-tag-text">{text}</span>
    </div>
  );
});

Tag.displayName = "Tag";
