import { X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { IconButton } from "../IconButton";
import { debugStyles as s } from "./styles";

const SUMMARY =
  "OpenUI Debug is a scratchpad for OpenUI Lang: drop in a model response and see how it parses, validates, and renders against this app's own components.";

const STEPS: { title: string; text: string }[] = [
  {
    title: "Load OpenUI Lang",
    text: "Drop in a model response, or write Lang by hand, in the editor on the left.",
  },
  {
    title: "Watch it render",
    text: "Render uses the host app's real createLibrary() components and CSS. Query() and Mutation() resolve with mocked data.",
  },
  {
    title: "Read the diagnostics",
    text: "Validation groups parse errors by code and lists unresolved refs; Tree and JSON show the parsed result.",
  },
  {
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
        aria-label="How to use OpenUI Debug"
      >
        Help
      </button>
      {open ? (
        <div style={s.helpOverlay} onClick={close} role="presentation">
          <div
            style={s.helpDialog}
            role="dialog"
            aria-modal="true"
            aria-label="How to use OpenUI Debug"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.helpHeader}>
              <span>How to use OpenUI Debug</span>
              <IconButton onClick={close} aria-label="Close help">
                <X size={15} />
              </IconButton>
            </div>
            <div style={s.helpBody}>
              <p style={styles.summary}>{SUMMARY}</p>
              <ol style={styles.steps}>
                {STEPS.map((step, index) => (
                  <li key={step.title} style={styles.step}>
                    <span style={styles.badge} aria-hidden>
                      {index + 1}
                    </span>
                    <div style={styles.stepBody}>
                      <div style={styles.stepTitle}>{step.title}</div>
                      <p style={styles.stepText}>{step.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div style={styles.footer}>
              <button style={styles.dismiss} onClick={close}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const BADGE = 18;

const styles = {
  // Matches the Inspect header's text buttons (Wrap / Copy).
  trigger: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    border: "1px solid var(--oui-dt-control-border)",
    borderRadius: 8,
    background: "var(--oui-dt-control-bg)",
    color: "var(--oui-dt-fg)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    padding: "4px 10px",
  },
  // What the tool is, before the how.
  summary: {
    margin: "0 0 16px",
    maxWidth: "62ch",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
    color: "var(--oui-dt-fg-secondary)",
  },
  steps: {
    listStyle: "none",
    display: "flex",
    flexDirection: "column",
    gap: 20,
    margin: 0,
    padding: 0,
  },
  step: {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
  },
  // Same chip proportions as LevelIcon, so the dialog matches the event rows.
  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxSizing: "border-box",
    width: BADGE,
    height: BADGE,
    borderRadius: 6,
    background: "var(--oui-dt-bg-subtle)",
    color: "var(--oui-dt-fg-secondary)",
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1,
  },
  stepBody: {
    minWidth: 0,
  },
  // Medium title over regular body.
  stepTitle: {
    color: "var(--oui-dt-fg)",
    fontSize: 12,
    fontWeight: 500,
  },
  stepText: {
    margin: "3px 0 0",
    maxWidth: "52ch",
    fontSize: 12,
    fontWeight: 400,
    lineHeight: 1.55,
    color: "var(--oui-dt-fg-muted)",
  },
  // Second way out, for anyone who reads to the end rather than reaching for
  // the cross.
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    padding: "0 20px 16px",
  },
  dismiss: {
    border: "1px solid var(--oui-dt-border)",
    borderRadius: 8,
    background: "var(--oui-dt-bg)",
    color: "var(--oui-dt-fg-secondary)",
    boxShadow: "var(--oui-dt-shadow-subtle)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    padding: "6px 14px",
  },
} satisfies Record<string, CSSProperties>;
