import { useLayoutEffect, useRef, type PointerEvent } from "react";
import { useAgentInterfaceStore } from "./_shared/store";

/* Keep DEFAULT in step with $sidebar-width in sidebar.scss. */
const DEFAULT_WIDTH = 272;
const MIN_WIDTH = 220;
const MAX_WIDTH = 420;
/* Dragged narrower than this, the sidebar snaps shut; dragged wider from the
   rail, it snaps open at MIN_WIDTH or wider. */
const COLLAPSE_AT = 150;
/* Lands on the default width when released within this many px of it. */
const SNAP_DISTANCE = 14;
const SAVE_DELAY_MS = 300;
const WIDTH_VAR = "--openui-agent-sidebar-width";

const isValidWidth = (width: number | null): width is number =>
  width !== null && width >= MIN_WIDTH && width <= MAX_WIDTH;

const fitWidth = (raw: number) => {
  const width = Math.min(Math.max(raw, MIN_WIDTH), MAX_WIDTH);
  return Math.abs(width - DEFAULT_WIDTH) <= SNAP_DISTANCE ? DEFAULT_WIDTH : width;
};

/**
 * The sidebar's right edge, draggable. It has no look of its own beyond the
 * resize cursor. The width lives in a CSS variable on the sidebar container,
 * written straight to the element so a drag doesn't re-render the tree, and is
 * saved with the other sidebar preferences (the AgentInterface store) once the
 * pointer settles.
 */
export const SidebarResizeEdge = () => {
  const { isSidebarOpen, setIsSidebarOpen, savedWidth, setSavedWidth } = useAgentInterfaceStore(
    (state) => ({
      isSidebarOpen: state.isSidebarOpen,
      setIsSidebarOpen: state.setIsSidebarOpen,
      savedWidth: state.savedSidebarWidth,
      setSavedWidth: state.setSavedSidebarWidth,
    }),
  );
  const edgeRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef(DEFAULT_WIDTH);
  const openRef = useRef(isSidebarOpen);
  openRef.current = isSidebarOpen;
  const dragRef = useRef<{ startX: number; startWidth: number; restoreWidth: number } | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const container = () => edgeRef.current?.parentElement ?? null;

  const applyWidth = (width: number) => {
    widthRef.current = width;
    container()?.style.setProperty(WIDTH_VAR, `${width}px`);
  };

  const scheduleSave = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => setSavedWidth(widthRef.current), SAVE_DELAY_MS);
  };

  // The saved width arrives with the other sidebar preferences, just after
  // hydration and before paint. Land on it without animating from the
  // default: apply it with transitions off, force the style to settle, then
  // let transitions back on. A drag's own save is already applied, so skips.
  useLayoutEffect(() => {
    const el = container();
    if (!el || !isValidWidth(savedWidth) || savedWidth === widthRef.current) return;
    el.classList.add("openui-agent-sidebar-container--resizing");
    widthRef.current = savedWidth;
    el.style.setProperty(WIDTH_VAR, `${savedWidth}px`);
    void el.offsetWidth;
    el.classList.remove("openui-agent-sidebar-container--resizing");
  }, [savedWidth]);

  useLayoutEffect(
    () => () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      container()?.style.removeProperty(WIDTH_VAR);
    },
    [],
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const el = container();
    if (!el) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      startX: event.clientX,
      startWidth: openRef.current ? widthRef.current : el.getBoundingClientRect().width,
      restoreWidth: widthRef.current,
    };
    el.classList.add("openui-agent-sidebar-container--resizing");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const raw = drag.startWidth + event.clientX - drag.startX;

    if (raw < COLLAPSE_AT) {
      // Snapping shut keeps the width it had, so it reopens the same size
      // rather than at whatever the drag passed through on the way.
      applyWidth(drag.restoreWidth);
      if (openRef.current) setIsSidebarOpen(false);
      return;
    }

    if (!openRef.current) setIsSidebarOpen(true);
    applyWidth(fitWidth(raw));
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    container()?.classList.remove("openui-agent-sidebar-container--resizing");
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    scheduleSave();
  };

  return (
    <div
      ref={edgeRef}
      aria-hidden="true"
      className="openui-agent-sidebar-resize-edge"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    />
  );
};
