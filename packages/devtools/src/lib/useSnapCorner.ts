import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  clampDrag,
  cornerPoint,
  cornerStyle,
  DRAG_THRESHOLD,
  nearestCorner,
  SNAP_DURATION_MS,
  SNAP_EASING,
  type DevtoolsPosition,
} from "./position";

type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  grabX: number;
  grabY: number;
  originLeft: number;
  originTop: number;
  dragged: boolean;
};

type Drag = { left: number; top: number; snapping: boolean };

function viewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface UseSnapCornerOptions {
  position: DevtoolsPosition;
  onSnap: (position: DevtoolsPosition) => void;
  onActivate: () => void;
}

interface UseSnapCornerResult {
  wrapStyle: CSSProperties;
  dragging: boolean;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onClick: (event: MouseEvent<HTMLElement>) => void;
}

/**
 * Next.js-style corner snap for the floating toggle: drag past a small
 * threshold, follow the pointer, then ease into the nearest quadrant.
 * A press that never crosses the threshold is a click (`onActivate`).
 */
export function useSnapCorner({
  position,
  onSnap,
  onActivate,
}: UseSnapCornerOptions): UseSnapCornerResult {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const gesture = useRef<Gesture | null>(null);
  const skipClick = useRef(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onSnapRef = useRef(onSnap);
  onSnapRef.current = onSnap;
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  useEffect(
    () => () => {
      if (snapTimer.current) clearTimeout(snapTimer.current);
    },
    [],
  );

  const wrapStyle: CSSProperties = drag
    ? {
        left: drag.left,
        top: drag.top,
        right: "auto",
        bottom: "auto",
        cursor: drag.snapping ? "grab" : "grabbing",
        transition: drag.snapping
          ? `left ${SNAP_DURATION_MS}ms ${SNAP_EASING}, top ${SNAP_DURATION_MS}ms ${SNAP_EASING}`
          : "none",
        willChange: drag.snapping ? "left, top" : undefined,
      }
    : { ...cornerStyle(position), cursor: "grab" };

  const clearSnapTimer = () => {
    if (!snapTimer.current) return;
    clearTimeout(snapTimer.current);
    snapTimer.current = null;
  };

  const settle = useCallback(() => {
    dragRef.current = null;
    setDrag(null);
    snapTimer.current = null;
  }, []);

  const glideTo = useCallback(
    (corner: DevtoolsPosition) => {
      if (prefersReducedMotion()) {
        settle();
        return;
      }
      const next = { ...cornerPoint(corner, viewport()), snapping: true };
      dragRef.current = next;
      setDrag(next);
      clearSnapTimer();
      snapTimer.current = setTimeout(settle, SNAP_DURATION_MS);
    },
    [settle],
  );

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    clearSnapTimer();
    const rect = event.currentTarget.getBoundingClientRect();
    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      grabX: event.clientX - rect.left,
      grabY: event.clientY - rect.top,
      originLeft: rect.left,
      originTop: rect.top,
      dragged: false,
    };
    skipClick.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    const dx = event.clientX - g.startX;
    const dy = event.clientY - g.startY;
    if (!g.dragged && dx * dx + dy * dy < DRAG_THRESHOLD * DRAG_THRESHOLD) return;
    g.dragged = true;
    skipClick.current = true;
    const next = {
      ...clampDrag(event.clientX - g.grabX, event.clientY - g.grabY, viewport()),
      snapping: false,
    };
    dragRef.current = next;
    setDrag(next);
  }, []);

  const finish = useCallback(
    (event: PointerEvent<HTMLElement>, commit: boolean) => {
      const g = gesture.current;
      if (!g || event.pointerId !== g.pointerId) return;
      gesture.current = null;
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      if (!g.dragged) {
        settle();
        return;
      }
      const point = dragRef.current ?? { left: g.originLeft, top: g.originTop };
      const corner = commit
        ? nearestCorner(point.left, point.top, viewport())
        : position;
      if (commit) onSnapRef.current(corner);
      glideTo(corner);
    },
    [glideTo, position, settle],
  );

  const onPointerUp = useCallback(
    (event: PointerEvent<HTMLElement>) => finish(event, true),
    [finish],
  );

  const onPointerCancel = useCallback(
    (event: PointerEvent<HTMLElement>) => finish(event, false),
    [finish],
  );

  const onClick = useCallback((event: MouseEvent<HTMLElement>) => {
    if (skipClick.current) {
      skipClick.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onActivateRef.current();
  }, []);

  return {
    wrapStyle,
    dragging: drag !== null && !drag.snapping,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
  };
}
