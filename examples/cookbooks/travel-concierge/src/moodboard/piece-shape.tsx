"use client";

import { Renderer } from "@openuidev/react-lang";
import { useLayoutEffect, useRef, useState } from "react";
import {
  BaseBoxShapeUtil,
  HTMLContainer,
  type RecordProps,
  T,
  type TLBaseShape,
  useEditor,
  useValue,
} from "tldraw";
import { moodboardLibrary } from "./library";

export type PieceProps = {
  w: number;
  h: number;
  kind: string;
  title: string;
  /** The piece's OpenUI Lang program. */
  code: string;
  streaming: boolean;
  /** The generation that made the piece, and its place in that generation. */
  batch: string;
  order: number;
};

declare module "tldraw" {
  interface TLGlobalShapePropsMap {
    piece: PieceProps;
  }
}

export type PieceShape = TLBaseShape<"piece", PieceProps>;

// One moodboard piece on the canvas: a card that renders the model's OpenUI Lang with the
// moodboard library. Its height follows its content; double-click a piece to interact with it.
export class PieceShapeUtil extends BaseBoxShapeUtil<PieceShape> {
  static override type = "piece" as const;
  static override props: RecordProps<PieceShape> = {
    w: T.number,
    h: T.number,
    kind: T.string,
    title: T.string,
    code: T.string,
    streaming: T.boolean,
    batch: T.string,
    order: T.number,
  };

  getDefaultProps(): PieceProps {
    return {
      w: 380,
      h: 120,
      kind: "notes",
      title: "",
      code: "",
      streaming: false,
      batch: "",
      order: 0,
    };
  }

  override canEdit() {
    return true;
  }

  override canScroll() {
    return true;
  }

  // A bare canvas: pieces move but don't resize, and show no handles or selection chrome.
  override canResize() {
    return false;
  }

  override hideResizeHandles() {
    return true;
  }

  override hideRotateHandle() {
    return true;
  }

  override hideSelectionBoundsBg() {
    return true;
  }

  override hideSelectionBoundsFg() {
    return true;
  }

  component(shape: PieceShape) {
    return <PieceView shape={shape} />;
  }

  // No blue outline on hover or selection; the card's own shadow shows its state.
  getIndicatorPath() {
    return undefined;
  }
}

// Pieces show their header label as one plain heading; "-" (or a title or quote piece) has none.
const unlabelled = new Set(["title", "quote"]);

function PieceView({ shape }: { shape: PieceShape }) {
  const editor = useEditor();
  const interactive = useValue("editing", () => editor.getEditingShapeId() === shape.id, [
    editor,
    shape.id,
  ]);
  const hovered = useValue("hovered", () => editor.getHoveredShapeId() === shape.id, [
    editor,
    shape.id,
  ]);
  // Lift the piece while it's dragged, and fade in pieces that arrive while streaming.
  const lifted = useValue(
    "lifted",
    () => editor.isIn("select.translating") && editor.getSelectedShapeIds().includes(shape.id),
    [editor, shape.id],
  );
  const [arriving] = useState(shape.props.streaming);
  const content = useRef<HTMLDivElement>(null);

  // Fit the shape's height to its content as the program streams and images load.
  useLayoutEffect(() => {
    const element = content.current;
    if (!element) return;
    // A measurement that keeps flipping (content that re-wraps at one height and not the
    // other) would update the shape forever. Allow a burst of updates, then pause and measure
    // again a second later, so the height still settles on the content's real size.
    const applied: number[] = [];
    let retry = 0;
    const fit = () => {
      // offsetHeight ignores the camera's zoom. A piece the canvas has culled off screen
      // measures 0, which says nothing about its content, so it keeps its height.
      if (!element.offsetParent || element.offsetHeight < 8) return;
      const h = Math.ceil(element.offsetHeight);
      const current = editor.getShape<PieceShape>(shape.id);
      if (!current || Math.abs(current.props.h - h) < 2) return;
      const now = performance.now();
      while (applied.length && now - applied[0] > 1000) applied.shift();
      if (applied.length >= 8) {
        clearTimeout(retry);
        retry = window.setTimeout(fit, 1000);
        return;
      }
      applied.push(now);
      editor.run(() => editor.updateShape({ id: shape.id, type: "piece", props: { h } }), {
        history: "ignore",
      });
    };
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    return () => {
      clearTimeout(retry);
      observer.disconnect();
    };
  }, [editor, shape.id]);

  return (
    <HTMLContainer
      className="mb-piece-container"
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: interactive ? "all" : "none",
      }}
    >
      <div
        ref={content}
        className={`mb-piece mb-piece--${shape.props.kind}${interactive ? " is-interactive" : ""}${hovered ? " is-hovered" : ""}${lifted ? " is-lifted" : ""}${arriving ? " is-arriving" : ""}`}
        onPointerDown={interactive ? (event) => event.stopPropagation() : undefined}
      >
        {unlabelled.has(shape.props.kind) ||
        !shape.props.title ||
        shape.props.title === "-" ? null : (
          <h2 className="mb-piece__label">{shape.props.title}</h2>
        )}
        {shape.props.streaming ? <span className="mb-piece__live" /> : null}
        <Renderer
          response={shape.props.code}
          library={moodboardLibrary}
          isStreaming={shape.props.streaming}
        />
      </div>
    </HTMLContainer>
  );
}
