import type { Placement } from "@floating-ui/react-dom";
import { computePosition, flip, offset, shift } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../ThemeProvider";

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
  const mousePositionRef = useRef({ x: Number.MAX_SAFE_INTEGER, y: Number.MAX_SAFE_INTEGER });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const { portalThemeClassName } = useTheme();

  // Memoize the virtual element to avoid recreating it on every render
  // this virtual element basically shares the same position as the mouse position
  // and it is used to position the tooltip
  const virtualElement = useMemo<VirtualElement>(
    () => ({
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
    }),
    [],
  );

  // Function to get the portal target element
  // also memoize it to avoid recreating it on every render
  const getPortalTarget = useCallback((): HTMLElement => {
    if (!portalContainer || !portalContainer.current) {
      return document.body;
    }
    return portalContainer.current;
  }, [portalContainer]);

  // Memoize the updatePosition function to avoid recreating it
  const updatePosition = useCallback(async () => {
    if (
      !virtualElement ||
      !tooltipRef.current ||
      virtualElement.getBoundingClientRect().x === Number.MAX_SAFE_INTEGER ||
      virtualElement.getBoundingClientRect().y === Number.MAX_SAFE_INTEGER
    ) {
      return;
    }

    // https://floating-ui.com/docs/computePosition
    // not a synchronous function, it returns a promise. so we need to await it.
    const { x, y } = await computePosition(virtualElement, tooltipRef.current, {
      placement,
      middleware: [offset(offsetDistance), flip(), shift({ padding: 8 })],
    });

    if (x === 0 && y === 0) {
      return;
    }

    setPosition({ x, y });
    setIsPositioned(true);
  }, [virtualElement, placement, offsetDistance]);

  // Memoize the mouse move handler
  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      mousePositionRef.current = {
        x: event.clientX,
        y: event.clientY,
      };
      updatePosition();
    },
    [updatePosition],
  );

  useEffect(() => {
    if (!active) {
      setIsPositioned(false);
      return;
    }

    document.addEventListener("mousemove", handleMouseMove);
    updatePosition();

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      setIsPositioned(false);
    };
  }, [active, handleMouseMove, updatePosition]);

  if (!active) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      className={clsx("crayon-portal-tooltip", portalThemeClassName, className)}
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
