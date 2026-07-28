import { envOr, requiredEnv } from "@/lib/env";
import { NextResponse } from "next/server";

/**
 * Mints the short-lived fct_ token the browser uses for the storage plane
 * (conversations / artifacts). The token BINDS the scope: with an fct_ token,
 * conversation create/list are locked to its `user_id` and `app_id` — the
 * browser cannot widen them.
 *
 * `APP_ID` (written to .env at scaffold time) keeps this app's threads
 * isolated from other apps sharing the same org API key. Keep it stable —
 * changing it orphans the app's existing conversations.
 *
 * DEMO_USER_ID is single-user demo identity. For real multi-user support,
 * derive `user_id` from your server-side auth session here (never from the
 * request body) — see the OpenUI skill's cloud-integration reference.
 */
export async function POST() {
  const appId = process.env.APP_ID;
  const upstream = await fetch(`https://api.thesys.dev/v1/frontend-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requiredEnv("THESYS_API_KEY")}`,
    },
    body: JSON.stringify({
      user_id: envOr("DEMO_USER_ID", "demo-user"),
      ...(appId ? { app_id: appId } : {}),
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream
      .text()
      .catch(() => "There was an error in the response from the upstream service.");
    console.error("[frontend-token] mint failed:", upstream.status, errText);
    return NextResponse.json({ error: { message: errText } }, { status: upstream.status });
  }

  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return NextResponse.json({ token, expires_at });
}
