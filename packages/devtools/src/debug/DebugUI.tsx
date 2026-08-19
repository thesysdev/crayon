import { Maximize2, Minimize2, X } from "lucide-react";
import { Component, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { IconButton } from "../IconButton";
import { type RegisteredLibrary } from "../libraryRegistry";
import { FONT, rootStyle, useDevtoolsScheme, useTheme, type ColorScheme, type ThemeTokens } from "../theme";
import { ThemeToggle } from "../ThemeToggle";
import type { ChunkStrategy } from "./chunker";
import { HelpDialog } from "./HelpDialog";
import { LangEditor } from "./LangEditor";
import { JsonPanel } from "./panels/JsonPanel";
import { RenderPanel } from "./panels/RenderPanel";
import { StreamTimeline } from "./panels/StreamTimeline";
import { TreePanel } from "./panels/TreePanel";
import { ValidationPanel } from "./panels/ValidationPanel";
import { librarySchema } from "./parse";
import { StreamToolbar, type StreamSettings } from "./StreamToolbar";
import { debugStyles } from "./styles";
import { usePlayback } from "./usePlayback";
import { useReactLang } from "./useReactLang";
import { useValidation } from "./useValidation";

const CHAR_STRATEGY_LIMIT = 50 * 1024;

/** Editor's share of the split, as a percentage. The panels get the rest. */
export const DEFAULT_EDITOR_PCT = 25;
export const MIN_EDITOR_PCT = 12;
export const MAX_EDITOR_PCT = 75;
const SPLITTER = 14;

type Tab = "render" | "validation" | "tree" | "json" | "stream";

const TABS: { id: Tab; label: string }[] = [
  { id: "render", label: "Render" },
  { id: "validation", label: "Validation" },
  { id: "tree", label: "Tree" },
  { id: "json", label: "JSON" },
  { id: "stream", label: "Stream" },
];

class DebugErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override componentDidUpdate(prevProps: { children: ReactNode }) {
    if (this.state.error && prevProps.children !== this.props.children) {
      this.setState({ error: null });
    }
  }

  override render() {
    if (this.state.error) {
      return <div style={{ padding: 16, fontSize: 12 }}>{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export interface DebugUIProps {
  libraries: RegisteredLibrary[];
  code: string;
  onCodeChange: (code: string) => void;
  ejected?: boolean;
  onEject?: () => void;
  /** Returns an ejected window to the tray. */
  onMinimize?: () => void;
  /** Dismisses the whole widget (or the ejected window). */
  onClose: () => void;
  theme: ColorScheme;
  onThemeChange: (theme: ColorScheme) => void;
  /** False on the first ever visit, which opens the help guide unprompted. */
  helpSeen?: boolean;
  onHelpSeen?: () => void;
  popupBlocked?: boolean;
  /** Editor column width. Lifted so ejecting to a window keeps the same split. */
  editorPct?: number;
  onEditorPctChange?: (pct: number) => void;
}

function pickLibrary(libraries: RegisteredLibrary[], code: string): RegisteredLibrary | undefined {
  const match = /^\s*root\s*=\s*([A-Za-z_][\w]*)/m.exec(code);
  if (match?.[1]) {
    const byRoot = libraries.find((entry) => entry.library.root === match[1]);
    if (byRoot) return byRoot;
  }
  return libraries[0];
}

export function DebugUI({
  libraries,
  code,
  onCodeChange,
  ejected = false,
  onEject,
  onMinimize,
  onClose,
  theme,
  onThemeChange,
  helpSeen = true,
  onHelpSeen,
  popupBlocked = false,
  editorPct: editorPctProp,
  onEditorPctChange,
}: DebugUIProps) {
  const selected = pickLibrary(libraries, code);
  const lang = useReactLang();
  const schema = useMemo(() => librarySchema(selected?.library), [selected]);
  const rootName = selected?.library.root;
  const outcome = useValidation(code, lang, schema, rootName);
  const playback = usePlayback(code, lang, schema, rootName);
  const [tab, setTab] = useState<Tab>("render");
  const [editorPctState, setEditorPctState] = useState(editorPctProp ?? DEFAULT_EDITOR_PCT);
  const editorPct = editorPctProp ?? editorPctState;
  const setEditorPct = (pct: number) => {
    setEditorPctState(pct);
    onEditorPctChange?.(pct);
  };
  const [resizing, setResizing] = useState(false);
  const [splitHover, setSplitHover] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [strategy, setStrategy] = useState<ChunkStrategy>("llm");
  const [seed, setSeed] = useState(42);
  const scheme = useDevtoolsScheme();
  const t = useTheme();
  const debug = debugStyles(t);
  const styles = shellStyles(t);
  const settings: StreamSettings = {
    strategy,
    onStrategyChange: setStrategy,
    seed,
    onSeedChange: setSeed,
  };

  const playbackActive = playback.state.status === "playing" || playback.state.status === "paused";
  const isStreaming = playback.state.status === "playing";
  const displayed =
    playbackActive || playback.state.status === "done"
      ? { result: playback.state.result, fatal: playback.state.fatal }
      : outcome;
  const renderedCode = playbackActive ? playback.state.prefix : code;
  const streamDisabled = !lang || !code.trim() || schema == null;

  const clampPct = (pct: number) => Math.min(MAX_EDITOR_PCT, Math.max(MIN_EDITOR_PCT, pct));

  // Listeners go on the captured handle, not on `window` — when Debug is
  // ejected the tray is portaled into the popup's document, and the
  // module-scope window never sees those pointer events. Pointer capture also
  // keeps the drag alive once the cursor leaves the handle.
  const startResize = (event: React.PointerEvent<HTMLDivElement>) => {
    const body = bodyRef.current;
    if (!body) return;
    const handle = event.currentTarget;
    handle.setPointerCapture(event.pointerId);
    setResizing(true);

    const onMove = (move: PointerEvent) => {
      const bounds = body.getBoundingClientRect();
      if (bounds.width === 0) return;
      setEditorPct(clampPct(((move.clientX - bounds.left) / bounds.width) * 100));
    };
    const onEnd = () => {
      setResizing(false);
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onEnd);
      handle.removeEventListener("pointercancel", onEnd);
    };

    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onEnd);
    handle.addEventListener("pointercancel", onEnd);
  };

  const changeCode = (next: string) => {
    if (playback.state.status !== "idle") playback.reset();
    onCodeChange(next);
  };

  return (
    <div style={{ ...styles.shell, ...rootStyle(scheme) }}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>OpenUI Debug</span>
        </div>
        <div style={styles.headerActions}>
          <HelpDialog defaultOpen={!helpSeen} onSeen={onHelpSeen} />
          <ThemeToggle value={theme} onChange={onThemeChange} />
          {!ejected && onEject ? (
            <IconButton onClick={onEject} aria-label="Open OpenUI Debug in a new window">
              <Maximize2 size={14} />
            </IconButton>
          ) : null}
          {ejected && onMinimize ? (
            <IconButton onClick={onMinimize} aria-label="Return OpenUI Debug to the tray">
              <Minimize2 size={14} />
            </IconButton>
          ) : null}
          <IconButton
            onClick={onClose}
            aria-label={ejected ? "Close OpenUI Debug window" : "Close OpenUI Debug"}
          >
            <X size={15} />
          </IconButton>
        </div>
      </div>
      {popupBlocked ? (
        <div style={styles.banner}>Allow popups for this origin to eject OpenUI Debug.</div>
      ) : null}
      <StreamToolbar
        playback={playback}
        settings={settings}
        bigInput={code.length > CHAR_STRATEGY_LIMIT}
        disabled={streamDisabled}
      />
      <div
        ref={bodyRef}
        style={{
          ...styles.body,
          gridTemplateColumns: `${editorPct}% ${SPLITTER}px minmax(0, 1fr)`,
        }}
      >
        <div style={styles.editorWrap}>
          <LangEditor value={code} onChange={changeCode} readOnly={playbackActive} />
          {playbackActive ? <span style={debug.editorLock}>Streaming…</span> : null}
        </div>
        <div
          style={styles.splitter}
          onPointerDown={startResize}
          onMouseEnter={() => setSplitHover(true)}
          onMouseLeave={() => setSplitHover(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") setEditorPct(clampPct(editorPct - 2));
            if (event.key === "ArrowRight") setEditorPct(clampPct(editorPct + 2));
          }}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize editor"
          aria-valuenow={Math.round(editorPct)}
          aria-valuemin={MIN_EDITOR_PCT}
          aria-valuemax={MAX_EDITOR_PCT}
          tabIndex={0}
        >
          <span
            style={{
              ...styles.splitterLine,
              ...(splitHover || resizing ? styles.splitterLineOn : null),
            }}
            aria-hidden
          />
          <span
            style={{
              ...styles.splitterGrip,
              ...(splitHover || resizing ? styles.splitterGripOn : null),
            }}
            aria-hidden
          >
            <span style={styles.splitterDot} />
            <span style={styles.splitterDot} />
            <span style={styles.splitterDot} />
          </span>
        </div>
        <div style={styles.output}>
          <div style={debug.tabStrip} role="tablist" aria-label="Debug panels">
            {TABS.map((item) => {
              const label =
                item.id === "validation" && displayed.result
                  ? `${item.label} (${displayed.result.meta.errors.length})`
                  : item.label;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  style={{ ...debug.tab, ...(active ? debug.tabActive : null) }}
                  onClick={() => setTab(item.id)}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <div style={styles.tabBody}>
            {lang === undefined ? (
              <div style={styles.missing}>Loading renderer…</div>
            ) : lang === null ? (
              <div style={styles.missing}>
                Install <code>@openuidev/react-lang</code> to use OpenUI Debug.
              </div>
            ) : selected ? (
              <>
                {tab === "render" ? (
                  <div style={{ ...styles.tabPanel, display: "flex" }}>
                    <DebugErrorBoundary>
                      <RenderPanel
                        Renderer={lang.Renderer}
                        library={selected.library}
                        code={renderedCode}
                        isStreaming={isStreaming}
                      />
                    </DebugErrorBoundary>
                  </div>
                ) : null}
                {tab === "validation" ? <ValidationPanel outcome={displayed} /> : null}
                {tab === "tree" ? <TreePanel result={displayed.result} /> : null}
                {tab === "json" ? <JsonPanel result={displayed.result} /> : null}
                {tab === "stream" ? <StreamTimeline state={playback.state} /> : null}
              </>
            ) : (
              <div style={styles.missing}>No library registered.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function shellStyles(t: ThemeTokens) {
  return {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: t.bg,
    color: t.fg,
    fontFamily: FONT,
    fontSize: 13,
    position: "relative",
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
    gap: 10,
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
  banner: {
    padding: "8px 16px",
    background: t.warningBg,
    color: t.warningStrong,
    fontSize: 12,
    borderBottom: `1px solid ${t.warningBorder}`,
  },
  // Columns are set inline so the drag can move them.
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
  },
  // A hairline that reads as a divider, inside a wider transparent strip so
  // it is still easy to grab. The handle only shows once you are on it.
  splitter: {
    position: "relative",
    cursor: "col-resize",
    background: "transparent",
    touchAction: "none",
  },
  splitterLine: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: 1,
    background: t.borderSubtle,
    transition: "width 150ms ease, background 150ms ease",
    pointerEvents: "none",
  },
  splitterLineOn: {
    width: 3,
    background: t.borderStrong,
  },
  // Thin rounded chip with three stacked dots, centred on the divider.
  splitterGrip: {
    position: "absolute",
    top: "50%",
    left: 0,
    transform: "translate(-50%, -50%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    boxSizing: "border-box",
    width: 11,
    height: 30,
    borderRadius: 999,
    border: `1px solid ${t.controlBorder}`,
    background: t.controlBg,
    opacity: 0,
    transition: "opacity 150ms ease",
    pointerEvents: "none",
  },
  splitterGripOn: {
    opacity: 1,
  },
  splitterDot: {
    width: 2,
    height: 2,
    borderRadius: "50%",
    background: t.fg,
  },
  editorWrap: {
    position: "relative",
    minWidth: 0,
    minHeight: 0,
    overflow: "hidden",
  },
  output: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    background: t.bg,
  },
  tabBody: {
    flex: 1,
    minHeight: 0,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  tabPanel: {
    flex: 1,
    minHeight: 0,
    overflow: "hidden",
    flexDirection: "column",
  },
  missing: {
    color: t.fgFaint,
    padding: 16,
    fontSize: 12,
  },
} satisfies Record<string, CSSProperties>;
}
