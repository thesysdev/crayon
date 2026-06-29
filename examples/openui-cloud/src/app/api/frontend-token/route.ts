import { envOr, openuiCloudBaseUrl, requiredEnv } from "@/lib/env";

/**
 * Read-plane credential mint: proxies the OpenUI Cloud POST /v1/frontend-tokens
 * (master-key plane) and returns ONLY { token, expires_at }.
 *
 *  - The master key never reaches the browser (server env; the response is
 *    field-picked, never passed through).
 *  - user_id comes from server config — the browser must not choose its own
 *    identity.
 */
export async function POST() {
  const upstream = await fetch(`${openuiCloudBaseUrl()}/v1/frontend-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requiredEnv("THESYS_API_KEY")}`,
    },
    body: JSON.stringify({ user_id: envOr("DEMO_USER_ID", "demo-user") }),
  });

  if (!upstream.ok) {
    // Never forward upstream auth-error bodies (they can embed key fragments).
    console.error(
      "[frontend-token] mint failed:",
      upstream.status,
      await upstream.text().catch(() => ""),
    );
    return Response.json({ error: { message: "token mint failed" } }, { status: 502 });
  }

  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return Response.json({ token, expires_at });
}
