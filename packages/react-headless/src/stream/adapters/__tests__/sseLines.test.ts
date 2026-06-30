import { describe, expect, it } from "vitest";
import { sseLineIterator } from "../_shared/sseLines";

function responseFromChunks(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(encoder.encode(c));
      controller.close();
    },
  });
  return new Response(stream);
}

async function collect(res: Response): Promise<string[]> {
  const out: string[] = [];
  for await (const line of sseLineIterator(res)) out.push(line);
  return out;
}

describe("sseLineIterator", () => {
  it("reassembles a line split across network chunks", async () => {
    // "data: line1" is split mid-token between two chunks.
    const res = responseFromChunks(["da", "ta: line1\nda", "ta: line2\n"]);
    expect(await collect(res)).toEqual(["data: line1", "data: line2"]);
  });

  it("flushes a trailing line with no final newline", async () => {
    const res = responseFromChunks(["data: a\n", "data: b"]);
    expect(await collect(res)).toEqual(["data: a", "data: b"]);
  });

  it("skips blank lines", async () => {
    const res = responseFromChunks(["data: a\n\n\n", "data: b\n"]);
    expect(await collect(res)).toEqual(["data: a", "data: b"]);
  });

  it("handles a JSON event split exactly at a brace across chunks", async () => {
    const res = responseFromChunks(['data: {"hello":', '"world"}\n']);
    expect(await collect(res)).toEqual(['data: {"hello":"world"}']);
  });
});
