"use client";

import {
  createContext,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { arrange, type Item, type LayoutConfig } from "../../moodboard/arrange";
import { PromptForm } from "./home";
import { iconFor } from "./place-icon";
import { type ItineraryItem, type Saveable, useItinerary } from "./itinerary";
import { type AskAnswer, AskPanel, dragType } from "./ask-panel";
import { daysOf } from "./itinerary-spread";
import { Chip } from "./steps";
import { Doodle, Stickers } from "./doodles";
import { SheetOpener } from "./library";
import { Price, readTraveller, travellerLine } from "./money";
import { type Bounds, Camera } from "./board-camera";
import "./board.css";

// The Itinerary tab: a canvas of our own (pan and zoom from board-camera.ts) where the saved
// places become a plan. Items are grouped by their day, each day a masonry of print cards under a
// Timeless heading, days left to right (the moodboard's own arrange(), imported). The prompt bar
// at the bottom reshapes the plan through api/planner/itinerary/agent.

const layout: LayoutConfig = { column: 248, gap: 24, columns: 2, boardGap: 112 };
const HEADING = 96;
/** How far above the first day the board's title sits. */
const TITLE = 190;
const UNPLANNED = "\u0000saved";
/** Saves not yet on a day: the traveller's favourites, waiting to become a plan. */
const FAVOURITES = "Favourites";
/** The "Make a plan" card at the end of Favourites. */
const TILE = "\u0000plan-tile";
const DAY_WIDTH = layout.column * 2 + layout.gap;
const TITLE_WIDTH = layout.column * 3 + layout.gap * 2;

/** What the board's headings can ask of it: "Make a plan" from the Favourites heading. */
const BoardActions = createContext<{ plan?: () => void; busy?: boolean }>({});

/** A heading on the board: a day's name (with what's over it, "Day 1 · Sat 7 Nov"), or the title. */
function Heading({ text, icon, title, x, y, w, h }: { text: string; icon?: string; title?: boolean; x: number; y: number; w: number; h: number }) {
  const [day, ...rest] = text.split(" · ");
  return (
    <div className={`pl-day pl-board__at${title ? " is-title" : ""}`} style={{ transform: `translate(${x}px, ${y}px)`, width: w, height: h }}>
      {rest.length ? <span className="pl-day__over">{rest.join(" · ")}</span> : null}
      <h2 className="pl-day__title">
        {icon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="pl-day__icon" src={`/icons-3d/${icon}-pixar.webp`} alt="" draggable={false} />
        ) : null}
        {day}
      </h2>
    </div>
  );
}

/** "Make a plan", as the last card in Favourites: the schedule icon, the words, and a soft card. */
function PlanTile() {
  const { plan, busy } = useContext(BoardActions);
  if (!plan) return null;
  return (
    <button
      type="button"
      className="pl-plan-tile"
      disabled={busy}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        plan();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons-3d/followup-schedule-pixar.webp" alt="" draggable={false} />
      <span className="pl-plan-tile__title">Make a plan</span>
      <span className="pl-plan-tile__line">Sort your favourites into days</span>
    </button>
  );
}

/** One saved item as a card: a portrait print, the time, the name, where, and for a stay its
 *  price and booking link; any pen note is written on the board just under it. Shared by the
 *  board and /components. */
export function ItineraryCard({ item }: { item: Partial<ItineraryItem> }) {
  const openSheet = useContext(SheetOpener);
  const press = useRef<{ x: number; y: number } | null>(null);
  const stickers = item.stickers?.length ? item.stickers : item.recommended ? [{ doodle: "star", at: "corner" }] : [];
  return (
    <div className="pl-card-wrap">
      {/* A recommended hotel has its pencil reason written above it, and a star on its corner. */}
      {item.recommended && item.note ? <p className="pl-card__note pl-card__note--above">{item.note}</p> : null}
      <Stickers stickers={stickers} at="above" />
      <article
        className={`pl-card${item.kind === "stay" ? " is-stay pl-hotel-open" : ""}`}
        onPointerDown={(e) => (press.current = { x: e.clientX, y: e.clientY })}
        onClick={(e) => {
          // A click (not the end of a drag) on a hotel opens its sheet.
          const moved = press.current && Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 6;
          if (item.kind !== "stay" || moved || !openSheet || !item.name || !item.url) return;
          openSheet({
            subject: `hotel:${item.name}`,
            name: item.name,
            hotel: {
              name: item.name,
              price: item.price ?? "",
              url: item.url,
              photo: item.photo,
              location: item.place,
              rating: item.rating,
              reviews: item.reviews,
              stars: item.stars,
              amenities: item.amenities,
              site: item.site,
              total: item.total,
            },
          });
        }}
      >
        <div className="pl-card__print">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {item.photo ? <img src={item.photo} alt="" draggable={false} /> : null}
        </div>
        <div className="pl-card__text">
          {item.time ? <span className="pl-card__time">{item.time}</span> : null}
          <h3 className="pl-card__name">{item.name}</h3>
          {item.place ? <p className="pl-card__place">{item.place}</p> : null}
          {item.url ? (
            <a className="pl-card__book" href={item.url} target="_blank" rel="noopener noreferrer" onPointerDown={(e) => e.stopPropagation()}>
              {item.price ? (
                <>
                  <Price price={item.price} suffix="a night" />
                  <span className="pl-card__sep"> · </span>
                </>
              ) : null}
              Book →
            </a>
          ) : null}
        </div>
      </article>
      <Stickers stickers={stickers} at="outside" />
      <Stickers stickers={stickers} at="below" />
      {/* The pen note lives on the board, outside the print, like a scribble beside it. */}
      {item.note && !item.recommended ? <LooseNote note={item.note} seed={item.id ?? item.name ?? ""} /> : null}
    </div>
  );
}

/** A pen note under its card, as if written there by hand: a clear gap from the card, a small
 *  pencil arrow curling up to it, and a slightly different offset and tilt on every card. */
function LooseNote({ note, seed }: { note: string; seed: string }) {
  const n = [...seed].reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const indent = 14 + (n % 4) * 14;
  const tilt = -4 + (n % 5) * 1.5;
  return (
    <p className="pl-card__note pl-card__note--loose" style={{ marginLeft: indent, rotate: `${tilt}deg` }}>
      <Doodle name="arrow" size={30} className="pl-card__note-arrow" />
      <span>{note}</span>
    </p>
  );
}

/** Bookings kept at the side of the board, ahead of the days: hotels now, flights later (add a
 *  { kind: "flight", title: "Planned flights" } entry when flights can be saved). */
const SIDE: { kind: NonNullable<ItineraryItem["kind"]>; title: string }[] = [{ kind: "stay", title: "Planned hotels" }];
const sideKey = (kind: string) => `\u0000side:${kind}`;
const sideTitle = (key: string) => SIDE.find((g) => sideKey(g.kind) === key)?.title;

/** A nightly price as a number, for ranking ("€95" → 95, "RM 757" → 757); unknown prices last. */
const cost = (price?: string) => {
  const n = Number(price?.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : Infinity;
};

/** The board's columns: the side bookings first (hotels, cheapest first), then the days in plan
 *  order (as the items run), then saves not yet on a day. */
function groups(items: ItineraryItem[]) {
  const side = SIDE.map((g) => ({
    day: sideKey(g.kind),
    items: items.filter((i) => i.kind === g.kind).sort((x, y) => cost(x.price) - cost(y.price)),
  })).filter((g) => g.items.length);
  const days = new Map<string, ItineraryItem[]>();
  for (const item of items) {
    if (SIDE.some((g) => g.kind === item.kind)) continue;
    const day = item.day?.trim() || UNPLANNED;
    days.set(day, [...(days.get(day) ?? []), item]);
  }
  const keys = [...days.keys()].sort((a, b) => (a === UNPLANNED ? 1 : b === UNPLANNED ? -1 : 0));
  return [...side, ...keys.map((day) => ({ day, items: days.get(day)! }))];
}

/** Where a dragged card would land: its day (group) and its place among that day's cards. */
type Drop = { id: string; group: number; order: number };

/** A card where it sits on the board: its column (group), its place in it, and its box. */
type Placed = { id: string; item?: ItineraryItem; group: number; order: number; x: number; y: number; h: number };
type Plan = { cards: Placed[]; days: { group: number; text: string; x: number }[]; slot?: { x: number; y: number; h: number }; bounds: Bounds };

const boardKey = (group: unknown) => String(group).padStart(3, "0");

/** Lays the days out left to right, each a two-column masonry under its heading. While a card is
 *  dragged (`drop`), the others make room for it where it would land, and `slot` is that spot. */
function lay(items: ItineraryItem[], heights: Record<string, number>, drop?: Drop): Plan {
  const columns = groups(items);
  const cards: Omit<Placed, "x" | "y">[] = [];
  columns.forEach(({ day, items: dayItems }, g) => {
    dayItems.forEach((item, order) => cards.push({ id: item.id, item, group: g, order, h: heights[item.id] ?? 360 }));
    // Favourites end with the Make a plan tile, a card like the home page's.
    if (day === UNPLANNED) cards.push({ id: TILE, group: g, order: Number.MAX_SAFE_INTEGER, h: heights[TILE] ?? 200 });
  });
  const pieces: Item[] = cards.map((c) => ({
    id: c.id,
    x: 0,
    y: 0,
    w: layout.column,
    h: c.h,
    board: boardKey(drop?.id === c.id ? drop.group : c.group),
    order: drop?.id === c.id ? drop.order : c.order,
    span: 1,
    parked: true,
  }));
  // Empty days still hold their place, so a card can be dropped back into one.
  const ghosts: Item[] = columns.map((_, g) => ({ id: `\u0000ghost-${g}`, x: 0, y: 0, w: layout.column, h: 0, board: boardKey(g), order: Infinity, span: 1, parked: true }));
  const placed = arrange([...pieces, ...ghosts], { respectPinned: false, config: layout });
  const lefts = new Map<string, number>();
  for (const piece of [...pieces, ...ghosts]) {
    const at = placed.get(piece.id);
    if (at) lefts.set(piece.board, Math.min(lefts.get(piece.board) ?? Infinity, at.x));
  }
  const laid = cards.map((c) => {
    const at = placed.get(c.id);
    return { ...c, x: at?.x ?? 0, y: (at?.y ?? 0) + HEADING };
  });
  const days = columns.map(({ day }, g) => ({ group: g, text: day === UNPLANNED ? FAVOURITES : sideTitle(day) ?? day, x: lefts.get(boardKey(g)) ?? 0 }));
  const dropped = drop && laid.find((c) => c.id === drop.id);
  const right = Math.max(TITLE_WIDTH, ...laid.map((c) => c.x + layout.column), ...days.map((d) => d.x + DAY_WIDTH));
  const bottom = Math.max(HEADING, ...laid.map((c) => c.y + c.h));
  return {
    cards: laid,
    days,
    slot: dropped ? { x: dropped.x, y: dropped.y, h: dropped.h } : undefined,
    bounds: { x: 0, y: -TITLE, w: right, h: bottom + TITLE },
  };
}

/** Which day a card held at (x, y) is over (by the day columns' left edges), and where among its
 *  cards: after every card of that day that sits above it (or level with it and to its left). */
function dropAt(plan: Plan, id: string, x: number, y: number, h: number): Drop {
  const days = [...plan.days].sort((a, b) => a.x - b.x);
  const cx = x + layout.column / 2;
  const cy = y + Math.min(h, 160) / 2;
  let group = days[0]?.group ?? 0;
  for (const d of days) if (cx >= d.x - layout.boardGap / 2) group = d.group;
  const others = plan.cards.filter((c) => c.id !== id && c.group === group).sort((a, b) => a.order - b.order);
  const before = others.filter((o) => o.y + o.h / 2 < cy || (Math.abs(o.y - y) < 40 && o.x < x)).length;
  const orders = others.map((o) => o.order);
  const order = !orders.length ? 0 : before === 0 ? orders[0] - 0.5 : before >= orders.length ? orders.at(-1)! + 0.5 : (orders[before - 1] + orders[before]) / 2;
  return { id, group, order };
}

/** The items in their new days and order once a dragged card is let go at `done`. */
function rearranged(items: ItineraryItem[], done: Drop) {
  const columns = groups(items);
  const where = new Map<string, { group: number; order: number }>();
  columns.forEach(({ items: list }, group) => list.forEach((i, order) => where.set(i.id, { group, order })));
  where.set(done.id, { group: done.group, order: done.order });
  return columns.flatMap(({ day }, g) =>
    items
      .filter((i) => where.get(i.id)?.group === g)
      .sort((a, b) => where.get(a.id)!.order - where.get(b.id)!.order)
      .map((i) => {
        if (i.id !== done.id) return i;
        // Side bookings keep their own column; a hotel dragged onto a day goes back to it.
        if (sideTitle(day) || SIDE.some((side) => side.kind === i.kind)) return i;
        const onDay = day === UNPLANNED ? undefined : day;
        // A card keeps its time of day within its day; moved to another day, it drops it.
        return onDay === i.day ? i : { ...i, day: onDay, time: undefined };
      }),
  );
}

/** The board itself, for a list of items (the itinerary's, or a fixed sample). */
export function BoardCanvas({
  items,
  place = "Your trip",
  icon = "city",
  onArrange,
  onPlan,
  onDropItem,
  busy,
  pending,
}: {
  items: ItineraryItem[];
  /** A print dragged in from outside (the Explore panel): what it is and the day it landed on. */
  onDropItem?: (item: Saveable, day?: string) => void;
  place?: string;
  icon?: string;
  /** Sorts the favourites into days (the Favourites heading's "Make a plan"). */
  onPlan?: () => void;
  busy?: boolean;
  /** Items the agent is working on right now: they shimmer until its answer lands. */
  pending?: string[];
  /** Called with the items in their new days and order after a card is dragged and dropped. */
  onArrange?: (items: ItineraryItem[]) => void;
}) {
  const latest = useRef({ items, onArrange });
  latest.current = { items, onArrange };
  const viewport = useRef<HTMLDivElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const camera = useRef<Camera | null>(null);
  useLayoutEffect(() => {
    const view = new Camera(viewport.current!, world.current!);
    camera.current = view;
    return () => {
      view.destroy();
      camera.current = null;
    };
  }, []);

  // Each card's height as drawn (it grows as its photo loads), measured in one observer.
  const [heights, setHeights] = useState<Record<string, number>>({});
  const observer = useRef<ResizeObserver | null>(null);
  const measure = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    observer.current ??= new ResizeObserver((entries) =>
      setHeights((now) => {
        let next = now;
        for (const entry of entries) {
          const target = entry.target as HTMLElement;
          if (!target.offsetParent) continue;
          const h = Math.ceil(target.offsetHeight);
          const id = target.dataset.id!;
          if (h > 8 && Math.abs((now[id] ?? 0) - h) > 1) {
            if (next === now) next = { ...now };
            next[id] = h;
          }
        }
        return next;
      }),
    );
    const watching = observer.current;
    watching.observe(element);
    return () => watching.unobserve(element);
  }, []);

  // The card in hand: where it is on the board and where it would land.
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; drop: Drop } | null>(null);
  const plan = useMemo(() => lay(items, heights, drag?.drop), [items, heights, drag?.drop]);
  const planNow = useRef(plan);
  planNow.current = plan;

  // Cards glide to new spots when the plan changes (the agent's answer, a drop) and while a card
  // is dragged; first placement and photo-load reflows don't animate.
  const [gliding, setGliding] = useState(false);
  const [shown, setShown] = useState(items);
  if (shown !== items) {
    setShown(items);
    setGliding(true);
  }
  useEffect(() => {
    if (!gliding) return;
    const t = window.setTimeout(() => setGliding(false), 480);
    return () => window.clearTimeout(t);
  }, [gliding, items]);

  // Frame the plan when it first appears and whenever it gains or loses a day: once now, and
  // again when the photos have loaded and the cards have their real heights.
  const fitted = useRef("");
  const days = groups(items).length;
  useEffect(() => {
    const key = String(days);
    if (!items.length || fitted.current === key) return;
    const first = fitted.current === "";
    fitted.current = key;
    // Extra room above, so the title starts below the floating Explore / Itinerary control.
    const fit = (decay?: number) => {
      const b = planNow.current.bounds;
      camera.current?.fit({ x: b.x, y: b.y - 72, w: b.w, h: b.h + 72 }, { inset: 56, max: 1, decay });
    };
    requestAnimationFrame(() => fit(first ? undefined : 0.12));
    window.setTimeout(() => fit(0.12), 900);
  }, [items.length, days]);

  // A hand on the empty board pans it (one finger or the mouse) or zooms it (two fingers).
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const card = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    if (card && !touches.current.size) return pick(e, card.dataset.card!);
    camera.current?.hold();
    e.currentTarget.setPointerCapture(e.pointerId);
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const points = touches.current;
    const was = points.get(e.pointerId);
    if (!was || !camera.current) return;
    const now = { x: e.clientX, y: e.clientY };
    if (points.size === 1) camera.current.panBy(now.x - was.x, now.y - was.y);
    else if (points.size === 2) {
      const other = [...points].find(([id]) => id !== e.pointerId)![1];
      const before = Math.hypot(was.x - other.x, was.y - other.y);
      const after = Math.hypot(now.x - other.x, now.y - other.y);
      camera.current.panBy((now.x - was.x) / 2, (now.y - was.y) / 2);
      if (before > 0) camera.current.zoomBy(after / before, (now.x + other.x) / 2, (now.y + other.y) / 2);
    }
    points.set(e.pointerId, now);
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    touches.current.delete(e.pointerId);
  };

  // A card picked up follows the pointer; the others make room where it would land. Moves are
  // gathered into one update per animation frame.
  const pick = (e: ReactPointerEvent, id: string) => {
    const card = planNow.current.cards.find((c) => c.id === id);
    if (!card || id === TILE) return;
    e.preventDefault();
    const start = { x: e.clientX, y: e.clientY };
    let held: { id: string; x: number; y: number; drop: Drop } | null = null;
    let frame = 0;
    let pointer = start;
    const follow = () => {
      frame = 0;
      const z = camera.current?.view.z ?? 1;
      const x = card.x + (pointer.x - start.x) / z;
      const y = card.y + (pointer.y - start.y) / z;
      const at = dropAt(planNow.current, id, x, y, card.h);
      const drop = held && held.drop.group === at.group && held.drop.order === at.order ? held.drop : at;
      held = { id, x, y, drop };
      setDrag(held);
    };
    const onMove = (m: PointerEvent) => {
      pointer = { x: m.clientX, y: m.clientY };
      if (!held && Math.hypot(pointer.x - start.x, pointer.y - start.y) < 4) return;
      if (!frame) frame = requestAnimationFrame(follow);
    };
    const end = (m: PointerEvent) => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      // A quick flick can end before its frame: take the last move now.
      if (frame) {
        cancelAnimationFrame(frame);
        follow();
      }
      if (!held) return;
      const done = held.drop;
      setDrag(null);
      setGliding(true);
      // On release, the card takes its new day and place, and the board saves the arranged plan.
      if (m.type === "pointerup") latest.current.onArrange?.(rearranged(latest.current.items, done));
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  };

  // Prints dragged in from the Explore panel land on the day column under the pointer.
  const [over, setOver] = useState(false);
  const accepts = (e: DragEvent) => !!onDropItem && e.dataTransfer.types.includes(dragType);
  const onDrop = (e: DragEvent) => {
    setOver(false);
    if (!accepts(e) || !camera.current) return;
    e.preventDefault();
    e.stopPropagation();
    let item: Saveable;
    try {
      item = JSON.parse(e.dataTransfer.getData(dragType));
    } catch {
      return;
    }
    const point = camera.current.toWorld(e.clientX, e.clientY);
    let group = -1;
    for (const d of [...plan.days].sort((a, b) => a.x - b.x)) if (point.x >= d.x - layout.boardGap / 2) group = d.group;
    const day = group < 0 ? undefined : groups(items)[group]?.day;
    const onDay = day && day !== UNPLANNED && !sideTitle(day) && item.kind !== "stay" ? day : undefined;
    onDropItem?.({ ...item, day: onDay }, onDay);
  };

  // Cards in a fixed order (by id), so a new plan moves them without moving their elements,
  // which would cut their glide short.
  const cards = [...plan.cards].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return (
    <div
      ref={viewport}
      className={`pl-board__canvas${over ? " is-drop-target" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onDragOver={(e) => {
        if (!accepts(e)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        if (!over) setOver(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={onDrop}
    >
      <div className="pl-board__paper" />
      <div ref={world} className={`pl-board__world${gliding || drag ? " is-gliding" : ""}`}>
        <BoardActions.Provider value={{ plan: onPlan, busy }}>
          <Heading text={place} icon={icon} title x={0} y={-TITLE} w={TITLE_WIDTH} h={120} />
          {plan.days.map((d) => (
            <Heading key={d.group} text={d.text} x={d.x} y={0} w={DAY_WIDTH} h={HEADING - 24} />
          ))}
          {plan.slot ? (
            <div className="pl-slot pl-board__at" style={{ transform: `translate(${plan.slot.x}px, ${plan.slot.y}px)`, width: layout.column, height: plan.slot.h }} />
          ) : null}
          {cards.map((c) => {
            const lifted = drag?.id === c.id;
            const at = lifted ? drag : c;
            const shimmer = !!c.item && !!pending?.includes(c.item.id);
            return (
              <div
                key={c.id}
                data-card={c.id}
                className={`pl-board__at pl-board__card${lifted ? " is-lifted" : ""}`}
                style={{ transform: `translate(${at.x}px, ${at.y}px)`, width: layout.column }}
              >
                <div ref={measure} data-id={c.id} className={`pl-card-host${lifted ? " is-lifted" : ""}${shimmer ? " is-pending" : ""}`}>
                  {c.item ? <ItineraryCard item={c.item} /> : <PlanTile />}
                </div>
              </div>
            );
          })}
        </BoardActions.Provider>
      </div>
    </div>
  );
}

const starters = ["Make it a day-by-day plan", "Group by neighbourhood", "Where should we eat nearby?"];

/** Whether a prompt asks to change the plan (the itinerary agent) rather than a question for Explore. */
const reshapes = (prompt: string) => {
  const p = prompt.trim().toLowerCase();
  const verb = /^(please\s+)?(group|arrange|rearrange|move|remove|delete|drop|reorder|sort|swap|shuffle|put|split|merge|clear|organi[sz]e|make|turn|add (a )?(note|sticker)|plan|schedule|spread|space)\b/;
  const question = /\?\s*$|^(what|where|which|how|who|when|why|is|are|should|can|could|any|best|find|suggest|recommend|show|tell|ideas?)\b/;
  return verb.test(p) || (!question.test(p) && /\b(day[- ]by[- ]day|days?|note|sticker|order)\b/.test(p));
};

/** The Itinerary tab: the board, and the prompt bar that edits it. */
export default function ItineraryBoard({
  dates,
  context,
  active,
  place,
}: {
  dates?: string;
  context: string;
  active: boolean;
  /** The trip's place, e.g. "Ubud": the board's title. */
  place?: string;
}) {
  const itinerary = useItinerary();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  // The cards in the request's scope, shimmering while the agent works on them.
  const [pending, setPending] = useState<string[]>([]);
  // The pill shows while the agent works and for a few seconds after, then fades back to the chips.
  const [pill, setPill] = useState(false);
  useEffect(() => {
    if (busy) return setPill(true);
    if (!message) return;
    const t = window.setTimeout(() => setPill(false), 3500);
    return () => window.clearTimeout(t);
  }, [busy, message]);
  const items = itinerary?.items ?? [];
  const ask = useCallback(
    async (prompt: string, scope?: string[]) => {
      if (!itinerary || busy) return;
      setBusy(true);
      setPending(scope ?? itinerary.items.map((i) => i.id));
      setMessage("Rearranging your plan…");
      try {
        const response = await fetch(`/api/planner/itinerary/agent?trip=${encodeURIComponent(itinerary.trip)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, dates, context, days: daysOf(context.split(" / "), dates), items: itinerary.items, traveller: travellerLine(readTraveller()) }),
        });
        // A crash or restart mid-request answers with an empty or HTML body: read it as text first.
        const text = await response.text();
        let body: { items?: ItineraryItem[]; message?: string; error?: string } = {};
        try {
          body = JSON.parse(text);
        } catch {
          body = { error: "That didn't come through. Try again?" };
        }
        if (body.items) itinerary.set(body.items);
        setMessage(body.message || body.error || "");
      } catch {
        setMessage("That didn't work. Try again?");
      } finally {
        setBusy(false);
        setPending([]);
      }
    },
    [itinerary, busy, dates, context],
  );

  // A question goes to the Explore agent, whose answer opens in the side panel; anything that
  // reshapes the plan goes to the itinerary agent. One prompt bar, routed by what's asked.
  const [answer, setAnswer] = useState<AskAnswer | null>(null);
  const [asking, setAsking] = useState(false);
  const explore = useCallback(
    async (prompt: string) => {
      setAnswer({ question: prompt });
      setAsking(true);
      try {
        const response = await fetch("/api/planner/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, place, dates, context, saved: items.map((i) => i.name), traveller: travellerLine(readTraveller()) }),
        });
        const text = await response.text();
        let body: Omit<AskAnswer, "question"> = {};
        try {
          body = JSON.parse(text);
        } catch {
          body = { error: "That didn't come through. Ask again?" };
        }
        setAnswer({ question: prompt, ...body });
      } catch {
        setAnswer({ question: prompt, error: "That didn't come through. Ask again?" });
      } finally {
        setAsking(false);
      }
    },
    [place, dates, context, items],
  );
  const route = (prompt: string) => (reshapes(prompt) ? ask(prompt) : explore(prompt));

  // With dates known, saved places that aren't on a day yet are made into a plan when the tab opens.
  const planned = useRef("");
  useEffect(() => {
    if (!active || !dates || busy || !itinerary) return;
    const loose = items.filter((i) => !i.day && !i.id.startsWith("pending-"));
    const key = `${itinerary.trip}:${items.map((i) => i.id).join(",")}`;
    if (items.length >= 2 && loose.length && planned.current !== key) {
      planned.current = key;
      void ask(`Make these into a day-by-day plan for ${dates}`);
    }
  }, [active, dates, busy, itinerary, items, ask]);

  return (
    <div className="pl-board">
      {items.length ? (
        <BoardCanvas
          items={items}
          place={place}
          icon={iconFor(place)}
          onArrange={itinerary?.save}
          onDropItem={(item) => itinerary?.add(item)}
          onPlan={() =>
            void ask(
              dates ? `Make these favourites into a day-by-day plan for ${dates}` : "Make these favourites into a day-by-day plan (Day 1, Day 2…)",
              items.filter((i) => !i.day && i.kind !== "stay").map((i) => i.id),
            )
          }
          busy={busy}
          pending={pending}
        />
      ) : (
        <div className="pl-board__empty">
          <h1>Your itinerary</h1>
          <p>Tap the heart on any photo, place or stay in Explore, and it lands here, ready to become a plan.</p>
        </div>
      )}
      {answer ? <AskPanel ask={answer} busy={asking} onClose={() => setAnswer(null)} /> : null}
      <div className="pl-board__dock">
        {/* Above the input, in one spot so nothing shifts: the agent's thinking (then its answer)
            in a floating pill, or the starter chips when it's quiet. */}
        <div className="pl-board__above">
          {pill ? (
            <p className={`pl-board__pill${busy ? " is-busy" : ""}`} aria-live="polite">
              <span>{message}</span>
            </p>
          ) : items.length ? (
            <ul className="hj-chips pl-board__starters">
              {starters.map((s) => (
                <li key={s}>
                  <Chip label={s} onClick={() => void route(s)} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="pl-board__bar">
          <PromptForm
            key={String(busy || asking)}
            onSend={items.length && !busy && !asking ? (p) => void route(p) : undefined}
            placeholder="Ask anything, or reshape the plan: group by day…"
            label="Ask about the trip or change the itinerary"
          />
        </div>
      </div>
    </div>
  );
}
