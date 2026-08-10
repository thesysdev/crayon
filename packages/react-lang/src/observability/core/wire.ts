import type { ObservabilityLevel } from "@openuidev/observability";

/** Must be kept in sync with packages/react-lang/package.json on release. */
export const SDK_VERSION = "0.2.11";

export interface StreamParserMetadata {
  incomplete: boolean;
  unresolved: unknown;
  orphaned: unknown;
  statementCount: number;
}

export interface WireEvent {
  id: string;
  kind: "react-lang:stream";
  level: ObservabilityLevel;
  timestamp: number;
  updateIndex: number;
  errorCount: number;
  parser?: StreamParserMetadata;
  response?: string;
  responseTruncated?: true;
  message?: string;
  errors?: unknown;
}

export interface WireEnvelope {
  v: 1;
  sentAt: number;
  sdk: { name: "react-lang"; version: string };
  droppedEvents?: number;
  events: WireEvent[];
}
