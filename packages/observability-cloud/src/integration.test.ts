// @vitest-environment jsdom
import { observability } from "@openuidev/observability";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as transport from "./core/transport";
import * as cloud from "./index";

const GLOBAL_KEY = Symbol.for("openui.cloudObservability");

function resetGlobalState(): void {
  const root = globalThis as Record<symbol, { client: unknown; options: unknown } | undefined>;
  root[GLOBAL_KEY] = { client: null, options: null };
}

const baseOptions = {
  apiKey: "test-key",
  endpoint: "https://ingest.example.com/v1/events",
  debug: false,
} as const;

function settledDetail(id: string, updateIndex = 1) {
  return {
    id,
    kind: "react-lang:stream" as const,
    phase: "settled" as const,
    updateIndex,
    errorCount: 0,
    response: "done",
    responseLength: 4,
  };
}

beforeEach(async () => {
  await cloud.close();
  resetGlobalState();
  vi.spyOn(transport, "sendEnvelope").mockResolvedValue(true);
  vi.spyOn(transport, "sendEnvelopeBeacon").mockImplementation(() => {});
});

afterEach(async () => {
  vi.restoreAllMocks();
  await cloud.close();
  resetGlobalState();
});

describe("cloud observability integration", () => {
  it("forwards settled react-lang:stream events from the observability bus", async () => {
    cloud.init(baseOptions);

    observability.info(settledDetail("stream-a"));

    await cloud.flush();

    expect(transport.sendEnvelope).toHaveBeenCalledTimes(1);
    const envelope = vi.mocked(transport.sendEnvelope).mock.calls[0]?.[0];
    expect(envelope?.events).toEqual([
      expect.objectContaining({ id: "stream-a", kind: "react-lang:stream" }),
    ]);
  });

  it("forwards republished settled events with the same id as separate wire events", async () => {
    cloud.init(baseOptions);

    observability.info(settledDetail("stream-a", 1));
    observability.error({
      ...settledDetail("stream-a", 2),
      errorCount: 1,
      errors: [{ source: "query", code: "x", message: "failed" }],
    });

    await cloud.flush();

    const envelopes = vi
      .mocked(transport.sendEnvelope)
      .mock.calls.flatMap(([payload]) => payload.events);
    expect(envelopes).toHaveLength(2);
    expect(envelopes[0]).toMatchObject({ id: "stream-a", updateIndex: 1 });
    expect(envelopes[1]).toMatchObject({ id: "stream-a", updateIndex: 2, errorCount: 1 });
  });
});
