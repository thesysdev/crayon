import type { OpenuiCloudConfig } from "./config";

interface FrontendToken {
  token: string;
  expiresAt: number;
}

export class OpenuiCloudUpstreamError extends Error {
  constructor() {
    super("OpenUI Cloud upstream request failed");
    this.name = "OpenuiCloudUpstreamError";
  }
}

export async function mintFrontendToken(
  config: OpenuiCloudConfig,
  userId: string,
  signal: AbortSignal,
): Promise<FrontendToken> {
  const response = await fetch(`${config.apiOrigin}/v1/frontend-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_id: userId }),
    cache: "no-store",
    signal,
  });

  if (!response.ok) throw new OpenuiCloudUpstreamError();

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new OpenuiCloudUpstreamError();
  }

  if (!isFrontendTokenPayload(payload)) throw new OpenuiCloudUpstreamError();
  return { token: payload.token, expiresAt: payload.expires_at };
}

function isFrontendTokenPayload(value: unknown): value is { token: string; expires_at: number } {
  if (!isRecord(value)) return false;
  return (
    typeof value.token === "string" &&
    value.token.length > 0 &&
    typeof value.expires_at === "number" &&
    Number.isFinite(value.expires_at) &&
    value.expires_at > Date.now() / 1000
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
