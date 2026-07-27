import { envOr, requiredEnv } from "@/lib/env";
import { NextResponse } from "next/server";

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
