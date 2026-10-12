import { changeTone } from "../../core/format";
import type { Kpi } from "../../core/schemas";
import { Sparkline } from "../Charts/Sparkline";
import { useContainerSize } from "../Charts/hooks";
import { DeltaPill } from "../DeltaPill";
import { RollingNumber } from "../RollingNumber";
import { kpiColumns } from "./kpiLayout";

export interface KpiStripProps {
  metrics: Kpi[];
  /** The label of the tile shown in the hero chart, if any. */
  selected?: string;
  /**
   * Make tiles with a trend into tabs: called with a tile's label when it is
   * chosen, or "" when the chosen tile is chosen again.
   */
  onSelect?: (label: string) => void;
}

/**
 * Supporting KPI tiles: each value with its change (colored by whether that
 * direction is good), the previous value, a sparkline, and a definition. The
 * strip balances its rows to its width, and each row's tiles share row lines
 * so values align when a label wraps.
 */
export function KpiStrip({ metrics, selected, onSelect }: KpiStripProps) {
  const [ref, size] = useContainerSize<HTMLDivElement>(1200);
  const columns = kpiColumns(metrics.length, size.width);
  const rows = Array.from({ length: Math.ceil(metrics.length / columns) }, (_, r) =>
    metrics.slice(r * columns, (r + 1) * columns),
  );
  const tile = (m: Kpi) => (
    <>
      <span className="kit-kpi__label">{m.label}</span>
      <RollingNumber value={m.value} className="kit-kpi__value" />
      <span className="kit-kpi__meta">
        <DeltaPill change={m.change} goodDirection={m.goodDirection} />
        {m.previous && <span className="kit-kpi__previous">vs {m.previous}</span>}
      </span>
      {m.series && m.series.length > 1 ? (
        <Sparkline values={m.series} tone={changeTone(m.change, m.goodDirection)} />
      ) : (
        <span />
      )}
      <span className="kit-kpi__hint">{m.hint}</span>
    </>
  );
  return (
    <div ref={ref} className="kit-kpis">
      {rows.map((row, r) => (
        <div
          key={r}
          className="kit-kpis__row"
          style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
        >
          {row.map((m, i) =>
            onSelect && m.trend ? (
              <button
                key={`${m.label}-${i}`}
                type="button"
                className="kit-kpi kit-kpi--tab"
                aria-pressed={selected === m.label}
                title={`Show ${m.label} in the chart`}
                onClick={() => onSelect(selected === m.label ? "" : m.label)}
              >
                {tile(m)}
              </button>
            ) : (
              <div key={`${m.label}-${i}`} className="kit-kpi">
                {tile(m)}
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}
