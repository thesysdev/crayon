import * as LabelPrimitive from "@radix-ui/react-label";
import clsx from "clsx";
import React, { forwardRef } from "react";
import "./label.scss";

interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ children, className, style, ...props }, ref) => {
    return (
      <LabelPrimitive.Root
        ref={ref}
        className={clsx("crayon-label", className)}
        style={style}
        {...props}
      >
        {children}
      </LabelPrimitive.Root>
    );
  },
);

Label.displayName = LabelPrimitive.Root.displayName;

export default Label;
