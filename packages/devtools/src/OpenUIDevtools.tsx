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

  useEffect(() => {
    if (!isEnabled) return;
    return bus.subscribeAll((event) => {
      if (errorsOnly && event.severity === "info") return;
      setEvents((prev) => [event, ...prev].slice(0, maxEvents));
    });
  }, [bus, isEnabled, errorsOnly, maxEvents]);

  if (!isEnabled) return null;

  const errorCount = events.filter((event) => event.severity === "error").length;

  return (
    <div style={styles.root}>
      {open ? (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span>OpenUI Devtools</span>
            <button style={styles.headerButton} onClick={() => setEvents([])}>
              clear
            </button>
          </div>
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
                      <details style={styles.details}>
                        <summary style={styles.detailsSummary}>stack trace</summary>
                        <pre style={styles.stack}>{error.stack}</pre>
                      </details>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : null}
      <button
        style={{ ...styles.toggle, ...(errorCount > 0 ? styles.toggleError : null) }}
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Toggle OpenUI devtools"
      >
        <ShiroLogo size={22} />
        {errorCount > 0 ? <span style={styles.toggleCount}>{errorCount}</span> : null}
      </button>
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

const styles = {
  root: {
    position: "fixed",
    bottom: 16,
    right: 16,
    zIndex: 2147483000,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 8,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
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
    color: "#fafafa",
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
  panel: {
    width: 380,
    maxHeight: 480,
    display: "flex",
    flexDirection: "column",
    borderRadius: 8,
    border: "1px solid #3f3f46",
    background: "#18181b",
    color: "#fafafa",
    overflow: "hidden",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
  },
  panelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid #3f3f46",
    fontWeight: 600,
  },
  headerButton: {
    border: "1px solid #3f3f46",
    borderRadius: 4,
    background: "transparent",
    color: "#a1a1aa",
    cursor: "pointer",
    fontSize: 11,
    padding: "2px 8px",
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
  },
  time: {
    color: "#71717a",
    fontSize: 11,
  },
  summary: {
    wordBreak: "break-word",
  },
  details: {
    marginTop: 2,
  },
  detailsSummary: {
    cursor: "pointer",
    color: "#a1a1aa",
    fontSize: 11,
  },
  stack: {
    margin: "4px 0 0",
    padding: 8,
    background: "#09090b",
    borderRadius: 4,
    overflowX: "auto",
    whiteSpace: "pre",
    fontSize: 11,
    color: "#fca5a5",
  },
} satisfies Record<string, CSSProperties>;
