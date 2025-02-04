import * as Radio from "@radix-ui/react-radio-group";
import clsx from "clsx";
import React, { forwardRef, useId } from "react";
import { Label } from "../Label";

export interface RadioItemProps {
  label?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
  required?: boolean;
  value: string;
}

const RadioItem = forwardRef<HTMLButtonElement, RadioItemProps>((props, ref) => {
  const { label, className, style, disabled, required, value } = props;
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
          width={14}
          height={14}
          fill="none"
          viewBox="0 0 15 15"
          className="crayon-radio-item-svg"
        >
          <path // This is the circle that is filled between the border and the circle
            fill="currentColor"
            d="M1 7a7 7 0 1 1 14 0A7 7 0 0 1 1 7Z"
            className="crayon-radio-item-svg-path"
          />
          <path // This is the border
            stroke="currentColor"
            d="M1.5 7a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0Z"
            className="crayon-radio-item-svg-border"
          />
          <path // This is the inner circle
            fill="currentColor"
            d="M4.5 7a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
            className="crayon-radio-item-svg-inner"
          />
        </svg>
      </Radio.Item>
      {label && (
        <Label htmlFor={id} className="crayon-radio-item-label" disabled={disabled}>
          {label}
        </Label>
      )}
    </div>
  );
});

RadioItem.displayName = "RadioItem";

export { RadioItem };
