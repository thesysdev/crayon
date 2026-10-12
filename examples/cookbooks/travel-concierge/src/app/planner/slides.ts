// Slide by slide: while an entry streams, the journal is shown only the spreads that are whole.
// The program arrives as one statement per line (root = Journal([a, b, …]), then a = Bleed(…),
// b = Trio(…, [d1, d2, d3]) …). A spread counts as whole once its line has ended and every name it
// uses is defined by a finished line too. Spreads are released in order, so a later spread never
// shows before an earlier one; the root is rewritten to list only those.

const WORDS = /\b[a-z_][\w]*\b/g;
const KEYWORDS = new Set(["true", "false", "null", "root"]);

export function wholeSlides(program: string, streaming: boolean): { program: string; whole: number; total: number } {
  if (!streaming) {
    const total = program.match(/^\s*root\s*=\s*Journal\(\s*\[(.*?)\]/m)?.[1].split(",").filter((s) => s.trim()).length ?? 0;
    return { program, whole: total, total };
  }
  const lines = program.split("\n");
  const finished = lines.slice(0, -1); // the last line may still be arriving
  const rootLine = finished.find((l) => /^\s*root\s*=/.test(l));
  if (!rootLine) return { program: "", whole: 0, total: 0 };
  const ids = (rootLine.match(/Journal\(\s*\[(.*?)\]/)?.[1] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
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
  for (const id of ids) {
    if (!whole(id)) break;
    ready.push(id);
  }
  if (!ready.length) return { program: "", whole: 0, total: ids.length };
  const body = finished.filter((l) => !/^\s*root\s*=/.test(l));
  return { program: [`root = Journal([${ready.join(", ")}])`, ...body].join("\n"), whole: ready.length, total: ids.length };
}
