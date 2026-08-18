export interface StreamChunk {
  text: string;
  delayMs: number;
}

export type ChunkStrategy = "24" | "line" | "char" | "llm";

export const CHUNK_STRATEGIES: { id: ChunkStrategy; label: string }[] = [
  { id: "llm", label: "LLM-like" },
  { id: "24", label: "24 chars" },
  { id: "line", label: "Per line" },
  { id: "char", label: "Per char" },
];

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function splitChunks(source: string, spec: ChunkStrategy, rng: () => number): StreamChunk[] {
  if (spec === "llm") {
    const chunks: StreamChunk[] = [];
    let i = 0;
    while (i < source.length) {
      const len = rng() < 0.8 ? 1 + Math.floor(rng() * 12) : 13 + Math.floor(rng() * 48);
      const text = source.slice(i, i + len);
      i += text.length;
      const r = rng();
      const delayMs =
        r < 0.15 ? 0 : r < 0.9 ? 5 + Math.floor(rng() * 75) : 200 + Math.floor(rng() * 400);
      chunks.push({ text, delayMs });
    }
    return chunks;
  }
  if (spec === "line") {
    return source
      .split(/(?<=\n)/)
      .filter((s) => s.length > 0)
      .map((text) => ({ text, delayMs: 0 }));
  }
  const n = spec === "char" ? 1 : Math.max(1, parseInt(spec, 10) || 24);
  const chunks: StreamChunk[] = [];
  for (let i = 0; i < source.length; i += n)
    chunks.push({ text: source.slice(i, i + n), delayMs: 0 });
  return chunks;
}
