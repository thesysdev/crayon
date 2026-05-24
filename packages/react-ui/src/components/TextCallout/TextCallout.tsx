import clsx from "clsx";
import React from "react";

type TextCalloutVariant = "neutral" | "info" | "warning" | "success" | "danger";

export interface TextCalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: TextCalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const variantMap: Record<TextCalloutVariant, string> = {
  neutral: "openui-text-callout-neutral",
  info: "openui-text-callout-info",
  warning: "openui-text-callout-warning",
  success: "openui-text-callout-success",
  danger: "openui-text-callout-danger",
};

export const TextCallout = React.forwardRef<HTMLDivElement, TextCalloutProps>((props, ref) => {
  const { className, variant = "neutral", title, description, ...rest } = props;

  return (
    <div
      ref={ref}
      className={clsx("openui-text-callout", variantMap[variant], className)}
      {...rest}
    >
      <div className="openui-text-callout-content">
        {title && <span className="openui-text-callout-content-title">{title}</span>}
        {description && (
          <span className="openui-text-callout-content-description">{description}</span>
        )}
      </div>
    </div>
  );
});
