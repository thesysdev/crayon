import type { ObservabilityEvent } from "@openuidev/observability";
import { STREAM_EVENT_KIND, STREAM_PHASE_SETTLED } from "../streamEventContract";
import type { StreamParserMetadata, StreamWireEvent, WireEvent } from "./wire";

const MAX_RESPONSE_LENGTH = 16_384;

export interface SelectorOptions {
  capture: "full" | "minimal";
  sampleRate: number;
  beforeSend?: (event: WireEvent) => WireEvent | null;
  debug: boolean;
}

function hashToUnitInterval(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967296;
}

function debugWarn(debug: boolean, message: string, error?: unknown): void {
  if (!debug) return;
  if (error === undefined) {
    console.warn("[@openuidev/react-lang/observability]", message);
    return;
  }
  console.warn("[@openuidev/react-lang/observability]", message, error);
}

function isStreamParserMetadata(value: unknown): value is StreamParserMetadata {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.incomplete === "boolean" &&
    "unresolved" in record &&
    "orphaned" in record &&
    typeof record.statementCount === "number"
  );
}

interface ShapedEvent {
  wireEvent: WireEvent;
  /** Stable key the shared pipeline hashes for the sampling decision. */
  sampleKey: string;
}

/** Kind-specific stage: filtering, field validation, and full/minimal shaping. */
function shapeStreamEvent(
  event: ObservabilityEvent,
  capture: SelectorOptions["capture"],
): ShapedEvent | null {
  const { detail } = event;
  if (detail.kind !== STREAM_EVENT_KIND || detail.phase !== STREAM_PHASE_SETTLED) return null;

  const id = detail.id;
  if (typeof id !== "string") return null;

  const updateIndex = detail.updateIndex;
  const errorCount = detail.errorCount;
  if (typeof updateIndex !== "number" || typeof errorCount !== "number") return null;

  const parser = isStreamParserMetadata(detail.parser) ? detail.parser : undefined;

  let shaped: StreamWireEvent;
  if (capture === "minimal") {
    shaped = {
      id,
      kind: STREAM_EVENT_KIND,
      level: event.level,
      timestamp: event.timestamp,
      updateIndex,
      errorCount,
      ...(parser ? { parser } : {}),
    };
  } else {
    const response = typeof detail.response === "string" ? detail.response : undefined;
    let responseTruncated: true | undefined;
    let truncatedResponse = response;
    if (response && response.length > MAX_RESPONSE_LENGTH) {
      truncatedResponse = response.slice(0, MAX_RESPONSE_LENGTH);
      responseTruncated = true;
    }

    shaped = {
      id,
      kind: STREAM_EVENT_KIND,
      level: event.level,
      timestamp: event.timestamp,
      updateIndex,
      errorCount,
      ...(parser ? { parser } : {}),
      ...(truncatedResponse !== undefined ? { response: truncatedResponse } : {}),
      ...(responseTruncated ? { responseTruncated } : {}),
      ...(typeof detail.message === "string" ? { message: detail.message } : {}),
      ...(detail.errors !== undefined ? { errors: detail.errors } : {}),
    };
  }

  return { wireEvent: shaped, sampleKey: id };
}

/** Shared pipeline: kind-specific shaping, then sampling and beforeSend. */
export function selectEvent(event: ObservabilityEvent, options: SelectorOptions): WireEvent | null {
  const result = shapeStreamEvent(event, options.capture);
  if (!result) return null;

  if (options.sampleRate < 1 && hashToUnitInterval(result.sampleKey) >= options.sampleRate) {
    return null;
  }

  const shaped = result.wireEvent;
  if (!options.beforeSend) return shaped;

  try {
    return options.beforeSend(shaped);
  } catch (error) {
    debugWarn(options.debug, "beforeSend threw; dropping event", error);
    return null;
  }
}
