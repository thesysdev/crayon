import * as SelectPrimitive from "@radix-ui/react-select";
import clsx from "clsx";
import { Check, ChevronDown } from "lucide-react";
import React, { forwardRef } from "react";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

interface SelectTriggerProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  hideDropdownIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

const SelectTrigger = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(({ className, style, children, hideDropdownIcon, size = "md", ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={clsx("crayon-select-trigger", `crayon-select-trigger-${size}`, className)}
    style={style}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      {!hideDropdownIcon && <ChevronDown className="crayon-select-trigger-icon" />}
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));

interface SelectContentProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  position?: "item-aligned" | "popper";
}

const SelectContent = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={clsx("crayon-select-content", className)}
      position={position}
      {...props}
    >
      <SelectPrimitive.Viewport className="crayon-select-viewport" data-position={position}>
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));

interface SelectLabelProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label> {
  className?: string;
  style?: React.CSSProperties;
}

const SelectLabel = forwardRef<React.ComponentRef<typeof SelectPrimitive.Label>, SelectLabelProps>(
  ({ className, style, ...props }, ref) => (
    <SelectPrimitive.Label
      ref={ref}
      className={clsx("crayon-select-label", className)}
      style={style}
      {...props}
    />
  ),
);

interface SelectItemProps extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  textValue?: string;
  showTick?: boolean;
}

const SelectItem = forwardRef<React.ComponentRef<typeof SelectPrimitive.Item>, SelectItemProps>(
  ({ className, style, children, showTick = true, textValue, ...props }, ref) => (
    <SelectPrimitive.Item
      ref={ref}
      className={clsx(
        "crayon-select-item",
        showTick ? "crayon-select-item--with-tick" : "crayon-select-item--without-tick",
        className,
      )}
      style={style}
      {...props}
    >
      {showTick && (
        <span className="crayon-select-item-check-wrapper">
          <SelectPrimitive.ItemIndicator>
            <Check className="crayon-select-item-check-icon" />
          </SelectPrimitive.ItemIndicator>
        </span>
      )}
      <SelectPrimitive.ItemText className="crayon-select-item-text">
        {children}
      </SelectPrimitive.ItemText>
      {textValue && <span className="crayon-select-item-text-value">{textValue}</span>}
    </SelectPrimitive.Item>
  ),
);

interface SelectSeparatorProps
  extends React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator> {
  className?: string;
  style?: React.CSSProperties;
}

const SelectSeparator = forwardRef<
  React.ComponentRef<typeof SelectPrimitive.Separator>,
  SelectSeparatorProps
>(({ className, style, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={clsx("crayon-select-separator", className)}
    style={style}
    {...props}
  />
));

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
