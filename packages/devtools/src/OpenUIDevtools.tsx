"use client";

import {
  observability,
  type ObservabilityErrorInfo,
  type ObservabilityEvent,
} from "@openuidev/observability";
import { ArrowLeft, Check, Copy, WrapText, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { addOrReplaceEvent } from "./eventBuffer";
import { isLibraryEvent, useRegisteredLibraries } from "./libraryRegistry";
import { openPasteWindow, pasteMountNode, PasteModal, PasteUI } from "./paste";
import { getQuotaError, QuotaErrorRow } from "./QuotaErrorRow";
import { getReactLangStreamDetail, ReactLangStreamEventRow } from "./ReactLangStreamEventRow";
import { ShiroLogo } from "./ShiroLogo";
import { useDevtoolsSingleton } from "./singleton";
import { useDevtoolsConfig } from "./useDevtoolsConfig";

export type DevtoolsPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export interface OpenUIDevtoolsProps {
  /** Force the widget on/off. Defaults to on outside production builds. */
  enabled?: boolean;
  /** Corner for the floating toggle button. Defaults to "bottom-right". */
  position?: DevtoolsPosition;
  /** How many events to keep; oldest are dropped first. */
  maxEvents?: number;
  /** Initial state of the drawer's "errors only" display filter: only
   *  error/warning events (default) or every event. */
  errorsOnly?: boolean;
  /** Initial state of the drawer's "auto-open on error" checkbox. Defaults to true. */
  autoOpenOnError?: boolean;
  /**
   * @internal Set by react-lang's auto-mount. Auto-mounted instances yield to
   * any manually rendered <OpenUIDevtools /> so host-provided props win.
   */
  __autoMounted?: boolean;
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
  errorsOnly = false,
  autoOpenOnError = true,
  __autoMounted = false,
}: OpenUIDevtoolsProps) {
  const isEnabled =
    enabled ?? (typeof process === "undefined" || process.env["NODE_ENV"] !== "production");
  // Only one instance renders even when several are mounted (e.g. react-lang's
  // auto-mount plus a manual <OpenUIDevtools /> in the host's layout).
  const isSingleton = useDevtoolsSingleton(__autoMounted);
  const [events, setEvents] = useState<ObservabilityEvent[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ObservabilityEvent | null>(null);
  const [wrapStack, setWrapStack] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [popup, setPopup] = useState<Window | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [code, setCode] = useState("");
  const libraries = useRegisteredLibraries();
  const { config, setConfig, configRef } = useDevtoolsConfig({
    autoOpen: autoOpenOnError,
    onlyErrors: errorsOnly,
  });
  const { autoOpen, onlyErrors } = config;

  // Read configRef inside the (stable) subscription without re-subscribing.
  useEffect(() => {
    if (!isEnabled) return;
    return observability.listenAll((event) => {
      if (isLibraryEvent(event)) return;
      setEvents((prev) => addOrReplaceEvent(prev, event, maxEvents));
      if (event.level === "error" && configRef.current.autoOpen) setOpen(true);
    });
  }, [isEnabled, maxEvents, configRef]);

  // Escape steps back: paste → stack view → list → closed.
  useEffect(() => {
    if (!open && !pasteOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pasteOpen) setPasteOpen(false);
      else if (selected) setSelected(null);
      else setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, selected, pasteOpen]);

  useEffect(() => {
    if (!popup) return;
    const onGone = () => setPopup(null);
    popup.addEventListener("pagehide", onGone);
    return () => popup.removeEventListener("pagehide", onGone);
  }, [popup]);

  if (!isEnabled || !isSingleton) return null;

  const errorCount = events.filter((event) => event.level === "error").length;
  const visibleEvents = onlyErrors ? events.filter((event) => event.level !== "info") : events;

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

  const closePaste = () => {
    if (popup) {
      popup.close();
      setPopup(null);
    }
    setPasteOpen(false);
    setPopupBlocked(false);
  };

  const ejectPaste = () => {
    const next = openPasteWindow();
    if (!next) {
      setPopupBlocked(true);
      return;
    }
    setPopupBlocked(false);
    setPopup(next);
    setPasteOpen(false);
  };

  const openPaste = () => {
    setPopupBlocked(false);
    if (popup && !popup.closed) {
      popup.focus();
      return;
    }
    if (popup) setPopup(null);
    setPasteOpen(true);
  };

  const paste = (
    <PasteUI
      libraries={libraries}
      code={code}
      onCodeChange={setCode}
      ejected={Boolean(popup)}
      onEject={ejectPaste}
      onClose={closePaste}
      popupBlocked={popupBlocked}
    />
  );
  const popupRoot = popup ? pasteMountNode(popup) : null;

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
                  <ArrowLeft size={14} />
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
                    <WrapText size={12} />
                    Wrap
                  </button>
                  <button style={styles.textButton} onClick={copyStack}>
                    {copied ? <Check size={12} /> : <Copy size={12} />}
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
                <X size={15} />
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
              <div style={styles.controlsRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={autoOpen}
                    onChange={(event) => setConfig({ autoOpen: event.target.checked })}
                  />
                  Auto-open on error
                </label>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={onlyErrors}
                    onChange={(event) => setConfig({ onlyErrors: event.target.checked })}
                  />
                  Errors only
                </label>
              </div>
              <div style={styles.pasteRow}>
                <span style={styles.pasteHint}>
                  {libraries.length === 0
                    ? "Paste previews OpenUI Lang with this app’s components once a library is registered."
                    : "Paste OpenUI Lang to preview it with this app’s components."}
                </span>
                <button
                  style={{
                    ...styles.pasteLink,
                    ...(libraries.length === 0 ? styles.textButtonDisabled : null),
                  }}
                  disabled={libraries.length === 0}
                  title={
                    libraries.length === 0
                      ? "No createLibrary() call detected"
                      : popup && !popup.closed
                        ? "Switch to OpenUI Paste window"
                        : "Open OpenUI Paste"
                  }
                  aria-label="Open OpenUI Paste"
                  onClick={openPaste}
                >
                  Open
                </button>
              </div>
              <div style={styles.list}>
                {visibleEvents.length === 0 ? (
                  <div style={styles.empty}>No events captured yet.</div>
                ) : (
                  visibleEvents.map((event, index) => {
                    const key =
                      typeof event.detail["id"] === "string"
                        ? event.detail["id"]
                        : `${event.timestamp}-${index}`;
                    const quotaError = getQuotaError(event);
                    if (quotaError) return <QuotaErrorRow key={key} info={quotaError} />;
                    const stream = getReactLangStreamDetail(event);
                    if (stream) {
                      return (
                        <ReactLangStreamEventRow
                          key={key}
                          event={event}
                          stream={stream}
                          canOpenInPaste={libraries.length > 0}
                          onOpenInPaste={(response) => {
                            setCode(response);
                            openPaste();
                          }}
                        />
                      );
                    }

                    const error = getErrorInfo(event);
                    const detail = asRecord(event.detail);
                    const kind = asString(detail["kind"]);
                    const status =
                      typeof detail["status"] === "number" ? String(detail["status"]) : undefined;
                    const message = error?.message ?? asString(detail["message"]);
                    return (
                      <div key={key} style={styles.row}>
                        <div style={styles.rowHeader}>
                          <div style={styles.badgeGroup}>
                            <span style={{ ...styles.badge, ...badgeByLevel[event.level] }}>
                              {event.level}
                            </span>
                            {kind ? (
                              <span style={{ ...styles.badge, ...styles.badgeNeutral }}>
                                {kind}
                              </span>
                            ) : null}
                            {status ? (
                              <span style={{ ...styles.badge, ...styles.badgeNeutral }}>
                                {status}
                              </span>
                            ) : null}
                          </div>
                          <span style={styles.time}>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        {message ? (
                          <div style={styles.summary}>{message}</div>
                        ) : kind ? null : (
                          <div style={styles.summary}>{summarize(event)}</div>
                        )}
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
      {popupRoot ? createPortal(paste, popupRoot) : null}
      {!popup ? (
        <PasteModal open={pasteOpen} onClose={() => setPasteOpen(false)}>
          {paste}
        </PasteModal>
      ) : null}
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
  error: { background: "#fef2f2", color: "#b91c1c", borderColor: "#fecaca" },
  warning: { background: "#fffbeb", color: "#b45309", borderColor: "#fde68a" },
  info: { background: "#eff6ff", color: "#1d4ed8", borderColor: "#bfdbfe" },
};

const positionStyles: Record<DevtoolsPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
};

// Mirrors react-ui's look (Inter, hairline borders, soft shadows) without
// depending on it — values, not tokens.
const FONT = '"Inter", system-ui, sans-serif';
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(0, 0, 0, 0.08)",
    background: "#18181b",
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.16)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  },
  toggleError: {
    background: "#b91c1c",
    borderColor: "#fecaca",
  },
  toggleCount: {
    position: "absolute",
    top: -6,
    right: -6,
    boxSizing: "border-box",
    minWidth: 16,
    height: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    background: "#dc2626",
    border: "2px solid #fff",
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    padding: "0 3px",
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "rgba(24, 24, 27, 0.4)",
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
    top: 12,
    right: 12,
    bottom: 12,
    boxSizing: "border-box",
    width: "min(420px, calc(100vw - 24px))",
    display: "flex",
    flexDirection: "column",
    border: "1px solid #e4e4e7",
    borderRadius: 16,
    background: "#ffffff",
    color: "#18181b",
    fontFamily: FONT,
    fontSize: 13,
    boxShadow: "0 16px 48px rgba(24, 24, 27, 0.18)",
    transform: "translateX(calc(100% + 12px))",
    transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
    overflow: "hidden",
  },
  drawerOpen: {
    transform: "translateX(0)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
    borderBottom: "1px solid #f4f4f5",
    fontWeight: 600,
    fontSize: 14,
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
    gap: 6,
    flexShrink: 0,
  },
  textButton: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid #e4e4e7",
    borderRadius: 8,
    background: "#ffffff",
    color: "#3f3f46",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
  },
  textButtonActive: {
    background: "#18181b",
    borderColor: "#18181b",
    color: "#ffffff",
  },
  textButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#71717a",
    cursor: "pointer",
    padding: 0,
  },
  controlsRow: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "10px 16px",
    borderBottom: "1px solid #f4f4f5",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#52525b",
    fontSize: 12,
    cursor: "pointer",
    accentColor: "#18181b",
  },
  pasteRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: "10px 16px",
    borderBottom: "1px solid #f4f4f5",
  },
  pasteHint: {
    color: "#52525b",
    fontSize: 12,
    lineHeight: 1.4,
    minWidth: 0,
  },
  pasteLink: {
    flexShrink: 0,
    border: "none",
    background: "transparent",
    color: "#18181b",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 600,
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  list: {
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  empty: {
    color: "#a1a1aa",
    padding: "32px 0",
    textAlign: "center",
  },
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
  badgeCredits: {
    background: "#fef3c7",
    color: "#92400e",
    borderColor: "#fde68a",
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
  badgeNeutral: {
    background: "#f4f4f5",
    color: "#52525b",
    borderColor: "#e4e4e7",
    fontFamily: MONO,
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
  time: {
    color: "#a1a1aa",
    fontSize: 11,
  },
  summary: {
    wordBreak: "break-word",
    color: "#3f3f46",
    fontSize: 12,
    lineHeight: 1.5,
  },
  stackButton: {
    alignSelf: "flex-start",
    border: "none",
    background: "transparent",
    color: "#52525b",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    padding: 0,
    textDecoration: "underline",
    textUnderlineOffset: 2,
  },
  stackBody: {
    flex: 1,
    overflow: "auto",
    padding: "8px 0",
    background: "#fafafa",
    fontFamily: MONO,
    fontSize: 11,
    color: "#3f3f46",
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
    color: "#a1a1aa",
    userSelect: "none",
    padding: "0 4px",
    borderRight: "1px solid #e4e4e7",
  },
  lineText: {
    whiteSpace: "pre",
  },
  lineTextWrap: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
} satisfies Record<string, CSSProperties>;
