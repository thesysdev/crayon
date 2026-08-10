import type { ObservabilityLevel } from "@openuidev/observability";
import type { StreamWireEvent } from "../events/stream";

/** Must be kept in sync with packages/react-lang/package.json on release. */
export const SDK_VERSION = "0.2.11";

export interface WireEventBase {
  id: string;
  kind: string;
  level: ObservabilityLevel;
  timestamp: number;
}

/** Currently a single member; will widen to a union as more kinds ship. */
export type WireEvent = StreamWireEvent;

export type { StreamWireEvent } from "../events/stream";

export interface WireEnvelope {
  v: 1;
  sentAt: number;
  sdk: { name: "react-lang"; version: string };
  droppedEvents?: number;
  events: WireEvent[];
}
