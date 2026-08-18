"use client";

import {
  observability,
  type ObservabilityErrorInfo,
  type ObservabilityEvent,
} from "@openuidev/observability";
import { ArrowLeft, Check, Copy, Inbox, RotateCcw, Settings, WrapText, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { addOrReplaceEvent } from "./eventBuffer";
import { IconButton } from "./IconButton";
import { LevelIcon } from "./LevelIcon";
import { isLibraryEvent, useRegisteredLibraries } from "./libraryRegistry";
import { openPasteWindow, pasteMountNode, PasteUI } from "./paste";
import { getQuotaError, QuotaErrorRow } from "./QuotaErrorRow";
import { getReactLangStreamDetail, ReactLangStreamEventRow } from "./ReactLangStreamEventRow";
import { ShiroLogo } from "./ShiroLogo";
import { useDevtoolsSingleton } from "./singleton";
import { DEFAULT_COLOR_SCHEME, DevtoolsSchemeProvider, themeVars, type ColorScheme } from "./theme";
import { ThemeSegmented } from "./ThemeToggle";
import { useDevtoolsConfig, type DevtoolsConfig } from "./useDevtoolsConfig";

const RELIABILITY_DOCS_URL = "https://www.openui.com/docs/openui-lang/reliability";

/** Uniform row height for the settings menu, set by its tallest control. */
const MENU_ROW_HEIGHT = 28;

/**
 * Tray geometry. The two trays together fill a block anchored to the bottom
 * right — 85% of the viewport, capped so it stops growing on very large
 * displays. Inspect keeps a fixed width and Debug takes whatever is left,
 * overlapping Inspect rather than collapsing once it hits its floor.
 */
const TRAY_EDGE = 12;
const TRAY_GAP = 12;
const INSPECT_WIDTH = 480;
const DEBUG_MIN_WIDTH = 360;
const BLOCK_W = `min(85vw, 3456px)`;
const BLOCK_H = `min(85vh, 2234px)`;

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
   * Initial widget chrome theme. Never auto-detected — change it under
   * Settings > Theme and the choice persists across reloads.
   */
  theme?: ColorScheme;
  /**
   * @internal Set by react-lang's auto-mount. Auto-mounted instances yield to
   * any manually rendered <OpenUIDevtools /> so host-provided props win.
   */
  __autoMounted?: boolean;
}

/**
 * dev-only widget that surfaces events captured by `@openuidev/observability` —
 * a Shiro-logo button (which turns red with the error count) that opens a side
 * drawer listing every captured event; selecting one drills into its stack
 * trace. OpenUI Inspect and OpenUI Debug are independent tools on independent
 * trays: the footer banner opens Debug in its own tray beside Inspect, and
 * either closes without disturbing the other. Display filters and the theme
 * live in the header settings menu. Renders nothing in production unless
 * `enabled` is set explicitly.
 */
export function OpenUIDevtools({
  enabled,
  position = "bottom-right",
  maxEvents = 50,
  errorsOnly = false,
  autoOpenOnError = true,
  theme: themeProp = DEFAULT_COLOR_SCHEME,
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
  const [toggleHovered, setToggleHovered] = useState(false);
  const [bannerHovered, setBannerHovered] = useState(false);
  const [code, setCode] = useState("");
  const libraries = useRegisteredLibraries();
  const { config, setConfig, configRef } = useDevtoolsConfig({
    autoOpen: autoOpenOnError,
    onlyErrors: errorsOnly,
    theme: themeProp,
    helpSeen: false,
  });
  const { onlyErrors, theme: scheme } = config;
  // Stable so the help dialog's Escape listener isn't rebound every render.
  const markHelpSeen = useCallback(() => setConfig({ helpSeen: true }), [setConfig]);

  // Read configRef inside the (stable) subscription without re-subscribing.
  useEffect(() => {
    if (!isEnabled) return;
    return observability.listenAll((event) => {
      if (isLibraryEvent(event)) return;
      setEvents((prev) => addOrReplaceEvent(prev, event, maxEvents));
      if (event.level === "error" && configRef.current.autoOpen) setOpen(true);
    });
  }, [isEnabled, maxEvents, configRef]);

  // Escape dismisses the top tray first: Debug → stack → list → closed. The
  // settings menu handles its own Escape first (capture phase), so it never
  // falls through to here.
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

  // Inspect and Debug are independent trays — closing one leaves the other be.
  const closeDrawer = () => setOpen(false);

  // The scrim is shared, so dismissing it retracts both trays. An ejected Debug
  // window is its own surface and is left alone.
  const dismissTrays = () => {
    setOpen(false);
    setPasteOpen(false);
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

  // Ejected -> back into the tray, without losing the editor's contents.
  const minimizePaste = () => {
    if (popup) {
      popup.close();
      setPopup(null);
    }
    setPopupBlocked(false);
    setPasteOpen(true);
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
      onMinimize={minimizePaste}
      // Debug owns its own tray, so its cross closes only Debug — in the drawer
      // and in an ejected window alike. There is no list to step back to.
      onClose={closePaste}
      theme={scheme}
      onThemeChange={(theme) => setConfig({ theme })}
      helpSeen={config.helpSeen}
      onHelpSeen={markHelpSeen}
      popupBlocked={popupBlocked}
    />
  );
  const popupRoot = popup ? pasteMountNode(popup) : null;
  const headerTitle = selected ? `${selected.level} — stack trace` : "OpenUI Inspect";

  // Inspect is pinned to the right edge; Debug fills the rest of the block and
  // slides over to reclaim Inspect's slot whenever Inspect is out.
  const inspectSlot = open ? INSPECT_WIDTH + TRAY_GAP : 0;
  const inspectTray: CSSProperties = {
    right: TRAY_EDGE,
    bottom: TRAY_EDGE,
    height: BLOCK_H,
    width: `min(${INSPECT_WIDTH}px, calc(100vw - ${TRAY_EDGE * 2}px))`,
    transform: open ? "translateX(0)" : `translateX(calc(100% + ${TRAY_EDGE}px))`,
  };
  // Debug is a workspace rather than a peek at the app behind it: it fills
  // everything Inspect leaves (left/right edges rather than a width, so the
  // inset matches top and bottom) and cuts straight in instead of sliding.
  // Overrides the shared chrome, so it is spread last.
  const debugTray: CSSProperties = {
    right: TRAY_EDGE + inspectSlot,
    bottom: TRAY_EDGE,
    height: BLOCK_H,
    width: `max(${DEBUG_MIN_WIDTH}px, calc(${BLOCK_W} - ${inspectSlot}px))`,
    transform: "none",
    transition: "none",
    visibility: pasteOpen ? "visible" : "hidden",
  };

  return (
    <DevtoolsSchemeProvider scheme={scheme}>
      <div style={{ ...styles.toggleWrap, ...themeVars(scheme), ...positionStyles[position] }}>
        <button
          style={{
            ...styles.toggle,
            ...(errorCount > 0 ? styles.toggleError : null),
            ...(toggleHovered ? styles.toggleHover : null),
          }}
          onClick={openDrawer}
          onMouseEnter={() => setToggleHovered(true)}
          onMouseLeave={() => setToggleHovered(false)}
          aria-label="Open OpenUI Inspect"
          aria-expanded={open}
          title={
            errorCount > 0 ? `${errorCount} error${errorCount === 1 ? "" : "s"}` : "OpenUI Inspect"
          }
        >
          {errorCount > 0 ? (
            <span style={styles.toggleCount}>{errorCount > 99 ? "99+" : errorCount}</span>
          ) : (
            <ShiroLogo size={22} />
          )}
        </button>
      </div>

      {/* Kept mounted so open/close can transition; hidden + inert when closed. */}
      <div
        style={{
          ...styles.backdrop,
          ...themeVars(scheme),
          ...(open || pasteOpen ? styles.backdropOpen : null),
        }}
        onClick={dismissTrays}
      >
        <aside
          style={{
            ...styles.drawer,
            ...inspectTray,
            ...(open ? styles.drawerOpen : null),
          }}
          role="dialog"
          aria-modal={!pasteOpen}
          aria-label="OpenUI Inspect"
          inert={!open}
          onClick={(event) => event.stopPropagation()}
        >
          <>
            <div style={styles.header}>
              <div style={styles.headerLeft}>
                {selected ? (
                  <IconButton
                    outlined
                    onClick={() => setSelected(null)}
                    aria-label="Back to event list"
                  >
                    <ArrowLeft size={14} />
                  </IconButton>
                ) : null}
                <span style={styles.title}>{headerTitle}</span>
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
                  <>
                    <IconButton
                      onClick={() => setEvents([])}
                      aria-label="Reset events"
                      title="Reset events"
                    >
                      <RotateCcw size={14} />
                    </IconButton>
                    <SettingsMenu config={config} onChange={setConfig} />
                  </>
                )}
                <IconButton onClick={closeDrawer} aria-label="Close OpenUI Inspect">
                  <X size={15} />
                </IconButton>
              </div>
            </div>

            {selected ? (
              <div style={styles.stackBody}>
                {selectedStack.split("\n").map((line, index) => (
                  <div key={index} style={styles.stackLine}>
                    <span style={styles.lineNumber}>{index + 1}</span>
                    <span
                      style={{ ...styles.lineText, ...(wrapStack ? styles.lineTextWrap : null) }}
                    >
                      {line || " "}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <div style={styles.bannerGroup}>
                  <span style={styles.bannerFade} aria-hidden />
                  <a
                    style={styles.pasteBanner}
                    href={RELIABILITY_DOCS_URL}
                    target="_blank"
                    rel="noreferrer"
                    title="Learn how to track and fix errors in production"
                    onMouseEnter={() => setBannerHovered(true)}
                    onMouseLeave={() => setBannerHovered(false)}
                  >
                    <span style={styles.pasteBannerText}>
                      <span style={styles.pasteBannerTitle}>
                        Want to track and fix errors in production?
                      </span>
                    </span>
                    <span
                      style={{
                        ...styles.pasteBannerAction,
                        ...(bannerHovered ? styles.pasteBannerActionHover : null),
                      }}
                    >
                      Learn more
                    </span>
                  </a>
                </div>
                <div style={styles.list}>
                  {visibleEvents.length === 0 ? (
                    <div style={styles.empty}>
                      <span style={styles.emptyIcon}>
                        <Inbox size={20} />
                      </span>
                      No events captured yet.
                    </div>
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
                              <LevelIcon level={event.level} />
                              {kind ? <span style={styles.kind}>{kind}</span> : null}
                              {status ? (
                                <span style={{ ...styles.badge, ...styles.badgeNeutral }}>
                                  {status}
                                </span>
                              ) : null}
                            </div>
                            <div style={styles.rowHeaderRight}>
                              <span style={styles.time}>
                                {new Date(event.timestamp).toLocaleTimeString()}
                              </span>
                              <span style={styles.chevronSlot} aria-hidden />
                            </div>
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
            <span style={styles.trayFade} aria-hidden />
          </>
        </aside>

        <aside
          style={{
            ...styles.drawer,
            ...(pasteOpen ? styles.drawerOpen : null),
            ...debugTray,
          }}
          role="dialog"
          aria-modal={pasteOpen}
          aria-label="OpenUI Debug"
          inert={!pasteOpen}
          onClick={(event) => event.stopPropagation()}
        >
          <div style={styles.pasteHost}>{paste}</div>
        </aside>
      </div>
      {popupRoot ? createPortal(paste, popupRoot) : null}
    </DevtoolsSchemeProvider>
  );
}

/**
 * A real checkbox painted as a switch — the input stays in the tree (hidden but
 * clickable and focusable) so keyboard, form semantics, and screen readers get
 * the native control rather than a div pretending to be one.
 */
function SettingSwitch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label style={styles.menuCheckbox}>
      <span style={styles.menuLabel}>{label}</span>
      <span style={{ ...styles.switchTrack, ...(checked ? styles.switchTrackOn : null) }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          style={styles.switchInput}
        />
        <span style={{ ...styles.switchKnob, ...(checked ? styles.switchKnobOn : null) }} />
      </span>
    </label>
  );
}

/**
 * Header dropdown for the display filters and the widget theme, so the list is
 * all list. Escape is handled in the capture phase so closing the menu doesn't
 * also step the drawer back.
 */
function SettingsMenu({
  config,
  onChange,
}: {
  config: DevtoolsConfig;
  onChange: (patch: Partial<DevtoolsConfig>) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!wrap.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [open]);

  return (
    <div ref={wrap} style={styles.menuWrap}>
      <IconButton
        active={open}
        onClick={() => setOpen((current) => !current)}
        aria-label="Devtools settings"
        aria-haspopup="true"
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={14} />
      </IconButton>
      {open ? (
        <div style={styles.menu} role="group" aria-label="Devtools settings">
          {/* Every row reads the same way: name on the left, control on the
              right, hairline between. */}
          <SettingSwitch
            label="Auto-open on error"
            checked={config.autoOpen}
            onChange={(autoOpen) => onChange({ autoOpen })}
          />
          <div style={styles.menuDivider} />
          <SettingSwitch
            label="Show errors only"
            checked={config.onlyErrors}
            onChange={(onlyErrors) => onChange({ onlyErrors })}
          />
          <div style={styles.menuDivider} />
          <div style={styles.menuRow}>
            <span style={styles.menuLabel}>Theme</span>
            <ThemeSegmented value={config.theme} onChange={(theme) => onChange({ theme })} />
          </div>
        </div>
      ) : null}
    </div>
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
const positionStyles: Record<DevtoolsPosition, CSSProperties> = {
  "top-left": { top: 16, left: 16 },
  "top-right": { top: 16, right: 16 },
  "bottom-left": { bottom: 16, left: 16 },
  "bottom-right": { bottom: 16, right: 16 },
};

// Mirrors react-ui's look (Inter, hairline borders, soft shadows) without
// depending on it. Colors come from `--oui-dt-*` vars set on each widget root.
const FONT = '"Inter", system-ui, sans-serif';
const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

const styles = {
  toggleWrap: {
    position: "fixed",
    // Max 32-bit signed int — sit above any app chrome.
    zIndex: 2147483647,
  },
  toggle: {
    boxSizing: "border-box",
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--oui-dt-toggle-border)",
    background: "var(--oui-dt-toggle-bg)",
    color: "var(--oui-dt-toggle-fg)",
    cursor: "pointer",
    boxShadow: "var(--oui-dt-toggle-shadow)",
    fontFamily: FONT,
    padding: 0,
    transition: "background 150ms ease, box-shadow 150ms ease, transform 150ms ease",
  },
  toggleHover: {
    transform: "scale(1.08)",
  },
  // Errors swap the mark for a count on a red disc, held inside a light puck so
  // the number reads as a badge rather than flooding the whole button red.
  toggleError: {
    background: "var(--oui-dt-toggle-error-surface)",
    borderColor: "var(--oui-dt-toggle-error-ring)",
  },
  toggleCount: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    minWidth: 24,
    height: 24,
    padding: "0 6px",
    borderRadius: 999,
    background: "var(--oui-dt-toggle-error)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 700,
    lineHeight: 1,
  },
  backdrop: {
    position: "fixed",
    inset: 0,
    background: "var(--oui-dt-overlay)",
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
  // Geometry (right/width/transform) is per-tray and set inline; this is the
  // shared chrome. Each tray hides itself when closed so the other can be open
  // over the same scrim without a retracted tray staying focusable.
  drawer: {
    position: "fixed",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "var(--oui-dt-tray-ring)",
    borderRadius: 16,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg)",
    fontFamily: FONT,
    fontSize: 13,
    visibility: "hidden",
    transition:
      "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), right 260ms cubic-bezier(0.32, 0.72, 0, 1), width 260ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s linear 220ms",
    overflow: "hidden",
  },
  drawerOpen: {
    visibility: "visible",
    transition:
      "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), right 260ms cubic-bezier(0.32, 0.72, 0, 1), width 260ms cubic-bezier(0.32, 0.72, 0, 1), visibility 0s",
  },
  pasteHost: {
    flex: 1,
    minHeight: 0,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    padding: "12px 16px",
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
    border: "1px solid var(--oui-dt-control-border)",
    borderRadius: 8,
    background: "var(--oui-dt-control-bg)",
    color: "var(--oui-dt-fg)",
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
  },
  textButtonActive: {
    background: "var(--oui-dt-inverted)",
    borderColor: "var(--oui-dt-inverted)",
    color: "var(--oui-dt-inverted-fg)",
  },
  menuWrap: {
    position: "relative",
    display: "inline-flex",
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    // Above the banner group, which lifts itself over the list for its fade.
    zIndex: 2,
    boxSizing: "border-box",
    width: 236,
    display: "flex",
    flexDirection: "column",
    gap: 10,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 12,
    background: "var(--oui-dt-bg)",
    boxShadow: "var(--oui-dt-shadow)",
    padding: 12,
    fontWeight: 400,
  },
  // Every row is the height of the tallest control (the theme toggle), so the
  // dividers land on an even rhythm no matter what each row holds.
  menuCheckbox: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: MENU_ROW_HEIGHT,
    cursor: "pointer",
  },
  switchTrack: {
    position: "relative",
    boxSizing: "border-box",
    flexShrink: 0,
    width: 30,
    height: 18,
    borderRadius: 999,
    background: "var(--oui-dt-border)",
    transition: "background 150ms ease",
  },
  switchTrackOn: {
    background: "var(--oui-dt-inverted)",
  },
  // Covers the whole track so the hit area and focus ring stay on the input.
  switchInput: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    margin: 0,
    borderRadius: 999,
    opacity: 0,
    cursor: "pointer",
  },
  switchKnob: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 14,
    height: 14,
    borderRadius: "50%",
    background: "var(--oui-dt-bg)",
    boxShadow: "var(--oui-dt-shadow-subtle)",
    transition: "transform 150ms ease",
    pointerEvents: "none",
  },
  switchKnobOn: {
    transform: "translateX(12px)",
  },
  menuDivider: {
    height: 1,
    background: "var(--oui-dt-border-subtle)",
  },
  menuRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    minHeight: MENU_ROW_HEIGHT,
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "var(--oui-dt-fg)",
  },
  // One border on the track, none on the segments — collapsing per-segment
  // borders with a negative margin made whichever one was active paint a pixel
  // wider than its neighbour.
  // Whole card is the button; the chevron only signals where it leads.
  // Inset from the drawer edges, matching the list's own 12px gutter. The top
  // margin keeps a clear gap even when the list scrolls right up to the banners.
  // Padding, not margin, so the tray background travels with the banner and
  // rows scrolling underneath are hidden rather than peeking through the gap.
  bannerGroup: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    gap: 8,
    flexShrink: 0,
    background: "var(--oui-dt-bg)",
    padding: "12px 12px 18px",
  },
  // Mirrors bannerFade at the tray's bottom edge, so rows dissolve into the
  // drawer instead of meeting the border mid-row. Pinned to the tray rather
  // than the list, so it covers the stack-trace view too.
  trayFade: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 28,
    background: "linear-gradient(to top, var(--oui-dt-bg), transparent)",
    pointerEvents: "none",
  },
  // Hangs below the banner, spanning the tray's full width, so list rows
  // dissolve as they scroll up under it rather than being clipped mid-row.
  // Sized to the list's own top padding so it dissolves the gap without
  // washing over the first card.
  bannerFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "100%",
    height: 12,
    background: "linear-gradient(to bottom, var(--oui-dt-bg), transparent)",
    pointerEvents: "none",
  },
  pasteBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexShrink: 0,
    textDecoration: "none",
    borderRadius: 12,
    background: "var(--oui-dt-promo-bg)",
    color: "var(--oui-dt-fg)",
    cursor: "pointer",
    fontFamily: FONT,
    textAlign: "left",
    padding: "12px 14px",
  },
  pasteBannerText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  pasteBannerTitle: {
    fontSize: 12,
    fontWeight: 500,
  },
  // The whole banner is the hit target; this just reads as the button on it, so
  // it stays a span rather than nesting a control inside a control.
  pasteBannerAction: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "1px solid var(--oui-dt-control-border)",
    borderRadius: 8,
    background: "var(--oui-dt-control-bg)",
    color: "var(--oui-dt-fg)",
    boxShadow: "var(--oui-dt-shadow-subtle)",
    fontSize: 11,
    padding: "5px 12px",
    transition: "transform 150ms ease",
  },
  pasteBannerActionHover: {
    transform: "scale(0.96)",
  },
  list: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  // Fills the list so the message sits in the middle of the tray, not pinned
  // under the header.
  empty: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    color: "var(--oui-dt-fg-faint)",
    textAlign: "center",
  },
  emptyIcon: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  row: {
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 12,
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    background: "var(--oui-dt-card)",
  },
  badgeCredits: {
    background: "var(--oui-dt-credits-bg)",
    color: "var(--oui-dt-credits-fg)",
    borderColor: "var(--oui-dt-credits-border)",
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
  // Holds the space an expandable row's chevron takes, so every timestamp
  // in the list lines up whether or not its row can expand.
  chevronSlot: {
    width: 14,
    flexShrink: 0,
  },
  badgeGroup: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    minWidth: 0,
  },
  kind: {
    color: "var(--oui-dt-fg)",
    fontSize: 12,
    fontWeight: 600,
    wordBreak: "break-word",
  },
  badgeNeutral: {
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg-secondary)",
    borderColor: "var(--oui-dt-border)",
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
    color: "var(--oui-dt-fg-faint)",
    fontSize: 11,
  },
  summary: {
    wordBreak: "break-word",
    color: "var(--oui-dt-fg-tertiary)",
    fontSize: 12,
    lineHeight: 1.5,
  },
  stackButton: {
    alignSelf: "flex-start",
    border: "none",
    background: "transparent",
    color: "var(--oui-dt-fg-secondary)",
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
    background: "var(--oui-dt-bg-muted)",
    fontFamily: MONO,
    fontSize: 11,
    color: "var(--oui-dt-fg-tertiary)",
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
    color: "var(--oui-dt-fg-faint)",
    userSelect: "none",
    padding: "0 4px",
    borderRight: "1px solid var(--oui-dt-border)",
  },
  lineText: {
    whiteSpace: "pre",
  },
  lineTextWrap: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
} satisfies Record<string, CSSProperties>;
