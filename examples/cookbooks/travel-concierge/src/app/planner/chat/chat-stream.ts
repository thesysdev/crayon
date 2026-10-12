// What a chat reply shows while it streams (ChatAnswer in chat.tsx). The program arrives one
// statement per line, the root first (root = Chat([h, p, places, f], "Kyoto"), then
// h = Headline(…) …). Blocks are shown in order as soon as they're whole: their line has ended and
// every name they use is defined by a finished line. Type writes in as it arrives: a Headline,
// Pull, Heading or Text still being written is shown with what it has so far. Pieces with photos
// hold their space with the usual shimmer until the photos load, so nothing jumps. Nothing can be
// tapped until the reply is finished.

const WORDS = /\b[a-z_][\w]*\b/g;
const KEYWORDS = new Set(["true", "false", "null", "root"]);
/** A type block whose one string is still being written: name = Text("words so far */
const WRITING = /^\s*([a-zA-Z_]\w*)\s*=\s*(Headline|Pull|Heading|Text)\(\s*"((?:[^"\\]|\\.)*)\\?$/;

export function wholeBlocks(program: string): { program: string; shown: number } {
  const lines = program.split("\n");
  const finished = lines.slice(0, -1); // the last line may still be arriving
  const rootLine = finished.find((l) => /^\s*root\s*=/.test(l));
  if (!rootLine) return { program: "", shown: 0 };
  const ids = (rootLine.match(/Chat\(\s*\[(.*?)\]/)?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const place = rootLine.match(/\]\s*,\s*("(?:[^"\\]|\\.)*")/)?.[1];
  const defs = new Map<string, string>();
  for (const line of finished) {
    const m = line.match(/^\s*([a-zA-Z_]\w*)\s*=\s*(.+)$/);
    if (m && m[1] !== "root") defs.set(m[1], m[2]);
  }
  const memo = new Map<string, boolean>();
  const whole = (id: string, seen = new Set<string>()): boolean => {
    if (memo.has(id)) return memo.get(id)!;
    const rhs = defs.get(id);
    if (!rhs || seen.has(id)) return false;
    seen.add(id);
    // Names outside string literals are references to other statements.
    const bare = rhs.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    const refs = [...bare.matchAll(WORDS)].map((m) => m[0]).filter((w) => !KEYWORDS.has(w) && !/^[A-Z]/.test(w));
    const ok = refs.every((r) => whole(r, seen));
    memo.set(id, ok);
    return ok;
  };
  const ready: string[] = [];
  const body = finished.filter((l) => !/^\s*root\s*=/.test(l));
  for (const id of ids) {
    if (whole(id)) {
      ready.push(id);
      continue;
    }
    // The next block is a line of type still arriving: close its string and show it so far.
    const writing = lines.at(-1)?.match(WRITING);
    if (writing && writing[1] === id && writing[3].trim()) {
      ready.push(id);
      body.push(`${id} = ${writing[2]}("${writing[3].replace(/\\$/, "")}")`);
    }
    break;
  }
  if (!ready.length) return { program: "", shown: 0 };
  return { program: [`root = Chat([${ready.join(", ")}]${place ? `, ${place}` : ""})`, ...body].join("\n"), shown: ready.length };
}
