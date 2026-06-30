import clsx from "clsx";
import { useEffect, useRef, useState } from "react";
import type { ResizeAriaValues } from "./useDetailedViewResize";

interface ResizableSeparatorProps {
  /** Mouse drag: receives the pointer's absolute clientX. */
  onResize: (clientX: number) => void;
  /** Keyboard resize: receives a relative px delta (±Infinity snaps to min/max). */
  onResizeStep: (deltaPx: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  /** Returns the current size as ARIA percentages, or null if unmeasurable. */
  getAriaValues: () => ResizeAriaValues | null;
  /** id of the panel this separator resizes (for aria-controls). */
  controlsId?: string;
  ariaLabel?: string;
  className?: string;
}

// Keyboard resize step sizes in px (Shift = coarse).
const KEYBOARD_STEP = 16;
const KEYBOARD_STEP_LARGE = 64;

/**
 * A draggable, keyboard-operable vertical separator for resizing panels.
 * Used between chat and detailed-view panels in desktop mode.
 *
 * Implements the WAI-ARIA window-splitter pattern: focusable, `role="separator"`,
 * Left/Right (Shift for larger steps) to resize, Home/End to snap to min/max.
 */
export const ResizableSeparator = ({
  onResize,
  onResizeStep,
  onDragStart,
  onDragEnd,
  getAriaValues,
  controlsId,
  ariaLabel = "Resize panel",
  className,
}: ResizableSeparatorProps) => {
  const isDraggingRef = useRef(false);
  const onResizeRef = useRef(onResize);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  const [aria, setAria] = useState<ResizeAriaValues | null>(null);
  // Refresh the reflected ARIA values from the latest measurement.
  const syncAria = () => setAria(getAriaValues());
  const syncAriaRef = useRef(syncAria);
  syncAriaRef.current = syncAria;

  // Keep callback refs up to date without triggering effect re-runs
  useEffect(() => {
    onResizeRef.current = onResize;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  }, [onResize, onDragStart, onDragEnd]);

  // Populate ARIA values on mount so a focusable separator always exposes
  // aria-valuenow (refreshed on focus/resize thereafter).
  useEffect(() => {
    syncAriaRef.current();
  }, []);

  // Global mouse event handlers for drag behavior.
  // Uses refs instead of dependencies to avoid re-creating listeners.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        e.preventDefault();
        onResizeRef.current(e.clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        onDragEndRef.current();
        // Reset cursor styles
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        // Reflect the dragged-to size for assistive tech.
        syncAriaRef.current();
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []); // Empty deps - handlers use refs to access latest callbacks

  const handleMouseDown = () => {
    isDraggingRef.current = true;
    onDragStartRef.current();
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let delta: number | null = null;
    switch (e.key) {
      case "ArrowLeft":
        delta = -(e.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP);
        break;
      case "ArrowRight":
        delta = e.shiftKey ? KEYBOARD_STEP_LARGE : KEYBOARD_STEP;
        break;
      case "Home":
        delta = -Infinity; // snap to smallest chat panel
        break;
      case "End":
        delta = Infinity; // snap to largest chat panel
        break;
      default:
        return;
    }
    e.preventDefault();
    onResizeStep(delta);
    syncAria();
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      aria-controls={controlsId}
      aria-valuenow={aria?.now}
      aria-valuemin={aria?.min}
      aria-valuemax={aria?.max}
      aria-valuetext={aria ? `${aria.now}%` : undefined}
      tabIndex={0}
      className={clsx("openui-agent-resizable-separator", className)}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
      onFocus={syncAria}
    >
      <div className="openui-agent-resizable-separator__handle" />
    </div>
  );
};
