import { type ObservabilityEvent } from "@openuidev/observability";
import { Bug, Check, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { useMemo, useState, type CSSProperties, type ReactNode } from "react";
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
  const [hovered, setHovered] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);
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
    <div
      style={{ ...styles.row, ...(hovered ? styles.rowHover : null) }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
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
            <span style={{ ...styles.chevron, ...(hovered ? styles.chevronHover : null) }}>
              {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </div>
        </div>
        <div style={styles.streamOverview}>
          {visibleErrors.length > 0 ? (
            <Tally count={visibleErrors.length} danger>
              error{visibleErrors.length === 1 ? "" : "s"}
            </Tally>
          ) : null}
          {statementCount !== undefined ? (
            <Tally count={statementCount}>statement{statementCount === 1 ? "" : "s"}</Tally>
          ) : null}
          {orphaned.length > 0 ? (
            <Tally count={orphaned.length}>
              orphaned statement{orphaned.length === 1 ? "" : "s"}
            </Tally>
          ) : null}
        </div>
      </button>

      {expanded ? (
        <div style={styles.streamExpanded}>
          <section style={styles.responseActions}>
            <span style={styles.responseActionsLabel}>Actions</span>
            <div style={styles.responseActionsButtons}>
              <button
                type="button"
                style={{
                  ...styles.responseButton,
                  ...(openInPasteDisabled ? styles.responseButtonDisabled : null),
                  ...(hoveredAction === "debug" ? styles.responseButtonHover : null),
                }}
                onMouseEnter={() => setHoveredAction("debug")}
                onMouseLeave={() => setHoveredAction(null)}
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
                        : "Open this response in OpenUI Debug"
                }
                aria-label="Debug"
              >
                <Bug size={12} />
                Debug
              </button>
              <button
                type="button"
                style={{
                  ...styles.responseButton,
                  ...(hoveredAction === "copy" ? styles.responseButtonHover : null),
                }}
                onMouseEnter={() => setHoveredAction("copy")}
                onMouseLeave={() => setHoveredAction(null)}
                onClick={copyResponse}
              >
                {responseCopied ? <Check size={12} /> : <Copy size={12} />}
                {responseCopied ? "Copied" : "Copy"}
              </button>
            </div>
          </section>

          {visibleErrors.length > 0 ? (
            <section style={styles.streamSection}>
              <div style={styles.streamSectionTitle}>
                Errors <span style={styles.streamSectionCount}>{visibleErrors.length}</span>
              </div>
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
          </section>
        </div>
      ) : null}
    </div>
  );
}

/**
 * One overview stat: the number in a circle, then what it counts. Errors get
 * the danger tint so severity still reads at a glance.
 */
function Tally({
  count,
  danger = false,
  children,
}: {
  count: number;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <span style={styles.tally}>
      <span style={{ ...styles.tallyCount, ...(danger ? styles.tallyCountDanger : null) }}>
        {count}
      </span>
      {children}
    </span>
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
  // Longhands, not the `border` shorthand: rowHover overrides borderColor, and
  // React blanks a shorthand's longhands when a later style touches one of them.
  row: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--oui-dt-border)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "var(--oui-dt-card)",
    transition: "border-color 150ms ease, box-shadow 150ms ease",
  },
  // Only this row expands, so hover is the affordance that says so.
  rowHover: {
    borderColor: "var(--oui-dt-border-strong)",
    boxShadow: "var(--oui-dt-shadow-subtle)",
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
  // Sized like an icon button so it can take the same fill; the card's own
  // hover drives it, since the whole card is the toggle.
  chevron: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    width: 22,
    height: 22,
    flexShrink: 0,
    borderRadius: 6,
    color: "var(--oui-dt-fg-muted)",
    transition: "background 150ms ease, color 150ms ease",
  },
  chevronHover: {
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg)",
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
    fontWeight: 600,
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
  tally: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
  },
  tallyCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    minWidth: 14,
    height: 14,
    padding: "0 3px",
    borderRadius: 999,
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 10,
    lineHeight: 1,
  },
  tallyCountDanger: {
    background: "var(--oui-dt-danger-bg)",
    color: "var(--oui-dt-danger)",
  },
  streamExpanded: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
    marginTop: 4,
    paddingTop: 12,
  },
  streamSection: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  streamSectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 11,
  },
  streamSectionCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 16,
    height: 16,
    borderRadius: 999,
    padding: "0 5px",
    boxSizing: "border-box",
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg-muted)",
    fontSize: 10,
    lineHeight: 1,
  },
  // Label and buttons share one unstroked panel: label left, buttons right.
  responseActions: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 8,
    background: "var(--oui-dt-bg-muted)",
    padding: "8px 8px 8px 14px",
  },
  responseActionsLabel: {
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 11,
  },
  responseActionsButtons: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  responseButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid var(--oui-dt-control-border)",
    borderRadius: 8,
    background: "var(--oui-dt-control-bg)",
    color: "var(--oui-dt-fg)",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 11,
    padding: "4px 9px",
    boxShadow: "var(--oui-dt-shadow-subtle)",
    transition: "transform 150ms ease",
  },
  responseButtonHover: {
    transform: "scale(0.96)",
  },
  responseButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  responseCode: {
    maxHeight: 260,
    overflow: "auto",
    margin: 0,
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
