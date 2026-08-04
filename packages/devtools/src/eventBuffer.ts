import type { ObservabilityEvent } from "@openuidev/observability";

export function addOrReplaceEvent(
  events: ObservabilityEvent[],
  event: ObservabilityEvent,
  maxEvents: number,
): ObservabilityEvent[] {
  const id = stableEventId(event);
  const remaining =
    id === null ? events : events.filter((existing) => stableEventId(existing) !== id);
  return [event, ...remaining].slice(0, maxEvents);
}

function stableEventId(event: ObservabilityEvent): string | null {
  return typeof event.detail["id"] === "string" ? event.detail["id"] : null;
}
