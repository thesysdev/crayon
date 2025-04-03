import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import clsx from "clsx";
import { ReactElement } from "react";
import { ToggleItemProps } from "../ToggleItem";

type RadixToggleGroupProps =
  | ToggleGroupPrimitive.ToggleGroupSingleProps
  | ToggleGroupPrimitive.ToggleGroupMultipleProps;

export type ToggleGroupProps = RadixToggleGroupProps & {
  className?: string;
  children: ReactElement<ToggleItemProps> | ReactElement<ToggleItemProps>[];
};

export const ToggleGroup = ({ children, className, ...props }: ToggleGroupProps) => {
  return (
    <ToggleGroupPrimitive.Root className={clsx("crayon-toggle-group", className)} {...props}>
      {children}
    </ToggleGroupPrimitive.Root>
  );
};
