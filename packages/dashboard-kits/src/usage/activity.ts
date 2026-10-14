import { random } from "../core/sample-data";
import { dayIndex, HISTORY_DAYS, type Member } from "./members";

/**
 * What each member did on each active day: which parts of Relay they used
 * and what they created. A member's habits follow their team (our model).
 */
export interface Detail {
  boards: Uint8Array;
  tasks: Uint8Array;
  docs: Uint8Array;
  comments: Uint8Array;
  created: Uint8Array;
  completed: Uint8Array;
}
const FEATURE_USE: Record<string, [boards: number, tasks: number, docs: number, comments: number]> =
  {
    default: [0.7, 0.75, 0.4, 0.5],
    "Clinical operations": [0.55, 0.85, 0.25, 0.45],
    "Revenue cycle": [0.75, 0.8, 0.5, 0.55],
    IT: [0.8, 0.8, 0.6, 0.6],
    Research: [0.6, 0.7, 0.7, 0.55],
    "Data science": [0.65, 0.6, 0.75, 0.5],
    Design: [0.85, 0.6, 0.45, 0.7],
  };
const detailCache = new Map<string, Detail>();
export function detailOf(m: Member): Detail {
  const hit = detailCache.get(m.id);
  if (hit) return hit;
  const next = random(`detail:${m.id}`);
  const rates = FEATURE_USE[m.team] ?? FEATURE_USE.default!;
  // Whether this member uses each part of Relay at all, then how often.
  const uses = rates.map((r) => next() < r);
  const use = uses.map((u) => (u ? 0.5 + next() * 0.4 : 0));
  const d: Detail = {
    boards: new Uint8Array(HISTORY_DAYS),
    tasks: new Uint8Array(HISTORY_DAYS),
    docs: new Uint8Array(HISTORY_DAYS),
    comments: new Uint8Array(HISTORY_DAYS),
    created: new Uint8Array(HISTORY_DAYS),
    completed: new Uint8Array(HISTORY_DAYS),
  };
  for (let i = 0; i < HISTORY_DAYS; i++) {
    if (!m.active[i]) continue;
    d.boards[i] = next() < use[0] ? 1 : 0;
    d.tasks[i] = next() < use[1] ? 1 : 0;
    d.docs[i] = next() < use[2] ? 1 : 0;
    d.comments[i] = next() < use[3] ? 1 + Math.floor(next() * 3) : 0;
    d.created[i] = (d.tasks[i] && next() < 0.6 ? 1 : 0) + (d.docs[i] && next() < 0.25 ? 1 : 0);
    d.completed[i] = d.tasks[i] && next() < 0.55 ? 1 + Math.floor(next() * 2) : 0;
  }
  detailCache.set(m.id, d);
  return d;
}

export const countIn = (values: Uint8Array, days: number, offset = 0) => {
  let total = 0;
  for (let ago = offset; ago < offset + days && ago < HISTORY_DAYS; ago++) {
    total += values[dayIndex(ago)]!;
  }
  return total;
};
