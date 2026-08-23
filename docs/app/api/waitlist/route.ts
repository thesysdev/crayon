import { hasAllowedOrigin, hasJsonContentType } from "@/lib/openui-cloud/request";
import { addToWaitlist } from "@/lib/waitlist/store";

/* Public, unauthenticated, and it writes to a third party, so it is deliberately
   strict about what it will accept.

   The origin helper lives under openui-cloud only because that is where it was
   written; it is generic, and its default allowlist is this site's own origin,
   which is exactly what a same-origin form post needs. */

const MAX_BODY_BYTES = 1024;
/* RFC 5321's cap on a forward path. */
const MAX_EMAIL_LENGTH = 254;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
/* Stops the bucket map growing without bound on a long-lived instance. */
const MAX_TRACKED_CLIENTS = 10_000;

const hits = new Map<string, number[]>();

/* Per-instance only. Serverless spreads requests across instances, so this
   blunts casual scripted abuse rather than preventing it. Put a shared limiter
   in front if this endpoint ever draws real attention. */
function isRateLimited(request: Request): boolean {
  /* x-real-ip is written by the proxy and cannot be forged by the caller.
     x-forwarded-for can be, and its first entry is whatever the client claimed,
     so it is only a fallback for environments that do not set x-real-ip. */
  const client =
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const now = Date.now();
  const recent = (hits.get(client) ?? []).filter((at) => now - at < WINDOW_MS);
  recent.push(now);
  if (hits.size > MAX_TRACKED_CLIENTS) hits.clear();
  hits.set(client, recent);
  return recent.length > MAX_PER_WINDOW;
}

function json(body: unknown, status: number): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

/* Not a full RFC 5322 parser, and not trying to be. It rejects the obvious
   nonsense so the provider is not called for it; the provider stays the
   authority on whether an address is real. */
const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export async function POST(request: Request): Promise<Response> {
  if (!hasAllowedOrigin(request)) return json({ error: "Forbidden" }, 403);
  if (!hasJsonContentType(request)) return json({ error: "Expected application/json" }, 415);
  if (isRateLimited(request)) return json({ error: "Too many attempts. Try again shortly." }, 429);

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return json({ error: "Body too large" }, 413);

  let payload: { email?: unknown };
  try {
    payload = (await request.json()) as { email?: unknown };
  } catch {
    return json({ error: "Malformed JSON" }, 400);
  }

  if (typeof payload?.email !== "string") return json({ error: "Email is required" }, 400);
  const email = payload.email.trim().toLowerCase();
  if (email.length > MAX_EMAIL_LENGTH || !EMAIL.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  const result = await addToWaitlist(email, request.signal);
  if (result.ok) return json({ ok: true }, 200);

  /* Both remaining outcomes are the server's problem, not the visitor's, and
     neither may be reported as success: a silently dropped signup is invisible
     to the person signing up and to us. */
  if (result.reason === "unconfigured") {
    console.error(
      "[waitlist] GOOGLE_FORM_ID / GOOGLE_FORM_EMAIL_ENTRY are not set; the signup was not stored.",
    );
  }
  return json({ error: "Could not save that right now. Please try again." }, 503);
}
