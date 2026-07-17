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

  let payload: { token: string; expires_at: number };
  try {
    payload = (await response.json()) as { token: string; expires_at: number };
  } catch {
    throw new OpenuiCloudUpstreamError();
  }

  return { token: payload.token, expiresAt: payload.expires_at };
}
