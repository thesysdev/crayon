import type { ObservabilityLevel } from "@openuidev/observability";
import type { StreamWireEvent } from "../events/stream";

/** Must be kept in sync with packages/observability-cloud/package.json on release. */
export const SDK_VERSION = "0.0.1";

export interface WireEventBase {
  id: string;
  kind: string;
  level: ObservabilityLevel;
  timestamp: number;
}

/** Currently a single member; will widen to a union as more kinds ship. */
export type WireEvent = StreamWireEvent;

export type { StreamWireEvent, WireErrorEntry } from "../events/stream";

export interface WireEnvelope {
  v: 1;
  sentAt: number;
  sdk: { name: "observability-cloud"; version: string };
  /** The client's capture mode; every event in the batch was shaped by it. */
  capture: "full" | "minimal";
  droppedEvents?: number;
  events: WireEvent[];
}
