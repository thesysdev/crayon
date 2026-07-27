/**
 * Normalized error attached to every `*:error` event. Flat on purpose so
 * third-party sinks (Sentry, Datadog, custom loggers) can forward it without
 * unwrapping.
 */
export interface ObserverErrorInfo {
  /** Error class name, e.g. "TypeError". */
  name?: string;
  message: string;
  stack?: string;
  /** The original thrown value, for listeners that need more than the normalized fields. */
  cause?: unknown;
}

export type ObserverSeverity = "info" | "warning" | "error";

/** The fixed envelope every listener receives, whatever the event type. */
export interface ObserverEvent<TDetail = unknown> {
  /** Namespaced event name, e.g. "fetch:response", "llm:error", "renderer:error". */
  type: string;
  /** Defaults to "error" for `*:error` types, "warning" for `*:warning` types, "info" otherwise. */
  severity: ObserverSeverity;
  /** Milliseconds since epoch. */
  timestamp: number;
  /**
   * Event-specific payload. By convention `*:error` payloads carry
   * `{ error: ObserverErrorInfo }`.
   */
  detail: TDetail;
}
