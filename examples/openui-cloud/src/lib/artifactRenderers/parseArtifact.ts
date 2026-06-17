/**
 * Pure parsing for the artifact tool-call envelope (no React imports).
 *
 * The renderer's parser sees `response` in one of these shapes:
 *  1. LIVE — the tool's function_call_output: a JSON string
 *     {"artifact_id","type":"presentation"|"report","name","version","content"}
 *     where content is the openui-lang program.
 *  2. STRIPPED RELOAD — the same envelope minus "content" (stored items are
 *     metadata-only). The view hydrates via ArtifactStorage.get(id).
 *  3. STORAGE — the artifact browser passes { args: undefined, response:
 *     artifact.content } in the envelope shape; a bare program string is
 *     tolerated (kind sniffed from the program root).
 *  4. Anything else → null → the default tool chip remains.
 *
 * `response === null` + isStreaming = in-flight: the call started, args may be
 * partial JSON, no result yet.
 */

export type ArtifactKind = "presentation" | "report";

export interface ArtifactEnvelope {
  artifact_id: string;
  type: ArtifactKind;
  name?: string;
  version?: string;
  /** openui-lang program. Absent on the stripped-reload shape. */
  content?: string;
}

export type ParsedArtifactResult =
  | { source: "envelope"; envelope: ArtifactEnvelope }
  | { source: "program"; kind: ArtifactKind; content: string };

export interface ArtifactProps {
  kind: ArtifactKind;
  /** Storage id; null for the bare-program fallback and the earliest frames. */
  artifactId: string | null;
  name: string | null;
  version: string | null;
  /** openui-lang program; null ⇒ streaming or stripped reload. */
  content: string | null;
  phase: "streaming" | "ready";
}

export interface ArtifactParseResult {
  props: ArtifactProps;
  meta: { id: string; version: number; heading: string } | null;
}

const KIND_BY_TYPE: Record<string, ArtifactKind> = {
  presentation: "presentation",
  slides: "presentation",
  report: "report",
};

/** Program-root sniff for the bare-string storage fallback. */
const PROGRAM_ROOT_RE = /^\s*root\s*=\s*(SlideShow|ReportView)\s*\(/m;

const FALLBACK_HEADING: Record<ArtifactKind, string> = {
  presentation: "Presentation",
  report: "Report",
};

export function artifactHeading(p: Pick<ArtifactProps, "kind" | "name">): string {
  return p.name ?? FALLBACK_HEADING[p.kind];
}

/** Strip a leading ```lang fence (and the trailing ``` once it arrives) so a
 *  partial program feeds the viewers clean. */
function stripProgramFences(s: string): string {
  let t = s.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```[^\n]*\n?/, "");
    const close = t.lastIndexOf("```");
    if (close !== -1) t = t.slice(0, close);
  }
  return t.trim();
}

/** Streaming-morph carrier. During streaming the adapter re-delivers the
 *  growing program as a content-only partial envelope {"content":"…"} — no
 *  artifact_id yet. Returns the fence-stripped program for that shape, else
 *  null. A full envelope (artifact_id present) is intentionally NOT matched. */
export function extractStreamingProgramCarrier(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const text = raw.trim();
  if (!text.startsWith("{")) return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    const obj = parsed as Record<string, unknown>;
    if (typeof obj["artifact_id"] === "string" && obj["artifact_id"] !== "") return null;
    if (typeof obj["content"] !== "string") return null;
    return stripProgramFences(obj["content"]);
  } catch {
    return null;
  }
}

/** Classify a complete tool result (or stored content). */
export function parseArtifactResult(raw: unknown): ParsedArtifactResult | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const text = raw.trim();

  if (text.startsWith("{")) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (typeof parsed === "object" && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        const kind = typeof obj["type"] === "string" ? KIND_BY_TYPE[obj["type"]] : undefined;
        if (typeof obj["artifact_id"] === "string" && obj["artifact_id"] !== "" && kind !== undefined) {
          return {
            source: "envelope",
            envelope: {
              artifact_id: obj["artifact_id"],
              type: kind,
              ...(typeof obj["name"] === "string" && obj["name"] !== "" ? { name: obj["name"] } : {}),
              ...(typeof obj["version"] === "string" && obj["version"] !== ""
                ? { version: obj["version"] }
                : {}),
              ...(typeof obj["content"] === "string" && obj["content"] !== ""
                ? { content: obj["content"] }
                : {}),
            },
          };
        }
      }
      return null; // valid JSON, but not our envelope
    } catch {
      /* not JSON — fall through to the program sniff */
    }
  }

  const root = PROGRAM_ROOT_RE.exec(text);
  if (root) {
    return { source: "program", kind: root[1] === "ReportView" ? "report" : "presentation", content: text };
  }

  return null;
}

/** Best-effort field extraction from (possibly partial) streamed tool args. */
export function extractStreamingArgs(args: unknown): {
  kind: ArtifactKind | null;
  artifactId: string | null;
  name: string | null;
} {
  const empty = { kind: null, artifactId: null, name: null };
  if (typeof args !== "string" || args === "") return empty;

  try {
    const parsed = JSON.parse(args) as Record<string, unknown>;
    return {
      kind:
        typeof parsed["artifact_type"] === "string"
          ? (KIND_BY_TYPE[parsed["artifact_type"]] ?? null)
          : null,
      artifactId: typeof parsed["artifact_id"] === "string" ? parsed["artifact_id"] : null,
      name: typeof parsed["name"] === "string" ? parsed["name"] : null,
    };
  } catch {
    const field = (key: string): string | null =>
      new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*)`).exec(args)?.[1] ?? null;
    const type = field("artifact_type");
    return {
      kind: type !== null ? (KIND_BY_TYPE[type] ?? null) : null,
      artifactId: field("artifact_id"),
      name: field("name"),
    };
  }
}

/** Wire version string → numeric version (non-numeric/absent ⇒ 1). */
export function numericVersion(version: string | undefined | null): number {
  if (version === undefined || version === null || version === "") return 1;
  const n = Number.parseInt(version, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

/** The renderer `parser` — shared by both configs. */
export function artifactParser(
  raw: { args: unknown; response: unknown },
  ctx: { isStreaming: boolean },
): ArtifactParseResult | null {
  if (raw.response !== null && raw.response !== undefined) {
    const parsed = parseArtifactResult(raw.response);
    if (parsed === null) {
      // Streaming morph: the content-only carrier {"content":"<partial>"} is
      // not a full envelope. Render the partial program so the preview morphs
      // as it grows; register nothing (the stable id lands with the final
      // envelope, which re-renders this same tool message).
      const streamingProgram = extractStreamingProgramCarrier(raw.response);
      if (streamingProgram === null) return null;
      const partialArgs = extractStreamingArgs(raw.args);
      const root = PROGRAM_ROOT_RE.exec(streamingProgram);
      if (root) {
        return {
          props: {
            kind: root[1] === "ReportView" ? "report" : "presentation",
            artifactId: null,
            name: partialArgs.name,
            version: null,
            content: streamingProgram,
            phase: "streaming",
          },
          meta: null,
        };
      }
      // Carrier seen but the program root hasn't arrived yet: skeleton.
      return {
        props: {
          kind: partialArgs.kind ?? "presentation",
          artifactId: partialArgs.artifactId,
          name: partialArgs.name,
          version: null,
          content: null,
          phase: "streaming",
        },
        meta: null,
      };
    }

    if (parsed.source === "program") {
      // Bare-program storage fallback: render, never register (no stable id).
      return {
        props: {
          kind: parsed.kind,
          artifactId: null,
          name: null,
          version: null,
          content: parsed.content,
          phase: "ready",
        },
        meta: null,
      };
    }

    const env = parsed.envelope;
    const props: ArtifactProps = {
      kind: env.type,
      artifactId: env.artifact_id,
      name: env.name ?? null,
      version: env.version ?? null,
      content: env.content ?? null,
      phase: "ready",
    };
    return {
      props,
      meta: { id: env.artifact_id, version: numericVersion(env.version), heading: artifactHeading(props) },
    };
  }

  // No result outside streaming = a dropped/foreign result — skip.
  if (!ctx.isStreaming) return null;

  // In-flight: tool call started, args possibly partial, no result yet.
  const partial = extractStreamingArgs(raw.args);
  return {
    props: {
      kind: partial.kind ?? "presentation",
      artifactId: partial.artifactId,
      name: partial.name,
      version: null,
      content: null,
      phase: "streaming",
    },
    meta: null,
  };
}
