"use client";

import { ArrowUpToLine, Expand, LayoutDashboard, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { Editor, TLShapeId } from "tldraw";

// The canvas's right-click menu: board actions anywhere, plus piece actions over a piece.
// tldraw's own context menu is hidden with the rest of its UI, so this listens on the canvas.

type Menu = { x: number; y: number; piece?: TLShapeId; confirming?: boolean };

export function CanvasMenu({
  editor,
  onArrange,
  onFit,
  onClear,
}: {
  editor: Editor | null;
  onArrange: () => void;
  onFit: () => void;
  onClear: () => void;
}) {
  const [menu, setMenu] = useState<Menu | null>(null);

  useEffect(() => {
    if (!editor) return;
    const container = editor.getContainer();
    const open = (event: MouseEvent) => {
      event.preventDefault();
      const point = editor.screenToPage({ x: event.clientX, y: event.clientY });
      const shape = editor.getShapeAtPoint(point, { hitInside: true });
      setMenu({
        x: Math.min(event.clientX, window.innerWidth - 220),
        y: Math.min(event.clientY, window.innerHeight - 220),
        piece: shape?.type === "piece" ? shape.id : undefined,
      });
    };
    container.addEventListener("contextmenu", open);
    return () => container.removeEventListener("contextmenu", open);
  }, [editor]);

  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => {
      if (event instanceof KeyboardEvent && event.key !== "Escape") return;
      if (event.target instanceof Element && event.target.closest(".mb-menu")) return;
      setMenu(null);
    };
    window.addEventListener("pointerdown", close, true);
    window.addEventListener("keydown", close);
    window.addEventListener("wheel", close, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", close, true);
      window.removeEventListener("keydown", close);
      window.removeEventListener("wheel", close);
    };
  }, [menu]);

  if (!menu || !editor) return null;
  const hasPieces = editor.getCurrentPageShapes().some((shape) => shape.type === "piece");
  const run = (action: () => void) => () => {
    action();
    setMenu(null);
  };

  return (
    <div className="mb-menu" role="menu" style={{ left: menu.x, top: menu.y }}>
      {menu.piece ? (
        <>
          <button
            type="button"
            role="menuitem"
            onClick={run(() => editor.bringToFront([menu.piece!]))}
          >
            <ArrowUpToLine size={14} /> Bring to front
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={run(() => editor.deleteShapes([menu.piece!]))}
          >
            <X size={14} /> Remove piece
          </button>
          <hr />
        </>
      ) : null}
      <button type="button" role="menuitem" disabled={!hasPieces} onClick={run(onArrange)}>
        <LayoutDashboard size={14} /> Arrange
      </button>
      <button type="button" role="menuitem" disabled={!hasPieces} onClick={run(onFit)}>
        <Expand size={14} /> Zoom to fit
      </button>
      <hr />
      {menu.confirming ? (
        <button type="button" role="menuitem" className="is-danger" onClick={run(onClear)}>
          <Trash2 size={14} /> Click again to clear everything
        </button>
      ) : (
        <button
          type="button"
          role="menuitem"
          className="is-danger"
          disabled={!hasPieces}
          onClick={() => setMenu({ ...menu, confirming: true })}
        >
          <Trash2 size={14} /> Clear board…
        </button>
      )}
    </div>
  );
}
