// ─── Tag helpers ───

const openTag = (tag: string) => `<${tag}>`;
const closeTag = (tag: string) => `</${tag}>`;

/**
 * Wrap text in <content> tags.
 */
export function wrapContent(text: string): string {
  return `${openTag("content")}${text}${closeTag("content")}`;
}

/**
 * Wrap JSON string in <context> tags.
 */
export function wrapContext(json: string): string {
  return `${openTag("context")}${json}${closeTag("context")}`;
}

/**
 * Separate openui-lang code from <context> tag in a message.
 *
 * Supports two formats:
 *   <content>message</content><context>state</context>
 *   message<context>state</context>
 *
 * Uses regex to find the last <context>...</context> block.
 *
 * @returns { content: the message/code, contextString: raw JSON or null }
 */
export function separateContentAndContext(raw: string): {
  content: string;
  contextString: string | null;
} {
  // Extract <context>...</context> from the end
  const contextMatch = raw.match(/<context>([\s\S]*)<\/context>\s*$/);
  let content = raw;
  let contextString: string | null = null;

  if (contextMatch) {
    contextString = contextMatch[1];
    content = raw.slice(0, contextMatch.index!).trimEnd();
  }

  // Unwrap <content>...</content> if present
  const contentMatch = content.match(/^<content>([\s\S]*)<\/content>\s*$/);
  if (contentMatch) {
    content = contentMatch[1];
  }

  return { content, contextString };
}

/**
 * Parse the context string into a form state object.
 *
 * Context is stored as a JSON array: [{ formName: { fieldName: { value, componentType } } }]
 * The array wrapper exists for backward compatibility.
 *
 * @returns The form state object, or empty object if parsing fails.
 */
export function parseContext(contextString: string | null): Record<string, any> {
  if (!contextString) return {};
  try {
    const parsed = JSON.parse(contextString);
    if (Array.isArray(parsed) && typeof parsed[0] === "object") {
      return parsed[0];
    }
    if (typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch {
    return {};
  }
}
