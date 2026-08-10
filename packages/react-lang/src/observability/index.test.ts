// @vitest-environment jsdom
import { observability } from "@openuidev/observability";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as transport from "./core/transport";

const mockState = vi.hoisted(() => ({ failConstruction: false }));

vi.mock("./core/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./core/client")>();
  class CloudObservabilityClient extends actual.CloudObservabilityClient {
    constructor(options: ConstructorParameters<typeof actual.CloudObservabilityClient>[0]) {
      if (mockState.failConstruction) {
        throw new Error("construction failed");
      }
      super(options);
    }
  }
  return { ...actual, CloudObservabilityClient };
});

import { CloudObservabilityClient } from "./core/client";
import * as cloud from "./index";

const GLOBAL_KEY = Symbol.for("openui.cloudObservability");

function getGlobalState(): { client: CloudObservabilityClient | null; options: unknown } {
  return (globalThis as Record<symbol, typeof cloud> & Record<symbol, unknown>)[GLOBAL_KEY] as {
    client: CloudObservabilityClient | null;
    options: unknown;
  };
}

function resetGlobalState(): void {
  const root = globalThis as Record<symbol, { client: unknown; options: unknown } | undefined>;
  root[GLOBAL_KEY] = { client: null, options: null };
}

const baseOptions = {
  apiKey: "test-key",
  endpoint: "https://ingest.example.com/v1/events",
  debug: false,
} as const;

beforeEach(async () => {
  mockState.failConstruction = false;
  await cloud.close();
  resetGlobalState();
});

afterEach(async () => {
  mockState.failConstruction = false;
  vi.restoreAllMocks();
  await cloud.close();
  resetGlobalState();
});

describe("cloud observability lifecycle", () => {
  it("no-ops flush and close before init", async () => {
    await expect(cloud.flush()).resolves.toBe(true);
    await expect(cloud.close()).resolves.toBeUndefined();
  });

  it("init is idempotent for equivalent options", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});

    cloud.init({ ...baseOptions, debug: true });
    cloud.init({ ...baseOptions, debug: true });

    expect(debug).toHaveBeenCalledWith(
      "[@openuidev/react-lang/observability]",
      "init skipped; already initialized with equivalent options",
    );
  });

  it("replaces the client when init is called with different options", async () => {
    const closeSpy = vi.spyOn(CloudObservabilityClient.prototype, "close");

    cloud.init(baseOptions);
    const firstClient = getGlobalState().client;
    cloud.init({ ...baseOptions, capture: "minimal" });
    const secondClient = getGlobalState().client;

    expect(secondClient).not.toBe(firstClient);
    expect(closeSpy).toHaveBeenCalledTimes(1);
    await cloud.close();
  });

  it("failed init leaves prior singleton state intact", () => {
    cloud.init(baseOptions);
    const priorClient = getGlobalState().client;
    const priorOptions = getGlobalState().options;

    mockState.failConstruction = true;
    cloud.init({ ...baseOptions, capture: "minimal" });

    expect(getGlobalState().client).toBe(priorClient);
    expect(getGlobalState().options).toBe(priorOptions);
  });

  it("close detaches the observability bus listener", async () => {
    let removeListener: (() => void) | undefined;
    vi.spyOn(observability, "listenAll").mockImplementation(() => {
      removeListener = vi.fn();
      return removeListener;
    });

    cloud.init(baseOptions);
    await cloud.close();

    expect(removeListener).toHaveBeenCalledOnce();
  });

  it("flush resolves false when transport drops batches", async () => {
    vi.spyOn(transport, "sendEnvelope").mockResolvedValue(false);
    cloud.init(baseOptions);

    observability.info({
      id: "stream-1",
      kind: "react-lang:stream",
      phase: "settled",
      updateIndex: 1,
      errorCount: 0,
    });

    await expect(cloud.flush()).resolves.toBe(false);
  });

  it("warns and clamps sampleRate outside [0, 1] when debug is enabled", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    cloud.init({ ...baseOptions, debug: true, sampleRate: 1.5 });

    expect(warn).toHaveBeenCalledWith(
      "[@openuidev/react-lang/observability]",
      "sampleRate 1.5 is outside [0, 1] and was clamped to 1",
    );
  });
});
