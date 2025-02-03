import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { Check } from "lucide-react";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";
import { Label } from "../FormControl";

export interface CheckBoxItemProps {
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  checkedIcon?: ReactNode;
  onChange?: (checked: boolean) => void;
}

const CheckBoxItem = forwardRef<HTMLButtonElement, CheckBoxItemProps>((props, ref) => {
  const { label, onChange, className, disabled, ...rest } = props;
  const id = useId();
  return (
    <div className="crayon-checkbox-item-container">
      <Checkbox.Root
        ref={ref}
        onCheckedChange={onChange}
        {...rest}
        id={id}
        className={clsx("crayon-checkbox-item-root", className)}
        disabled={disabled}
      >
        <Checkbox.Indicator className="crayon-checkbox-item-indicator">
          <Check size={11} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label && (
        <Label htmlFor={id} className="crayon-checkbox-item-label" disabled={disabled}>
          {label}
        </Label>
      )}
    </div>
  );
});

CheckBoxItem.displayName = "CheckBoxItem";

export { CheckBoxItem };
