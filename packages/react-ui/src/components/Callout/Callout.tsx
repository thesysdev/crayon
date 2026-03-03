import clsx from "clsx";
import React from "react";

type CalloutVariant = "info" | "danger" | "warning" | "success" | "neutral";

export interface CalloutProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  variant?: CalloutVariant;
  title?: React.ReactNode;
  description?: React.ReactNode;
}

const variantMap: Record<CalloutVariant, string> = {
  info: "openui-callout-info",
  danger: "openui-callout-danger",
  warning: "openui-callout-warning",
  success: "openui-callout-success",
  neutral: "openui-callout-neutral",
};

export const Callout = React.forwardRef<HTMLDivElement, CalloutProps>((props, ref) => {
  const { className, variant = "neutral", title, description, ...rest } = props;

  return (
    <div ref={ref} className={clsx("openui-callout", variantMap[variant], className)} {...rest}>
      {title && <span className="openui-callout-title">{title}</span>}
      {description && <span className="openui-callout-description">{description}</span>}
    </div>
  );
});
