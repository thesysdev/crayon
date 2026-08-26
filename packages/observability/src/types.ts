/** The observability interface */
export interface Observability {
  /** Emit an event at `level` carrying `detail`. */
  (level: ObservabilityLevel, detail: ObservabilityDetail): void;

  /**
   * Listen to one level, or several — every event at that level. Returns a
   * remover.
   */
  listen(
    level: ObservabilityLevel | ObservabilityLevel[],
    handler: (event: ObservabilityEvent) => void,
  ): Remove;
  /** Listen to every event — the attachment point for sinks. Returns a remover. */
  listenAll(handler: (event: ObservabilityEvent) => void): Remove;

  /** Level shortcut — emit `detail` at info level. */
  info(detail: ObservabilityDetail): void;
  /** Level shortcut — emit `detail` at warning level. */
  warn(detail: ObservabilityDetail): void;
  /** Level shortcut — emit `detail` at error level. */
  error(detail: ObservabilityDetail): void;
}

export type Remove = () => void;

export type Handler = (event: ObservabilityEvent) => void;

/**
 * Normalized error, convenient to place on an event's `detail` (e.g.
 * `{ error: ObservabilityErrorInfo }`) so third party sinks
 * can forward it without unwrapping.
 */
export interface ObservabilityErrorInfo {
  /** Error class name, e.g. "TypeError". */
  name?: string;
  message: string;
  stack?: string;
  /** The original thrown value, for listeners that need more than the normalized fields. */
  cause?: unknown;
}

export type ObservabilityLevel = "info" | "warning" | "error";

/**
 * Payload shape for every event. A required `kind` gives each
 * event a machine-readable descriptor (the structured replacement for a
 * top-level type); everything else is optional or free extra fields.
 */
export interface ObservabilityDetail {
  /**
   * Stable identity for successive snapshots of one logical event. Consumers
   * may replace an earlier snapshot when another event uses the same id.
   */
  id?: string;
  /** Short descriptor of what happened, e.g. "fetch:error", "route:change". */
  kind: string;
  /** Optional human-readable message. */
  message?: string;
  /** Present on failures; build it with `toErrorInfo()`. */
  error?: ObservabilityErrorInfo;
  /** Extra structured fields — ids, timings, urls, etc. */
  [key: string]: unknown;
}

/** The fixed envelope every listener receives. */
export interface ObservabilityEvent {
  level: ObservabilityLevel;
  /** Milliseconds since epoch. */
  timestamp: number;
  detail: ObservabilityDetail;
}
