import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";
import React, { forwardRef } from "react";

type TabsVariant = "clear" | "card" | "sunk";

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  className?: string;
  style?: React.CSSProperties;
  variant?: TabsVariant;
}

const tabsVariants: Record<TabsVariant, string> = {
  clear: "crayon-tabs-clear",
  card: "crayon-tabs-card",
  sunk: "crayon-tabs-sunk",
};

export const Tabs = forwardRef<React.ComponentRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ className, style, variant = "clear", ...props }, ref) => (
    <TabsPrimitive.Root
      ref={ref}
      className={clsx("crayon-tabs", tabsVariants[variant], className)}
      style={style}
      {...props}
    />
  ),
);

export interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  className?: string;
  style?: React.CSSProperties;
}

export const TabsList = forwardRef<React.ComponentRef<typeof TabsPrimitive.List>, TabsListProps>(
  ({ className, style, ...props }, ref) => (
    <TabsPrimitive.List
      ref={ref}
      className={clsx("crayon-tabs-list", className)}
      style={style}
      {...props}
    />
  ),
);

export interface TabsTriggerProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  className?: string;
  style?: React.CSSProperties;
  value: string;
  icon?: React.ReactNode;
  text: React.ReactNode;
}

export const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  TabsTriggerProps
>(({ className, style, icon, text, value, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={clsx("crayon-tabs-trigger", className)}
    style={style}
    value={value}
    {...props}
  >
    {icon && <span className="crayon-tabs-trigger-icon">{icon}</span>}
    {text && <span className="crayon-tabs-trigger-text">{text}</span>}
  </TabsPrimitive.Trigger>
));

export interface TabsContentProps
  extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content> {
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  TabsContentProps
>(({ className, style, children, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={clsx("crayon-tabs-content", className)}
    style={style}
    {...props}
  >
    <div className="crayon-tabs-content-inner">{children}</div>
  </TabsPrimitive.Content>
));
