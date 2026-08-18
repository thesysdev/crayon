import { ArrowDown, ClipboardPaste, ListChecks, MonitorPlay, Play, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { pasteStyles as s } from "./styles";

const STEPS: { icon: typeof Play; title: string; text: string }[] = [
  {
    icon: ClipboardPaste,
    title: "Paste OpenUI Lang",
    text: "Drop in a model response, or write Lang by hand, in the editor on the left.",
  },
  {
    icon: MonitorPlay,
    title: "Watch it render",
    text: "Render uses the host app's real createLibrary() components and CSS. Query() and Mutation() resolve with mocked data.",
  },
  {
    icon: ListChecks,
    title: "Read the diagnostics",
    text: "Validation groups parse errors by code and lists unresolved refs; Tree and JSON show the parsed result.",
  },
  {
    icon: Play,
    title: "Replay it as a stream",
    text: "Stream re-emits the editor chunk by chunk with LLM-like jitter. Pause, step, or fix the Seed to reproduce a run.",
  },
];

export function HelpDialog({
  defaultOpen = false,
  onSeen,
}: {
  /** First run opens this unprompted; dismissing it marks the guide as seen. */
  defaultOpen?: boolean;
  onSeen?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const close = () => {
    setOpen(false);
    onSeen?.();
  };

  // Captured so Escape closes the help first, without also stepping the drawer back.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      setOpen(false);
      onSeen?.();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onSeen]);

  return (
    <>
      <button
        style={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="How to use OpenUI Paste"
      >
        Help
      </button>
      {open ? (
        <div style={s.helpOverlay} onClick={close} role="presentation">
          <div
            style={s.helpDialog}
            role="dialog"
            aria-modal="true"
            aria-label="How to use OpenUI Paste"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.helpHeader}>
              <span>How to use OpenUI Paste</span>
              <button style={styles.closeButton} onClick={close} aria-label="Close help">
                <X size={14} />
              </button>
            </div>
            <div style={s.helpBody}>
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title}>
                    <div style={styles.step}>
                      <span style={styles.tile}>
                        <Icon size={17} />
                      </span>
                      <div>
                        <div style={styles.stepTitle}>{step.title}</div>
                        <p style={styles.stepText}>{step.text}</p>
                      </div>
                    </div>
                    {index < STEPS.length - 1 ? (
                      <div style={styles.arrow} aria-hidden>
                        <ArrowDown size={14} />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const TILE = 38;

const styles = {
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    height: 26,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-tertiary)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    padding: "0 10px",
  },
  closeButton: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 26,
    height: 26,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-muted)",
    cursor: "pointer",
    padding: 0,
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 12,
  },
  tile: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxSizing: "border-box",
    width: TILE,
    height: TILE,
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 10,
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg-secondary)",
  },
  stepTitle: {
    color: "var(--oui-dt-fg)",
    fontSize: 13,
    fontWeight: 700,
    // Optically centers the title against the tile's first line.
    paddingTop: 2,
  },
  stepText: {
    margin: "2px 0 0",
    fontSize: 12,
    lineHeight: 1.5,
    color: "var(--oui-dt-fg-muted)",
  },
  // Sits under the tile column so the tiles read as one flow.
  arrow: {
    display: "flex",
    justifyContent: "center",
    width: TILE,
    padding: "6px 0",
    color: "var(--oui-dt-fg-faint)",
  },
} satisfies Record<string, CSSProperties>;
