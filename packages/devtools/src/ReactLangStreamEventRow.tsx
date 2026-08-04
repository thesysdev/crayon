import { type ObservabilityEvent } from "@openuidev/observability";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useState, type CSSProperties } from "react";

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
}: {
  event: ObservabilityEvent;
  stream: ReactLangStreamDetail;
}) {
  const [expanded, setExpanded] = useState(false);
  const [responseCopied, setResponseCopied] = useState(false);
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
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span style={{ ...styles.badge, ...badgeByLevel[event.level] }}>{event.level}</span>
            <span style={{ ...styles.badge, ...styles.badgeNeutral }}>OpenUI Lang stream</span>
            {isStreaming ? (
              <span style={{ ...styles.badge, ...styles.badgeStreaming }}>Streaming</span>
            ) : null}
          </div>
          <span style={styles.time}>{new Date(event.timestamp).toLocaleTimeString()}</span>
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
            <div style={styles.responseHeader}>
              <div style={styles.streamSectionTitle}>Response</div>
              <button type="button" style={styles.copyResponseButton} onClick={copyResponse}>
                {responseCopied ? <Check size={12} /> : <Copy size={12} />}
                {responseCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre style={styles.responseCode}>{stream.response || "(empty response)"}</pre>
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

const badgeByLevel: Record<ObservabilityEvent["level"], CSSProperties> = {
  error: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" },
  warning: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  info: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
};

const styles = {
  row: {
    border: "1px solid #e4e4e7",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "#ffffff",
    boxShadow: "0 1px 2px rgba(24, 24, 27, 0.04)",
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
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
  badgeNeutral: {
    background: "#f4f4f5",
    color: "#52525b",
    borderColor: "#e4e4e7",
    fontFamily: MONO,
  },
  badgeStreaming: {
    background: "#ecfdf5",
    color: "#047857",
    borderColor: "#a7f3d0",
  },
  time: {
    color: "#a1a1aa",
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
    color: "#71717a",
    fontSize: 11,
    marginTop: 7,
    paddingLeft: 20,
  },
  errorSummary: {
    color: "#b91c1c",
    fontWeight: 600,
  },
  streamExpanded: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    borderTop: "1px solid #f4f4f5",
    marginTop: 4,
    paddingTop: 12,
  },
  streamSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  streamSectionTitle: {
    color: "#52525b",
    fontSize: 11,
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  },
  responseHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  copyResponseButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "none",
    background: "transparent",
    color: "#52525b",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 11,
    padding: 0,
  },
  responseCode: {
    maxHeight: 260,
    overflow: "auto",
    margin: 0,
    border: "1px solid #e4e4e7",
    borderRadius: 8,
    background: "#fafafa",
    color: "#27272a",
    fontFamily: MONO,
    fontSize: 11,
    lineHeight: 1.5,
    padding: 10,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  parserIssues: {
    borderRadius: 8,
    background: "#fffbeb",
    color: "#92400e",
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
    borderLeft: "2px solid #fca5a5",
    background: "#fef2f2",
    color: "#3f3f46",
    fontSize: 11,
    lineHeight: 1.45,
    padding: "7px 8px",
  },
  diagnosticHeader: {
    color: "#991b1b",
    fontFamily: MONO,
    fontWeight: 600,
    marginBottom: 3,
  },
  diagnosticLocation: {
    color: "#71717a",
    fontFamily: MONO,
    marginTop: 3,
  },
  diagnosticHint: {
    color: "#52525b",
    fontStyle: "italic",
    marginTop: 4,
  },
} satisfies Record<string, CSSProperties>;
