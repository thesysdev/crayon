import type { ObservabilityLevel } from "@openuidev/observability";

/** Must be kept in sync with packages/react-lang/package.json on release. */
export const SDK_VERSION = "0.2.11";

export interface StreamParserMetadata {
  incomplete: boolean;
  unresolved: unknown;
  orphaned: unknown;
  statementCount: number;
}

export interface WireEventBase {
  id: string;
  kind: string;
  level: ObservabilityLevel;
  timestamp: number;
}

export interface StreamWireEvent extends WireEventBase {
  kind: "react-lang:stream";
  updateIndex: number;
  errorCount: number;
  parser?: StreamParserMetadata;
  response?: string;
  responseTruncated?: true;
  message?: string;
  errors?: unknown;
}

/** Currently a single member; will widen to a union as more kinds ship. */
export type WireEvent = StreamWireEvent;

export interface WireEnvelope {
  v: 1;
  sentAt: number;
  sdk: { name: "react-lang"; version: string };
  droppedEvents?: number;
  events: WireEvent[];
}
