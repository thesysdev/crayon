import type { ObserverErrorInfo, ObserverEvent, ObserverSeverity } from "./types";

/** Name of the DOM CustomEvent mirrored for every published event. */
export const OBSERVER_EVENT_NAME = "openui_observer:event";

export type Unsubscribe = () => void;

export interface PublishOptions {
  /** Defaults to "error" for `*:error` types, "warning" for `*:warning` types, "info" otherwise. */
  severity?: ObserverSeverity;
}

export interface Observer {
  /** Publish an event to all matching subscribers */
  publish<TDetail>(type: string, detail: TDetail, options?: PublishOptions): void;
  /** Listen to one event type. Returns a remover. */
  subscribe<TDetail = unknown>(
    type: string,
    listener: (event: ObserverEvent<TDetail>) => void,
  ): Unsubscribe;
  /** Listen to every event — the attachment point for third party sinks. Returns a remover. */
  subscribeAll(listener: (event: ObserverEvent) => void): Unsubscribe;
}

/** Normalize any thrown value into the fixed error shape carried by `*:error` events. */
export function toErrorInfo(value: unknown): ObserverErrorInfo {
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

type AnyListener = (event: ObserverEvent) => void;

function defaultSeverity(type: string): ObserverSeverity {
  if (type.endsWith(":error")) return "error";
  if (type.endsWith(":warning")) return "warning";
  return "info";
}

export function createObserver(): Observer {
  const byType = new Map<string, Set<AnyListener>>();
  const all = new Set<AnyListener>();

  // A throwing listener must not break the publisher or other listeners.
  const deliver = (listener: AnyListener, event: ObserverEvent) => {
    try {
      listener(event);
    } catch (error) {
      console.error("[@openuidev/observer] listener threw", error);
    }
  };

  return {
    publish(type, detail, options) {
      const event: ObserverEvent = {
        type,
        severity: options?.severity ?? defaultSeverity(type),
        timestamp: Date.now(),
        detail,
      };

      byType.get(type)?.forEach((listener) => deliver(listener, event));
      all.forEach((listener) => deliver(listener, event));

      if (
        typeof globalThis.dispatchEvent === "function" &&
        typeof globalThis.CustomEvent === "function"
      ) {
        globalThis.dispatchEvent(new CustomEvent(OBSERVER_EVENT_NAME, { detail: event }));
      }
    },
    subscribe(type, listener) {
      let listeners = byType.get(type);
      if (!listeners) {
        listeners = new Set();
        byType.set(type, listeners);
      }
      listeners.add(listener as AnyListener);
      return () => {
        listeners.delete(listener as AnyListener);
      };
    },
    subscribeAll(listener) {
      all.add(listener);
      return () => {
        all.delete(listener);
      };
    },
  };
}

/** Shared default bus. Import this everywhere unless you need an isolated instance. */
export const observer: Observer = createObserver();
