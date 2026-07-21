import { envOr } from "@/lib/env";

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
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error: {
          code: "missing_api_key",
          message:
            "THESYS_API_KEY is not set. Add it to .env (create a key in the Thesys console → API keys) and restart the dev server.",
        },
      },
      { status: 500 },
    );
  }

  const appId = process.env.APP_ID;
  const upstream = await fetch(`https://api.thesys.dev/v1/frontend-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      user_id: envOr("DEMO_USER_ID", "demo-user"),
      ...(appId ? { app_id: appId } : {}),
    }),
  });

  if (!upstream.ok) {
    if (upstream.status === 401 || upstream.status === 403) {
      return Response.json(
        {
          error: {
            code: "invalid_api_key",
            message:
              "OpenUI Cloud rejected THESYS_API_KEY. Check the key in .env against the Thesys console → API keys.",
          },
        },
        { status: upstream.status },
      );
    }
    const errText = await upstream
      .text()
      .catch(() => "There was an error in the response from the upstream service.");
    console.error("[frontend-token] mint failed:", upstream.status, errText);
    return Response.json({ error: { message: errText } }, { status: 502 });
  }

  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return Response.json({ token, expires_at });
}
