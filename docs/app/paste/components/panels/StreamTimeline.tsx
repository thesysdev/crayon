"use client";

import { CheckCircle2, Circle, CircleDot, CircleMinus, CirclePlus, XCircle } from "lucide-react";
import type { PlaybackState } from "@paste/lib/streaming/usePlayback";

export function StreamTimeline({ state }: { state: PlaybackState }) {
  if (state.status === "idle") {
    return (
      <div className="panel-empty">
        Press <strong>Stream</strong> to replay the current code as simulated LLM output and watch
        the parser converge chunk by chunk.
      </div>
    );
  }
  return (
    <div className="panel-scroll">
      {state.convergence && (
        <div className={`convergence convergence-${state.convergence}`}>
          {state.convergence === "converged" ? (
            <>
              <CheckCircle2 size={15} /> Streaming result converged with one-shot parse
            </>
          ) : (
            <>
              <XCircle size={15} /> DIVERGED from one-shot parse — parser bug in this version?
            </>
          )}
        </div>
      )}
      {state.fatal && (
        <div className="fatal-card">
          <strong>Streaming parse threw</strong>
          <pre>{state.fatal}</pre>
        </div>
      )}
      {state.traceTruncated && (
        <p className="toolbar-hint">Trace capped at 5,000 rows — remaining chunks not logged.</p>
      )}
      <table className="trace-table">
        <thead>
          <tr>
            <th>#</th>
            <th>chunk</th>
            <th>delay</th>
            <th>root</th>
            <th>stmts</th>
            <th>state</th>
            <th>unres</th>
            <th>errs</th>
          </tr>
        </thead>
        <tbody>
          {state.trace.map((row) => (
            <tr
              key={row.i}
              className={row.rootAppeared ? "row-appeared" : row.rootDropped ? "row-dropped" : ""}
            >
              <td>{row.i}</td>
              <td>
                <code className="chunk-preview">{visualize(row.chunkPreview)}</code>
              </td>
              <td>{row.delayMs}ms</td>
              <td className="root-cell">
                {row.rootAppeared ? (
                  <>
                    <CirclePlus size={12} /> appeared
                  </>
                ) : row.rootDropped ? (
                  <>
                    <CircleMinus size={12} /> dropped
                  </>
                ) : row.rootPresent ? (
                  <CircleDot size={12} />
                ) : (
                  <Circle size={12} />
                )}
              </td>
              <td>{row.statementCount}</td>
              <td>{row.incomplete ? "incomplete" : "complete"}</td>
              <td>{row.unresolvedCount}</td>
              <td>{row.errorCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function visualize(text: string): string {
  return text.replace(/\n/g, "⏎").replace(/\t/g, "⇥");
}
