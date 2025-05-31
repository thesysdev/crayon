import clsx from "clsx";
import React from "react";

type CalloutVariant = "neutral" | "info" | "warning" | "success" | "danger";

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CalloutVariant;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  description?: React.ReactNode;
}

const variantMap: Record<CalloutVariant, string> = {
  neutral: "crayon-callout-neutral",
  info: "crayon-callout-info",
  warning: "crayon-callout-warning",
  success: "crayon-callout-success",
  danger: "crayon-callout-danger",
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>((props, ref) => {
  const { className, variant = "neutral", title, icon, description, ...rest } = props;

  return (
    <div ref={ref} className={clsx("crayon-callout", variantMap[variant], className)} {...rest}>
      {/* {icon && (
        <div className="crayon-callout-icon">
          <span className="crayon-callout-icon-inner">{icon}</span>
        </div>
      )} */}
      <div className="crayon-callout-content">
        {title && <span className="crayon-callout-content-title">{title}</span>}
        {description && <span className="crayon-callout-content-description">{description}</span>}
      </div>
    </div>
  );
});
