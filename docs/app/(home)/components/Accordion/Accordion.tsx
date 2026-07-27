"use client";

import type { CSSProperties, ReactNode } from "react";

const NO_SHADOW = "0px 0px 0px rgba(0,0,0,0)";

interface Transition {
  duration?: number;
  delay?: number;
  ease?: readonly number[] | string;
}

interface PanelTarget {
  height?: CSSProperties["height"];
  opacity?: CSSProperties["opacity"];
  scale?: number;
  y?: number;
}

function transitionStyle(transition?: Transition): string | undefined {
  if (!transition) return undefined;
  const duration = transition.duration ?? 0.3;
  const delay = transition.delay ?? 0;
  const easing =
    Array.isArray(transition.ease) && transition.ease.length === 4
      ? `cubic-bezier(${transition.ease.join(",")})`
      : (transition.ease ?? "ease");
  return `all ${duration}s ${easing} ${delay}s`;
}

function panelStyle(target: PanelTarget, transition?: Transition): CSSProperties {
  const transforms = [
    target.y !== undefined ? `translateY(${target.y}px)` : "",
    target.scale !== undefined ? `scale(${target.scale})` : "",
  ].filter(Boolean);

  return {
    height: target.height,
    opacity: target.opacity,
    transform: transforms.length > 0 ? transforms.join(" ") : undefined,
    transition: transitionStyle(transition),
  };
}

interface AccordionItemProps {
  open: boolean;
  expandedHeight: number;
  collapsedHeight: number;
  className?: string;
  activeShadow?: string;
  zIndexOpen?: number;
  zIndexClosed?: number;
  transition?: Transition;
  onActivate?: () => void;
  activateOnHover?: boolean;
  children: ReactNode;
}

export function AccordionItem({
  open,
  expandedHeight,
  collapsedHeight,
  className,
  activeShadow = NO_SHADOW,
  zIndexOpen = 2,
  zIndexClosed = 1,
  transition,
  onActivate,
  activateOnHover = true,
  children,
}: AccordionItemProps) {
  return (
    <div
      className={className}
      style={{
        height: open ? expandedHeight : collapsedHeight,
        boxShadow: open ? activeShadow : NO_SHADOW,
        zIndex: open ? zIndexOpen : zIndexClosed,
        transition: transitionStyle(transition),
      }}
      onClick={onActivate}
      onMouseEnter={activateOnHover ? onActivate : undefined}
    >
      {children}
    </div>
  );
}

interface AccordionPanelProps {
  open: boolean;
  className?: string;
  transition?: Transition;
  initial?: PanelTarget;
  animate?: PanelTarget;
  exit?: PanelTarget;
  children: ReactNode;
}

export function AccordionPanel({
  open,
  className,
  transition,
  animate = { height: "auto", opacity: 1 },
  children,
}: AccordionPanelProps) {
  if (!open) return null;

  return (
    <div className={className} style={panelStyle(animate, transition)}>
      {children}
    </div>
  );
}
