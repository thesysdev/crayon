import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEnvelope, sendEnvelopeBeacon } from "./transport";
import { SDK_VERSION, type WireEnvelope } from "./wire";

const config = {
  endpoint: "https://ingest.example.com/v1/events",
  apiKey: "test-key",
  debug: false,
};

function envelope(events = 1): WireEnvelope {
  return {
    v: 1,
    sentAt: Date.now(),
    sdk: { name: "react-lang", version: SDK_VERSION },
    events: Array.from({ length: events }, (_, index) => ({
      id: `event-${index}`,
      kind: "react-lang:stream" as const,
      level: "info" as const,
      timestamp: 1,
      updateIndex: 1,
      errorCount: 0,
    })),
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("sendEnvelope", () => {
  it("sends the expected envelope shape with auth header", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const payload = envelope(2);
    await expect(sendEnvelope(payload, config)).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(config.endpoint);
    expect(init.method).toBe("POST");
    expect(init.keepalive).toBe(true);
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      authorization: "Bearer test-key",
    });
    expect(JSON.parse(String(init.body))).toEqual(payload);
  });

  it("retries 5xx responses then drops", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 500 }))
      .mockResolvedValueOnce(new Response(null, { status: 502 }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = sendEnvelope(envelope(), config);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });

  it("drops 4xx responses without retry", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(sendEnvelope(envelope(), config)).resolves.toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("retries 429 responses", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { "Retry-After": "1" },
        }),
      )
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = sendEnvelope(envelope(), config);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("retries network errors", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const promise = sendEnvelope(envelope(), config);
    await vi.runAllTimersAsync();
    await expect(promise).resolves.toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe("sendEnvelopeBeacon", () => {
  it("appends apiKey as a query param when sendBeacon succeeds", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });

    sendEnvelopeBeacon(envelope(), config);

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url] = sendBeacon.mock.calls[0] as [string, Blob];
    expect(url).toContain("apiKey=test-key");
  });

  it("falls back to fetch keepalive when sendBeacon returns false", () => {
    const sendBeacon = vi.fn().mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("navigator", { sendBeacon });
    vi.stubGlobal("fetch", fetchMock);

    sendEnvelopeBeacon(envelope(), config);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("apiKey=test-key");
    expect(init.keepalive).toBe(true);
  });

  it("falls back to fetch keepalive when sendBeacon is unavailable", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("fetch", fetchMock);

    sendEnvelopeBeacon(envelope(), config);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("apiKey=test-key");
  });
});
