import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import { ReactNode } from "react";

export interface ToggleItemProps extends ToggleGroupPrimitive.ToggleGroupItemProps {
  children: ReactNode;
  className?: string;
}

export const ToggleItem = ({ className, children, ...props }: ToggleItemProps) => {
  return (
    <ToggleGroupPrimitive.Item className={clsx("crayon-toggle-item", className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Item>
  );
};
