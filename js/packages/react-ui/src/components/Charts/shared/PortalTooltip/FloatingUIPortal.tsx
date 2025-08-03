import { autoUpdate, flip, hide, offset, useFloating } from "@floating-ui/react-dom";
import clsx from "clsx";
import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../../../ThemeProvider";

interface FloatingUIPortalProps {
  children: React.ReactNode;
  className?: string;
  chartId?: string;
  portalContainer?: React.RefObject<HTMLElement | null>;
  position?: Partial<{ x: number; y: number }>;
}

export const FloatingUIPortal: React.FC<FloatingUIPortalProps> = ({
  children,
  className = "",
  chartId,
  portalContainer,
  position,
}) => {
  const { refs, floatingStyles, update } = useFloating({
    placement: "right-start",
    middleware: [offset(20), flip(), hide()],
    whileElementsMounted: autoUpdate,
  });

  const { portalThemeClassName } = useTheme();

  useEffect(() => {
    if (position) {
      update();
    }
  }, [position, update]);

  return (
    <>
      <div
        ref={refs.setReference}
        style={{
          position: "absolute",
          top: position?.y,
          left: position?.x,
        }}
      />
      {createPortal(
        <div
          ref={refs.setFloating}
          className={clsx("crayon-portal-tooltip", portalThemeClassName, className)}
          data-chart={chartId}
          style={{
            ...floatingStyles,
          }}
        >
          {children}
        </div>,
        portalContainer?.current || document.body,
      )}
    </>
  );
};
