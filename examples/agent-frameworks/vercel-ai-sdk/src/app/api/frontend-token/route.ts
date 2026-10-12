import { THESYS_API_URL } from "@/lib/chat-history";

export const runtime = "nodejs";

// Mints the short-lived frontend token that useOpenuiCloudStorage() sends with its
// Conversations API calls. The token is scoped to one user and app, so the browser
// reaches only those threads and never sees THESYS_API_KEY.
export async function POST(request: Request) {
  const apiKey = process.env.THESYS_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Set THESYS_API_KEY, then restart." }, { status: 500 });
  }

  const upstream = await fetch(`${THESYS_API_URL}/v1/frontend-tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      // There is no sign-in, so every browser shares one local user. Use the signed-in
      // user's id instead when you add authentication.
      user_id: "demo-user",
      // Keeps this example's threads apart from other apps that use the same key.
      app_id: "vercel-ai-sdk-example",
    }),
    signal: request.signal,
  });
  if (!upstream.ok) {
    return Response.json(
      { error: `OpenUI Cloud could not create a frontend token: ${await upstream.text()}` },
      { status: upstream.status },
    );
  }
  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return Response.json(
    { token, expires_at },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
