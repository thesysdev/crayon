import type {
  Handler,
  Observability,
  ObservabilityDetail,
  ObservabilityEvent,
  ObservabilityLevel,
  Remove,
} from "./types";

/**
 * All listeners live in one map keyed by level plus a
 * literal "all" key for `listenAll`. An event at level
 * L is delivered to the L level and "all".
 */
const ALL_KEY = "all";

/** Internal — the package exports a single shared instance, not this factory. */
function createObservability(): Observability {
  const listeners = new Map<string, Set<Handler>>();

  // A throwing listener must not break the emitter or other listeners.
  const deliver = (listener: Handler, event: ObservabilityEvent) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[@openuidev/observability] listener threw", error);
    }
  };

  const subscribe = (key: string, handler: Handler): Remove => {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(handler);
    return () => {
      set.delete(handler);
    };
  };

  const emit = (level: ObservabilityLevel, detail: ObservabilityDetail): void => {
    const event: ObservabilityEvent = { level, timestamp: Date.now(), detail };
    const targets = new Set<Handler>();
    listeners.get(level)?.forEach((listener) => targets.add(listener));
    listeners.get(ALL_KEY)?.forEach((listener) => targets.add(listener));
    targets.forEach((listener) => deliver(listener, event));
  };

  // The bus IS the emit function, with the rest of the API attached to it.
  const bus = emit as Observability;

  bus.listen = (level, handler) => {
    const levels = Array.isArray(level) ? level : [level];
    const removers = levels.map((l) => subscribe(l, handler as Handler));
    return () => removers.forEach((remove) => remove());
  };
  bus.listenAll = (handler) => subscribe(ALL_KEY, handler);
  bus.info = (detail) => emit("info", detail);
  bus.warn = (detail) => emit("warning", detail);
  bus.error = (detail) => emit("error", detail);

  return bus;
}

/**
 * The shared observability bus. Keyed on globalThis via `Symbol.for` so
 * duplicate copies of this module (ESM/CJS dual builds, nested package
 * versions) still share one instance.
 */
const BUS_KEY = Symbol.for("openui.observability");
const store = globalThis as { [BUS_KEY]?: Observability };
export const observability: Observability = (store[BUS_KEY] ??= createObservability());
