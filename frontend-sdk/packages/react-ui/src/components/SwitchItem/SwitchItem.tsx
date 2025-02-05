import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode, useId } from "react";
import { Label } from "../Label";

interface SwitchItemProps {
  label?: ReactNode;
  className?: string;
  style?: CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (value: boolean) => void;
}

const SwitchItem = forwardRef<HTMLButtonElement, SwitchItemProps>((props, ref) => {
  const { label, onChange, className, disabled, required, ...rest } = props;
  const id = useId();
  return (
    <div className="crayon-switch-item-container">
      <Switch.Root
        ref={ref}
        onCheckedChange={onChange}
        id={id}
        className={clsx("crayon-switch-item-root", className)}
        disabled={disabled}
        required={required}
        {...rest}
      >
        <Switch.Thumb className="crayon-switch-item-thumb" />
      </Switch.Root>
      {label && (
        <Label
          htmlFor={id}
          className="crayon-switch-item-label"
          disabled={disabled}
          required={required}
        >
          {label}
        </Label>
      )}
    </div>
  );
});

SwitchItem.displayName = "SwitchItem";

export { SwitchItem, type SwitchItemProps };
