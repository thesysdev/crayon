import { Box, createShapeId, type Editor } from "tldraw";
import type { PieceShape } from "../piece-shape";
import type { QuestionShape } from "./question-shape";
import { questionWidth } from "./question-shape";
import type { AgentEvent, Ask } from "./questions";

// The page's side of the agent route: reading its events, joining the planner's text, keeping
// the conversation between requests, and placing questions on the canvas.

// Reads the route's response, one JSON event per line.
export async function* readEvents(body: ReadableStream<Uint8Array<ArrayBuffer>>) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) yield JSON.parse(line) as AgentEvent;
  }
  if (buffer.trim()) yield JSON.parse(buffer) as AgentEvent;
}

// Each completion is one segment. The Gateway can wrap a completion in content markers and add
// a second, merged copy, so keep each segment's first block, then join them for parseReply().
export function joinSegments(segments: string[]) {
  return segments
    .map((text = "") => {
      const marker = text.indexOf("]]>openui:content");
      if (marker >= 0) text = text.slice(text.indexOf("\n", marker) + 1);
      const end = text.indexOf("]]>openui:");
      return end >= 0 ? text.slice(0, end) : text;
    })
    .join("\n");
}

// The conversation the route hands back after every request, kept for this browser so a
// question can still be answered after a reload.
// Versioned: a conversation saved under the old board format would teach the planner to keep
// writing it.
const KEY = "openui-moodboard-agent-v2";
export const conversation = {
  load(): unknown[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  },
  save(messages: unknown[]) {
    try {
      localStorage.setItem(KEY, JSON.stringify(messages));
    } catch {
      // Storage is full or blocked; the conversation lasts until the page reloads.
    }
  },
  clear() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  },
};

export const questions = (editor: Editor) =>
  editor
    .getCurrentPageShapes()
    .filter((shape): shape is QuestionShape => shape.type === "question");

// Places a question card where the traveller is looking and brings it into view at full size.
// A pick-on-the-board question sits beside the board instead, so it covers none of the pieces.
export function placeQuestion(editor: Editor, ask: Ask) {
  editor.deleteShapes(questions(editor).map((shape) => shape.id));
  const w = questionWidth(ask.question);
  const viewport = editor.getViewportPageBounds();
  // The latest board: the pieces of the newest batch.
  const all = editor
    .getCurrentPageShapes()
    .filter((shape): shape is PieceShape => shape.type === "piece");
  const latest = all.reduce(
    (last, piece) => (piece.props.batch > last ? piece.props.batch : last),
    "",
  );
  const board = all
    .filter((piece) => piece.props.batch === latest)
    .map((piece) => editor.getShapePageBounds(piece))
    .filter((bounds): bounds is Box => !!bounds);
  const boardBounds = board.length ? Box.Common(board) : null;
  const beside = ask.question.type === "canvas" && boardBounds;
  const x = beside ? boardBounds.minX - w - 96 : viewport.center.x - w / 2;
  const y = beside ? boardBounds.minY : viewport.center.y - 320;
  const id = createShapeId();
  editor.run(
    () =>
      editor.createShape<QuestionShape>({
        id,
        type: "question",
        x,
        y,
        props: { w, h: 420, askId: ask.id, question: JSON.stringify(ask.question), sent: false },
      }),
    { history: "ignore" },
  );
  const frame = beside
    ? Box.Common([new Box(x, y, w, 520), boardBounds])
    : new Box(x - 60, y - 60, w + 120, 900);
  editor.zoomToBounds(frame, {
    targetZoom: beside ? undefined : 1,
    animation: { duration: 500 },
  });
  return id;
}

export const removeQuestions = (editor: Editor) =>
  editor.run(() => editor.deleteShapes(questions(editor).map((shape) => shape.id)), {
    history: "ignore",
  });
