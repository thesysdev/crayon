// The planner replies with header lines, each followed by a piece's own OpenUI Lang program, so
// the page can place every piece as it streams in. The planner decides what each prompt does:
//
//   === new board                     start a new board beside the others
//   === <kind>@<span> | <label>       add a piece, <span> columns wide (1-4, optional)
//   === replace <id> | <kind>@<span> | <label>   rewrite a piece in place
//   === remove <id>                   delete a piece
//
// Piece ids (p1, p2, ...) are the ones the page sent with the canvas.

export type Op =
  | { type: "add"; kind: string; span?: number; title: string; code: string }
  | { type: "replace"; ref: string; kind: string; span?: number; title: string; code: string }
  | { type: "remove"; ref: string };

const NEW_BOARD = /^===\s*new board\s*$/i;
const REMOVE = /^===\s*remove\s+(p\d+)\s*$/i;
const REPLACE = /^===\s*replace\s+(p\d+)\s*\|\s*([a-z-]+)(?:@([1-4]))?\s*\|\s*(.+?)\s*$/i;
const ADD = /^===\s*([a-z-]+)(?:@([1-4]))?\s*\|\s*(.+?)\s*$/i;

// The Gateway wraps the reply in content markers and a code fence, and may append a second,
// merged copy. Keep the first block, then split it at each header.
export function parseReply(raw: string, done = false): { newBoard: boolean; ops: Op[] } {
  let text = raw;
  const marker = text.indexOf("]]>openui:content");
  if (marker >= 0) text = text.slice(text.indexOf("\n", marker) + 1);
  const end = text.indexOf("]]>openui:");
  if (end >= 0) text = text.slice(0, end);

  let newBoard = false;
  const ops: Op[] = [];
  const lines = text.split("\n");
  // A header still streaming has a partial title; wait for its line to end.
  if (!done && lines.at(-1)?.trim().startsWith("===")) lines.pop();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) continue;
    let match: RegExpExecArray | null;
    if (NEW_BOARD.test(trimmed)) newBoard = true;
    else if ((match = REMOVE.exec(trimmed))) ops.push({ type: "remove", ref: match[1] });
    else if ((match = REPLACE.exec(trimmed)))
      ops.push({
        type: "replace",
        ref: match[1],
        kind: match[2].toLowerCase(),
        span: match[3] ? Number(match[3]) : undefined,
        title: match[4],
        code: "",
      });
    else if ((match = ADD.exec(trimmed)))
      ops.push({
        type: "add",
        kind: match[1].toLowerCase(),
        span: match[2] ? Number(match[2]) : undefined,
        title: match[3],
        code: "",
      });
    else {
      const last = ops.at(-1);
      if (last && last.type !== "remove") last.code += `${line}\n`;
    }
  }
  for (const op of ops) if (op.type !== "remove") op.code = op.code.trim();
  return { newBoard, ops };
}
