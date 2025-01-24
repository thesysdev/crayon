import * as LabelPrimitive from "@radix-ui/react-label";
import clsx from "clsx";
import React, { forwardRef } from "react";

export interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, style, disabled, ...props }, ref) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={clsx("crayon-label", { "crayon-label-disabled": disabled }, className)}
        style={style}
        {...props}
      >
        {children}
      </LabelPrimitive.Root>
    );
  },
);

Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
