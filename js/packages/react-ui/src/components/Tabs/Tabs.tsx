import * as TabsPrimitive from "@radix-ui/react-tabs";
import clsx from "clsx";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { forwardRef, useEffect, useRef, useState } from "react";
import { IconButton } from "../IconButton";

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
  ({ className, style, ...props }, ref) => {
    const listRef = useRef<HTMLDivElement>(null);
    const [showLeftButton, setShowLeftButton] = useState(false);
    const [showRightButton, setShowRightButton] = useState(false);

    // Check if scrolling is needed
    useEffect(() => {
      const checkScroll = () => {
        if (listRef.current) {
          const { scrollLeft, scrollWidth, clientWidth } = listRef.current;
          setShowLeftButton(scrollLeft > 0);
          setShowRightButton(scrollLeft < scrollWidth - clientWidth - 1); // -1 for rounding errors
        }
      };

      // Initial check
      checkScroll();

      // Add event listener for scroll
      const currentRef = listRef.current;
      if (currentRef) {
        currentRef.addEventListener("scroll", checkScroll);

        // Also add resize observer to handle responsive changes
        const resizeObserver = new ResizeObserver(checkScroll);
        resizeObserver.observe(currentRef);

        return () => {
          currentRef.removeEventListener("scroll", checkScroll);
          resizeObserver.disconnect();
        };
      }
      return () => {};
    }, []);

    // Scroll functions
    const scrollLeft = () => {
      if (listRef.current) {
        // Scroll one tab to the left
        listRef.current.scrollBy({ left: -120, behavior: "smooth" });
      }
    };

    const scrollRight = () => {
      if (listRef.current) {
        // Scroll one tab to the right
        listRef.current.scrollBy({ left: 120, behavior: "smooth" });
      }
    };

    return (
      <div className="crayon-tabs-list-container">
        {showLeftButton && (
          <IconButton
            className="crayon-tabs-scroll-button crayon-tabs-scroll-left"
            onClick={scrollLeft}
            aria-label="Scroll tabs left"
            icon={<ArrowLeft />}
            variant="secondary"
            size="small"
          />
        )}

        <TabsPrimitive.List
          ref={(node) => {
            // Forward the ref to the original ref prop if provided
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            // Also store it in our local ref
            listRef.current = node;
          }}
          className={clsx("crayon-tabs-list", className)}
          style={style}
          {...props}
        />

        {showRightButton && (
          <IconButton
            className="crayon-tabs-scroll-button crayon-tabs-scroll-right"
            onClick={scrollRight}
            aria-label="Scroll tabs right"
            icon={<ArrowRight />}
            variant="secondary"
            size="small"
          />
        )}
      </div>
    );
  },
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
