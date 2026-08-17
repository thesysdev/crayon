// @vitest-environment jsdom
import type { Observability, ObservabilityEvent } from "@openuidev/observability";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudObservabilityClient } from "./client";
import * as transport from "./transport";

function createFakeBus() {
  const handlers: Array<(event: ObservabilityEvent) => void> = [];
  const remove = vi.fn();
  const bus = {
    listenAll: (handler: (event: ObservabilityEvent) => void) => {
      handlers.push(handler);
      return remove;
    },
  } as unknown as Observability;
  return { bus, handlers, remove };
}

const options = {
  endpoint: "https://ingest.example.com/v1/events",
  apiKey: "test-key",
  capture: "full" as const,
  sampleRate: 1,
  debug: false,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("CloudObservabilityClient bus injection", () => {
  it("listens on the injected bus and detaches on close", async () => {
    vi.spyOn(transport, "sendEnvelope").mockResolvedValue(true);
    const { bus, handlers, remove } = createFakeBus();

    const client = new CloudObservabilityClient(options, bus);
    expect(handlers).toHaveLength(1);

    handlers[0]!({
      level: "info",
      timestamp: 1_700_000_000_000,
      detail: {
        id: "stream-1",
        kind: "react-lang:stream",
        phase: "settled",
        updateIndex: 1,
        errorCount: 0,
      },
    });

    await client.flush();
    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);
    expect(vi.mocked(transport.sendEnvelope).mock.calls[0]?.[0]?.events).toEqual([
      expect.objectContaining({ id: "stream-1", kind: "react-lang:stream" }),
    ]);

    await client.close();
    expect(remove).toHaveBeenCalledOnce();
  });
});
