import { CircleAlert } from "lucide-react";
import { Component, type CSSProperties, type ReactNode } from "react";
import { FONT, useStyles, type ThemeTokens } from "../theme";

/** GitHub Issues for the OpenUI repo — the report destination from a crashed tray. */
export const ISSUES_URL = "https://github.com/thesysdev/openui/issues/new?template=bug_report.md";

const FILL: CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

/**
 * Catches render crashes in Inspect and Debug so the tray stays up and the
 * host app is not taken down with it. The fallback points at OpenUI's Issues
 * page; Try again remounts the children.
 */
export class ErrorBoundary extends Component<
  { children: ReactNode; title: string; resetKey?: string },
  { error: Error | null; lastResetKey: string | undefined }
> {
  constructor(props: { children: ReactNode; title: string; resetKey?: string }) {
    super(props);
    this.state = { error: null, lastResetKey: props.resetKey };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: { resetKey?: string },
    state: { error: Error | null; lastResetKey: string | undefined },
  ) {
    if (props.resetKey !== state.lastResetKey) {
      return { error: null, lastResetKey: props.resetKey };
    }
    return null;
  }

  override componentDidCatch(error: Error) {
    console.error("[OpenUI Devtools]", error);
  }

  override render() {
    if (this.state.error) {
      return (
        <div style={FILL} role="alert">
          <ErrorFallback
            title={this.props.title}
            error={this.state.error}
            onRetry={() => this.setState({ error: null })}
          />
        </div>
      );
    }
    return <div style={FILL}>{this.props.children}</div>;
  }
}

function ErrorFallback({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: Error;
  onRetry: () => void;
}) {
  const styles = useStyles(fallbackStyles);
  return (
    <div style={styles.wrap}>
      <span style={styles.icon} aria-hidden>
        <CircleAlert size={20} />
      </span>
      <p style={styles.title}>{title}</p>
      {error.message ? <pre style={styles.message}>{error.message}</pre> : null}
      <p style={styles.hint}>Help us improve OpenUI by reporting it on GitHub.</p>
      <div style={styles.actions}>
        <button type="button" style={styles.action} onClick={onRetry}>
          Try again
        </button>
        <a style={styles.action} href={ISSUES_URL} target="_blank" rel="noreferrer">
          Report an issue
        </a>
      </div>
    </div>
  );
}

function fallbackStyles(t: ThemeTokens) {
  const action: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    border: `1px solid ${t.controlBorder}`,
    borderRadius: 8,
    background: t.controlBg,
    color: t.fg,
    boxShadow: t.shadowSubtle,
    cursor: "pointer",
    fontFamily: FONT,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: "none",
    padding: "6px 12px",
  };
  return {
    wrap: {
      flex: 1,
      minHeight: 0,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      padding: 24,
      color: t.fg,
      textAlign: "center",
    },
    icon: {
      display: "inline-flex",
      color: t.danger,
    },
    title: {
      margin: 0,
      fontSize: 13,
      fontWeight: 600,
    },
    message: {
      margin: 0,
      maxWidth: "100%",
      maxHeight: 96,
      overflow: "auto",
      borderRadius: 8,
      color: t.fgSecondary,
      fontFamily: FONT,
      fontSize: 12,
      lineHeight: 1.45,
      textAlign: "left",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    },
    hint: {
      margin: 0,
      color: t.fgMuted,
      fontSize: 12,
      lineHeight: 1.45,
    },
    actions: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginTop: 4,
    },
    action,
  } satisfies Record<string, CSSProperties>;
}
