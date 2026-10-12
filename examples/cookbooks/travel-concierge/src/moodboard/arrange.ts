// Arranges moodboard pieces without the agent: each board is a masonry of fixed-width columns,
// filled shortest column first, and boards sit left to right with a gap between them. Pieces the
// user has dragged ("pinned") stay where they are and the rest flow around them. Pure functions
// of the pieces' sizes and order, so the same pieces always land in the same places.

export type Rect = { x: number; y: number; w: number; h: number };

export type Item = Rect & {
  id: string;
  /** The board (generation) the piece belongs to; boards are ordered by this key. */
  board: string;
  /** The piece's place in its board. */
  order: number;
  /** How many columns the piece spans, 1 to the column count. */
  span: number;
  /** A piece the user placed by hand; it stays put and others flow around it. */
  pinned?: boolean;
  /** A new piece not placed yet; its position says nothing about where its board is. */
  parked?: boolean;
};

export type Placement = { x: number; y: number; w: number };

export type LayoutConfig = { column: number; gap: number; columns: number; boardGap: number };

export const defaultLayout: LayoutConfig = { column: 380, gap: 32, columns: 4, boardGap: 240 };

/** Whether two rectangles overlap, counting `gap` of clearance around each. */
export function intersects(a: Rect, b: Rect, gap = 0) {
  return (
    a.x < b.x + b.w + gap && b.x < a.x + a.w + gap && a.y < b.y + b.h + gap && b.y < a.y + a.h + gap
  );
}

/** Every pair of overlapping rectangles, across all boards. */
export function findOverlaps<T extends Rect & { id: string }>(items: T[], gap = 0) {
  const pairs: [string, string][] = [];
  const sorted = [...items].sort((a, b) => a.x - b.x);
  for (let i = 0; i < sorted.length; i++)
    for (let j = i + 1; j < sorted.length && sorted[j].x < sorted[i].x + sorted[i].w + gap; j++)
      if (intersects(sorted[i], sorted[j], gap)) pairs.push([sorted[i].id, sorted[j].id]);
  return pairs;
}

const widthOf = (span: number, config: LayoutConfig) =>
  span * config.column + (span - 1) * config.gap;

/**
 * Lays out one board at `origin`: each unpinned piece, in order, goes where its span fits
 * highest (leftmost on a tie), below the columns it covers and clear of pinned pieces.
 */
export function masonry(
  items: Item[],
  origin: { x: number; y: number },
  config: LayoutConfig = defaultLayout,
) {
  const placed = new Map<string, Placement>();
  const obstacles: Rect[] = items.filter((item) => item.pinned);
  const bottoms = Array<number>(config.columns).fill(origin.y);
  const pitch = config.column + config.gap;

  for (const item of items.filter((piece) => !piece.pinned).sort((a, b) => a.order - b.order)) {
    const span = Math.max(1, Math.min(config.columns, Math.round(item.span)));
    const w = widthOf(span, config);
    let best: { x: number; y: number; column: number } | undefined;
    for (let column = 0; column + span <= config.columns; column++) {
      const x = origin.x + column * pitch;
      let y = Math.max(...bottoms.slice(column, column + span));
      // Step below any pinned piece in the way until the span is clear.
      for (let blocked = true; blocked;) {
        blocked = false;
        for (const obstacle of obstacles)
          if (intersects({ x, y, w, h: item.h }, obstacle, config.gap)) {
            y = obstacle.y + obstacle.h + config.gap;
            blocked = true;
          }
      }
      if (!best || y < best.y) best = { x, y, column };
    }
    if (!best) continue;
    placed.set(item.id, { x: best.x, y: best.y, w });
    for (let c = best.column; c < best.column + span; c++)
      bottoms[c] = best.y + item.h + config.gap;
  }
  return placed;
}

/**
 * Lays out every board. The first board keeps its top-left corner; each later board starts
 * `boardGap` to the right of the one before, at the same top. With `respectPinned` false,
 * every piece is reflowed, including the ones the user dragged.
 */
export function arrange(
  items: Item[],
  {
    respectPinned = true,
    config = defaultLayout,
  }: { respectPinned?: boolean; config?: LayoutConfig } = {},
) {
  const placed = new Map<string, Placement>();
  const boards = new Map<string, Item[]>();
  for (const item of items) {
    const board = boards.get(item.board) ?? [];
    board.push(respectPinned ? item : { ...item, pinned: false });
    boards.set(item.board, board);
  }
  const keys = [...boards.keys()].sort();
  if (!keys.length) return placed;

  // The first board stays where its placed pieces are; a canvas of only new pieces starts at 0,0.
  const settled = boards.get(keys[0])!.filter((item) => !item.parked);
  const anchor = settled.filter((item) => !item.pinned).length
    ? settled.filter((item) => !item.pinned)
    : settled;
  let x = anchor.length ? Math.min(...anchor.map((item) => item.x)) : 0;
  const top = anchor.length ? Math.min(...anchor.map((item) => item.y)) : 0;

  for (const key of keys) {
    const board = boards.get(key)!;
    const layout = masonry(board, { x, y: top }, config);
    let right = x + widthOf(1, config);
    for (const item of board) {
      const at = layout.get(item.id);
      if (at) placed.set(item.id, at);
      const final = at ?? item;
      right = Math.max(right, final.x + (at ? at.w : item.w));
    }
    x = right + config.boardGap;
  }
  return placed;
}
