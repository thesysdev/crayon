import type { WireEnvelope } from "./wire";

const MAX_BACKOFF_MS = 5000;
const BACKOFF_MS = [500, 2000] as const;

export interface TransportConfig {
  endpoint: string;
  apiKey: string;
  debug: boolean;
}

function debugLog(debug: boolean, message: string, detail?: unknown): void {
  if (!debug) return;
  // eslint-disable-next-line no-console -- gated debug diagnostics for cloud sink
  if (detail === undefined) console.debug("[@openuidev/react-lang/observability]", message);
  // eslint-disable-next-line no-console -- gated debug diagnostics for cloud sink
  else console.debug("[@openuidev/react-lang/observability]", message, detail);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function beaconUrl(endpoint: string, apiKey: string): string {
  const url = new URL(endpoint);
  url.searchParams.set("apiKey", apiKey);
  return url.toString();
}

function envelopeBody(envelope: WireEnvelope): string {
  return JSON.stringify(envelope);
}

function retryAfterMs(response: Response): number {
  const header = response.headers.get("Retry-After");
  if (!header) return BACKOFF_MS[0];
  const seconds = Number.parseInt(header, 10);
  if (!Number.isFinite(seconds) || seconds <= 0) return BACKOFF_MS[0];
  return Math.min(seconds * 1000, MAX_BACKOFF_MS);
}

async function postEnvelope(
  envelope: WireEnvelope,
  config: TransportConfig,
  attempt: number,
): Promise<{ ok: true } | { ok: false; retryable: boolean; retryDelayMs: number }> {
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: envelopeBody(envelope),
      keepalive: true,
    });

    if (response.ok) return { ok: true };

    if (response.status === 429) {
      return {
        ok: false,
        retryable: true,
        retryDelayMs: retryAfterMs(response),
      };
    }

    if (response.status >= 400 && response.status < 500) {
      debugLog(config.debug, `Dropped batch after HTTP ${response.status} (non-retryable)`);
      return { ok: false, retryable: false, retryDelayMs: 0 };
    }

    debugLog(config.debug, `HTTP ${response.status} on attempt ${attempt + 1}`);
    return {
      ok: false,
      retryable: true,
      retryDelayMs: BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] ?? MAX_BACKOFF_MS,
    };
  } catch (error) {
    debugLog(config.debug, `Network error on attempt ${attempt + 1}`, error);
    return {
      ok: false,
      retryable: true,
      retryDelayMs: BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)] ?? MAX_BACKOFF_MS,
    };
  }
}

/** Sends an envelope with retry policy. Returns true when accepted by the server. */
export async function sendEnvelope(
  envelope: WireEnvelope,
  config: TransportConfig,
): Promise<boolean> {
  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await postEnvelope(envelope, config, attempt);
    if (result.ok) return true;
    if (!result.retryable) return false;
    if (attempt >= maxAttempts - 1) break;
    await sleep(Math.min(result.retryDelayMs, MAX_BACKOFF_MS));
  }

  debugLog(
    config.debug,
    `Dropped batch of ${envelope.events.length} event(s) after ${maxAttempts} attempts`,
  );
  return false;
}

/** Best-effort synchronous send for page hide; no retries. */
export function sendEnvelopeBeacon(envelope: WireEnvelope, config: TransportConfig): void {
  const body = envelopeBody(envelope);
  const blob = new Blob([body], { type: "application/json" });

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const accepted = navigator.sendBeacon(beaconUrl(config.endpoint, config.apiKey), blob);
    if (accepted) return;
    debugLog(config.debug, "sendBeacon returned false; falling back to fetch keepalive");
  }

  void fetch(beaconUrl(config.endpoint, config.apiKey), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch((error) => {
    debugLog(config.debug, "Beacon fallback fetch failed", error);
  });
}
