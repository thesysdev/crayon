import OpenAI from "openai";
import { moodboardPrompt } from "../../../lib/moodboard-prompt";

export const runtime = "nodejs";

type Piece = { id: string; kind: string; title: string; code: string };

// Streams a moodboard as plain text: a header line per piece, then the piece's OpenUI Lang.
// The page splits the text into pieces and places each one on the canvas as it arrives.
export async function POST(request: Request) {
  const { prompt, board, selected } = (await request.json()) as {
    prompt?: string;
    board?: Piece[];
    selected?: string[];
  };
  if (!prompt?.trim()) return Response.json({ error: "Describe the mood." }, { status: 400 });
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) throw new Error("Set THESYS_API_KEY in .env.local, then restart.");

  const gateway = new OpenAI({ apiKey, baseURL: "https://api.thesys.dev/v1/embed" });
  // The planner sees the canvas with each piece's id, so it can decide whether to start a new
  // board, add pieces, or replace or remove ones by id.
  const canvas = board?.length
    ? `Canvas (current board):\n\n${board
        .map((piece) => `=== ${piece.id} | ${piece.kind} | ${piece.title}\n${piece.code}`)
        .join("\n\n")}\n\nSelected: ${selected?.length ? selected.join(", ") : "none"}`
    : "Canvas: empty.";

  try {
    const completion = await gateway.chat.completions.create(
      {
        model: process.env.OPENUI_MODEL || "openai/gpt-5.5",
        messages: [
          { role: "system", content: moodboardPrompt() },
          { role: "user", content: `${canvas}\n\nRequest: ${prompt.trim()}` },
        ],
        max_completion_tokens: 8000,
        stream: true,
      },
      { signal: request.signal },
    );
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (error) {
          if (!request.signal.aborted) console.error("Moodboard stream failed.", error);
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error) {
    const upstream = error as { status?: number; message?: string };
    return Response.json(
      { error: upstream.message ?? "OpenUI Gateway request failed." },
      { status: upstream.status ?? 502 },
    );
  }
}
