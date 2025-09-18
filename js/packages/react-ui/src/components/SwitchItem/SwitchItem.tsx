import * as Switch from "@radix-ui/react-switch";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";
import { useId } from "../../polyfills";

interface SwitchItemProps {
  label?: ReactNode;
  description?: ReactNode;
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
  const { label, description, onChange, className, disabled, required, ...rest } = props;
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
      <div className="crayon-switch-item-content">
        {label && (
          <label htmlFor={id} className="crayon-switch-item-label">
            {label}
          </label>
        )}
        {description && <p className="crayon-switch-item-description">{description}</p>}
      </div>
    </div>
  );
});

SwitchItem.displayName = "SwitchItem";

export { SwitchItem, type SwitchItemProps };
