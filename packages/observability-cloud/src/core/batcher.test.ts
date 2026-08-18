// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Batcher } from "./batcher";
import * as transport from "./transport";
import type { WireEvent } from "./wire";

const transportConfig = {
  endpoint: "https://ingest.example.com/v1/events",
  apiKey: "test-key",
  debug: false,
  capture: "full" as const,
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
    expect(envelope?.capture).toBe("full");
    await batcher.close();
  });

  it("stamps the client's capture mode on every envelope", async () => {
    const batcher = new Batcher({ ...transportConfig, capture: "minimal" });
    batcher.enqueue(wireEvent(0));
    await batcher.flush();
    const envelope = vi.mocked(transport.sendEnvelope).mock.calls[0]?.[0];
    expect(envelope?.capture).toBe("minimal");
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

  it("flush awaits a threshold-initiated in-flight send and reflects its failure", async () => {
    let resolveSend!: (accepted: boolean) => void;
    vi.mocked(transport.sendEnvelope).mockImplementation(
      () => new Promise<boolean>((resolve) => (resolveSend = resolve)),
    );
    const batcher = new Batcher(transportConfig);
    for (let index = 0; index < 50; index++) {
      batcher.enqueue(wireEvent(index));
    }
    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);

    let settled = false;
    const flushPromise = batcher.flush();
    void flushPromise.then(() => {
      settled = true;
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveSend(false);
    await expect(flushPromise).resolves.toBe(false);
    vi.mocked(transport.sendEnvelope).mockResolvedValue(true);
    await batcher.close();
  });

  it("flush resolves false within timeoutMs when the in-flight send is stuck", async () => {
    vi.useFakeTimers();
    vi.mocked(transport.sendEnvelope).mockImplementation(() => new Promise<boolean>(() => {}));
    const batcher = new Batcher(transportConfig);
    for (let index = 0; index < 50; index++) {
      batcher.enqueue(wireEvent(index));
    }

    const flushPromise = batcher.flush(100);
    await vi.advanceTimersByTimeAsync(100);
    await expect(flushPromise).resolves.toBe(false);

    const closePromise = batcher.close();
    await vi.runAllTimersAsync();
    await expect(closePromise).resolves.toBe(false);
  });

  it("stamps droppedEvents from a transport-dropped batch on the next accepted envelope", async () => {
    vi.mocked(transport.sendEnvelope).mockResolvedValueOnce(false);
    const batcher = new Batcher(transportConfig);
    batcher.enqueue(wireEvent(1));
    batcher.enqueue(wireEvent(2));
    await expect(batcher.flush()).resolves.toBe(false);

    batcher.enqueue(wireEvent(3));
    await expect(batcher.flush()).resolves.toBe(true);

    const envelopes = vi.mocked(transport.sendEnvelope).mock.calls.map(([payload]) => payload);
    expect(envelopes[0]?.droppedEvents).toBeUndefined();
    expect(envelopes[1]?.droppedEvents).toBe(2);
    await batcher.close();
  });

  it("re-stamps queue-overflow drops carried by a failed envelope on the next accepted one", async () => {
    const flushSpy = vi.spyOn(Batcher.prototype, "flushNextBatch").mockResolvedValue({
      accepted: true,
      timedOut: false,
    });
    const batcher = new Batcher(transportConfig);
    for (let index = 0; index < 501; index++) {
      batcher.enqueue(wireEvent(index));
    }
    flushSpy.mockRestore();

    vi.mocked(transport.sendEnvelope).mockResolvedValueOnce(false);
    await expect(batcher.flush()).resolves.toBe(false);

    const envelopes = vi.mocked(transport.sendEnvelope).mock.calls.map(([payload]) => payload);
    expect(envelopes[0]?.droppedEvents).toBe(1);
    expect(envelopes[1]?.droppedEvents).toBe(51);
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
