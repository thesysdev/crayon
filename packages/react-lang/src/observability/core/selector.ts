import type { ObservabilityEvent } from "@openuidev/observability";
import type { StreamParserMetadata, WireEvent } from "./wire";

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

export function selectEvent(event: ObservabilityEvent, options: SelectorOptions): WireEvent | null {
  const { detail } = event;
  if (detail.kind !== "react-lang:stream" || detail.phase !== "settled") return null;

  const id = detail.id;
  if (typeof id === "string" && options.sampleRate < 1) {
    if (hashToUnitInterval(id) >= options.sampleRate) return null;
  }

  const updateIndex = detail.updateIndex;
  const errorCount = detail.errorCount;
  if (typeof updateIndex !== "number" || typeof errorCount !== "number") return null;
  if (typeof id !== "string") return null;

  const parser = isStreamParserMetadata(detail.parser) ? detail.parser : undefined;

  let shaped: WireEvent;
  if (options.capture === "minimal") {
    shaped = {
      id,
      kind: "react-lang:stream",
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
      kind: "react-lang:stream",
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

  if (!options.beforeSend) return shaped;

  try {
    return options.beforeSend(shaped);
  } catch (error) {
    debugWarn(options.debug, "beforeSend threw; dropping event", error);
    return null;
  }
}
