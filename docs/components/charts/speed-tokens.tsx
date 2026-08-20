"use client";

import {
  DECODE_TOKENS_PER_SECOND,
  SPEED_FORMATS,
  speedScenarios,
  speedTotal,
} from "@/lib/benchmark-data";
import { Chart, Row, styles as s, slotClass } from "./primitives";

/**
 * The OLDER token-efficiency benchmark (benchmarks/README.md) — a different
 * format set (YAML and Thesys C1 JSON instead of A2UI), one model, and derived
 * rather than measured latency. Kept visually separate from the 46-brief run.
 */
export function SpeedTokens({ note }: { note?: React.ReactNode | null } = {}) {
  const max = Math.max(...SPEED_FORMATS.map((f) => speedTotal(f.id)));
  const openui = speedTotal("openuiLang");
  return (
    <Chart
      title="Output tokens for the same screen"
      sub="Four encodings of the identical screens. Fewer tokens means the screen arrives sooner."
      note={
        note !== undefined ? (
          note
        ) : (
          <>
            {speedScenarios.length}&#32;scenarios, one model (GPT-5.2) · seconds derived at a fixed{" "}
            {DECODE_TOKENS_PER_SECOND} tokens/second, not wall-clock · an earlier benchmark with a
            different format set (C1 JSON and YAML instead of A2UI).
          </>
        )
      }
    >
      <div className={s.rows}>
        {SPEED_FORMATS.map((f, i) => {
          const total = speedTotal(f.id);
          return (
            <Row
              key={f.id}
              label={f.label}
              tip={`${f.label}: ${total.toLocaleString()} tokens${
                f.id === "openuiLang" ? "" : ` · ${(total / openui).toFixed(1)}× OpenUI Lang`
              }`}
            >
              <span className={s.barSlot}>
                <span
                  className={`${s.bar} ${slotClass(f.slot)} ${
                    f.id === "openuiLang" ? s.colBarOurs : s.colBarStriped
                  }`}
                  style={
                    { width: `${(total / max) * 88}%`, "--d": `${i * 90}ms` } as React.CSSProperties
                  }
                />
              </span>
              <span
                className={`${s.value} ${f.id === "openuiLang" ? `${s.valueHi} ${slotClass(1)}` : ""}`}
              >
                {total.toLocaleString()}
                {` · ~${(total / DECODE_TOKENS_PER_SECOND).toFixed(0)}s`}
              </span>
            </Row>
          );
        })}
      </div>
    </Chart>
  );
}
