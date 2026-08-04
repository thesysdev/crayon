import { describe, expect, it, vi } from "vitest";
import {
  advanceStreamingObservability,
  createStreamingObservabilityState,
} from "./useStreamingObservability";

describe("streaming observability lifecycle", () => {
  it("does not create an event for content that was never streamed", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi.fn(() => "stream-1");

    expect(
      advanceStreamingObservability(state, false, 'root = Card("done")', "[]", idFactory),
    ).toBeNull();
    expect(idFactory).not.toHaveBeenCalled();
  });

  it("uses one stable id for every update and the settled event", () => {
    const state = createStreamingObservabilityState();
    const idFactory = vi.fn(() => "stream-1");

    expect(advanceStreamingObservability(state, true, "root = Car", null, idFactory)).toEqual({
      streamId: "stream-1",
      phase: "streaming",
      updateIndex: 1,
    });
    expect(
      advanceStreamingObservability(state, true, 'root = Card("done")', null, idFactory),
    ).toEqual({
      streamId: "stream-1",
      phase: "streaming",
      updateIndex: 2,
    });
    expect(
      advanceStreamingObservability(state, false, 'root = Card("done")', "[]", idFactory),
    ).toEqual({
      streamId: "stream-1",
      phase: "settled",
      updateIndex: 2,
    });
    expect(idFactory).toHaveBeenCalledOnce();
  });

  it("emits once per response and unchanged settled snapshot", () => {
    const state = createStreamingObservabilityState();
    const idFactory = () => "stream-1";

    expect(
      advanceStreamingObservability(state, true, "root = Car", null, idFactory),
    ).not.toBeNull();
    expect(advanceStreamingObservability(state, true, "root = Car", null, idFactory)).toBeNull();
    expect(
      advanceStreamingObservability(state, false, "root = Car", "[]", idFactory),
    ).not.toBeNull();
    expect(advanceStreamingObservability(state, false, "root = Car", "[]", idFactory)).toBeNull();
    expect(
      advanceStreamingObservability(state, true, "a second stream", null, idFactory),
    ).toBeNull();
  });

  it("republishes settled when the error snapshot changes", () => {
    const state = createStreamingObservabilityState();
    const idFactory = () => "stream-1";

    advanceStreamingObservability(state, true, "root = Card()", null, idFactory);
    advanceStreamingObservability(state, false, "root = Card()", "[]", idFactory);

    expect(
      advanceStreamingObservability(
        state,
        false,
        "root = Card()",
        '[{"code":"query-error"}]',
        idFactory,
      ),
    ).toEqual({
      streamId: "stream-1",
      phase: "settled",
      updateIndex: 1,
    });
    expect(
      advanceStreamingObservability(
        state,
        false,
        "root = Card()",
        '[{"code":"query-error"}]',
        idFactory,
      ),
    ).toBeNull();
  });
});
