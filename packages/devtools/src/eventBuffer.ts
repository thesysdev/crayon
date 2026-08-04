import type { ObservabilityEvent } from "@openuidev/observability";

export function addOrReplaceEvent(
  events: ObservabilityEvent[],
  event: ObservabilityEvent,
  maxEvents: number,
): ObservabilityEvent[] {
  const id = stableEventId(event);
  const remaining = id ? events.filter((existing) => stableEventId(existing) !== id) : events;
  return [event, ...remaining].slice(0, maxEvents);
}

function stableEventId(event: ObservabilityEvent): string | null {
  const detail = event.detail;
  return detail.kind === "react-lang:stream" &&
    typeof detail["streamId"] === "string" &&
    (detail["phase"] === "streaming" || detail["phase"] === "settled")
    ? `${detail.kind}:${detail["streamId"]}`
    : null;
}
