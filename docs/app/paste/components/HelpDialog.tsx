"use client";

import { Button } from "@openuidev/react-ui";
import { HelpCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button
        variant="secondary"
        size="small"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label="How to use paste"
        title="How to use paste"
      >
        <HelpCircle size={16} />
      </Button>
      {open && (
        <div className="help-overlay" onClick={() => setOpen(false)}>
          <div
            className="help-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="How to use paste"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="help-header">
              <h2>How to use Paste</h2>
              <Button
                variant="tertiary"
                size="small"
                iconLeft={<X size={14} />}
                onClick={() => setOpen(false)}
                aria-label="Close"
              />
            </div>

            <div className="help-body">
              <p>
                Paste is a playground for <strong>OpenUI Lang</strong>. Paste code on the left; the
                panels on the right show what the parser and renderer make of it.
              </p>

              <h3>Quick start</h3>
              <ol>
                <li>
                  Pick an example from <strong>Examples</strong>, or paste your own Lang code
                </li>
                <li>
                  Validation runs as you type against the selected <strong>lang-core</strong>{" "}
                  version. Every published npm version is available and loaded on demand.
                </li>
                <li>
                  Switch the component <strong>Library</strong> (openui, openui chat) to validate
                  and render against a different component set.
                </li>
              </ol>

              <h3>Panels</h3>
              <ul>
                <li>
                  <strong>Render</strong>: live output. Interactive: forms hold state, and{" "}
                  <code>Query()</code> calls resolve with mocked data (any tool name returns sample
                  data; calls are logged under the canvas). Always rendered with the bundled
                  renderer; the selected lang-core version drives the other panels.
                </li>
                <li>
                  <strong>Validation</strong>: errors grouped by code, with fix hints, plus
                  unresolved refs and orphaned statements.
                </li>
                <li>
                  <strong>Tree</strong>: the parsed element tree, state declarations, queries and
                  mutations.
                </li>
                <li>
                  <strong>JSON</strong>: the raw ParseResult.
                </li>
                <li>
                  <strong>Stream</strong>: a per-chunk trace of the streaming parse with a final
                  streaming-vs-one-shot convergence check.
                </li>
              </ul>

              <h3>Streaming mode</h3>
              <p>
                <strong>Stream</strong> replays your code as if an LLM were emitting it.{" "}
                <em>LLM-like</em> chunking adds realistic jitter and stalls (reproducible via{" "}
                <strong>Seed</strong>). Watch the render window build up live, pause and{" "}
                <strong>Step</strong> chunk by chunk, and check whether the root ever appears or
                drops mid-stream.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
