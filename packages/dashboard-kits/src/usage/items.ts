import { random } from "../core/sample-data";
import { detailOf } from "./activity";
import { dayIndex, HISTORY_DAYS, type WorkspaceModel } from "./members";

// The boards and docs of a workspace, and who edited which on which day, so
// collaboration and contribution are counted from the same members and days
// as everything else. Each team owns boards and docs; some are shared across
// teams from the start. On a day a member works on boards or tasks they edit
// a board, on a day they write they edit a doc: mostly their own team's,
// sometimes a shared one, now and then another team's (our model). Members
// also start new boards and docs, which their team owns.
//
//   collaborative item = an item 2+ members edited in the window
//   cross-team item    = an item members of 2+ teams edited in the window

export interface Item {
  kind: "board" | "doc";
  team: string;
  shared: boolean;
  /** Days ago it was created; past the history for items that already existed. */
  bornAgo: number;
  /** The member who created it during the history, if any. */
  creator?: number;
}

export interface ItemModel {
  items: Item[];
  /** One entry per member and item edited that day. */
  edits: { item: Int32Array; member: Int32Array; ago: Int16Array };
}

/** Of a member's edits: their own team's items, a shared item, or another team's. */
const OWN = 0.72;
const SHARED = 0.6;
/** Chance a writing or planning day starts a new doc or board. */
const NEW_DOC = 0.1;
const NEW_BOARD = 0.025;

const cache = new Map<string, ItemModel>();

export function itemModel(w: WorkspaceModel): ItemModel {
  const hit = cache.get(w.id);
  if (hit) return hit;
  const next = random(`items:${w.id}`);
  const items: Item[] = [];
  const before = HISTORY_DAYS + 30;
  for (const team of w.teams) {
    const size = w.members.filter((m) => m.team === team).length;
    for (let k = 0; k < Math.max(2, Math.round(size / 4)); k++)
      items.push({ kind: "board", team, shared: false, bornAgo: before });
    for (let k = 0; k < Math.max(2, Math.round(size / 2.5)); k++)
      items.push({ kind: "doc", team, shared: false, bornAgo: before });
  }
  // Items shared across teams: a project board, a handbook, a weekly review doc.
  for (let k = 0; k < Math.max(2, Math.round(w.members.length / 6)); k++) {
    items.push({
      kind: next() < 0.55 ? "board" : "doc",
      team: w.teams[Math.floor(next() * w.teams.length)]!,
      shared: true,
      bornAgo: before,
    });
  }

  const edits: { item: number; member: number; ago: number }[] = [];
  // Walk the days oldest first so new items exist before anyone edits them.
  for (let ago = HISTORY_DAYS - 1; ago >= 0; ago--) {
    const i = dayIndex(ago);
    w.members.forEach((m, member) => {
      if (!m.active[i]) return;
      const d = detailOf(m);
      const pick = (kind: Item["kind"]) => {
        const alive = (it: Item) => it.kind === kind && it.bornAgo >= ago;
        const roll = next();
        const pool =
          roll < OWN
            ? items.filter((it) => alive(it) && it.team === m.team && !it.shared)
            : next() < SHARED
              ? items.filter((it) => alive(it) && it.shared)
              : items.filter((it) => alive(it) && it.team !== m.team && !it.shared);
        const from = pool.length ? pool : items.filter((it) => alive(it) && it.team === m.team);
        if (!from.length) return;
        // Newer items get more attention: weight by recency rank.
        const sorted = [...from].sort((a, b) => a.bornAgo - b.bornAgo);
        const index = Math.floor(sorted.length * next() ** 1.6);
        edits.push({ item: items.indexOf(sorted[index]!), member, ago });
      };
      if (d.docs[i]) {
        if (next() < NEW_DOC) {
          items.push({ kind: "doc", team: m.team, shared: false, bornAgo: ago, creator: member });
          edits.push({ item: items.length - 1, member, ago });
        } else pick("doc");
      }
      if (d.boards[i] || d.tasks[i]) {
        if (next() < NEW_BOARD) {
          items.push({ kind: "board", team: m.team, shared: false, bornAgo: ago, creator: member });
          edits.push({ item: items.length - 1, member, ago });
        } else {
          pick("board");
          if (next() < 0.3) pick("board");
        }
      }
    });
  }
  const model: ItemModel = {
    items,
    edits: {
      item: Int32Array.from(edits.map((e) => e.item)),
      member: Int32Array.from(edits.map((e) => e.member)),
      ago: Int16Array.from(edits.map((e) => e.ago)),
    },
  };
  cache.set(w.id, model);
  return model;
}

/** Who edited each item in the window: item index → member indexes. */
export function editorsIn(model: ItemModel, days: number, offset = 0): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  const { item, member, ago } = model.edits;
  for (let k = 0; k < item.length; k++) {
    if (ago[k]! < offset || ago[k]! >= offset + days) continue;
    let set = out.get(item[k]!);
    if (!set) out.set(item[k]!, (set = new Set()));
    set.add(member[k]!);
  }
  return out;
}
