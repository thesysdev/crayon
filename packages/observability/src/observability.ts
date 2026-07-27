import type { ObservabilityErrorInfo, ObservabilityEvent, ObservabilitySeverity } from "./types";

export type Unsubscribe = () => void;

export interface EmitOptions {
  /** Defaults to "error" for `*:error` types, "warning" for `*:warning` types, "info" otherwise. */
  severity?: ObservabilitySeverity;
}

/**
 * A `listen` key: either an exact event type (`"fetch:error"`) or a severity
 * (`"info"` | `"warning"` | `"error"`) that matches every event of that
 * severity. The `string & {}` keeps severity autocomplete without narrowing
 * the type-string case away.
 */
export type ListenKey = ObservabilitySeverity | (string & {});

/**
 * The observability bus. Modeled on a toast library's contract — the bus is
 * itself callable to emit an event, with severity shortcuts hanging off it:
 *
 * ```ts
 * observability("fetch:request", { requestId, url });          // like toast(...)
 * observability.error("llm:timeout", { requestId });            // like toast.error(...)
 * observability.listen("fetch:error", (event) => { ... });      // by type
 * observability.listen("error", (event) => { ... });            // by severity
 * observability.listen(["error", "fetch:request"], (e) => {});  // a mix of both
 * ```
 */
export interface Observability {
  /** Emit any event. Severity is inferred from the type suffix unless overridden. */
  <TDetail>(type: string, detail: TDetail, options?: EmitOptions): void;

  /**
   * Listen by exact event type (`"fetch:error"`), by severity
   * (`"info"`/`"warning"`/`"error"` — matches every event of that severity), or
   * by an array mixing both (matches an event that satisfies **any** key). A
   * handler registered under several matching keys still fires once per event.
   * Returns a remover.
   */
  listen<TDetail = unknown>(
    key: ListenKey | ListenKey[],
    handler: (event: ObservabilityEvent<TDetail>) => void,
  ): Unsubscribe;
  /** Listen to every event — the attachment point for sinks. Returns a remover. */
  listenAll(handler: (event: ObservabilityEvent) => void): Unsubscribe;

  /** Severity shortcut — emit `type` as an info event. */
  info<TDetail>(type: string, detail: TDetail): void;
  /** Severity shortcut — emit `type` as a warning event. */
  warn<TDetail>(type: string, detail: TDetail): void;
  /** Severity shortcut — emit `type` as an error event. */
  error<TDetail>(type: string, detail: TDetail): void;
}

/** Normalize any thrown value into the fixed error shape carried by `*:error` events. */
export function toErrorInfo(value: unknown): ObservabilityErrorInfo {
  if (value instanceof Error) {
    return { name: value.name, message: value.message, stack: value.stack, cause: value };
  }
  let message: string;
  if (typeof value === "string") {
    message = value;
  } else {
    try {
      message = JSON.stringify(value) ?? String(value);
    } catch {
      message = String(value);
    }
  }
  return { message, cause: value };
}

const SEVERITIES = new Set<string>(["info", "warning", "error"]);

function isSeverity(key: string): key is ObservabilitySeverity {
  return SEVERITIES.has(key);
}

function defaultSeverity(type: string): ObservabilitySeverity {
  if (type.endsWith(":error")) return "error";
  if (type.endsWith(":warning")) return "warning";
  return "info";
}

type AnyListener = (event: ObservabilityEvent) => void;

/**
 * All listeners live in one map keyed `"{severity}-{type}"`, with `*` for the
 * dimension a subscription doesn't constrain, plus a literal "all" key:
 *   - listen by severity "error"      → "error-*"
 *   - listen by type "fetch:error"    → "*-fetch:error"
 *   - listenAll                       → "all"
 * An event of type T / severity S is delivered to "S-*", "*-T", and "all".
 */
const ALL_KEY = "all";
const severitySlot = (severity: ObservabilitySeverity) => `${severity}-*`;
const typeSlot = (type: string) => `*-${type}`;

/** Internal — the package exports a single shared instance, not this factory. */
function createObservability(): Observability {
  const listeners = new Map<string, Set<AnyListener>>();

  // A throwing listener must not break the emitter or other listeners.
  const deliver = (listener: AnyListener, event: ObservabilityEvent) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[@openuidev/observability] listener threw", error);
    }
  };

  const subscribe = (slot: string, handler: AnyListener): Unsubscribe => {
    let set = listeners.get(slot);
    if (!set) {
      set = new Set();
      listeners.set(slot, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  };

  const emit = <TDetail>(type: string, detail: TDetail, options?: EmitOptions): void => {
    const event: ObservabilityEvent = {
      type,
      severity: options?.severity ?? defaultSeverity(type),
      timestamp: Date.now(),
      detail,
    };
    // Union into a Set so a handler matched by several slots fires only once.
    const targets = new Set<AnyListener>();
    listeners.get(severitySlot(event.severity))?.forEach((listener) => targets.add(listener));
    listeners.get(typeSlot(type))?.forEach((listener) => targets.add(listener));
    listeners.get(ALL_KEY)?.forEach((listener) => targets.add(listener));
    targets.forEach((listener) => deliver(listener, event));
  };

  // The bus IS the emit function, with the rest of the API attached to it.
  const bus = emit as Observability;

  bus.listen = (key, handler) => {
    const keys = Array.isArray(key) ? key : [key];
    const removers = keys.map((k) =>
      subscribe(isSeverity(k) ? severitySlot(k) : typeSlot(k), handler as AnyListener),
    );
    return () => removers.forEach((remove) => remove());
  };
  bus.listenAll = (handler) => subscribe(ALL_KEY, handler);
  bus.info = (type, detail) => emit(type, detail, { severity: "info" });
  bus.warn = (type, detail) => emit(type, detail, { severity: "warning" });
  bus.error = (type, detail) => emit(type, detail, { severity: "error" });

  return bus;
}

/** The shared observability bus. Import this everywhere — there is one per app. */
export const observability: Observability = createObservability();
