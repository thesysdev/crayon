"use client";

import {
  observer,
  type Observer,
  type ObserverErrorInfo,
  type ObserverEvent,
} from "@openuidev/observer";
import { useEffect, useState, type CSSProperties } from "react";
import { ShiroLogo } from "./ShiroLogo";

export interface OpenUIDevtoolsProps {
  /** Force the widget on/off. Defaults to on outside production builds. */
  enabled?: boolean;
  /** How many events to keep; oldest are dropped first. */
  maxEvents?: number;
  /** Capture only error/warning events (default) or every event. */
  errorsOnly?: boolean;
  /** Observer instance to listen to. Defaults to the shared singleton. */
  bus?: Observer;
}

/**
 * dev-only widget that surfaces events captured by
 * `@openuidev/observer` — a badge with the error count, expanding into a panel
 * with type, message, and stack trace per event. Renders nothing in
 * production unless `enabled` is set explicitly.
 */
export function OpenUIDevtools({
  enabled,
  maxEvents = 50,
  errorsOnly = true,
  bus = observer,
}: OpenUIDevtoolsProps) {
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");
  const [events, setEvents] = useState<ObserverEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ObserverEvent | null>(null);
  const [wrapStack, setWrapStack] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isEnabled) return;
    return bus.subscribeAll((event) => {
      if (errorsOnly && event.severity === "info") return;
      setEvents((prev) => [event, ...prev].slice(0, maxEvents));
    });
  }, [bus, isEnabled, errorsOnly, maxEvents]);

  // Escape steps back: stack view → list, list → closed.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (selected) setSelected(null);
      else setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, selected]);

  if (!isEnabled) return null;

  const errorCount = events.filter((event) => event.severity === "error").length;

  const openDialog = () => {
    setSelected(null);
    setOpen(true);
  };

  const showStack = (event: ObserverEvent) => {
    setSelected(event);
    setCopied(false);
  };

  const copyStack = () => {
    if (!selected || typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard
      .writeText(getErrorInfo(selected)?.stack ?? "")
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };

  const selectedStack = selected ? (getErrorInfo(selected)?.stack ?? "") : "";

  return (
    <div style={styles.root}>
      <button
        style={{ ...styles.toggle, ...(errorCount > 0 ? styles.toggleError : null) }}
        onClick={openDialog}
        aria-label="Open OpenUI devtools"
        aria-expanded={open}
      >
        <ShiroLogo size={22} />
        {errorCount > 0 ? <span style={styles.toggleCount}>{errorCount}</span> : null}
      </button>

      {/* Kept mounted so open/close can transition; hidden + inert when closed. */}
      <div
        style={{ ...styles.backdrop, ...(open ? styles.backdropOpen : null) }}
        onClick={() => setOpen(false)}
      >
        <div
          style={{ ...styles.dialog, ...(open ? styles.dialogOpen : null) }}
          role="dialog"
          aria-modal="true"
          aria-label="OpenUI devtools"
          onClick={(event) => event.stopPropagation()}
        >
          <div style={styles.dialogHeader}>
            <div style={styles.headerLeft}>
              {selected ? (
                <button
                  style={styles.iconButton}
                  onClick={() => setSelected(null)}
                  aria-label="Back to event list"
                >
                  ←
                </button>
              ) : null}
              <span style={styles.dialogTitle}>
                {selected ? `${selected.type} — stack trace` : "OpenUI Devtools"}
              </span>
            </div>
            <div style={styles.headerActions}>
              {selected ? (
                <>
                  <button
                    style={{
                      ...styles.textButton,
                      ...(wrapStack ? styles.textButtonActive : null),
                    }}
                    onClick={() => setWrapStack((prev) => !prev)}
                    aria-pressed={wrapStack}
                  >
                    Wrap
                  </button>
                  <button style={styles.textButton} onClick={copyStack}>
                    {copied ? "copied" : "copy"}
                  </button>
                </>
              ) : (
                <button style={styles.textButton} onClick={() => setEvents([])}>
                  Clear
                </button>
              )}
              <button
                style={styles.iconButton}
                onClick={() => setOpen(false)}
                aria-label="Close OpenUI devtools"
              >
                Close
              </button>
            </div>
          </div>

          {selected ? (
            <div style={styles.stackBody}>
              {selectedStack.split("\n").map((line, index) => (
                <div key={index} style={styles.stackLine}>
                  <span style={styles.lineNumber}>{index + 1}</span>
                  <span style={{ ...styles.lineText, ...(wrapStack ? styles.lineTextWrap : null) }}>
                    {line || " "}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={styles.list}>
              {events.length === 0 ? (
                <div style={styles.empty}>No events captured yet.</div>
              ) : (
                events.map((event, index) => {
                  const error = getErrorInfo(event);
                  return (
                    <div key={`${event.timestamp}-${index}`} style={styles.row}>
                      <div style={styles.rowHeader}>
                        <span style={{ ...styles.badge, ...badgeBySeverity[event.severity] }}>
                          {event.type}
                        </span>
                        <span style={styles.time}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div style={styles.summary}>{summarize(event)}</div>
                      {error?.stack ? (
                        <button style={styles.stackButton} onClick={() => showStack(event)}>
                          Stack Trace
                        </button>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getErrorInfo(event: ObserverEvent): ObserverErrorInfo | undefined {
  const error = asRecord(event.detail)["error"];
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ObserverErrorInfo;
  }
  return undefined;
}

/**
 * Best-effort one-line summary from the conventional detail fields
 * (component/toolName/target/method+url/status/error.message). Falls back to
 * JSON for unconventional payloads.
 */
function summarize(event: ObserverEvent): string {
  const detail = asRecord(event.detail);
  const error = getErrorInfo(event);
  const method = asString(detail["method"]);
  const url = asString(detail["url"]);
  const subject =
    asString(detail["component"]) ??
    asString(detail["toolName"]) ??
    asString(detail["target"]) ??
    (url ? [method, url].filter(Boolean).join(" ") : undefined);
  const status = typeof detail["status"] === "number" ? `→ ${detail["status"]}` : undefined;
  const message = error ? `— ${error.message}` : undefined;

  const parts = [subject, status, message].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  try {
    return JSON.stringify(event.detail) ?? event.type;
  } catch {
    return event.type;
  }
}

const badgeBySeverity: Record<ObserverEvent["severity"], CSSProperties> = {
  error: { background: "#7f1d1d", color: "#fecaca" },
  warning: { background: "#78350f", color: "#fde68a" },
  info: { background: "#1e3a5f", color: "#bfdbfe" },
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const styles = {
  root: {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 2147483000,
  },
  toggle: {
    position: "relative",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "#fff",
    cursor: "pointer",
  },
  toggleError: {
    background: "#7f1d1d",
    borderColor: "#dc2626",
  },
  toggleCount: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#dc2626",
    color: "#fff",
    fontSize: 10,
    fontWeight: 700,
    padding: "0 4px",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2147483001,
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    transition: "opacity 160ms ease, visibility 0s linear 160ms",
  },
  backdropOpen: {
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
    transition: "opacity 160ms ease, visibility 0s",
  },
  dialog: {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 12,
    width: "min(720px, calc(100vw - 32px))",
    maxHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    borderRadius: 8,
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "#fafafa",
    overflow: "hidden",
    boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
    opacity: 0,
    transform: "translateY(8px) scale(0.98)",
    transition: "opacity 160ms ease, transform 160ms ease",
  },
  dialogOpen: {
    opacity: 1,
    transform: "translateY(0) scale(1)",
  },
  dialogHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: "1px solid #3f3f46",
    fontWeight: 600,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  dialogTitle: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  textButton: {
    border: "1px solid #3f3f46",
    borderRadius: 4,
    background: "transparent",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 11,
    padding: "2px 8px",
  },
  textButtonActive: {
    background: "#3f3f46",
    color: "#fafafa",
  },
  iconButton: {
    border: "none",
    background: "transparent",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 16,
    lineHeight: 1,
    padding: "0 2px",
  },
  list: {
    overflowY: "auto",
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    color: "#a1a1aa",
    padding: 8,
  },
  row: {
    border: "1px solid #27272a",
    borderRadius: 6,
    padding: 8,
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    borderRadius: 4,
    padding: "1px 6px",
    fontSize: 11,
    fontFamily: MONO,
  },
  time: {
    color: "#71717a",
    fontSize: 11,
  },
  summary: {
    wordBreak: "break-word",
  },
  stackButton: {
    alignSelf: "flex-start",
    border: "none",
    background: "transparent",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 11,
    padding: 0,
    textDecoration: "underline",
  },
  stackBody: {
    overflow: "auto",
    padding: "8px 0",
    background: "#09090b",
    fontFamily: MONO,
    fontSize: 11,
    color: "#fca5a5",
  },
  stackLine: {
    display: "flex",
    gap: 8,
    paddingRight: 12,
  },
  lineNumber: {
    flexShrink: 0,
    width: 32,
    textAlign: "right",
    color: "#52525b",
    userSelect: "none",
    padding: "0 4px",
    borderRight: "1px solid #27272a",
  },
  lineText: {
    whiteSpace: "pre",
  },
  lineTextWrap: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
} satisfies Record<string, CSSProperties>;
