import clsx from "clsx";
import React from "react";

type CalloutV2Variant = "info" | "danger" | "warning" | "success" | "neutral";
export interface CalloutV2Props extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode;
  description: React.ReactNode;
  variant: CalloutV2Variant;
}

const variantMap: Record<CalloutV2Variant, string> = {
  info: "crayon-callout-v2-info",
  danger: "crayon-callout-v2-danger",
  warning: "crayon-callout-v2-warning",
  success: "crayon-callout-v2-success",
  neutral: "crayon-callout-v2-neutral",
};

export const CalloutV2 = React.forwardRef<HTMLDivElement, CalloutV2Props>((props, ref) => {
  const { title, description, variant, ...rest } = props;
  return (
    <div ref={ref} className={clsx("crayon-callout-v2", variantMap[variant])} {...rest}>
      <span className="crayon-callout-v2-title">{title}</span>
      <span className="crayon-callout-v2-description">{description}</span>
    </div>
  );
});
