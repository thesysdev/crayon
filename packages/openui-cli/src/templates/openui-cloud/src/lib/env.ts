export function envOr(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/**
 * THESYS_API_KEY, or the error Response the route should return instead.
 *
 * The scaffold can legitimately start without a key (`--auth skip`), so a
 * missing key is a first-run state, not a programmer error: return a
 * structured `{ error: { code, message } }` the chat UI renders as actionable
 * guidance, where a thrown Error would surface as an opaque 500.
 */
export function apiKeyOrError(): string | Response {
  const key = process.env.THESYS_API_KEY;
  if (key) return key;
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
