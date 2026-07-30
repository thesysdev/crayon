/** Element-node shape after evaluation (only the bits the chart needs). */
interface SeriesNode {
  props?: { category?: unknown; values?: unknown };
}

function padEnd(s: string, w: number): string {
  return s.length >= w ? s : s + " ".repeat(w - s.length);
}

/**
 * Render a horizontal ASCII bar chart. Single-series charts show one bar per
 * label; multi-series charts show one bar per (label, series) pair.
 */
export function renderBars(
  labels: string[],
  seriesNodes: SeriesNode[],
  width = 32,
): string[] {
  const series = seriesNodes.map((s) => ({
    category: String(s?.props?.category ?? ""),
    values: Array.isArray(s?.props?.values) ? (s!.props!.values as unknown[]).map(Number) : [],
  }));

  const rows: { name: string; value: number }[] = [];
  labels.forEach((label, i) => {
    series.forEach((s) => {
      rows.push({
        name: series.length > 1 ? `${label} · ${s.category}` : label,
        value: Number.isFinite(s.values[i]) ? s.values[i]! : 0,
      });
    });
  });

  if (rows.length === 0) return ["(no data)"];

  const max = Math.max(1, ...rows.map((r) => Math.abs(r.value)));
  const nameW = Math.max(0, ...rows.map((r) => r.name.length));

  return rows.map((r) => {
    const barLen = Math.max(0, Math.round((Math.abs(r.value) / max) * width));
    const bar = "█".repeat(barLen) || "▏";
    return `${padEnd(r.name, nameW)} │ ${bar} ${r.value}`;
  });
}
