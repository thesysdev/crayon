import clsx from "clsx";
import React from "react";

type CalloutV2Variant = "neutral" | "info" | "warning" | "success" | "danger";

export interface CalloutV2Props extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CalloutV2Variant;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const variantMap: Record<CalloutV2Variant, string> = {
  neutral: "crayon-callout-v2-neutral",
  info: "crayon-callout-v2-info",
  warning: "crayon-callout-v2-warning",
  success: "crayon-callout-v2-success",
  danger: "crayon-callout-v2-danger",
};

export const CalloutV2 = React.forwardRef<HTMLDivElement, CalloutV2Props>((props, ref) => {
  const { className, variant = "neutral", title, description, ...rest } = props;

  return (
    <div ref={ref} className={clsx("crayon-callout-v2", variantMap[variant], className)} {...rest}>
      <div className="crayon-callout-v2-content">
        {title && <span className="crayon-callout-v2-content-title">{title}</span>}
        {description && (
          <span className="crayon-callout-v2-content-description">{description}</span>
        )}
      </div>
    </div>
  );
});
