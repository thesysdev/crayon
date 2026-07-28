"use client";

import {
  observability,
  type ObservabilityErrorInfo,
  type ObservabilityEvent,
} from "@openuidev/observability";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ShiroLogo } from "./ShiroLogo";

export type DevtoolsPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface OpenUIDevtoolsProps {
  /** Force the widget on/off. Defaults to on outside production builds. */
  enabled?: boolean;
  /** Corner for the floating toggle button. Defaults to "bottom-right". */
  position?: DevtoolsPosition;
  /** How many events to keep; oldest are dropped first. */
  maxEvents?: number;
  /** Capture only error/warning events (default) or every event. */
  errorsOnly?: boolean;
  /** Initial state of the drawer's "auto-open on error" checkbox. Defaults to true. */
  autoOpenOnError?: boolean;
}

/**
 * dev-only widget that surfaces events captured by `@openuidev/observability` —
 * a Shiro-logo button (with an error-count badge) that opens a left side drawer
 * listing every captured event; selecting one drills into its stack trace. A
 * checkbox in the drawer controls whether it auto-opens on error. Renders
 * nothing in production unless `enabled` is set explicitly.
 */
export function OpenUIDevtools({
  enabled,
  position = "bottom-right",
  maxEvents = 50,
  errorsOnly = true,
  autoOpenOnError = true,
}: OpenUIDevtoolsProps) {
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ObservabilityEvent | null>(null);
  const [wrapStack, setWrapStack] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoOpen, setAutoOpen] = useState(autoOpenOnError);

  // Read the live checkbox value inside the (stable) subscription without re-subscribing.
  const autoOpenRef = useRef(autoOpen);
  autoOpenRef.current = autoOpen;

  useEffect(() => {
    if (!isEnabled) return;
    return observability.listenAll((event) => {
      if (errorsOnly && event.level === "info") return;
      setEvents((prev) => [event, ...prev].slice(0, maxEvents));
      if (event.level === "error" && autoOpenRef.current) setOpen(true);
    });
  }, [isEnabled, errorsOnly, maxEvents]);

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

  const errorCount = events.filter((event) => event.level === "error").length;

  const openDrawer = () => {
    setSelected(null);
    setOpen(true);
  };

  const showStack = (event: ObservabilityEvent) => {
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
    <>
      <div style={{ ...styles.toggleWrap, ...positionStyles[position] }}>
        <button
          style={{ ...styles.toggle, ...(errorCount > 0 ? styles.toggleError : null) }}
          onClick={openDrawer}
          aria-label="Open OpenUI devtools"
          aria-expanded={open}
        >
          <ShiroLogo size={22} />
          {errorCount > 0 ? <span style={styles.toggleCount}>{errorCount}</span> : null}
        </button>
      </div>

      {/* Kept mounted so open/close can transition; hidden + inert when closed. */}
      <div
        style={{ ...styles.backdrop, ...(open ? styles.backdropOpen : null) }}
        onClick={() => setOpen(false)}
      >
        <aside
          style={{ ...styles.drawer, ...(open ? styles.drawerOpen : null) }}
          role="dialog"
          aria-modal="true"
          aria-label="OpenUI devtools"
          onClick={(event) => event.stopPropagation()}
        >
          <div style={styles.header}>
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
              <span style={styles.title}>
                {selected ? `${selected.level} — stack trace` : "OpenUI Devtools"}
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
                    {copied ? "Copied" : "Copy"}
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
                ✕
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
            <>
              <label style={styles.autoOpenRow}>
                <input
                  type="checkbox"
                  checked={autoOpen}
                  onChange={(event) => setAutoOpen(event.target.checked)}
                />
                Auto-open on error
              </label>
              <div style={styles.list}>
                {events.length === 0 ? (
                  <div style={styles.empty}>No events captured yet.</div>
                ) : (
                  events.map((event, index) => {
                    const error = getErrorInfo(event);
                    return (
                      <div key={`${event.timestamp}-${index}`} style={styles.row}>
                        <div style={styles.rowHeader}>
                          <span style={{ ...styles.badge, ...badgeByLevel[event.level] }}>
                            {event.level}
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
            </>
          )}
        </aside>
      </div>
    </>
  );
}

function asRecord(detail: unknown): Record<string, unknown> {
  return typeof detail === "object" && detail !== null ? (detail as Record<string, unknown>) : {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getErrorInfo(event: ObservabilityEvent): ObservabilityErrorInfo | undefined {
  const error = asRecord(event.detail)["error"];
  if (typeof error === "object" && error !== null && "message" in error) {
    return error as ObservabilityErrorInfo;
  }
  return undefined;
}

/**
 * Best-effort one-line summary from conventional detail fields
 * (kind/component/toolName/target/method+url/status/message/error.message).
 * Falls back to JSON for unconventional payloads.
 */
function summarize(event: ObservabilityEvent): string {
  const detail = asRecord(event.detail);
  const error = getErrorInfo(event);
  const method = asString(detail["method"]);
  const url = asString(detail["url"]);
  const subject =
    asString(detail["kind"]) ??
    asString(detail["component"]) ??
    asString(detail["toolName"]) ??
    asString(detail["target"]) ??
    (url ? [method, url].filter(Boolean).join(" ") : undefined);
  const status = typeof detail["status"] === "number" ? `→ ${detail["status"]}` : undefined;
  const message = error ? `— ${error.message}` : asString(detail["message"]);

  const parts = [subject, status, message].filter(Boolean);
  if (parts.length > 0) return parts.join(" ");
  try {
    return JSON.stringify(event.detail) ?? "(no detail)";
  } catch {
    return "(no detail)";
  }
}

const badgeByLevel: Record<ObservabilityEvent["level"], CSSProperties> = {
  error: { background: "#7f1d1d", color: "#fecaca" },
  warning: { background: "#78350f", color: "#fde68a" },
  info: { background: "#1e3a5f", color: "#bfdbfe" },
};

const positionStyles: Record<DevtoolsPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
};

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const styles = {
  toggleWrap: {
    position: "fixed",
    // Max 32-bit signed int — sit above any app chrome.
    zIndex: 2147483647,
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
    // Max 32-bit signed int — the open drawer sits above everything, including the toggle.
    zIndex: 2147483647,
    opacity: 0,
    visibility: "hidden",
    pointerEvents: "none",
    transition: "opacity 200ms ease, visibility 0s linear 200ms",
  },
  backdropOpen: {
    opacity: 1,
    visibility: "visible",
    pointerEvents: "auto",
    transition: "opacity 200ms ease, visibility 0s",
  },
  drawer: {
    position: "fixed",
    top: 0,
    right: 0,
    bottom: 0,
    width: "min(420px, 100vw)",
    display: "flex",
    flexDirection: "column",
    borderLeft: "1px solid #3f3f46",
    background: "#18181b",
    color: "#fafafa",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontSize: 12,
    boxShadow: "-8px 0 32px rgba(0, 0, 0, 0.5)",
    transform: "translateX(100%)",
    transition: "transform 200ms ease",
  },
  drawerOpen: {
    transform: "translateX(0)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderBottom: "1px solid #3f3f46",
    fontWeight: 600,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    minWidth: 0,
  },
  title: {
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
  autoOpenRow: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 12px",
    borderBottom: "1px solid #27272a",
    color: "#a1a1aa",
    cursor: "pointer",
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
    flex: 1,
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
