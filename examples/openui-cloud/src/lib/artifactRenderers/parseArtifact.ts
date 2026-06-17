/**
 * Pure parsing for the artifact tool-call carrier (no React imports).
 *
 * The carrier is now ONE inline-sentinel string (backend artifact-shared.ts):
 *   ]]>openui:artifact {"artifact_id","type","name"?,"version"?}\n<program>
 * Same shape live (header first, program appends), at completion, and — header
 * only, no program — on a stripped reload. So there is a SINGLE parser; the
 * old dual-shape (streaming {content} + full {artifact_id,…}) is gone, and the
 * artifact_id is known from the first frame (register immediately).
 *
 * `parseArtifactResult` remains for STORAGE content (a bare program fetched via
 * ArtifactStorage.get) and the bare-program fallback.
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
  /** Storage id; null only for the bare-program fallback / earliest in-flight frames. */
  artifactId: string | null;
  name: string | null;
  version: string | null;
  /** openui-lang program; null ⇒ streaming-before-program or stripped reload. */
  content: string | null;
  phase: "streaming" | "ready";
}

export interface ArtifactParseResult {
  props: ArtifactProps;
  meta: { id: string; version: number; heading: string } | null;
}

const OPENUI_ARTIFACT_MARKER = "]]>openui:artifact";

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

export interface ArtifactSentinelHeader {
  artifact_id: string;
  type: ArtifactKind;
  name?: string;
  version?: string;
}

/**
 * Parse the inline-sentinel carrier `]]>openui:artifact <header-json>\n<program>`.
 * Returns the validated header + raw program (program may be "" on a stripped
 * reload). Returns null when `raw` is not an artifact sentinel — the caller then
 * tries the bare-program fallback.
 */
export function parseArtifactSentinel(
  raw: unknown,
): { header: ArtifactSentinelHeader; program: string } | null {
  if (typeof raw !== "string") return null;
  const prefix = `${OPENUI_ARTIFACT_MARKER} `;
  if (!raw.startsWith(prefix)) return null;
  const nl = raw.indexOf("\n");
  const headerStr = nl === -1 ? raw.slice(prefix.length) : raw.slice(prefix.length, nl);
  const program = nl === -1 ? "" : raw.slice(nl + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(headerStr);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;
  const h = parsed as Record<string, unknown>;
  if (typeof h["artifact_id"] !== "string" || h["artifact_id"] === "") return null;
  const kind = typeof h["type"] === "string" ? KIND_BY_TYPE[h["type"]] : undefined;
  if (kind === undefined) return null;
  return {
    header: {
      artifact_id: h["artifact_id"],
      type: kind,
      ...(typeof h["name"] === "string" && h["name"] !== "" ? { name: h["name"] } : {}),
      ...(typeof h["version"] === "string" && h["version"] !== "" ? { version: h["version"] } : {}),
    },
    program: stripProgramFences(program),
  };
}

/**
 * Classify STORAGE content (or a bare-program fallback). Storage returns the
 * bare openui-lang program; the legacy JSON envelope branch is retained only
 * for older stored rows.
 */
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
      return null;
    } catch {
      /* not JSON — fall through to the program sniff */
    }
  }

  const program = stripProgramFences(text);
  const root = PROGRAM_ROOT_RE.exec(program);
  if (root) {
    return { source: "program", kind: root[1] === "ReportView" ? "report" : "presentation", content: program };
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
    // ── Inline-sentinel carrier: ONE shape for live stream + final + reload.
    const sentinel = parseArtifactSentinel(raw.response);
    if (sentinel !== null) {
      const { header, program } = sentinel;
      const hasProgram = program !== "";
      const props: ArtifactProps = {
        kind: header.type,
        artifactId: header.artifact_id,
        name: header.name ?? null,
        version: header.version ?? null,
        // null ⇒ header-only (stripped reload) OR header-before-program: the
        // view hydrates via ArtifactStorage.get(artifactId).
        content: hasProgram ? program : null,
        phase: ctx.isStreaming ? "streaming" : "ready",
      };
      // Register from frame 1 — the header always carries a stable artifact_id.
      return {
        props,
        meta: { id: header.artifact_id, version: numericVersion(header.version), heading: artifactHeading(props) },
      };
    }

    // ── Bare-program storage fallback (no sentinel): render, never register.
    const parsed = parseArtifactResult(raw.response);
    if (parsed?.source === "program") {
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
    return null;
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
