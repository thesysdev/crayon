import type { ObservabilityErrorInfo, ObservabilityEvent, ObservabilitySeverity } from "./types";

export type Unsubscribe = () => void;

export interface EmitOptions {
  /** Defaults to "error" for `*:error` types, "warning" for `*:warning` types, "info" otherwise. */
  severity?: ObservabilitySeverity;
}

/**
 * The observability bus. Modeled on a toast library's contract — the bus is
 * itself callable to emit an event, with severity shortcuts hanging off it:
 *
 * ```ts
 * observability("fetch:request", { requestId, url });   // like toast(...)
 * observability.error("llm:timeout", { requestId });     // like toast.error(...)
 * observability.listen("llm:error", (event) => { ... }); // subscribe
 * ```
 */
export interface Observability {
  /** Emit any event. Severity is inferred from the type suffix unless overridden. */
  <TDetail>(type: string, detail: TDetail, options?: EmitOptions): void;

  /** Listen to one event type. Returns a remover. */
  listen<TDetail = unknown>(
    type: string,
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

function defaultSeverity(type: string): ObservabilitySeverity {
  if (type.endsWith(":error")) return "error";
  if (type.endsWith(":warning")) return "warning";
  return "info";
}

type AnyListener = (event: ObservabilityEvent) => void;

/** Internal — the package exports a single shared instance, not this factory. */
function createObservability(): Observability {
  const byType = new Map<string, Set<AnyListener>>();
  const all = new Set<AnyListener>();

  // A throwing listener must not break the emitter or other listeners.
  const deliver = (listener: AnyListener, event: ObservabilityEvent) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[@openuidev/observability] listener threw", error);
    }
  };

  const emit = <TDetail>(type: string, detail: TDetail, options?: EmitOptions): void => {
    const event: ObservabilityEvent = {
      type,
      severity: options?.severity ?? defaultSeverity(type),
      timestamp: Date.now(),
      detail,
    };
    byType.get(type)?.forEach((listener) => deliver(listener, event));
    all.forEach((listener) => deliver(listener, event));
  };

  // The bus IS the emit function, with the rest of the API attached to it.
  const bus = emit as Observability;

  bus.listen = (type, handler) => {
    let listeners = byType.get(type);
    if (!listeners) {
      listeners = new Set();
      byType.set(type, listeners);
    }
    listeners.add(handler as AnyListener);
    return () => {
      listeners.delete(handler as AnyListener);
    };
  };
  bus.listenAll = (handler) => {
    all.add(handler);
    return () => {
      all.delete(handler);
    };
  };
  bus.info = (type, detail) => emit(type, detail, { severity: "info" });
  bus.warn = (type, detail) => emit(type, detail, { severity: "warning" });
  bus.error = (type, detail) => emit(type, detail, { severity: "error" });

  return bus;
}

/** The shared observability bus. Import this everywhere — there is one per app. */
export const observability: Observability = createObservability();
