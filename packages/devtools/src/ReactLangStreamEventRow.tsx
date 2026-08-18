import { type ObservabilityEvent } from "@openuidev/observability";
import { Bug, Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { LevelIcon } from "./LevelIcon";
import { TOKEN_COLOR, tokenizeLang } from "./paste/highlight";

export interface ReactLangStreamDetail {
  phase: "streaming" | "settled";
  response?: string;
  errors: Record<string, unknown>[];
  parser?: {
    incomplete?: boolean;
    unresolved?: string[];
    orphaned?: string[];
    statementCount?: number;
  };
}

export function getReactLangStreamDetail(event: ObservabilityEvent): ReactLangStreamDetail | null {
  const detail = asRecord(event.detail);
  if (
    detail["kind"] !== "react-lang:stream" ||
    (detail["phase"] !== "streaming" && detail["phase"] !== "settled")
  ) {
    return null;
  }

  const parser = asRecord(detail["parser"]);
  return {
    phase: detail["phase"],
    response: asString(detail["response"]),
    errors: Array.isArray(detail["errors"]) ? detail["errors"].map((error) => asRecord(error)) : [],
    parser:
      Object.keys(parser).length > 0
        ? {
            incomplete:
              typeof parser["incomplete"] === "boolean" ? parser["incomplete"] : undefined,
            unresolved: Array.isArray(parser["unresolved"])
              ? parser["unresolved"].filter((value): value is string => typeof value === "string")
              : undefined,
            orphaned: Array.isArray(parser["orphaned"])
              ? parser["orphaned"].filter((value): value is string => typeof value === "string")
              : undefined,
            statementCount:
              typeof parser["statementCount"] === "number" ? parser["statementCount"] : undefined,
          }
        : undefined,
  };
}

export function ReactLangStreamEventRow({
  event,
  stream,
  onOpenInPaste,
  canOpenInPaste = false,
}: {
  event: ObservabilityEvent;
  stream: ReactLangStreamDetail;
  onOpenInPaste?: (response: string) => void;
  canOpenInPaste?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [responseCopied, setResponseCopied] = useState(false);
  // Collapsed rows skip tokenizing: a live stream re-renders this on every chunk.
  const responseTokens = useMemo(
    () => (expanded && stream.response ? tokenizeLang(stream.response) : []),
    [expanded, stream.response],
  );
  const isStreaming = stream.phase === "streaming";
  const visibleErrors = isStreaming ? [] : stream.errors;
  const statementCount = stream.parser?.statementCount;
  const orphaned = stream.parser?.orphaned ?? [];
  const parserIssues = [
    !isStreaming && stream.parser?.incomplete ? "Incomplete input" : null,
    !isStreaming && stream.parser?.unresolved?.length
      ? `Unresolved: ${stream.parser.unresolved.join(", ")}`
      : null,
    orphaned.length > 0 ? `Orphaned: ${orphaned.join(", ")}` : null,
  ].filter((issue): issue is string => Boolean(issue));

  const copyResponse = () => {
    if (typeof navigator === "undefined" || !navigator.clipboard || !stream.response) return;
    navigator.clipboard
      .writeText(stream.response)
      .then(() => {
        setResponseCopied(true);
        setTimeout(() => setResponseCopied(false), 1500);
      })
      .catch(() => {});
  };

  const openInPasteDisabled = isStreaming || !stream.response || !canOpenInPaste;

  return (
    <div style={styles.row}>
      <button
        type="button"
        style={styles.streamToggle}
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-label="Toggle OpenUI Lang stream details"
      >
        <div style={styles.rowHeader}>
          <div style={styles.badgeGroup}>
            <LevelIcon level={event.level} />
            <span style={styles.kind}>OpenUI Lang stream</span>
            {isStreaming ? (
              <span style={{ ...styles.badge, ...styles.badgeStreaming }}>Streaming</span>
            ) : null}
          </div>
          <div style={styles.rowHeaderRight}>
            <span style={styles.time}>{new Date(event.timestamp).toLocaleTimeString()}</span>
            <span style={styles.chevron}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </div>
        </div>
        <div style={styles.streamOverview}>
          {statementCount !== undefined ? (
            <span>
              {statementCount} statement{statementCount === 1 ? "" : "s"}
            </span>
          ) : null}
          {orphaned.length > 0 ? (
            <span>
              {orphaned.length} orphaned statement{orphaned.length === 1 ? "" : "s"}
            </span>
          ) : null}
          {visibleErrors.length > 0 ? (
            <span style={styles.errorSummary}>
              {visibleErrors.length} error{visibleErrors.length === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div style={styles.streamExpanded}>
          {visibleErrors.length > 0 ? (
            <section style={styles.streamSection}>
              <div style={styles.streamSectionTitle}>Errors ({visibleErrors.length})</div>
              <div style={styles.diagnosticList}>
                {visibleErrors.map((error, index) => (
                  <Diagnostic
                    key={`${asString(error["source"]) ?? "error"}-${asString(error["code"]) ?? "unknown"}-${index}`}
                    error={error}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {parserIssues.length > 0 ? (
            <section style={styles.streamSection}>
              <div style={styles.streamSectionTitle}>Parser details</div>
              <div style={styles.parserIssues}>{parserIssues.join(" · ")}</div>
            </section>
          ) : null}

          <section style={styles.streamSection}>
            <pre style={styles.responseCode}>
              {stream.response
                ? responseTokens.map((token, index) => (
                    <span key={index} style={{ color: TOKEN_COLOR[token.kind] }}>
                      {token.value}
                    </span>
                  ))
                : "(empty response)"}
            </pre>
            <div style={styles.responseActions}>
              <button
                type="button"
                style={{
                  ...styles.responseButton,
                  ...(openInPasteDisabled ? styles.responseButtonDisabled : null),
                }}
                onClick={() => {
                  if (isStreaming || !stream.response || !onOpenInPaste) return;
                  onOpenInPaste(stream.response);
                }}
                disabled={openInPasteDisabled}
                title={
                  isStreaming
                    ? "Wait until the stream finishes"
                    : !stream.response
                      ? "Empty response"
                      : !canOpenInPaste
                        ? "No createLibrary() call detected"
                        : "Debug this response in OpenUI Paste"
                }
                aria-label="Debug"
              >
                <Bug size={12} />
                Debug
              </button>
              <button type="button" style={styles.responseButton} onClick={copyResponse}>
                {responseCopied ? <Check size={12} /> : <Copy size={12} />}
                {responseCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Diagnostic({ error }: { error: Record<string, unknown> }) {
  const source = asString(error["source"]);
  const code = asString(error["code"]);
  const message = asString(error["message"]) ?? "Unknown OpenUI Lang error";
  const location = [
    asString(error["component"]),
    asString(error["statementId"]),
    asString(error["path"]),
  ].filter(Boolean);
  const hint = asString(error["hint"]);

  return (
    <div style={styles.diagnostic}>
      <div style={styles.diagnosticHeader}>
        {[source, code].filter(Boolean).join(" / ") || "error"}
      </div>
      <div>{message}</div>
      {location.length > 0 ? (
        <div style={styles.diagnosticLocation}>{location.join(" · ")}</div>
      ) : null}
      {hint ? <div style={styles.diagnosticHint}>{hint}</div> : null}
    </div>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const FONT = '"Inter", system-ui, sans-serif';
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const styles = {
  row: {
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "var(--oui-dt-bg)",
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  rowHeaderRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  // Width is fixed to match the empty slot plain rows reserve, so timestamps align.
  chevron: {
    display: "inline-flex",
    width: 14,
    flexShrink: 0,
    color: "var(--oui-dt-fg-muted)",
  },
  badgeGroup: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    minWidth: 0,
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    padding: "1px 8px",
    fontSize: 11,
    fontWeight: 500,
    fontFamily: FONT,
  },
  kind: {
    color: "var(--oui-dt-fg)",
    fontSize: 12,
    fontWeight: 700,
  },
  badgeStreaming: {
    background: "var(--oui-dt-success-bg)",
    color: "var(--oui-dt-success)",
    borderColor: "var(--oui-dt-success-border)",
  },
  time: {
    color: "var(--oui-dt-fg-faint)",
    fontSize: 11,
  },
  streamToggle: {
    width: "100%",
    border: "none",
    background: "transparent",
    color: "inherit",
    cursor: "pointer",
    fontFamily: FONT,
    padding: 0,
    textAlign: "left",
  },
  streamOverview: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 10px",
    color: "var(--oui-dt-fg-muted)",
    fontSize: 11,
    marginTop: 7,
    paddingLeft: 24,
  },
  errorSummary: {
    color: "var(--oui-dt-danger)",
    fontWeight: 600,
  },
  streamExpanded: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderTop: "1px solid var(--oui-dt-border-subtle)",
    marginTop: 4,
    paddingTop: 12,
  },
  streamSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  streamSectionTitle: {
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  responseActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  responseButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-secondary)",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 11,
    fontWeight: 500,
    padding: "4px 9px",
  },
  responseButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  responseCode: {
    maxHeight: 260,
    overflow: "auto",
    margin: 0,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg-muted)",
    color: "var(--oui-dt-fg-tertiary)",
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 1.5,
    padding: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  parserIssues: {
    borderRadius: 8,
    background: "var(--oui-dt-warning-bg)",
    color: "var(--oui-dt-warning-strong)",
    fontSize: 11,
    lineHeight: 1.45,
    padding: "6px 8px",
  },
  diagnosticList: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  diagnostic: {
    borderLeft: "2px solid var(--oui-dt-danger-border)",
    background: "var(--oui-dt-danger-bg)",
    color: "var(--oui-dt-fg-tertiary)",
    fontSize: 11,
    lineHeight: 1.45,
    padding: "7px 8px",
  },
  diagnosticHeader: {
    color: "var(--oui-dt-danger-strong)",
    fontFamily: MONO,
    fontWeight: 600,
    marginBottom: 3,
  },
  diagnosticLocation: {
    color: "var(--oui-dt-fg-muted)",
    fontFamily: MONO,
    marginTop: 3,
  },
  diagnosticHint: {
    color: "var(--oui-dt-fg-secondary)",
    fontStyle: "italic",
    marginTop: 4,
  },
} satisfies Record<string, CSSProperties>;
