import { formatCurrency, formatNumber } from "../../core/format";
import type { CohortRow } from "../../core/schemas";

/** A single-hue sequential fill: the accent mixed into the card, so low values recede in both modes. */
export const heat = (intensity: number) =>
  `color-mix(in oklch, var(--kit-accent) ${Math.round(6 + Math.max(0, Math.min(1, intensity)) * 90)}%, var(--kit-card))`;

export interface CohortGridProps {
  cohorts: CohortRow[];
  /** One label per period since a cohort started; defaults to P0, P1, … */
  periodLabels?: string[];
  /** Rates as percents, or cumulative value per customer as currency. */
  format?: "percent" | "currency";
  /** Header for the cohort size column. Default "Users". */
  sizeLabel?: string;
}

/**
 * Cohort table: one row per cohort and one shaded cell per period since it
 * started, a size-weighted average row, and a scale legend. Read down a
 * column to compare cohorts at the same age.
 */
export function CohortGrid({ cohorts, periodLabels, format, sizeLabel }: CohortGridProps) {
  const currency = format === "currency";
  const periods = Math.max(...cohorts.map((c) => c.values.length));
  const labels = periodLabels ?? Array.from({ length: periods }, (_, i) => `P${i}`);
  const all = cohorts.flatMap((c) => c.values);
  const max = Math.max(1, ...all);
  const min = currency ? Math.min(...all) : 0;
  const scale = (v: number) => (v - min) / (max - min || 1);
  const fmt = (v: number) =>
    currency ? formatCurrency(Math.round(v)) : `${v.toFixed(v < 10 ? 1 : 0)}%`;
  const average = Array.from({ length: periods }, (_, i) => {
    const rows = cohorts.filter((c) => c.values[i] != null);
    const size = rows.reduce((a, c) => a + c.size, 0);
    return size ? rows.reduce((a, c) => a + c.values[i] * c.size, 0) / size : undefined;
  });
  return (
    <div className="kit-cohort-wrap">
      <div className="kit-scroll">
        <table className="kit-cohort">
          <thead>
            <tr>
              <th>Cohort</th>
              <th className="kit-num">{sizeLabel ?? "Users"}</th>
              {labels.slice(0, periods).map((label) => (
                <th key={label}>{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohorts.map((row) => (
              <tr key={row.cohort}>
                <th scope="row">{row.cohort}</th>
                <td className="kit-num kit-muted">{formatNumber(row.size)}</td>
                {Array.from({ length: periods }, (_, i) => {
                  const v = row.values[i];
                  if (v == null) return <td key={i} />;
                  const s = scale(v);
                  return (
                    <td key={i} className="kit-cohort__cell-wrap">
                      <span
                        className={`kit-cohort__cell${s > 0.58 ? " kit-cohort__cell--strong" : ""}`}
                        style={{ background: heat(s) }}
                        title={`${row.cohort}, ${labels[i] ?? i}: ${fmt(v)}`}
                      >
                        {fmt(v)}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr className="kit-cohort__average">
              <th scope="row">Average</th>
              <td className="kit-num kit-muted">
                {formatNumber(cohorts.reduce((a, c) => a + c.size, 0) / cohorts.length)}
              </td>
              {average.map((v, i) => (
                <td key={i} className="kit-num">
                  {v == null ? "" : fmt(v)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="kit-scale-legend" aria-hidden>
        <span>{fmt(min).replace(/^0\.0%$/, "0%")}</span>
        <span
          className="kit-scale-legend__ramp"
          style={{ background: `linear-gradient(90deg, ${heat(0)}, ${heat(0.5)}, ${heat(1)})` }}
        />
        <span>{fmt(max)}</span>
      </div>
    </div>
  );
}
