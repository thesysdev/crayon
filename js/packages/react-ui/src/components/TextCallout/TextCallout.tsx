import clsx from "clsx";
import React from "react";

type TextCalloutVariant = "neutral" | "info" | "warning" | "success" | "danger";

export interface TextCalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: TextCalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const variantMap: Record<TextCalloutVariant, string> = {
  neutral: "crayon-text-callout-neutral",
  info: "crayon-text-callout-info",
  warning: "crayon-text-callout-warning",
  success: "crayon-text-callout-success",
  danger: "crayon-text-callout-danger",
};

export const TextCallout = React.forwardRef<HTMLDivElement, TextCalloutProps>((props, ref) => {
  const { className, variant = "neutral", title, description, ...rest } = props;

  return (
    <div
      ref={ref}
      className={clsx("crayon-text-callout", variantMap[variant], className)}
      {...rest}
    >
      <div className="crayon-text-callout-content">
        {title && <span className="crayon-text-callout-content-title">{title}</span>}
        {description && (
          <span className="crayon-text-callout-content-description">{description}</span>
        )}
      </div>
    </div>
  );
});
