import React, { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import type { Placement } from "@floating-ui/react-dom";

interface VirtualElement {
  getBoundingClientRect(): DOMRect;
}

interface FloatingUIPortalProps {
  active: boolean;
  children: React.ReactNode;
  placement?: Placement;
  offsetDistance?: number;
  className?: string;
}

export const FloatingUIPortal: React.FC<FloatingUIPortalProps> = ({
  active,
  children,
  placement = "right-start",
  offsetDistance = 8,
  className = "",
}) => {
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const virtualElementRef = useRef<VirtualElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Create virtual element that tracks mouse position
    const virtualElement: VirtualElement = {
      getBoundingClientRect(): DOMRect {
        return {
          width: 0,
          height: 0,
          x: mousePositionRef.current.x,
          y: mousePositionRef.current.y,
          top: mousePositionRef.current.y,
          left: mousePositionRef.current.x,
          right: mousePositionRef.current.x,
          bottom: mousePositionRef.current.y,
        } as DOMRect;
      },
    };

    virtualElementRef.current = virtualElement;
  }, []);

  useEffect(() => {
    if (!active || !virtualElementRef.current || !tooltipRef.current) return;

    const updatePosition = async () => {
      const { x, y } = await computePosition(virtualElementRef.current!, tooltipRef.current!, {
        placement,
        middleware: [
          offset(offsetDistance),
          flip(),
          shift({ padding: 8 }),
        ],
      });

      setPosition({ x, y });
    };

    const handleMouseMove = (event: MouseEvent) => {
      mousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      updatePosition();
    };

    if (active) {
      document.addEventListener("mousemove", handleMouseMove);
      updatePosition();
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [active, placement, offsetDistance]);

  if (!active) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={`crayon-portal-tooltip ${className}`}
      style={{
        position: "absolute",
        left: position.x,
        top: position.y,
        zIndex: 1000,
        pointerEvents: "none",
      }}
    >
      {children}
    </div>,
    document.body
  );
}; 