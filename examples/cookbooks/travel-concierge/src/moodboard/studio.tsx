"use client";

import {
  Callout,
  IconButton,
  TextArea,
  ThemeProvider,
  createTheme,
} from "@openuidev/react-ui";
import {
  Expand,
  Plane,
  ArrowUp,
  Gauge,
  Square,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  createShapeId,
  type Editor,
  type TLEventInfo,
  type TLShapeId,
  type TLShapePartial,
  Tldraw,
} from "tldraw";
import "tldraw/tldraw.css";
import { CanvasMenu } from "./canvas-menu";
import { arrange, defaultLayout, findOverlaps, type Item } from "./arrange";
import { parseReply } from "./protocol";
import { type PieceShape, PieceShapeUtil } from "./piece-shape";
import {
  joinSegments,
  placeQuestion,
  questions,
  readEvents,
  removeQuestions,
} from "./agent/client";
import { QuestionShapeUtil, setAnswerHandler } from "./agent/question-shape";
import {
  FIRST,
  boardKey,
  firstRequest,
  locate,
  saidIn,
  tripConversation,
  trips,
  UNTITLED,
  useTrips,
} from "./trips";
import type { Chip } from "./agent/follow-ups";
import { ChipRow, fetchFollowUps, savedChips, useStarters } from "./follow-up-chips";
import "./moodboard.css";
import "./agent/agent.css";

const shapeUtils = [PieceShapeUtil, QuestionShapeUtil];

// New pieces are created this far down, out of sight, until arrange() places them.
const PARKED = 20_000;

// A plain warm paper background that stays the same at every zoom.
function Paper() {
  return <div className="mb-paper" />;
}

// The canvas alone: hideUi removes tldraw's toolbars and menus, the piece shape hides its
// handles and selection box, and dragging empty canvas pans instead of drawing a brush.
// tldraw's context menu is replaced by the moodboard's own (see canvas-menu.tsx).
const canvasComponents = { Background: Paper, ContextMenu: null };

// Headlines and photo grids span two of a board's four columns.
// A piece's width in board columns: what the planner asked for in its header (=== food@3),
// else a default for pieces the app writes and boards saved before widths existed.
const wide = new Set(["title", "hero", "quote", "places", "food", "itinerary", "stays", "when"]);
const defaultSpan = (kind: string) => (kind === "hotels" ? 4 : wide.has(kind) ? 2 : 1);
const spanOf = (piece: PieceShape) =>
  typeof piece.meta.span === "number" ? piece.meta.span : defaultSpan(piece.props.kind);
const widthOf = (span: number) => span * defaultLayout.column + (span - 1) * defaultLayout.gap;

const pieces = (editor: Editor) =>
  editor.getCurrentPageShapes().filter((shape): shape is PieceShape => shape.type === "piece");

const isPinned = (piece: PieceShape) => piece.meta.pinned === true;

const rects = (editor: Editor) =>
  pieces(editor).map((piece) => ({
    id: piece.id,
    x: piece.x,
    y: piece.y,
    w: piece.props.w,
    h: piece.props.h,
  }));

// Lays out every board with arrange() and moves pieces there: new pieces appear in place,
// pieces already on the canvas glide. Arrange (respectPinned false) also frees dragged pieces.
// With placeOnly, nothing already on the canvas moves; new pieces take the next free spot.
function applyArrange(editor: Editor, { respectPinned = true, placeOnly = false } = {}) {
  const all = pieces(editor);
  const items: Item[] = all.map((piece) => ({
    id: piece.id,
    x: piece.x,
    y: piece.y,
    w: piece.props.w,
    h: piece.props.h,
    board: piece.props.batch,
    order: piece.props.order,
    span: spanOf(piece),
    pinned: isPinned(piece) || (placeOnly && piece.meta.parked !== true),
    parked: piece.meta.parked === true,
  }));
  const placed = arrange(items, { respectPinned });
  const appear: TLShapePartial<PieceShape>[] = [];
  const glide: TLShapePartial<PieceShape>[] = [];
  for (const piece of all) {
    const at = placed.get(piece.id);
    const freed = !respectPinned && isPinned(piece);
    if (!at && !freed) continue;
    const meta = { ...piece.meta, parked: false, pinned: respectPinned && isPinned(piece) };
    if (at && (piece.x !== at.x || piece.y !== at.y || piece.props.w !== at.w)) {
      const update = { id: piece.id, type: "piece" as const, x: at.x, y: at.y, props: { w: at.w } };
      (piece.meta.parked ? appear : glide).push({ ...update, meta });
    } else if (piece.meta.parked || freed) appear.push({ id: piece.id, type: "piece", meta });
  }
  if (appear.length) editor.run(() => editor.updateShapes(appear), { history: "ignore" });
  if (glide.length) {
    editor.run(() => editor.updateShapes(glide.map(({ id, type, meta }) => ({ id, type, meta }))), {
      history: "ignore",
    });
    editor.animateShapes(glide, { animation: { duration: 360 } });
  }
}

// Frames the top of a board, leaving room for the composer below.
function frameBatch(editor: Editor, batch: string) {
  const mine = pieces(editor).filter((piece) => piece.props.batch === batch && !piece.meta.parked);
  if (!mine.length) return;
  const x = Math.min(...mine.map((piece) => piece.x));
  const y = Math.min(...mine.map((piece) => piece.y));
  const width =
    defaultLayout.columns * defaultLayout.column + (defaultLayout.columns - 1) * defaultLayout.gap;
  editor.zoomToBounds(new Box(x - 80, y - 80, width + 160, 1100), { animation: { duration: 600 } });
}

// Shown only if the planner can't suggest starters of its own.
const starters: Chip[] = [
  {
    prompt: "A slow week in Kyoto in autumn, temples, maple leaves, and tea",
    label: "Kyoto in autumn",
    icon: "leaf",
  },
  {
    prompt: "Amalfi coast honeymoon in June, lemons, boats, and long lunches",
    label: "Amalfi honeymoon",
    icon: "heart",
  },
  {
    prompt: "Backpacking Patagonia for two weeks, glaciers and hiking on a budget",
    label: "Patagonia trek",
    icon: "mountain",
  },
  {
    prompt: "Family beach week in Goa with two kids, easy days and seafood",
    label: "Goa family week",
    icon: "palm",
  },
  {
    prompt: "Neon nights in Tokyo, ramen, arcades, and jazz bars",
    label: "Tokyo nights",
    icon: "moon",
  },
];

// Airbnb-like: Rausch pink accent, near-black text, soft radii, and Inter as a Cereal stand-in.
const airbnbTheme = createTheme({
  interactiveAccentDefault: "#FF385C",
  interactiveAccentHover: "#E31C5F",
  interactiveAccentPressed: "#D70466",
  interactiveAccentDisabled: "#FFB3C1",
  textAccentPrimary: "#ffffff",
  fontBody: "var(--mb-font), -apple-system, system-ui, sans-serif",
  fontHeading: "var(--mb-font), -apple-system, system-ui, sans-serif",
  fontLabel: "var(--mb-font), -apple-system, system-ui, sans-serif",
  radiusM: "12px",
  radiusL: "16px",
  radiusXl: "24px",
});

// The trip from a ?trip= link that this page has already planned.
let linkedTrip: string | undefined;

// A different composition nudge each time, so new boards don't settle into one shape.
const styles = [
  "photo-led: open with a full-width PhotoGrid, keep text sparse",
  "type-led: big headings and Numerals, a few photos with captions",
  "compact: 5 or 6 pieces, each doing a lot",
  "expansive: 10 to 12 smaller pieces, many 1-column",
  "story-led: a NumberedList journey with a PhotoWithCaption per highlight",
  "food-and-places: pair each place with what to eat there using Columns",
];

const pace = ["very slow", "relaxed", "balanced", "busy", "packed"];

// One trip's board. The Trips panel mounts a studio per trip and passes itself in as aside.
export default function MoodboardStudio({
  trip = FIRST,
  onBusy,
  aside,
}: {
  trip?: string;
  onBusy?: (busy: boolean) => void;
  aside?: ReactNode;
}) {
  const chat = useMemo(() => tripConversation(trip), [trip]);
  const root = useRef<HTMLDivElement>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [prompt, setPrompt] = useState("");
  const [level, setLevel] = useState([3]);
  const [status, setStatus] = useState<{ busy: boolean; pieces: number; error?: string }>({
    busy: false,
    pieces: 0,
  });
  const [selectedCount, setSelectedCount] = useState(0);
  const [boardSize, setBoardSize] = useState(0);
  const abort = useRef<AbortController | null>(null);
  // The agent's conversation, which the route hands back after each request, and what it's
  // doing right now (searching trivago, say). A question card on the canvas means it's waiting.
  const convo = useRef<unknown[]>([]);
  const [agentStatus, setAgentStatus] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  // Chips above the prompt bar: the planner's suggestions after its last turn, and generated
  // starters on an empty trip (avoiding places the traveller already has trips to).
  const [chips, setChips] = useState<Chip[]>(() => savedChips.load(trip));
  const places = useTrips().trips.flatMap((item) => (item.place ? [item.place] : []));
  const ideas = useStarters(boardSize === 0 && !asking, places);
  const startChips = ideas?.length ? ideas : ideas ? starters : [];
  // The camera follows a new board until the user pans or zooms.
  const following = useRef(false);
  // True while a generation streams; layout then only places new pieces.
  const generating = useRef(false);

  const mount = useCallback(
    (target: Editor) => {
      setEditor(target);
      convo.current = chat.load();
      // A trip saved before it had a name takes one from its first request.
      const request = firstRequest(convo.current);
      if (request) trips.name(trip, request);
      // A question card from an earlier visit can still be answered if its conversation was kept.
      if (!convo.current.length) removeQuestions(target);
      setAsking(questions(target).length > 0);
      // A piece saved mid-stream in an earlier visit is shown as finished.
      const stale = pieces(target).filter((piece) => piece.props.streaming);
      if (stale.length)
        target.updateShapes(
          stale.map((piece) => ({ id: piece.id, type: "piece", props: { streaming: false } })),
        );
      // Arrange once per frame at most, whenever pieces come, go, or change height. Camera moves
      // never change a piece, so they never arrange anything.
      let frame = 0;
      // While a generation streams, new pieces only take free spots and nothing moves; once it
      // ends, the board reflows once. Otherwise pieces reflow only to clear a real overlap.
      const schedule = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          if (generating.current) applyArrange(target, { placeOnly: true });
          else if (findOverlaps(rects(target)).length) applyArrange(target);
        });
      };
      const offs = [
        target.sideEffects.registerAfterCreateHandler("shape", (shape) => {
          if (shape.type === "piece") schedule();
        }),
        target.sideEffects.registerAfterDeleteHandler("shape", (shape) => {
          if (shape.type === "piece") schedule();
        }),
        target.sideEffects.registerAfterChangeHandler("shape", (prev, next) => {
          if (
            next.type === "piece" &&
            (prev as PieceShape).props.h !== (next as PieceShape).props.h
          )
            schedule();
        }),
        // A piece the user drags stays where it's put, until Arrange.
        target.sideEffects.registerBeforeChangeHandler("shape", (prev, next) => {
          if (
            next.type !== "piece" ||
            !target.isIn("select.translating") ||
            (prev.x === next.x && prev.y === next.y)
          )
            return next;
          return { ...next, meta: { ...next.meta, pinned: true } };
        }),
        // Dragging empty canvas pans, like a map, instead of drawing a selection box.
        (() => {
          const onEvent = (info: TLEventInfo) => {
            if (info.type === "wheel" || (info.type === "pinch" && info.name === "pinch_start"))
              following.current = false;
            if (info.type !== "pointer") return;
            // Pieces don't take pointer events, so every pointer targets the canvas; a pointer
            // over no piece is the one that pans.
            const overPiece = () =>
              !!target.getShapeAtPoint(target.screenToPage(info.point), { hitInside: true });
            if (
              info.name === "pointer_down" &&
              info.button === 0 &&
              target.getCurrentToolId() === "select" &&
              !overPiece()
            ) {
              following.current = false;
              target.selectNone();
              target.setCurrentTool("hand.pointing", info);
            } else if (info.name === "pointer_up") {
              if (target.getCurrentToolId() === "hand")
                setTimeout(() => target.setCurrentTool("select"));
              // A piece dropped onto others nudges them out of its way.
              else
                setTimeout(() => {
                  if (!generating.current && findOverlaps(rects(target)).length)
                    applyArrange(target);
                });
            }
          };
          target.on("event", onEvent);
          return () => target.off("event", onEvent);
        })(),
        // The store changes on every pointer move, camera step, and measured height, sometimes in
        // the middle of a React commit. Set state only when a count actually changes, and after
        // the frame, so store churn never cascades into nested React updates.
        (() => {
          let counts = "";
          let pending = 0;
          const sync = () => {
            pending = 0;
            const selected = target
              .getSelectedShapes()
              .filter((shape) => shape.type === "piece").length;
            const size = pieces(target).length;
            if (`${selected}:${size}` === counts) return;
            counts = `${selected}:${size}`;
            setSelectedCount(selected);
            setBoardSize(size);
          };
          const off = target.store.listen(
            () => {
              if (!pending) pending = requestAnimationFrame(sync);
            },
            { scope: "all" },
          );
          return () => {
            cancelAnimationFrame(pending);
            off();
          };
        })(),
      ];
      setBoardSize(pieces(target).length);
      schedule();
      return () => {
        cancelAnimationFrame(frame);
        offs.forEach((off) => off());
      };
    },
    [chat, trip],
  );

  useEffect(() => () => abort.current?.abort(), []);

  // Keeps the Trips panel's row current: how many pieces, and the first photo as its cover.
  useEffect(() => {
    onBusy?.(status.busy);
    if (status.busy) return;
    const timer = setTimeout(() => {
      // The biggest photo on the board, usually its lead image.
      const area = (img: HTMLImageElement) => img.offsetWidth * img.offsetHeight;
      const photo = [...(root.current?.querySelectorAll<HTMLImageElement>(".mb-photo img") ?? [])]
        .sort((a, b) => area(b) - area(a))
        .at(0)?.src;
      trips.update(
        trip,
        boardSize ? { pieces: boardSize, ...(photo && { cover: photo }) } : { pieces: 0 },
      );
      // Once there's a board, name the trip after its place, with the place's own photo.
      if (editor && boardSize)
        locate(
          trip,
          saidIn(convo.current),
          pieces(editor).map((piece) => `${piece.props.kind}: ${piece.props.title}`),
        );
    }, 1200);
    return () => clearTimeout(timer);
  }, [boardSize, status.busy, trip, onBusy, editor]);

  // Answers the question on the canvas, if one is open; otherwise plans or edits the board.
  const submit = (text = prompt) => {
    const open = editor && questions(editor).find((shape) => !shape.props.sent);
    if (open && text.trim())
      return generate(text, { id: open.props.askId, value: { text: text.trim() } });
    return generate(text);
  };

  const generate = async (text = prompt, answer?: { id: string; value: unknown }) => {
    if (!editor || !text.trim() || status.busy) return;
    trips.name(trip, text);

    // The canvas the planner sees: the latest board in full, plus any selected pieces, with
    // short ids it can name to replace or remove a piece.
    const all = pieces(editor);
    const latest = all.reduce(
      (last, piece) => (piece.props.batch > last ? piece.props.batch : last),
      "",
    );
    const selected = editor
      .getSelectedShapes()
      .filter((shape): shape is PieceShape => shape.type === "piece");
    const context = [
      ...all
        .filter((piece) => piece.props.batch === latest)
        .sort((a, b) => a.props.order - b.props.order),
      ...selected.filter((piece) => piece.props.batch !== latest),
    ];
    const refs = new Map(context.map((piece, i) => [`p${i + 1}`, piece]));
    const board = [...refs].map(([id, piece]) => ({
      id,
      kind: piece.props.kind,
      title: piece.props.title,
      code: piece.props.code,
    }));
    const selectedRefs = [...refs]
      .filter(([, piece]) => selected.some((shape) => shape.id === piece.id))
      .map(([id]) => id);

    // A new board gets its own batch, which arrange() places right of the others; added pieces
    // join the latest board after its last piece.
    const fresh = { batch: `b${Date.now()}`, next: 0 };
    const current = latest
      ? { batch: latest, next: Math.max(...context.map((piece) => piece.props.order)) + 1 }
      : fresh;
    let target = current;
    const ids = new Map<number, TLShapeId>();
    let framed = 0;
    let created = 0;

    abort.current = new AbortController();
    setStatus({ busy: true, pieces: 0 });
    setPrompt("");
    generating.current = true;
    let raw = "";
    const segments: string[] = [];
    let asked = false;
    let finished = false;
    setChips([]);
    savedChips.save(trip, []);
    try {
      const response = await fetch("/api/moodboard/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: `${text.trim()}\nPace: ${level[0]}/5 (${pace[level[0] - 1]}).\nStyle hint for a new board (ignore for edits): ${styles[Math.floor(Math.random() * styles.length)]}.`,
          board,
          selected: selectedRefs,
          messages: convo.current,
          answer,
        }),
        signal: abort.current.signal,
      });
      if (!response.ok || !response.body)
        throw new Error(
          ((await response.json().catch(() => ({}))) as { error?: string }).error ??
            "Generation failed.",
        );
      // The answer is on its way; the card leaves the canvas.
      removeQuestions(editor);
      setAsking(false);
      const apply = (done: boolean) => {
        const { newBoard, ops } = parseReply(raw, done);
        if (newBoard || !board.length) target = fresh;
        editor.run(
          () => {
            ops.forEach((op, index) => {
              const streaming = !done && index === ops.length - 1;
              const known = ids.get(index);
              if (op.type === "remove") {
                const piece = refs.get(op.ref);
                if (piece && editor.getShape(piece.id)) editor.deleteShapes([piece.id]);
                return;
              }
              if (known) {
                editor.updateShape({
                  id: known,
                  type: "piece",
                  props: { code: op.code, kind: op.kind, title: op.title, streaming },
                });
                return;
              }
              const replaced = op.type === "replace" ? refs.get(op.ref) : undefined;
              if (replaced && editor.getShape(replaced.id)) {
                ids.set(index, replaced.id);
                editor.updateShape({
                  id: replaced.id,
                  type: "piece",
                  meta: { ...replaced.meta, span: op.span ?? spanOf(replaced) },
                  props: { code: op.code, kind: op.kind, title: op.title, streaming },
                });
                return;
              }
              created++;
              const id = createShapeId();
              ids.set(index, id);
              // Created out of sight; arrange() places it on the next frame.
              editor.createShape<PieceShape>({
                id,
                type: "piece",
                x: 0,
                y: PARKED,
                meta: { parked: true, span: op.span ?? defaultSpan(op.kind) },
                props: {
                  kind: op.kind,
                  title: op.title,
                  code: op.code,
                  streaming,
                  batch: target.batch,
                  order: target.next++,
                  w: widthOf(op.span ?? defaultSpan(op.kind)),
                  h: 120,
                },
              });
            });
          },
          { history: "ignore" },
        );
        // Follow a new board as pieces land, until the user takes the camera.
        if (created > framed && target === fresh) {
          if (!framed) following.current = true;
          framed = created;
          const batch = fresh.batch;
          if (following.current) requestAnimationFrame(() => frameBatch(editor, batch));
        }
        // Only re-render the composer when its numbers change.
        if (shown.busy !== !done || shown.pieces !== ops.length) {
          shown = { busy: !done, pieces: ops.length };
          setStatus(shown);
        }
      };
      let shown: { busy: boolean; pieces: number } = { busy: true, pieces: 0 };
      // Text arrives in many small events, often several at once. Apply it to the canvas at
      // most once per frame, so a burst of chunks doesn't become a burst of React updates
      // ("Maximum update depth exceeded").
      let frame = 0;
      let statusShown = true;
      const applySoon = () => {
        if (!frame) frame = requestAnimationFrame(() => ((frame = 0), apply(false)));
      };
      let failed: string | undefined;
      for await (const event of readEvents(response.body)) {
        if (event.type === "text") {
          segments[event.segment] = (segments[event.segment] ?? "") + event.delta;
          raw = joinSegments(segments);
          if (statusShown) {
            statusShown = false;
            setAgentStatus(null);
          }
          applySoon();
        } else if (event.type === "status") {
          statusShown = true;
          setAgentStatus(event.label);
        } else if (event.type === "ask") {
          asked = true;
          placeQuestion(editor, event.ask);
          setAsking(true);
        } else if (event.type === "state") {
          convo.current = event.messages;
          chat.save(event.messages);
        } else if (event.type === "error") failed = event.message;
      }
      // A reply written as plain text, outside any piece, still lands on the canvas as one.
      const prose = raw.replace(/```[a-z]*\n?/gi, "").trim();
      if (!raw.includes("===") && prose)
        raw = `=== reply | Planner\nroot = Stack([reply], "column")\nreply = Note("", ${JSON.stringify(prose)})`;
      cancelAnimationFrame(frame);
      apply(true);
      if (failed) throw new Error(failed);
      finished = true;
    } catch (error) {
      const aborted = (error as Error).name === "AbortError";
      const streaming = pieces(editor).filter((piece) => piece.props.streaming);
      editor.updateShapes(
        streaming.map((piece) => ({ id: piece.id, type: "piece", props: { streaming: false } })),
      );
      setStatus((current) => ({
        busy: false,
        pieces: current.pieces,
        error: aborted ? undefined : (error as Error).message,
      }));
    } finally {
      // Chips for the next turn: next steps, or likely answers to the question just asked.
      if (finished)
        void fetchFollowUps(convo.current, asked).then((next) => {
          savedChips.save(trip, next);
          setChips(next);
        });
      setAgentStatus(null);
      // The generation is done: reflow the boards once, with one animated move.
      generating.current = false;
      requestAnimationFrame(() => applyArrange(editor));
      if (following.current && !asked) setTimeout(() => frameBatch(editor, fresh.batch), 1500);
      setTimeout(() => (following.current = false), 1600);
    }
  };

  // Answers from question cards on the canvas resume the agent.
  useEffect(() => {
    setAnswerHandler((id, value, summary) => void generate(summary, { id, value }));
  });

  // Fit the board, leaving room on the left for the panel.
  // /design/moodboard?trip=... plans that trip once the canvas is ready, then drops the parameter
  // through the router, so a reload or a remount doesn't plan it again. The short wait lets dev
  // mode's double mount settle, so the board goes to the editor that stays.
  const router = useRouter();
  useEffect(() => {
    if (!editor) return;
    const trip = new URL(window.location.href).searchParams.get("trip")?.trim();
    if (!trip || linkedTrip === trip) return;
    const timer = setTimeout(() => {
      if (editor.isDisposed || linkedTrip === trip) return;
      linkedTrip = trip;
      router.replace("/design/moodboard");
      setPrompt(trip);
      void generate(trip);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const fit = () => {
    const bounds = editor?.getCurrentPageBounds();
    if (!editor || !bounds) return;
    const room = bounds.w * 0.3;
    editor.zoomToBounds(new Box(bounds.x - room, bounds.y, bounds.w + room, bounds.h), {
      animation: { duration: 400 },
    });
  };
  const clear = () => {
    if (!editor) return;
    editor.deleteShapes(pieces(editor).map((piece) => piece.id));
    removeQuestions(editor);
    setAsking(false);
    convo.current = [];
    chat.clear();
    trips.update(trip, {
      name: UNTITLED,
      cover: undefined,
      place: undefined,
      location: undefined,
      photo: undefined,
      pieces: 0,
    });
  };

  return (
    <ThemeProvider mode="light" lightTheme={airbnbTheme}>
      <div className="mb-studio" ref={root}>
        <Tldraw
          hideUi
          shapeUtils={shapeUtils}
          components={canvasComponents}
          persistenceKey={boardKey(trip)}
          onMount={mount}
        />
        {/* Right-click: arrange, zoom to fit, clear, and piece actions. */}
        <CanvasMenu
          editor={editor}
          onArrange={() => editor && applyArrange(editor, { respectPinned: false })}
          onFit={fit}
          onClear={clear}
        />
        {/* A compact composer docked at the bottom center; the canvas fills the window. */}
        <div className="mb-dock">
          {status.busy ? null : boardSize === 0 && !asking ? (
            <ChipRow chips={startChips} selected={prompt} onPick={setPrompt} />
          ) : (
            <ChipRow chips={chips} onPick={(next) => void submit(next)} />
          )}
          {agentStatus ? <p className="mb-agent-status">{agentStatus}</p> : null}
          {status.error ? (
            <Callout variant="danger" title="Couldn't build the board" description={status.error} />
          ) : null}
          <div className={`mb-composer${status.busy ? " is-busy" : ""}`}>
            <span className="mb-composer__logo" aria-hidden="true">
              <Plane size={16} />
            </span>
            <TextArea
              rows={1}
              value={prompt}
              aria-label="Ask the trip planner"
              placeholder={
                asking
                  ? "Answer on the card, or type it here…"
                  : selectedCount
                    ? `Change the ${selectedCount} selected piece${selectedCount > 1 ? "s" : ""}…`
                    : boardSize
                      ? "Change anything, or plan a new trip…"
                      : "Where to?"
              }
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <div className="mb-composer__tools">
              <span className="mb-composer__count" title="Pieces on the canvas">
                {status.busy ? `${status.pieces}…` : boardSize}
              </span>
              <IconButton
                icon={<Gauge size={15} />}
                variant="tertiary"
                shape="circle"
                size="small"
                title={`Trip pace: ${pace[level[0] - 1]} (click to change)`}
                onClick={() => setLevel([(level[0] % 5) + 1])}
              />
              <IconButton
                icon={<Expand size={15} />}
                variant="tertiary"
                shape="circle"
                size="small"
                title="Zoom to fit"
                onClick={fit}
              />
            </div>
            {status.busy ? (
              <IconButton
                icon={<Square size={14} />}
                variant="primary"
                shape="circle"
                size="medium"
                title="Stop"
                onClick={() => abort.current?.abort()}
              />
            ) : (
              <IconButton
                icon={<ArrowUp size={18} />}
                variant="primary"
                shape="circle"
                size="medium"
                title="Ask the planner"
                disabled={!prompt.trim() || !editor}
                onClick={() => void submit()}
              />
            )}
          </div>
        </div>
        <a
          className="mb-credit"
          href="https://commons.wikimedia.org"
          target="_blank"
          rel="noreferrer"
        >
          Photos: Wikipedia &amp; Wikimedia Commons
        </a>
        {aside}
      </div>
    </ThemeProvider>
  );
}
