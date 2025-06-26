import * as Checkbox from "@radix-ui/react-checkbox";
import clsx from "clsx";
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
          <svg
            width="10"
            height="8"
            viewBox="0 0 10 8"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9 1L3.5 6.5L1 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
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
