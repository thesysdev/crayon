import type { ObservabilityEvent } from "@openuidev/observability";
import type { WireEventBase } from "../core/wire";

/**
 * Shared producer↔sink contract for stream lifecycle events. The hook
 * (src/hooks/useStreamingObservability.ts) builds event details against this
 * module, and selectStreamEvent filters against the same constants, so the two
 * sides cannot silently drift.
 */
export const STREAM_EVENT_KIND = "react-lang:stream" as const;
export type StreamEventKind = typeof STREAM_EVENT_KIND;

export const STREAM_PHASE_STREAMING = "streaming" as const;
export const STREAM_PHASE_SETTLED = "settled" as const;
export type StreamPhase = typeof STREAM_PHASE_STREAMING | typeof STREAM_PHASE_SETTLED;

const MAX_RESPONSE_LENGTH = 16_384;

export interface StreamParserMetadata {
  incomplete: boolean;
  unresolved: unknown;
  orphaned: unknown;
  statementCount: number;
}

/** Detail payload the producer emits when a stream settles. */
export interface SettledStreamEventDetail {
  id: string;
  kind: StreamEventKind;
  phase: typeof STREAM_PHASE_SETTLED;
  updateIndex: number;
  response: string | null;
  responseLength: number;
  parser?: StreamParserMetadata;
  errors: unknown[];
  errorCount: number;
  message: string;
}

/** Wire shape for settled stream events sent to cloud ingest. */
export interface StreamWireEvent extends WireEventBase {
  kind: StreamEventKind;
  updateIndex: number;
  errorCount: number;
  parser?: StreamParserMetadata;
  response?: string;
  responseTruncated?: true;
  message?: string;
  errors?: unknown;
}

function isStreamParserMetadata(value: unknown): value is StreamParserMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["incomplete"] === "boolean" &&
    "unresolved" in record &&
    "orphaned" in record &&
    typeof record["statementCount"] === "number"
  );
}

/**
 * Returns a wire event when `event` is a settled stream event the cloud sink
 * should keep; otherwise null. Kind filtering, validation, and capture shaping
 * all live here so the shared selector stays kind-agnostic.
 */
export function selectStreamEvent(
  event: ObservabilityEvent,
  capture: "full" | "minimal",
): StreamWireEvent | null {
  const { detail } = event;
  if (detail["kind"] !== STREAM_EVENT_KIND || detail["phase"] !== STREAM_PHASE_SETTLED) return null;

  const id = detail["id"];
  if (typeof id !== "string") return null;

  const updateIndex = detail["updateIndex"];
  const errorCount = detail["errorCount"];
  if (typeof updateIndex !== "number" || typeof errorCount !== "number") return null;

  const parser = isStreamParserMetadata(detail["parser"]) ? detail["parser"] : undefined;

  if (capture === "minimal") {
    return {
      id,
      kind: STREAM_EVENT_KIND,
      level: event.level,
      timestamp: event.timestamp,
      updateIndex,
      errorCount,
      ...(parser ? { parser } : {}),
    };
  }

  const response = typeof detail["response"] === "string" ? detail["response"] : undefined;
  let responseTruncated: true | undefined;
  let truncatedResponse = response;
  if (response && response.length > MAX_RESPONSE_LENGTH) {
    truncatedResponse = response.slice(0, MAX_RESPONSE_LENGTH);
    responseTruncated = true;
  }

  return {
    id,
    kind: STREAM_EVENT_KIND,
    level: event.level,
    timestamp: event.timestamp,
    updateIndex,
    errorCount,
    ...(parser ? { parser } : {}),
    ...(truncatedResponse !== undefined ? { response: truncatedResponse } : {}),
    ...(responseTruncated ? { responseTruncated } : {}),
    ...(typeof detail["message"] === "string" ? { message: detail["message"] } : {}),
    ...(detail["errors"] !== undefined ? { errors: detail["errors"] } : {}),
  };
}
