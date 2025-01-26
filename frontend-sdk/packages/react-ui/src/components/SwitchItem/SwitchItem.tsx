import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import React, { useId } from "react";
import { Label } from "../FormControl";

interface SwitchItemProps {
  label?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  checked?: boolean;
  disabled?: boolean;
  defaultChecked?: boolean;
  required?: boolean;
  name?: string;
  value?: string;
  onChange?: (value: boolean) => void;
}

const SwitchItem = React.forwardRef<HTMLButtonElement, SwitchItemProps>((props, ref) => {
  const { label, onChange, className, disabled, ...rest } = props;
  const id = useId();
  return (
    <div className="crayon-switch-item-container">
      <Switch.Root
        ref={ref}
        onCheckedChange={onChange}
        {...rest}
        id={id}
        className={clsx("crayon-switch-item-root", className)}
        disabled={disabled}
      >
        <Switch.Thumb className="crayon-switch-item-thumb" />
      </Switch.Root>
      {label && (
        <Label htmlFor={id} className="crayon-switch-item-label" disabled={disabled}>
          {label}
        </Label>
      )}
    </div>
  );
});

SwitchItem.displayName = "SwitchItem";

export { SwitchItem, type SwitchItemProps };
