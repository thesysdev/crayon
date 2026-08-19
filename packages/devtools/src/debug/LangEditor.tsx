import { useMemo, useRef, type CSSProperties, type UIEvent } from "react";
import { MONO, useTheme, type ThemeTokens } from "../theme";
import { tokenColor, toTokenLines, tokenizeLang } from "./highlight";

// One line on purpose: the empty editor renders it as a single numbered row.
const PLACEHOLDER = 'root = TextContent("Hello")';

function selectionCss(t: ThemeTokens) {
  return `
.openui-debug-lang-editor textarea::selection {
  background: ${t.selection};
  color: transparent;
}
.openui-debug-lang-editor textarea::-moz-selection {
  background: ${t.selection};
  color: transparent;
}
.openui-debug-lang-editor pre {
  scrollbar-width: none;
}
.openui-debug-lang-editor pre::-webkit-scrollbar {
  display: none;
}
`;
}

const PAD = 16;
const NUMBER_WIDTH = 36;
const NUMBER_GAP = 10;

// Both layers must share one text column, or the highlight drifts from the caret.
const shared: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  height: "100%",
  paddingTop: PAD,
  paddingRight: PAD,
  paddingBottom: PAD,
  paddingLeft: PAD + NUMBER_WIDTH + NUMBER_GAP,
  margin: 0,
  border: "none",
  fontFamily: MONO,
  fontSize: 12,
  lineHeight: 1.5,
  tabSize: 2,
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
  wordBreak: "normal",
};

export function LangEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}) {
  const t = useTheme();
  const colors = tokenColor(t);
  const styles = editorStyles(t);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lines = useMemo(() => toTokenLines(tokenizeLang(value)), [value]);

  const syncScroll = (event: UIEvent<HTMLTextAreaElement>) => {
    const highlight = highlightRef.current;
    if (!highlight) return;
    highlight.scrollTop = event.currentTarget.scrollTop;
    highlight.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <div className="openui-debug-lang-editor" style={styles.wrap}>
      <style>{selectionCss(t)}</style>
      <pre ref={highlightRef} style={styles.highlight} aria-hidden>
        {value ? (
          lines.map((line, index) => (
            <div key={index} style={styles.line}>
              <span style={styles.lineNumber}>{index + 1}</span>
              {line.length === 0
                ? // Keeps a blank line one row tall.
                  "\u200b"
                : line.map((token, tokenIndex) => (
                    <span key={tokenIndex} style={{ color: colors[token.kind] }}>
                      {token.value}
                    </span>
                  ))}
            </div>
          ))
        ) : (
          <div style={styles.line}>
            <span style={styles.lineNumber}>1</span>
            <span style={{ color: t.fgFaint }}>{PLACEHOLDER}</span>
          </div>
        )}
      </pre>
      <textarea
        style={styles.textarea}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={syncScroll}
        spellCheck={false}
        readOnly={readOnly}
        aria-label="OpenUI Lang"
      />
    </div>
  );
}

function editorStyles(t: ThemeTokens) {
  return {
    wrap: {
      position: "relative",
      minWidth: 0,
      minHeight: 0,
      height: "100%",
      background: t.bgMuted,
    },
    highlight: {
      ...shared,
      position: "absolute",
      inset: 0,
      overflow: "auto",
      pointerEvents: "none",
      color: t.fg,
      background: "transparent",
    },
    line: {
      position: "relative",
    },
    lineNumber: {
      position: "absolute",
      // The gutter lives in the text column's left padding.
      left: -(NUMBER_WIDTH + NUMBER_GAP),
      top: 0,
      bottom: 0,
      boxSizing: "border-box",
      width: NUMBER_WIDTH,
      paddingRight: NUMBER_GAP,
      borderRight: `1px solid ${t.border}`,
      color: t.fgFaint,
      textAlign: "right",
      whiteSpace: "pre",
    },
    textarea: {
      ...shared,
      position: "absolute",
      inset: 0,
      resize: "none",
      color: "transparent",
      caretColor: t.fg,
      background: "transparent",
      outline: "none",
      overflow: "auto",
    },
  } satisfies Record<string, CSSProperties>;
}
