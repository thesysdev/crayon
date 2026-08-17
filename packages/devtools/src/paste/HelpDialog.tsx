import { HelpCircle, X } from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import { pasteStyles as s } from "./styles";

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      event.preventDefault();
      setOpen(false);
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open]);

  return (
    <>
      <button
        style={helpButton}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="How to use OpenUI Paste"
        title="How to use OpenUI Paste"
      >
        <HelpCircle size={14} />
      </button>
      {open ? (
        <div style={s.helpOverlay} onClick={() => setOpen(false)} role="presentation">
          <div
            style={s.helpDialog}
            role="dialog"
            aria-modal="true"
            aria-label="How to use OpenUI Paste"
            onClick={(event) => event.stopPropagation()}
          >
            <div style={s.helpHeader}>
              <span>How to use OpenUI Paste</span>
              <button style={helpButton} onClick={() => setOpen(false)} aria-label="Close help">
                <X size={14} />
              </button>
            </div>
            <div style={s.helpBody}>
              <p>
                Paste OpenUI Lang on the left. The panels on the right show what the host app’s
                parser and renderer make of it — your real <code>createLibrary()</code> components
                and CSS, using the app’s installed <code>lang-core</code> (shown in the header).
              </p>
              <h3 style={heading}>Panels</h3>
              <ul>
                <li>
                  <strong>Render</strong>: live output. <code>Query()</code> / <code>Mutation()</code>{" "}
                  resolve with mocked data.
                </li>
                <li>
                  <strong>Validation</strong>: parse errors grouped by code, plus unresolved refs
                  and orphaned statements.
                </li>
                <li>
                  <strong>Tree</strong>: the parsed element tree, state, queries, and mutations.
                </li>
                <li>
                  <strong>JSON</strong>: the raw parse result.
                </li>
                <li>
                  <strong>Stream</strong>: a per-chunk trace of simulated LLM playback.
                </li>
              </ul>
              <h3 style={heading}>Streaming</h3>
              <p>
                <strong>Stream</strong> replays the editor as if a model were emitting it. LLM-like
                chunking adds jitter (reproducible via <strong>Seed</strong>). Pause and{" "}
                <strong>Step</strong> chunk by chunk.
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

const helpButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 26,
  height: 26,
  border: "1px solid #e4e4e7",
  borderRadius: 8,
  background: "#ffffff",
  color: "#71717a",
  cursor: "pointer",
  padding: 0,
};

const heading: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  margin: "12px 0 6px",
  color: "#18181b",
};
