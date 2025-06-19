import type { Placement } from "@floating-ui/react-dom";
import { autoPlacement, computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface VirtualElement {
  getBoundingClientRect(): DOMRect;
}

interface FloatingUIPortalProps {
  active: boolean;
  children: React.ReactNode;
  placement?: Placement;
  offsetDistance?: number;
  className?: string;
  chartId?: string;
  portalContainer?: React.RefObject<HTMLElement | null>;
}

export const FloatingUIPortal: React.FC<FloatingUIPortalProps> = ({
  active,
  children,
  placement = "right-start",
  offsetDistance = 10,
  className = "",
  chartId,
  portalContainer,
}) => {
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const virtualElementRef = useRef<VirtualElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPositioned, setIsPositioned] = useState(false);

  // Function to get the portal target element
  const getPortalTarget = (): HTMLElement => {
    if (!portalContainer || !portalContainer.current) {
      return document.body;
    }

    return portalContainer.current;
  };

  useEffect(() => {
    // Create virtual element that tracks mouse position
    // this element element is basically tracks the mouse position always shadows the mouse cursor.
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
    // it as 0 width and height because it is not a real element, it is just a virtual element that tracks the mouse position.

    virtualElementRef.current = virtualElement;
  }, []);

  useEffect(() => {
    if (!active || !virtualElementRef.current || !tooltipRef.current) return;

    const updatePosition = async () => {
      // https://floating-ui.com/docs/computePosition
      // not a synchronous function, it returns a promise. so we need to await it.
      const { x, y } = await computePosition(virtualElementRef.current!, tooltipRef.current!, {
        placement,
        middleware: [offset(offsetDistance), flip(), shift({ padding: 8 }), autoPlacement()],
      });

      setPosition({ x, y });
      // this is to avoid the tooltip from flickering when the mouse is moving fast and the tooltip is not positioned yet initially
      setTimeout(() => {
        setIsPositioned(true);
      }, 20);
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
      setIsPositioned(false);
    };
  }, [active, placement, offsetDistance]);

  if (!active) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={clsx("crayon-portal-tooltip", className)}
      data-chart={chartId}
      style={{
        left: position.x,
        top: position.y,
        opacity: isPositioned ? 1 : 0,
      }}
    >
      {children}
    </div>,
    getPortalTarget(),
  );
};
