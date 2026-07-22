const OPENUI_INLINE_SENTINEL = "]]\u003eopenui:";
const CONTENT_MARKER = `${OPENUI_INLINE_SENTINEL}content`;
const CONTEXT_MARKER = `${OPENUI_INLINE_SENTINEL}context`;
const END_MARKER = `${OPENUI_INLINE_SENTINEL}end`;
const STREAM_PARTIAL_TOKENS = [CONTENT_MARKER, CONTEXT_MARKER, END_MARKER];

interface ParsedMessageContent {
  content: string;
  contextString: string | null;
  contentHeader?: string;
}

export function wrapContent(text: string): string {
  return `${CONTENT_MARKER}\n${text}`;
}

export function wrapContentWithHeader(text: string, contentHeader?: string): string {
  return contentHeader ? `${contentHeader}\n${text}` : wrapContent(text);
}

export function wrapContext(json: string): string {
  return `\n${CONTEXT_MARKER}\n${json}`;
}

export function separateContentAndContext(raw: string): ParsedMessageContent {
  const text = stripEndMarkers(raw);
  const lastContentIndex = text.lastIndexOf(CONTENT_MARKER);
  const lastContextIndex = text.lastIndexOf(CONTEXT_MARKER);

  if (lastContentIndex === -1 && lastContextIndex === -1) {
    return parseLegacyXml(text);
  }

  if (lastContentIndex === -1) {
    return {
      content: stripSectionSeparator(text.slice(0, lastContextIndex)),
      contextString: text.slice(bodyStartIndex(text, lastContextIndex)),
    };
  }

  if (lastContextIndex === -1 || lastContentIndex > lastContextIndex) {
    return {
      content: stripStreamingTail(text.slice(bodyStartIndex(text, lastContentIndex))),
      contextString: null,
      contentHeader: readContentHeader(text, lastContentIndex),
    };
  }

  return {
    content: stripStreamingTail(
      stripSectionSeparator(text.slice(bodyStartIndex(text, lastContentIndex), lastContextIndex)),
    ),
    contextString: text.slice(bodyStartIndex(text, lastContextIndex)),
    contentHeader: readContentHeader(text, lastContentIndex),
  };
}

function stripEndMarkers(raw: string): string {
  let text = raw;
  for (let index = text.indexOf(END_MARKER); index !== -1; index = text.indexOf(END_MARKER)) {
    const lineEnd = text.indexOf("\n", index);
    const before = stripSectionSeparator(text.slice(0, index));
    const after = lineEnd === -1 ? "" : text.slice(lineEnd + 1);
    text = after ? `${before}\n${after}` : before;
  }
  return text;
}

function stripStreamingTail(content: string): string {
  let trimLength = 0;
  for (const token of STREAM_PARTIAL_TOKENS) {
    const maxLength = Math.min(token.length - 1, content.length);
    for (let length = maxLength; length > trimLength; length--) {
      if (content.endsWith(token.slice(0, length))) {
        trimLength = length;
        break;
      }
    }
  }
  return trimLength > 0
    ? stripSectionSeparator(content.slice(0, content.length - trimLength))
    : content;
}

function readContentHeader(raw: string, markerIndex: number): string {
  const headerEnd = raw.indexOf("\n", markerIndex);
  return headerEnd === -1 ? raw.slice(markerIndex) : raw.slice(markerIndex, headerEnd);
}

function bodyStartIndex(raw: string, markerIndex: number): number {
  const headerEnd = raw.indexOf("\n", markerIndex);
  return headerEnd === -1 ? raw.length : headerEnd + 1;
}

function stripSectionSeparator(value: string): string {
  if (value.endsWith("\r\n")) return value.slice(0, -2);
  if (value.endsWith("\n")) return value.slice(0, -1);
  return value;
}

function parseLegacyXml(raw: string): ParsedMessageContent {
  let content = raw;
  let contextString: string | null = null;
  const contextMatch = raw.match(/\u003ccontext\u003e([\s\S]*)\u003c\/context\u003e\s*$/);

  if (contextMatch) {
    contextString = contextMatch[1] ?? null;
    content = raw.slice(0, contextMatch.index).trimEnd();
  }

  const contentMatch = content.match(
    /^\u003ccontent[^\u003e]*\u003e([\s\S]*)\u003c\/content\u003e\s*$/,
  );
  if (contentMatch) content = contentMatch[1] ?? content;
  return { content, contextString };
}
