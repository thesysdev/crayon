import { Maximize2, X } from "lucide-react";
import { Component, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { type RegisteredLibrary } from "../libraryRegistry";
import type { ChunkStrategy } from "./chunker";
import { HelpDialog } from "./HelpDialog";
import { JsonPanel } from "./panels/JsonPanel";
import { RenderPanel } from "./panels/RenderPanel";
import { StreamTimeline } from "./panels/StreamTimeline";
import { TreePanel } from "./panels/TreePanel";
import { ValidationPanel } from "./panels/ValidationPanel";
import { librarySchema } from "./parse";
import { FONT, MONO, pasteStyles as paste } from "./styles";
import { StreamToolbar, type StreamSettings } from "./StreamToolbar";
import { usePlayback } from "./usePlayback";
import { useReactLang } from "./useReactLang";
import { useValidation } from "./useValidation";

const CHAR_STRATEGY_LIMIT = 50 * 1024;

type Tab = "render" | "validation" | "tree" | "json" | "stream";

const TABS: { id: Tab; label: string }[] = [
  { id: "render", label: "Render" },
  { id: "validation", label: "Validation" },
  { id: "tree", label: "Tree" },
  { id: "json", label: "JSON" },
  { id: "stream", label: "Stream" },
];

class PasteErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
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
      return <div style={styles.missing}>{this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

export interface PasteUIProps {
  libraries: RegisteredLibrary[];
  code: string;
  onCodeChange: (code: string) => void;
  ejected?: boolean;
  onEject?: () => void;
  onClose: () => void;
  popupBlocked?: boolean;
}

function pickLibrary(libraries: RegisteredLibrary[], code: string): RegisteredLibrary | undefined {
  const match = /^\s*root\s*=\s*([A-Za-z_][\w]*)/m.exec(code);
  if (match?.[1]) {
    const byRoot = libraries.find((entry) => entry.library.root === match[1]);
    if (byRoot) return byRoot;
  }
  return libraries[0];
}

export function PasteUI({
  libraries,
  code,
  onCodeChange,
  ejected = false,
  onEject,
  onClose,
  popupBlocked = false,
}: PasteUIProps) {
  const selected = pickLibrary(libraries, code);
  const lang = useReactLang();
  const schema = useMemo(() => librarySchema(selected?.library), [selected]);
  const rootName = selected?.library.root;
  const outcome = useValidation(code, lang, schema, rootName);
  const playback = usePlayback(code, lang, schema, rootName);
  const [tab, setTab] = useState<Tab>("render");
  const [strategy, setStrategy] = useState<ChunkStrategy>("llm");
  const [seed, setSeed] = useState(42);
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

  const changeCode = (next: string) => {
    if (playback.state.status !== "idle") playback.reset();
    onCodeChange(next);
  };

  return (
    <div style={styles.shell}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.title}>OpenUI Paste</span>
          {lang?.langCoreVersion ? (
            <span style={styles.version} title="Installed @openuidev/lang-core">
              lang-core {lang.langCoreVersion}
            </span>
          ) : null}
        </div>
        <div style={styles.headerActions}>
          <HelpDialog />
          {!ejected && onEject ? (
            <button
              style={styles.iconButton}
              onClick={onEject}
              aria-label="Open OpenUI Paste in a new window"
            >
              <Maximize2 size={14} />
            </button>
          ) : null}
          <button
            style={styles.iconButton}
            onClick={onClose}
            aria-label={ejected ? "Close OpenUI Paste window" : "Close OpenUI Paste"}
          >
            <X size={15} />
          </button>
        </div>
      </div>
      {popupBlocked ? (
        <div style={styles.banner}>Allow popups for this origin to eject OpenUI Paste.</div>
      ) : null}
      <StreamToolbar
        playback={playback}
        settings={settings}
        bigInput={code.length > CHAR_STRATEGY_LIMIT}
        disabled={streamDisabled}
      />
      <div style={styles.body}>
        <div style={styles.editorWrap}>
          <textarea
            style={styles.editor}
            value={code}
            onChange={(event) => changeCode(event.target.value)}
            spellCheck={false}
            readOnly={playbackActive}
            aria-label="OpenUI Lang"
          />
          {playbackActive ? <span style={paste.editorLock}>Streaming…</span> : null}
        </div>
        <div style={styles.output}>
          <div style={paste.tabStrip} role="tablist" aria-label="Paste panels">
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
                  style={{ ...paste.tab, ...(active ? paste.tabActive : null) }}
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
                Install <code>@openuidev/react-lang</code> to use OpenUI Paste.
              </div>
            ) : selected ? (
              <>
                <div style={{ ...styles.tabPanel, display: tab === "render" ? "flex" : "none" }}>
                  <PasteErrorBoundary>
                    <RenderPanel
                      Renderer={lang.Renderer}
                      library={selected.library}
                      code={renderedCode}
                      isStreaming={isStreaming}
                    />
                  </PasteErrorBoundary>
                </div>
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

const styles = {
  shell: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    background: "#ffffff",
    color: "#18181b",
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
    borderBottom: "1px solid #f4f4f5",
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
  version: {
    color: "#71717a",
    fontWeight: 500,
    fontSize: 11,
    fontFamily: MONO,
    background: "#f4f4f5",
    borderRadius: 999,
    padding: "2px 8px",
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
    color: "#71717a",
    cursor: "pointer",
    padding: 0,
  },
  banner: {
    padding: "8px 16px",
    background: "#fffbeb",
    color: "#92400e",
    fontSize: 12,
    borderBottom: "1px solid #fde68a",
  },
  body: {
    flex: 1,
    minHeight: 0,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
  },
  editorWrap: {
    position: "relative",
    minWidth: 0,
    minHeight: 0,
  },
  editor: {
    boxSizing: "border-box",
    width: "100%",
    height: "100%",
    border: "none",
    borderRight: "1px solid #f4f4f5",
    resize: "none",
    padding: 16,
    fontFamily: MONO,
    fontSize: 12,
    lineHeight: 1.5,
    color: "#18181b",
    background: "#fafafa",
    outline: "none",
  },
  output: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
    minHeight: 0,
    background: "#ffffff",
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
    color: "#a1a1aa",
    padding: 16,
    fontSize: 12,
  },
} satisfies Record<string, CSSProperties>;
