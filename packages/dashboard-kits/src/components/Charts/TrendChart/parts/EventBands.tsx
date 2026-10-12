import type { ChartEvent } from "../../../../core/schemas";
import { KIT_CHART_PREFIX } from "../../utils/constants";

const P = `${KIT_CHART_PREFIX}-trend-chart`;

/** Shaded spans for events (a sale, a holiday), each labeled at its top-left. */
export function EventBands({
  events,
  labels,
  x,
  top,
  height,
  halfStep,
  active,
}: {
  events: ChartEvent[];
  labels: string[];
  x: (index: number) => number;
  top: number;
  height: number;
  /** Half the distance between points, so a span covers its whole first and last day. */
  halfStep: number;
  active?: ChartEvent;
}) {
  return (
    <g className={`${P}-events`}>
      {events.map((event) => {
        const a = labels.indexOf(event.start);
        const b = labels.indexOf(event.end);
        if (a < 0 || b < 0) return null;
        return (
          <g
            key={event.label}
            className={`${P}-event${event === active ? ` ${P}-event--active` : ""}`}
          >
            <rect
              x={x(a) - halfStep}
              y={top}
              width={x(b) - x(a) + halfStep * 2}
              height={height}
              className={`${P}-event-band`}
            />
            <text x={x(a) - halfStep + 6} y={top + 13} className={`${P}-event-label`}>
              {event.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** The event a point falls inside, if any. */
export function eventAt(events: ChartEvent[], labels: string[], index: number) {
  return events.find((event) => {
    const a = labels.indexOf(event.start);
    const b = labels.indexOf(event.end);
    return a >= 0 && b >= 0 && index >= a && index <= b;
  });
}
