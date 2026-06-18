const OPENUI_INLINE_SENTINEL = "]]>openui:";
const CONTENT_MARKER = `${OPENUI_INLINE_SENTINEL}content`;
const CONTEXT_MARKER = `${OPENUI_INLINE_SENTINEL}context`;

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

// Separate openui-lang code from inline context in a message.
export function separateContentAndContext(raw: string): {
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
