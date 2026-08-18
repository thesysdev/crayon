"use client";

import { observability, type ObservabilityEvent } from "@openuidev/observability";
import { ChevronRight, Moon, Settings, Sun, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { addOrReplaceEvent } from "./eventBuffer";
import { EventRow } from "./EventRow";
import { isLibraryEvent, useRegisteredLibraries } from "./libraryRegistry";
import { openPasteWindow, pasteMountNode, PasteUI } from "./paste";
import { getQuotaError, QuotaErrorRow } from "./QuotaErrorRow";
import { getReactLangStreamDetail, ReactLangStreamEventRow } from "./ReactLangStreamEventRow";
import { ShiroLogo } from "./ShiroLogo";
import { useDevtoolsSingleton } from "./singleton";
import { DEFAULT_COLOR_SCHEME, DevtoolsSchemeProvider, themeVars, type ColorScheme } from "./theme";
import { useDevtoolsConfig, type DevtoolsConfig } from "./useDevtoolsConfig";

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
 * drawer listing every captured event. Errors expand in place to show the
 * stack trace (copy sits under the trace, same as OpenUI Lang stream cards).
 * The footer banner widens the drawer into OpenUI Paste. Display filters and
 * the theme live in the header settings menu. Renders nothing in production
 * unless `enabled` is set explicitly.
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
  const [pasteOpen, setPasteOpen] = useState(false);
  const [popup, setPopup] = useState<Window | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
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

  // Escape steps back: paste → list → closed. The settings menu handles
  // its own Escape first (capture phase), so it never falls through to here.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (pasteOpen) setPasteOpen(false);
      else setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, pasteOpen]);

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
    setOpen(true);
  };

  const closePaste = () => {
    if (popup) {
      popup.close();
      setPopup(null);
    }
    setPasteOpen(false);
    setPopupBlocked(false);
  };

  // Dismissing the widget always collapses paste, so it never reopens wide.
  const closeDrawer = () => {
    setPasteOpen(false);
    setOpen(false);
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
      // In the drawer the cross dismisses the widget and the back arrow returns
      // to the list; an ejected window only has its own close.
      onClose={popup ? closePaste : closeDrawer}
      onBack={popup ? undefined : closePaste}
      helpSeen={config.helpSeen}
      onHelpSeen={markHelpSeen}
      popupBlocked={popupBlocked}
    />
  );
  const popupRoot = popup ? pasteMountNode(popup) : null;

  return (
    <DevtoolsSchemeProvider scheme={scheme}>
      <div style={{ ...styles.toggleWrap, ...themeVars(scheme), ...positionStyles[position] }}>
        <button
          style={{ ...styles.toggle, ...(errorCount > 0 ? styles.toggleError : null) }}
          onClick={openDrawer}
          aria-label="Open OpenUI devtools"
          aria-expanded={open}
          title={
            errorCount > 0 ? `${errorCount} error${errorCount === 1 ? "" : "s"}` : "OpenUI devtools"
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
          ...(open ? styles.backdropOpen : null),
        }}
        onClick={closeDrawer}
      >
        <aside
          style={{
            ...styles.drawer,
            ...(pasteOpen ? styles.drawerWide : null),
            ...(open ? styles.drawerOpen : null),
          }}
          role="dialog"
          aria-modal="true"
          aria-label={pasteOpen ? "OpenUI Paste" : "OpenUI devtools"}
          onClick={(event) => event.stopPropagation()}
        >
          {pasteOpen ? (
            <div style={styles.pasteHost}>{paste}</div>
          ) : (
            <>
              <div style={styles.header}>
                <div style={styles.headerLeft}>
                  <span style={styles.headerLogo}>
                    <ShiroLogo size={18} />
                  </span>
                  <span style={styles.title}>OpenUI Devtools</span>
                </div>
                <div style={styles.headerActions}>
                  <button
                    style={styles.iconButton}
                    onClick={() => setEvents([])}
                    aria-label="Clear events"
                    title="Clear events"
                  >
                    <Trash2 size={14} />
                  </button>
                  <SettingsMenu config={config} onChange={setConfig} />
                  <button
                    style={styles.iconButton}
                    onClick={closeDrawer}
                    aria-label="Close OpenUI devtools"
                  >
                    <X size={15} />
                  </button>
                </div>
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
                    return <EventRow key={key} event={event} />;
                  })
                )}
              </div>
              <button
                style={{
                  ...styles.pasteBanner,
                  ...(libraries.length === 0 ? styles.pasteBannerDisabled : null),
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
                <span style={styles.pasteBannerText}>
                  <span style={styles.pasteBannerTitle}>OpenUI Paste</span>
                  <span style={styles.pasteBannerHint}>
                    Replay OpenUI Lang against your components
                  </span>
                </span>
                <span style={styles.pasteBannerChevron}>
                  <ChevronRight size={15} />
                </span>
              </button>
            </>
          )}
        </aside>
      </div>
      {popupRoot ? createPortal(paste, popupRoot) : null}
    </DevtoolsSchemeProvider>
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
      <button
        style={{ ...styles.iconButton, ...(open ? styles.iconButtonActive : null) }}
        onClick={() => setOpen((current) => !current)}
        aria-label="Devtools settings"
        aria-haspopup="true"
        aria-expanded={open}
        title="Settings"
      >
        <Settings size={14} />
      </button>
      {open ? (
        <div style={styles.menu} role="group" aria-label="Devtools settings">
          <label style={styles.menuCheckbox}>
            <input
              type="checkbox"
              checked={config.autoOpen}
              onChange={(event) => onChange({ autoOpen: event.target.checked })}
            />
            Auto-open on error
          </label>
          <label style={styles.menuCheckbox}>
            <input
              type="checkbox"
              checked={config.onlyErrors}
              onChange={(event) => onChange({ onlyErrors: event.target.checked })}
            />
            Errors only
          </label>
          <div style={styles.menuDivider} />
          <div style={styles.menuRow}>
            <div style={styles.menuLabel}>Theme</div>
            <ThemeToggle value={config.theme} onChange={(theme) => onChange({ theme })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

const THEME_OPTIONS: {
  id: ColorScheme;
  label: string;
  icon: typeof Sun;
}[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
];

function ThemeToggle({
  value,
  onChange,
}: {
  value: ColorScheme;
  onChange: (value: ColorScheme) => void;
}) {
  return (
    <div style={styles.themeToggle} role="radiogroup" aria-label="Theme">
      {THEME_OPTIONS.map((option, index) => {
        const active = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            style={{
              ...styles.themeOption,
              ...(active ? styles.themeOptionActive : null),
              ...(index === 0 ? styles.themeOptionFirst : null),
              ...(index === THEME_OPTIONS.length - 1 ? styles.themeOptionLast : null),
            }}
            onClick={() => onChange(option.id)}
            aria-label={option.label}
            title={option.label}
          >
            <Icon size={14} />
          </button>
        );
      })}
    </div>
  );
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
    transition: "background 150ms ease, box-shadow 150ms ease",
  },
  // Errors turn the whole button red and the count replaces the mark, rather
  // than hiding the number in a corner badge.
  toggleError: {
    background: "var(--oui-dt-toggle-error)",
    borderColor: "var(--oui-dt-toggle-error)",
    color: "#fff",
  },
  toggleCount: {
    fontSize: 15,
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
  drawer: {
    position: "fixed",
    top: 12,
    right: 12,
    bottom: 12,
    boxSizing: "border-box",
    width: "min(420px, calc(100vw - 24px))",
    display: "flex",
    flexDirection: "column",
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 16,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg)",
    fontFamily: FONT,
    fontSize: 13,
    boxShadow: "var(--oui-dt-shadow)",
    transform: "translateX(calc(100% + 12px))",
    transition:
      "transform 220ms cubic-bezier(0.32, 0.72, 0, 1), width 260ms cubic-bezier(0.32, 0.72, 0, 1)",
    overflow: "hidden",
  },
  drawerOpen: {
    transform: "translateX(0)",
  },
  // Paste isn't a separate dialog: the same drawer grows into it.
  drawerWide: {
    width: "min(1180px, calc(100vw - 24px))",
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
  headerLogo: {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
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
  iconButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "var(--oui-dt-fg-muted)",
    cursor: "pointer",
    padding: 0,
  },
  iconButtonActive: {
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg)",
  },
  menuWrap: {
    position: "relative",
    display: "inline-flex",
  },
  menu: {
    position: "absolute",
    top: "calc(100% + 6px)",
    right: 0,
    zIndex: 1,
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
  menuCheckbox: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 12,
    cursor: "pointer",
    accentColor: "var(--oui-dt-fg)",
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
  },
  menuLabel: {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--oui-dt-fg)",
  },
  themeToggle: {
    display: "inline-flex",
    alignItems: "stretch",
    flexShrink: 0,
  },
  themeOption: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    width: 34,
    height: 28,
    border: "1px solid var(--oui-dt-border)",
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-tertiary)",
    cursor: "pointer",
    padding: 0,
    marginLeft: -1,
  },
  themeOptionFirst: {
    marginLeft: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  themeOptionLast: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  themeOptionActive: {
    background: "var(--oui-dt-inverted)",
    borderColor: "var(--oui-dt-inverted)",
    color: "var(--oui-dt-inverted-fg)",
    zIndex: 1,
  },
  // Whole card is the button; the chevron only signals where it leads.
  pasteBanner: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexShrink: 0,
    // Inset from the drawer edges, matching the list's own 12px gutter. The top
    // margin keeps a clear gap even when the list scrolls right up to the banner.
    margin: 12,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 12,
    background: "var(--oui-dt-bg-muted)",
    color: "var(--oui-dt-fg)",
    cursor: "pointer",
    fontFamily: FONT,
    textAlign: "left",
    padding: "12px 14px",
  },
  pasteBannerDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  pasteBannerText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 0,
  },
  pasteBannerTitle: {
    fontSize: 12,
    fontWeight: 600,
  },
  pasteBannerHint: {
    color: "var(--oui-dt-fg-muted)",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  pasteBannerChevron: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: 26,
    height: 26,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-muted)",
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
  empty: {
    color: "var(--oui-dt-fg-faint)",
    padding: "32px 0",
    textAlign: "center",
  },
} satisfies Record<string, CSSProperties>;
