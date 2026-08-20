"use client";

import { FORMATS, FORMAT_ORDER, type FormatId, tokens } from "@/lib/benchmark-data";
import { Chart, Row, styles as s, slotClass } from "./primitives";

/* Streaming speed, derived from the current benchmark: the mean output per
   screen over all 1,104 scored runs, decoded at a typical 50–60 tokens per
   second. The bars use the midpoint; the tooltip carries the range. */
const LOW = 50;
const HIGH = 60;
const MID = (LOW + HIGH) / 2;

export function SpeedTokens({ note }: { note?: React.ReactNode | null } = {}) {
  const secs = (id: FormatId) => tokens.outputPerScreen[id] / MID;
  const max = Math.max(...FORMAT_ORDER.map(secs));
  return (
    <Chart
      title="Time to stream a screen"
      sub="Mean output per screen, decoded at 50–60 tokens per second."
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            Derived, not wall-clock: mean output over {tokens.outputBasis.runs.toLocaleString()}
            &#32;scored runs, at a fixed {LOW}–{HIGH}
            &#32;tokens/second decode rate.
          </>
        )
      }
    >
      <div className={s.rows}>
        {FORMAT_ORDER.map((id, i) => {
          const f = FORMATS.find((x) => x.id === id)!;
          const out = tokens.outputPerScreen[id];
          return (
            <Row
              key={id}
              label={f.label}
              tip={`${f.label}: ${out.toLocaleString()} output tokens ≈ ${Math.round(out / HIGH)}–${Math.round(out / LOW)}s per screen`}
            >
              <span className={s.barSlot}>
                <span
                  className={`${s.bar} ${slotClass(f.series)} ${
                    id === "openui"
                      ? s.colBarOurs
                      : id === "a2ui"
                        ? s.colBarStriped
                        : s.colBarStripedLight
                  }`}
                  style={
                    {
                      width: `${(secs(id) / max) * 88}%`,
                      "--d": `${i * 90}ms`,
                    } as React.CSSProperties
                  }
                />
              </span>
              <span
                className={`${s.value} ${id === "openui" ? `${s.valueHi} ${slotClass(1)}` : ""}`}
              >
                ~{Math.round(secs(id))}s
              </span>
            </Row>
          );
        })}
      </div>
    </Chart>
  );
}
