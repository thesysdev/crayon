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

/**
 * Conversation storage is scoped by the frontend token's user_id. The same
 * item endpoint used by the published storage client therefore provides an
 * authoritative ownership check without accepting identity or authorization
 * material from the browser. A newly created conversation legitimately has an
 * empty item page, so the response status (not item count) is the proof.
 */
export async function isConversationOwnedByUser(
  config: OpenuiCloudConfig,
  userId: string,
  conversationId: string,
  signal: AbortSignal,
): Promise<boolean> {
  const { token } = await mintFrontendToken(config, userId, signal);
  const encodedId = encodeURIComponent(conversationId);
  const response = await fetch(
    `${config.apiOrigin}/v1/conversations/${encodedId}/items?order=asc&limit=1`,
    {
      headers: { "x-thesys-frontend-token": token },
      cache: "no-store",
      signal,
    },
  );

  if (response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new OpenuiCloudUpstreamError();
    }
    if (!isRecord(payload) || !Array.isArray(payload.data)) {
      throw new OpenuiCloudUpstreamError();
    }
    return true;
  }
  if (response.status === 403 || response.status === 404) return false;
  throw new OpenuiCloudUpstreamError();
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
