/** How a key draws: a stroke for lines, a square for fills, dashes or dots for context. */
export interface ChartKeyShape {
  kind?: "line" | "rect";
  dashed?: boolean;
  dotted?: boolean;
}

/** A legend or tooltip key drawn like its mark, in its series color. */
export function ChartKey({
  color,
  kind = "line",
  dashed,
  dotted,
}: ChartKeyShape & { color: string }) {
  const style = dotted ? " kit-key--dotted" : dashed ? " kit-key--dashed" : "";
  return <i className={`kit-key kit-key--${kind}${style}`} style={{ color }} aria-hidden />;
}
