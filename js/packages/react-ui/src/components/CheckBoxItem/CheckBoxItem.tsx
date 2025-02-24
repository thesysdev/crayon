import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { Check } from "lucide-react";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";

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
  onChange?: (checked: boolean) => void;
}

const CheckBoxItem = forwardRef<HTMLButtonElement, CheckBoxItemProps>((props, ref) => {
  const { label, onChange, className, disabled, required, ...rest } = props;
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
        required={required}
      >
        <Checkbox.Indicator className="crayon-checkbox-item-indicator">
          <Check size={11} />
        </Checkbox.Indicator>
      </Checkbox.Root>
      {label && (
        <label htmlFor={id} className="crayon-checkbox-item-label">
          {label}
        </label>
      )}
    </div>
  );
});

CheckBoxItem.displayName = "CheckBoxItem";

export { CheckBoxItem };
