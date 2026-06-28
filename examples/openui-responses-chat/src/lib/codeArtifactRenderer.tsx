"use client";

import { CodeBlock, defineArtifactRenderer } from "@openuidev/react-ui";

type CodeArtifactProps = {
  language: string;
  title: string;
  code: string;
};

// Best-effort extractor for partial JSON args during streaming.
// Strict mode + property order (language → title → code) means we can pull
// completed fields out even when the tail of `code` hasn't streamed in yet.
function parseCodeArgs(raw: string): CodeArtifactProps | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<CodeArtifactProps>;
    return {
      language: parsed.language ?? "",
      title: parsed.title ?? "",
      code: parsed.code ?? "",
    };
  } catch {
    // Fall through to partial extraction
  }

  const language = raw.match(/"language"\s*:\s*"([^"]*)/)?.[1] ?? "";
  const title = raw.match(/"title"\s*:\s*"([^"]*)/)?.[1] ?? "";
  // Capture from `"code":"` up to the unescaped closing `"` (or end of buffer).
  const codeMatch = raw.match(/"code"\s*:\s*"((?:[^"\\]|\\.)*)/);
  const code = codeMatch ? unescapeJSONString(codeMatch[1]) : "";

  if (!language && !title && !code) return null;
  return { language, title, code };
}

function unescapeJSONString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\r/g, "\r")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

export const codeArtifactRenderer = defineArtifactRenderer({
  type: "code_artifact",
  toolName: "create_code_artifact",
  parser: ({ args }) => {
    if (typeof args !== "string") return null;
    const props = parseCodeArgs(args);
    if (!props) return null;
    return {
      props,
      meta: props.title ? { id: `code:${props.title}`, version: 1, heading: props.title } : null,
    };
  },
  preview: (props, { isStreaming, isActive, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "var(--openui-color-surface-card, #1e1e1e)",
        color: "var(--openui-color-text, #eee)",
        border: "1px solid var(--openui-color-border, #333)",
        borderRadius: 8,
        padding: "12px 14px",
        margin: "8px 0",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <strong style={{ fontSize: 14 }}>{props.title || "Code artifact"}</strong>
        <span style={{ fontSize: 12, opacity: 0.6 }}>
          {props.language}
          {isStreaming ? " · streaming…" : ""}
          {isActive ? " · open" : ""}
        </span>
      </div>
      <pre
        style={{
          margin: "8px 0 0",
          padding: 0,
          fontSize: 12,
          opacity: 0.8,
          overflow: "hidden",
          maxHeight: 96,
          whiteSpace: "pre-wrap",
        }}
      >
        <code>{props.code.split("\n").slice(0, 5).join("\n")}</code>
      </pre>
    </button>
  ),
  actual: (props) => (
    <div style={{ padding: 16 }}>
      <CodeBlock language={props.language || "text"} codeString={props.code} />
    </div>
  ),
});
