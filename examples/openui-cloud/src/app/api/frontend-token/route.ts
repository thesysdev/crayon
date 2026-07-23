import { envOr, requiredEnv } from "@/lib/env";

export async function POST() {
  const upstream = await fetch(`https://api.thesys.dev/v1/frontend-tokens`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requiredEnv("THESYS_API_KEY")}`,
    },
    body: JSON.stringify({ user_id: envOr("DEMO_USER_ID", "demo-user") }),
  });

  if (!upstream.ok) {
    const errText = await upstream
      .text()
      .catch(() => "There was an error in the response from the upstream service.");
    console.error("[frontend-token] mint failed:", upstream.status, errText);
    return Response.json({ error: { message: errText } }, { status: 502 });
  }

  const { token, expires_at } = (await upstream.json()) as { token: string; expires_at: number };
  return Response.json({ token, expires_at });
}
