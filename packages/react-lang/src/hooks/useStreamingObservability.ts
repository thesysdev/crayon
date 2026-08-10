import type { OpenUIError, ParseResult } from "@openuidev/lang-core";
import { observability } from "@openuidev/observability";
import { useEffect, useRef } from "react";
import {
  STREAM_EVENT_KIND,
  STREAM_PHASE_SETTLED,
  STREAM_PHASE_STREAMING,
  type SettledStreamEventDetail,
  type StreamPhase,
} from "../observability/events/stream";

type CurrentRef<T> = { current: T };

export interface UseStreamingObservabilityOptions {
  response: string | null;
  isStreaming: boolean;
  result: ParseResult | null;
  errorsRef: CurrentRef<OpenUIError[]>;
  errorRevision: number;
}

export interface StreamingObservabilityState {
  id: string | null;
  updateIndex: number;
  lastResponse: string | null;
  hasPublishedStreamingSnapshot: boolean;
  settled: boolean;
  lastSettledErrorKey: string | null;
}

export interface StreamingObservabilityUpdate {
  id: string;
  phase: StreamPhase;
  updateIndex: number;
}

let fallbackId = 0;

function createStreamId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  fallbackId += 1;
  return `openui-lang-${Date.now().toString(36)}-${fallbackId.toString(36)}`;
}

export function createStreamingObservabilityState(): StreamingObservabilityState {
  return {
    id: null,
    updateIndex: 0,
    lastResponse: null,
    hasPublishedStreamingSnapshot: false,
    settled: false,
    lastSettledErrorKey: null,
  };
}

/** Advances a Renderer through successive stream lifecycles. */
export function advanceStreamingObservability(
  state: StreamingObservabilityState,
  isStreaming: boolean,
  response: string | null,
  settledErrorKey: string | null = null,
  idFactory: () => string = createStreamId,
): StreamingObservabilityUpdate | null {
  if (isStreaming) {
    // A mounted Renderer can be reused for another message. Once the previous
    // stream has settled, the next streaming transition starts a new identity.
    if (state.settled) Object.assign(state, createStreamingObservabilityState());

    state.id ??= idFactory();
    if (state.hasPublishedStreamingSnapshot && state.lastResponse === response) return null;

    state.hasPublishedStreamingSnapshot = true;
    state.lastResponse = response;
    state.updateIndex += 1;
    return { id: state.id, phase: STREAM_PHASE_STREAMING, updateIndex: state.updateIndex };
  }

  // A Renderer mounted only for static or historical content never starts a stream.
  if (!state.id) return null;
  if (
    state.settled &&
    (settledErrorKey === null || state.lastSettledErrorKey === settledErrorKey)
  ) {
    return null;
  }

  state.settled = true;
  state.lastSettledErrorKey = settledErrorKey;
  return { id: state.id, phase: STREAM_PHASE_SETTLED, updateIndex: state.updateIndex };
}

function parserMetadata(result: ParseResult | null) {
  if (!result) return undefined;
  return {
    incomplete: result.meta.incomplete,
    unresolved: result.meta.unresolved,
    orphaned: result.meta.orphaned,
    statementCount: result.meta.statementCount,
  };
}

/**
 * Publishes the incremental OpenUI Lang stream lifecycle. The stable id is
 * created only after this Renderer instance has actually entered streaming.
 */
export function useStreamingObservability({
  response,
  isStreaming,
  result,
  errorsRef,
  errorRevision,
}: UseStreamingObservabilityOptions): void {
  const streamRef = useRef<StreamingObservabilityState>(createStreamingObservabilityState());

  useEffect(() => {
    const errors = errorsRef.current;
    const settledErrorKey = isStreaming ? null : JSON.stringify(errors);
    const update = advanceStreamingObservability(
      streamRef.current,
      isStreaming,
      response,
      settledErrorKey,
    );

    if (isStreaming) {
      if (update) {
        observability.info({
          id: update.id,
          kind: STREAM_EVENT_KIND,
          phase: update.phase,
          updateIndex: update.updateIndex,
          response,
          responseLength: response?.length ?? 0,
          parser: parserMetadata(result),
          message: "OpenUI Lang is streaming",
        });
      }
      return;
    }

    if (update?.phase === STREAM_PHASE_SETTLED) {
      observability(errors.length > 0 ? "error" : "info", {
        id: update.id,
        kind: STREAM_EVENT_KIND,
        phase: STREAM_PHASE_SETTLED,
        updateIndex: update.updateIndex,
        response,
        responseLength: response?.length ?? 0,
        parser: parserMetadata(result),
        errors,
        errorCount: errors.length,
        message:
          errors.length > 0
            ? `OpenUI Lang settled with ${errors.length} error${errors.length === 1 ? "" : "s"}`
            : "OpenUI Lang settled",
      } satisfies SettledStreamEventDetail);
    }
  }, [isStreaming, response, result, errorsRef, errorRevision]);
}
