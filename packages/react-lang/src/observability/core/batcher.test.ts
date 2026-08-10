// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Batcher } from "./batcher";
import * as transport from "./transport";
import type { WireEvent } from "./wire";

const transportConfig = {
  endpoint: "https://ingest.example.com/v1/events",
  apiKey: "test-key",
  debug: false,
};

function wireEvent(index: number): WireEvent {
  return {
    id: `event-${index}`,
    kind: "react-lang:stream",
    level: "info",
    timestamp: index,
    updateIndex: index,
    errorCount: 0,
  };
}

describe("Batcher", () => {
  beforeEach(() => {
    vi.spyOn(transport, "sendEnvelope").mockResolvedValue(true);
    vi.spyOn(transport, "sendEnvelopeBeacon").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("flushes on interval when the queue is non-empty", async () => {
    vi.useFakeTimers();
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    await vi.advanceTimersByTimeAsync(5000);

    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);
    await batcher.close();
  });

  it("flushes when the queue reaches 50 events", async () => {
    const batcher = new Batcher(transportConfig);
    for (let index = 0; index < 50; index++) {
      batcher.enqueue(wireEvent(index));
    }

    await Promise.resolve();
    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);
    const envelope = vi.mocked(transport.sendEnvelope).mock.calls[0]?.[0];
    expect(envelope?.events).toHaveLength(50);
    await batcher.close();
  });

  it("explicit flush resolves true when transport accepts every batch", async () => {
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));
    batcher.enqueue(wireEvent(2));

    await expect(batcher.flush()).resolves.toBe(true);
    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);
    await batcher.close();
  });

  it("explicit flush resolves false when transport drops a batch", async () => {
    vi.mocked(transport.sendEnvelope).mockResolvedValue(false);
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    await expect(batcher.flush()).resolves.toBe(false);
    await batcher.close();
  });

  it("close resolves false when transport drops during final flush", async () => {
    vi.mocked(transport.sendEnvelope).mockResolvedValue(false);
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    await expect(batcher.close()).resolves.toBe(false);
  });

  it("flush resolves false within timeoutMs while send is in retry backoff", async () => {
    vi.useFakeTimers();
    vi.restoreAllMocks();
    vi.spyOn(transport, "sendEnvelopeBeacon").mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 500 }));
    vi.stubGlobal("fetch", fetchMock);

    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    const flushPromise = batcher.flush(100);
    await vi.advanceTimersByTimeAsync(100);

    await expect(flushPromise).resolves.toBe(false);
    await vi.runAllTimersAsync();
    await batcher.close();
  });

  it("stamps droppedEvents from queue overflow on the next envelope", async () => {
    const flushSpy = vi.spyOn(Batcher.prototype, "flushNextBatch").mockResolvedValue({
      accepted: true,
      timedOut: false,
    });
    const batcher = new Batcher(transportConfig);

    for (let index = 0; index < 501; index++) {
      batcher.enqueue(wireEvent(index));
    }

    flushSpy.mockRestore();
    await batcher.flush();

    const envelopes = vi.mocked(transport.sendEnvelope).mock.calls.map(([payload]) => payload);
    expect(envelopes.some((payload) => payload.droppedEvents === 1)).toBe(true);
    await batcher.close();
  });

  it("pagehide flushes through the beacon path", () => {
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    window.dispatchEvent(new Event("pagehide"));

    expect(transport.sendEnvelopeBeacon).toHaveBeenCalledTimes(1);
    expect(transport.sendEnvelope).not.toHaveBeenCalled();
  });

  it("visibilitychange to hidden flushes through the beacon path", () => {
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));

    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      get: () => "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(transport.sendEnvelopeBeacon).toHaveBeenCalledTimes(1);
  });
});
