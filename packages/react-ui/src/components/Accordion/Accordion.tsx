import * as AccordionPrimitive from "@radix-ui/react-accordion";
import clsx from "clsx";
import { ChevronDownIcon } from "lucide-react";
import React, { forwardRef } from "react";

type AccordionVariant = "clear" | "card" | "sunk";

export type AccordionProps = (
  | AccordionPrimitive.AccordionSingleProps
  | AccordionPrimitive.AccordionMultipleProps
) & {
  variant?: AccordionVariant;
};

const variantMap: Record<AccordionVariant, string> = {
  clear: "openui-accordion-clear",
  card: "openui-accordion-card",
  sunk: "openui-accordion-sunk",
};

export const Accordion = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Root>,
  AccordionProps
>(({ className, style, variant = "clear", ...props }, ref) => (
  <AccordionPrimitive.Root
    ref={ref}
    className={clsx("openui-accordion", variantMap[variant], className)}
    style={style}
    {...props}
  />
));

export interface AccordionItemProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
}

export const AccordionItem = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Item>,
  AccordionItemProps
>(({ className, style, value, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={clsx("openui-accordion-item", className)}
    style={style}
    value={value}
    {...props}
  />
));

export interface AccordionTriggerProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> {
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  text: React.ReactNode;
}
export const AccordionTrigger = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Trigger>,
  AccordionTriggerProps
>(({ className, style, text, icon, ...props }, ref) => (
  <AccordionPrimitive.Header className={clsx("openui-accordion-header")}>
    <AccordionPrimitive.Trigger
      ref={ref}
      className={clsx("openui-accordion-trigger", className)}
      style={style}
      {...props}
    >
      <div className="openui-accordion-trigger-content">
        {icon && <span className="openui-accordion-trigger-content-icon">{icon}</span>}
        {text}
      </div>
      <ChevronDownIcon className="openui-accordion-trigger-icon" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));

export interface AccordionContentProps
  extends React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}
export const AccordionContent = forwardRef<
  React.ComponentRef<typeof AccordionPrimitive.Content>,
  AccordionContentProps
>(({ className, style, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={clsx("openui-accordion-content", className)}
    style={style}
    {...props}
  >
    <div className="openui-accordion-content-wrapper">{children}</div>
  </AccordionPrimitive.Content>
));
