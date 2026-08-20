"use client";

import {
  FORMATS,
  FORMAT_ORDER,
  type FormatId,
  MODELS,
  type ModelId,
  blanksOver,
  formatLabel,
  runsFor,
} from "@/lib/benchmark-data";
import { Chart, Chip, Mark, styles as s, slotClass } from "./primitives";

/* Render rate per model, one panel per format. Framed as the share of runs
   that put a screen in front of the user, so OpenUI Lang's near-perfect
   record reads as tall bars instead of near-empty ones. The scale starts at
   RATE_MIN, not zero, and the section copy says so. */
const RATE_MIN = 88;

const fullName = (m: (typeof MODELS)[number]) =>
  "family" in m && m.family ? `${m.family} ${m.label}` : m.label;

export function BlankScreensPanels({
  models,
  formats = FORMAT_ORDER,
}: {
  models?: readonly ModelId[];
  formats?: readonly FormatId[];
}) {
  const selected = models ?? MODELS.map((m) => m.id);
  const shownFormats = FORMAT_ORDER.filter((f) => formats.includes(f));
  const rate = (f: FormatId, m: ModelId) => (1 - blanksOver(f, [m]) / runsFor(m)) * 100;

  return (
    <Chart
      title="Render rate"
      sub="Share of runs where the user saw a screen at all. The scale starts at 88%, not zero."
    >
      <div className={s.panelGrid}>
        {shownFormats.map((f) => {
          const format = FORMATS.find((x) => x.id === f)!;
          const active = MODELS.filter((m) => selected.includes(m.id));
          const formatRate =
            active.reduce((sum, m) => sum + rate(f, m.id), 0) / Math.max(1, active.length);
          return (
            <div key={f} className={`${s.panel} ${slotClass(format.series)}`}>
              <div className={s.panelHead}>
                <span className={s.panelName}>{formatLabel(f)}</span>
                <span className={s.panelRate}>{formatRate.toFixed(1)}%</span>
              </div>
              <div className={s.panelPlot}>
                {MODELS.map((m, i) => {
                  const v = rate(f, m.id);
                  const blanks = blanksOver(f, [m.id]);
                  const ghost = !selected.includes(m.id);
                  const h = Math.max(((v - RATE_MIN) / (100 - RATE_MIN)) * 88, 2);
                  return (
                    <div
                      key={m.id}
                      className={`${s.colCell} ${s.tip} ${ghost ? s.colCellGhost : ""}`}
                      data-tip={`${formatLabel(f)} · ${fullName(m)}: ${v.toFixed(1)}% rendered, ${blanks} blank of ${runsFor(m.id)}`}
                    >
                      {ghost ? null : (
                        <span
                          className={s.colVal}
                          style={
                            {
                              bottom: `calc(${h}% + 6px)`,
                              "--d": `${i * 55}ms`,
                            } as React.CSSProperties
                          }
                        >
                          {v === 100 ? "100" : v.toFixed(1)}
                        </span>
                      )}
                      <span
                        className={`${s.colBar} ${
                          f === "openui"
                            ? s.colBarOurs
                            : f === "a2ui"
                              ? s.colBarStriped
                              : s.colBarStripedLight
                        }`}
                        style={
                          {
                            height: `${ghost ? 0 : h}%`,
                            "--d": `${i * 55}ms`,
                          } as React.CSSProperties
                        }
                      />
                    </div>
                  );
                })}
              </div>
              <div className={s.panelFeet}>
                {MODELS.map((m) => (
                  <span
                    key={m.id}
                    className={`${s.panelFoot} ${selected.includes(m.id) ? "" : s.panelFootGhost}`}
                    title={fullName(m)}
                    aria-label={fullName(m)}
                  >
                    <Chip mark={m.mark} />
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className={`${s.legend} ${s.legendCenter}`} aria-label="Model key">
        {MODELS.map((m) => (
          <span key={m.id} className={s.key}>
            <Mark id={m.mark} />
            {fullName(m)}
          </span>
        ))}
      </div>
    </Chart>
  );
}
