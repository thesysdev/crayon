import type { StreamParserMetadata } from "./core/wire";

/**
 * Shared producer↔sink contract for stream lifecycle events. The hook
 * (src/hooks/useStreamingObservability.ts) builds event details against this
 * module, and the sink selector (core/selector.ts) filters against the same
 * constants, so the two sides cannot silently drift.
 */
export const STREAM_EVENT_KIND = "react-lang:stream" as const;
export type StreamEventKind = typeof STREAM_EVENT_KIND;

export const STREAM_PHASE_STREAMING = "streaming" as const;
export const STREAM_PHASE_SETTLED = "settled" as const;
export type StreamPhase = typeof STREAM_PHASE_STREAMING | typeof STREAM_PHASE_SETTLED;

/** Detail payload the producer emits when a stream settles. */
export interface SettledStreamEventDetail {
  id: string;
  kind: StreamEventKind;
  phase: typeof STREAM_PHASE_SETTLED;
  updateIndex: number;
  response: string | null;
  responseLength: number;
  parser?: StreamParserMetadata;
  errors: unknown[];
  errorCount: number;
  message: string;
}
