import {
  useCallback,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
} from "react";
import {
  clampDrag,
  cornerStyle,
  DRAG_THRESHOLD,
  nearestCorner,
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

function viewport(): { width: number; height: number } {
  return { width: window.innerWidth, height: window.innerHeight };
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
 * threshold, follow the pointer, then land on the nearest quadrant.
 * A press that never crosses the threshold is a click (`onActivate`).
 */
export function useSnapCorner({
  position,
  onSnap,
  onActivate,
}: UseSnapCornerOptions): UseSnapCornerResult {
  const [drag, setDrag] = useState<{ left: number; top: number } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const gesture = useRef<Gesture | null>(null);
  const skipClick = useRef(false);
  const onSnapRef = useRef(onSnap);
  onSnapRef.current = onSnap;
  const onActivateRef = useRef(onActivate);
  onActivateRef.current = onActivate;

  const wrapStyle: CSSProperties = drag
    ? {
        left: drag.left,
        top: drag.top,
        right: "auto",
        bottom: "auto",
        cursor: "grabbing",
        transition: "none",
      }
    : { ...cornerStyle(position), cursor: "grab" };

  const onPointerDown = useCallback((event: PointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
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
    const next = clampDrag(event.clientX - g.grabX, event.clientY - g.grabY, viewport());
    dragRef.current = next;
    setDrag(next);
  }, []);

  const finish = useCallback((event: PointerEvent<HTMLElement>, commit: boolean) => {
    const g = gesture.current;
    if (!g || event.pointerId !== g.pointerId) return;
    gesture.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    if (commit && g.dragged) {
      const point = dragRef.current ?? { left: g.originLeft, top: g.originTop };
      onSnapRef.current(nearestCorner(point.left, point.top, viewport()));
    }
    dragRef.current = null;
    setDrag(null);
  }, []);

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
    dragging: drag !== null,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onClick,
  };
}
