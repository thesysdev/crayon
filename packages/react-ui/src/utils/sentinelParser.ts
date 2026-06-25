const OPENUI_INLINE_SENTINEL = "]]>openui:";
const CONTENT_MARKER = `${OPENUI_INLINE_SENTINEL}content`;
const CONTEXT_MARKER = `${OPENUI_INLINE_SENTINEL}context`;
const END_MARKER = `${OPENUI_INLINE_SENTINEL}end`;

// Tokens whose partial prefix can sit at the tail of a still-streaming chunk.
// Trimming keeps a half-arrived marker from flashing as raw text; the next
// delta re-parses the full message, so any false positive is transient.
const STREAM_PARTIAL_TOKENS = [CONTENT_MARKER, CONTEXT_MARKER, END_MARKER];

export interface ParsedMessageContent {
  content: string;
  contextString: string | null;
  contentHeader?: string;
  /**
   * True when the bare `]]>openui:end` liveness marker was present — the
   * stream reached its terminal chunk. Absent on a PERSISTED message ⇒ the
   * stream died mid-write. HOW a response ended is structural (output item
   * `status` + the Responses terminal event), never in-band bytes.
   */
  end?: boolean;
}

export function wrapContent(text: string): string {
  return `${CONTENT_MARKER}\n${text}`;
}

// Round-trip the original header verbatim so its attrs (libraryVersion, etc.)
// survive form-state persistence.
export function wrapContentWithHeader(text: string, contentHeader?: string): string {
  return contentHeader ? `${contentHeader}\n${text}` : wrapContent(text);
}

export function wrapContext(json: string): string {
  return `\n${CONTEXT_MARKER}\n${json}`;
}

// Separate openui-lang code from inline context in a message, stripping
// display-only noise: the bare end marker and partial streaming tails. The
// raw message bytes in the store stay untouched.
export function separateContentAndContext(raw: string): ParsedMessageContent {
  const { text, end } = extractEndMarker(raw);
  const sections = splitSections(text);
  const content = stripStreamingTail(sections.content);
  return { ...sections, content, ...(end ? { end: true } : {}) };
}

// The ordered section walk over the inline-sentinel format.
function splitSections(raw: string): {
  content: string;
  contextString: string | null;
  contentHeader?: string;
} {
  const lastContentIdx = raw.lastIndexOf(CONTENT_MARKER);
  const lastContextIdx = raw.lastIndexOf(CONTEXT_MARKER);

  // No inline markers: fall back to the deprecated XML envelope so messages
  // persisted by older app versions still round-trip on reload.
  if (lastContentIdx === -1 && lastContextIdx === -1) {
    return parseLegacyXml(raw);
  }

  // Only context section
  if (lastContentIdx === -1) {
    return {
      content: stripSectionSeparator(raw.slice(0, lastContextIdx)),
      contextString: raw.slice(bodyStartIndex(raw, lastContextIdx)),
    };
  }

  // Content-only response
  if (lastContextIdx === -1 || lastContentIdx > lastContextIdx) {
    return {
      content: raw.slice(bodyStartIndex(raw, lastContentIdx)),
      contextString: null,
      contentHeader: contentHeader(raw, lastContentIdx),
    };
  }

  // Content section followed by context section
  return {
    content: stripSectionSeparator(raw.slice(bodyStartIndex(raw, lastContentIdx), lastContextIdx)),
    contextString: raw.slice(bodyStartIndex(raw, lastContextIdx)),
    contentHeader: contentHeader(raw, lastContentIdx),
  };
}

// Strip every `]]>openui:end` marker LINE and report presence. Mirrors the
// backend's inline-format 'end' case: the separator newline before the marker
// is removed, header attrs on the marker line are ignored (a future
// `?status=…` form must not break display), and defensive trailing text after
// the line stays with the section it interrupted.
function extractEndMarker(raw: string): { text: string; end: boolean } {
  let text = raw;
  let end = false;
  for (let idx = text.indexOf(END_MARKER); idx !== -1; idx = text.indexOf(END_MARKER)) {
    end = true;
    const lineEnd = text.indexOf("\n", idx);
    const before = stripSectionSeparator(text.slice(0, idx));
    const after = lineEnd === -1 ? "" : text.slice(lineEnd + 1);
    text = after === "" ? before : `${before}\n${after}`;
  }
  return { text, end };
}

// Trim a PROPER prefix of a marker token sitting at the very end of the
// content. Full tokens are handled upstream (the section walk); this only
// suppresses the one-frame flash while a chunk boundary splits a token.
function stripStreamingTail(content: string): string {
  let trim = 0;
  for (const token of STREAM_PARTIAL_TOKENS) {
    const max = Math.min(token.length - 1, content.length);
    for (let k = max; k > trim; k--) {
      if (content.endsWith(token.slice(0, k))) {
        trim = k;
        break;
      }
    }
  }
  return trim > 0 ? stripSectionSeparator(content.slice(0, content.length - trim)) : content;
}

function contentHeader(raw: string, markerIdx: number): string {
  const headerEndIdx = raw.indexOf("\n", markerIdx);
  return headerEndIdx === -1 ? raw.slice(markerIdx) : raw.slice(markerIdx, headerEndIdx);
}

function bodyStartIndex(raw: string, markerIdx: number): number {
  const headerEndIdx = raw.indexOf("\n", markerIdx);
  return headerEndIdx === -1 ? raw.length : headerEndIdx + 1;
}

function stripSectionSeparator(value: string): string {
  if (value.endsWith("\r\n")) {
    return value.slice(0, -2);
  }
  if (value.endsWith("\n")) {
    return value.slice(0, -1);
  }
  return value;
}

/**
 * @deprecated Legacy `<content>`/`<context>` XML envelope. Retained only to
 * parse messages persisted before the inline sentinel format; new messages are
 * always wrapped with {@link wrapContent}/{@link wrapContext}.
 */
function parseLegacyXml(raw: string): { content: string; contextString: string | null } {
  let content = raw;
  let contextString: string | null = null;

  const contextMatch = raw.match(/<context>([\s\S]*)<\/context>\s*$/);
  if (contextMatch) {
    contextString = contextMatch[1] ?? null;
    content = raw.slice(0, contextMatch.index!).trimEnd();
  }

  const contentMatch = content.match(/^<content[^>]*>([\s\S]*)<\/content>\s*$/);
  if (contentMatch) {
    content = contentMatch[1] ?? content;
  }

  return { content, contextString };
}

// ---------------------------------------------------------------------------
// Artifact sentinel — the `]]>openui:artifact` member of the inline-sentinel
// family. Unlike content/context (assistant-message channel), this rides the
// tool-result channel (function_call_output + response.artifact_call.delta).
// Carrier: `]]>openui:artifact <header-json>\n<program>` (header-only on a
// stripped reload). Byte-mirrors the example renderer's parseArtifact.ts and
// the backend builder (muse artifact-shared.ts buildArtifactSentinel).
// ---------------------------------------------------------------------------
const ARTIFACT_MARKER = `${OPENUI_INLINE_SENTINEL}artifact`;

export type ArtifactKind = "slides" | "report";

export interface ArtifactSentinelHeader {
  artifact_id: string;
  type: ArtifactKind;
  name?: string;
  version?: string;
}

const ARTIFACT_KIND_BY_TYPE: Record<string, ArtifactKind> = {
  slides: "slides",
  presentation: "slides",
  report: "report",
};

/**
 * Parse the artifact carrier `]]>openui:artifact <header-json>\n<program>` into
 * the validated header + raw program (program is "" on a stripped reload).
 * Returns null when `raw` is not an artifact sentinel.
 */
export function parseArtifactSentinel(
  raw: unknown,
): { header: ArtifactSentinelHeader; program: string } | null {
  if (typeof raw !== "string") return null;
  const prefix = `${ARTIFACT_MARKER} `;
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
  const kind = typeof h["type"] === "string" ? ARTIFACT_KIND_BY_TYPE[h["type"]] : undefined;
  if (kind === undefined) return null;
  return {
    header: {
      artifact_id: h["artifact_id"],
      type: kind,
      ...(typeof h["name"] === "string" && h["name"] !== "" ? { name: h["name"] } : {}),
      ...(typeof h["version"] === "string" && h["version"] !== "" ? { version: h["version"] } : {}),
    },
    program,
  };
}
