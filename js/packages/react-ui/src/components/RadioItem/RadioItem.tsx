import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import { CSSProperties, forwardRef, ReactNode } from "react";
import { useId } from "../../polyfills";

export interface RadioItemProps {
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
  style?: CSSProperties;
  disabled?: boolean;
  required?: boolean;
  value: string;
}

const RadioItem = forwardRef<HTMLButtonElement, RadioItemProps>((props, ref) => {
  const { label, description, className, style, disabled, required, value } = props;
  const id = useId();
  return (
    <div className="crayon-radio-item-container">
      <Radio.Item
        ref={ref}
        className={clsx("crayon-radio-item-root", className)}
        value={value}
        disabled={disabled}
        required={required}
        style={style}
        id={id}
      >
        <svg
          width={16}
          height={16}
          fill="none"
          viewBox="0 0 16 16"
          className="crayon-radio-item-svg"
        >
          <path // This is the circle that is filled between the border and the circle
            fill="currentColor"
            d="M1 8a7 7 0 1 1 14 0A7 7 0 0 1 1 8Z"
            className="crayon-radio-item-svg-path"
          />
          <path // This is the border
            stroke="currentColor"
            d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
            className="crayon-radio-item-svg-border"
          />
          <path // This is the inner circle
            fill="currentColor"
            d="M4 8a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
            className="crayon-radio-item-svg-inner"
          />
        </svg>
      </Radio.Item>
      <div className="crayon-radio-item-content">
        {label && (
          <label htmlFor={id} className="crayon-radio-item-label">
            {label}
          </label>
        )}
        {description && <p className="crayon-radio-item-description">{description}</p>}
      </div>
    </div>
  );
});

RadioItem.displayName = "RadioItem";

export { RadioItem };
