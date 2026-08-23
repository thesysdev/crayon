import type { ObservabilityEvent } from "@openuidev/observability";

const STREAM_KIND = "react-lang:stream";

export type InspectListItem =
  | { type: "event"; event: ObservabilityEvent }
  | { type: "run"; runId: string; events: ObservabilityEvent[] };

export function eventRunId(event: ObservabilityEvent): string | null {
  const runId = event.detail["runId"];
  return typeof runId === "string" && runId.length > 0 ? runId : null;
}

export function eventKind(event: ObservabilityEvent): string | undefined {
  return typeof event.detail["kind"] === "string" ? event.detail["kind"] : undefined;
}

/**
 * Collapse events that share a `runId` into one list item, parked at the
 * newest event of that run. Lone runIds stay as ordinary rows so a single
 * in-flight request does not grow a wrapper.
 */
export function groupEventsByRunId(events: ObservabilityEvent[]): InspectListItem[] {
  const buckets = new Map<string, ObservabilityEvent[]>();
  for (const event of events) {
    const runId = eventRunId(event);
    if (!runId) continue;
    const bucket = buckets.get(runId);
    if (bucket) bucket.push(event);
    else buckets.set(runId, [event]);
  }

  const emitted = new Set<string>();
  const items: InspectListItem[] = [];
  for (const event of events) {
    const runId = eventRunId(event);
    if (!runId) {
      items.push({ type: "event", event });
      continue;
    }
    const bucket = buckets.get(runId)!;
    if (bucket.length === 1) {
      items.push({ type: "event", event });
      continue;
    }
    if (emitted.has(runId)) continue;
    emitted.add(runId);
    items.push({ type: "run", runId, events: presentRunEvents(bucket) });
  }
  return items;
}

/** One request, one response/error, one stream — chronological inside the card. */
export function presentRunEvents(events: ObservabilityEvent[]): ObservabilityEvent[] {
  return sortRunEvents(collapseStreams(events));
}

export function runGroupTitle(events: ObservabilityEvent[]): string {
  for (const event of events) {
    if (eventKind(event) !== "LLM:request") continue;
    const text = userMessageText(event.detail["userMessage"]);
    if (text) return text;
  }
  return "LLM run";
}

/** Worst level in the group, including stream parse errors and 429s. */
export function runGroupLevel(events: ObservabilityEvent[]): ObservabilityEvent["level"] {
  if (events.some((event) => event.level === "error")) return "error";
  if (events.some((event) => event.level === "warning")) return "warning";
  return "info";
}

export function displayEventKind(kind: string): string {
  switch (kind) {
    case "LLM:request":
      return "Request sent";
    case "LLM:response":
      return "Response received";
    case "LLM:error":
      return "Request failed";
    default:
      return kind;
  }
}

function collapseStreams(events: ObservabilityEvent[]): ObservabilityEvent[] {
  const streams = events.filter((event) => eventKind(event) === STREAM_KIND);
  if (streams.length <= 1) return events;
  const chosen = streams.reduce((best, event) => (preferStream(event, best) ? event : best));
  return [...events.filter((event) => eventKind(event) !== STREAM_KIND), chosen];
}

function preferStream(candidate: ObservabilityEvent, best: ObservabilityEvent): boolean {
  const candidateSettled = candidate.detail["phase"] === "settled";
  const bestSettled = best.detail["phase"] === "settled";
  if (candidateSettled !== bestSettled) return candidateSettled;
  return candidate.timestamp >= best.timestamp;
}

function sortRunEvents(events: ObservabilityEvent[]): ObservabilityEvent[] {
  return [...events].sort((a, b) => {
    const rank = kindRank(eventKind(a)) - kindRank(eventKind(b));
    if (rank !== 0) return rank;
    return a.timestamp - b.timestamp;
  });
}

function kindRank(kind: string | undefined): number {
  if (kind === "LLM:request") return 0;
  if (kind === "LLM:response" || kind === "LLM:error") return 1;
  if (kind === STREAM_KIND) return 2;
  return 3;
}

function userMessageText(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (!value || typeof value !== "object") return undefined;
  const content = (value as { content?: unknown }).content;
  if (typeof content === "string") {
    const trimmed = content.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (!Array.isArray(content)) return undefined;
  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (
        part &&
        typeof part === "object" &&
        typeof (part as { text?: unknown }).text === "string"
      ) {
        return (part as { text: string }).text;
      }
      return "";
    })
    .join("");
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
