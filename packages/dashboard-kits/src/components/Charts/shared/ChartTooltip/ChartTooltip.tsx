import { useCallback, useRef, type ReactNode } from "react";
import { useIsomorphicLayoutEffect } from "../../hooks/useIsomorphicLayoutEffect";
import { ChartKey, type ChartKeyShape } from "../ChartLegend/ChartKey";
import { springPresets, useTranslate } from "../spring";

export interface TooltipRow extends ChartKeyShape {
  color: string;
  name: string;
  value: string;
}

/** Gap between the hovered point and the tooltip. */
const OFFSET = 12;

/**
 * The hover readout every kit chart shares: values lead, series names follow,
 * each keyed with the same mark as its series. An optional note sits under the
 * title (the event a point falls in, an in-progress day) and an optional
 * footer under the rows (a total, the change against the prior period).
 *
 * It follows the hovered point on react-ui's tooltip spring, as react-ui's
 * chart tooltip does: mounted once per hover session, it jumps into place on
 * its first position and glides after, flipping to the left of the point when
 * it would run past the chart's right edge.
 */
export function ChartTooltip({
  x,
  y,
  width,
  title,
  note,
  rows,
  footer,
}: {
  x: number;
  y: number;
  width: number;
  title: string;
  note?: string;
  rows: TooltipRow[];
  footer?: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const follow = useTranslate(springPresets.tooltip);
  const seeded = useRef(false);
  const bind = useCallback(
    (el: HTMLDivElement | null) => {
      panelRef.current = el;
      follow.bind(el);
    },
    [follow],
  );

  // Every render: the content (and so the panel's width) changes with the point.
  useIsomorphicLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const w = panel.offsetWidth;
    const flip = x + OFFSET + w > width && x - OFFSET - w >= 0;
    const tx = flip ? x - OFFSET - w : Math.min(x + OFFSET, Math.max(0, width - w));
    const ty = Math.max(0, y);
    if (seeded.current) {
      follow.to(tx, ty);
    } else {
      follow.jump(tx, ty);
      seeded.current = true;
    }
  });

  return (
    <div ref={bind} className="kit-tooltip" role="status">
      <div className="kit-tooltip__title">{title}</div>
      {note && <div className="kit-tooltip__note">{note}</div>}
      {rows.map((row) => (
        <div key={row.name} className="kit-tooltip__row">
          <ChartKey {...row} />
          <span className="kit-tooltip__value">{row.value}</span>
          <span className="kit-tooltip__name">{row.name}</span>
        </div>
      ))}
      {footer && <div className="kit-tooltip__footer">{footer}</div>}
    </div>
  );
}
