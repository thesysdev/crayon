import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";
import React, { forwardRef } from "react";

export interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  className?: string;
  style?: React.CSSProperties;
  variant?: "clear" | "card" | "sunk";
}

export const Tabs = forwardRef<React.ComponentRef<typeof TabsPrimitive.Root>, TabsProps>(
  ({ className, style, variant = "clear", ...props }, ref) => (
    <TabsPrimitive.Root
      ref={ref}
      className={clsx("crayon-tabs", className, `crayon-tabs-${variant}`)}
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
    {icon}
    {text}
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
    {children}
  </TabsPrimitive.Content>
));
