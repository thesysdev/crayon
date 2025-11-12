import clsx from "clsx";
import { useEffect, useRef } from "react";

interface ResizableSeparatorProps {
  onResize: (clientX: number) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  className?: string;
}

/**
 * A draggable vertical separator for resizing panels.
 * Used between chat and artifact panels in desktop mode.
 */
export const ResizableSeparator = ({
  onResize,
  onDragStart,
  onDragEnd,
  className,
}: ResizableSeparatorProps) => {
  const isDraggingRef = useRef(false);
  const onResizeRef = useRef(onResize);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef = useRef(onDragEnd);

  // Keep callback refs up to date without triggering effect re-runs
  useEffect(() => {
    onResizeRef.current = onResize;
    onDragStartRef.current = onDragStart;
    onDragEndRef.current = onDragEnd;
  }, [onResize, onDragStart, onDragEnd]);

  // Global mouse event handlers for drag behavior
  // Uses refs instead of dependencies to avoid re-creating listeners
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

  return (
    <div
      className={clsx("crayon-shell-resizable-separator", className)}
      onMouseDown={handleMouseDown}
    >
      <div className="crayon-shell-resizable-separator__handle" />
    </div>
  );
};
