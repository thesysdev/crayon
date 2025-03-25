import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { ReactNode } from "react";

interface ToggleItemProps extends ToggleGroupPrimitive.ToggleGroupItemProps {
  children: ReactNode;
}

const ToggleItem = ({ children, ...props }: ToggleItemProps) => {
  return (
    <ToggleGroupPrimitive.Item {...props} className="crayon-toggle-item">
      {children}
    </ToggleGroupPrimitive.Item>
  );
};

export default ToggleItem;
