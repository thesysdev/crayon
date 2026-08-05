import {
  respondToGrokBuildInteraction,
  waitForGrokBuildInteractionChange,
} from "@/lib/grok-build-interactions";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface InteractionResponseBody {
  interactionId?: string;
  response?: unknown;
  threadId?: string;
}

function noStoreJson(body: unknown, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store");
  return Response.json(body, { ...init, headers });
}

export async function GET(request: NextRequest) {
  const threadId = request.nextUrl.searchParams.get("threadId")?.trim();
  if (!threadId) return noStoreJson({ error: "threadId is required." }, { status: 400 });
  const afterInteractionId = request.nextUrl.searchParams.get("after")?.trim() || undefined;
  const interaction = await waitForGrokBuildInteractionChange(
    threadId,
    afterInteractionId,
    request.signal,
  );
  return noStoreJson({ interaction: interaction ?? null });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as InteractionResponseBody;
  const threadId = body.threadId?.trim();
  const interactionId = body.interactionId?.trim();
  if (!threadId || !interactionId || body.response === undefined) {
    return noStoreJson(
      { error: "threadId, interactionId, and response are required." },
      { status: 400 },
    );
  }

  try {
    if (!respondToGrokBuildInteraction(threadId, interactionId, body.response)) {
      return noStoreJson(
        { error: "That Grok Build interaction is no longer pending." },
        { status: 409 },
      );
    }
    return noStoreJson({ ok: true });
  } catch (error) {
    return noStoreJson(
      { error: error instanceof Error ? error.message : "Invalid interaction response." },
      { status: 400 },
    );
  }
}
