import { CheckCircle2, Circle, CircleDot, CircleMinus, CirclePlus, XCircle } from "lucide-react";
import { pasteStyles as s } from "../styles";
import type { PlaybackState } from "../usePlayback";

export function StreamTimeline({ state }: { state: PlaybackState }) {
  if (state.status === "idle") {
    return (
      <div style={s.panelEmpty}>
        Press <strong>Stream</strong> to replay the current code as simulated LLM output and watch
        the parser converge chunk by chunk.
      </div>
    );
  }
  return (
    <div style={s.panelScroll}>
      {state.convergence ? (
        <div
          style={{
            ...s.convergence,
            ...(state.convergence === "converged" ? s.convergenceOk : s.convergenceBad),
          }}
        >
          {state.convergence === "converged" ? (
            <>
              <CheckCircle2 size={15} /> Streaming result converged with one-shot parse
            </>
          ) : (
            <>
              <XCircle size={15} /> Diverged from one-shot parse
            </>
          )}
        </div>
      ) : null}
      {state.fatal ? (
        <div style={s.fatalCard}>
          <strong>Streaming parse threw</strong>
          <pre style={s.fatalPre}>{state.fatal}</pre>
        </div>
      ) : null}
      {state.traceTruncated ? (
        <p style={{ color: "var(--oui-dt-fg-muted)", fontSize: 12 }}>
          Trace capped at 5,000 rows — remaining chunks not logged.
        </p>
      ) : null}
      <table style={s.traceTable}>
        <thead>
          <tr>
            {["#", "chunk", "delay", "root", "stmts", "state", "unres", "errs"].map((heading) => (
              <th key={heading} style={s.traceTh}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.trace.map((row) => (
            <tr
              key={row.i}
              style={row.rootAppeared ? s.rowAppeared : row.rootDropped ? s.rowDropped : undefined}
            >
              <td style={s.traceTd}>{row.i}</td>
              <td style={s.traceTd}>{visualize(row.chunkPreview)}</td>
              <td style={s.traceTd}>{row.delayMs}ms</td>
              <td style={{ ...s.traceTd, ...s.rootCell }}>
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
              <td style={s.traceTd}>{row.statementCount}</td>
              <td style={s.traceTd}>{row.incomplete ? "incomplete" : "complete"}</td>
              <td style={s.traceTd}>{row.unresolvedCount}</td>
              <td style={s.traceTd}>{row.errorCount}</td>
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
