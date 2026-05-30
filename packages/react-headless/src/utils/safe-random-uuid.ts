/**
 * Returns a UUID, falling back gracefully when `crypto.randomUUID` is unavailable.
 *
 * `crypto.randomUUID()` is only defined in a secure context — HTTPS, or
 * `http://localhost` / `127.0.0.1` / `[::1]`. When the app is served from a
 * non-secure origin (for example a LAN IP over plain HTTP, or `0.0.0.0`),
 * `crypto.randomUUID` is `undefined` and calling it throws
 * "crypto.randomUUID is not a function". This helper detects that case and
 * falls back to a sufficiently-unique id, which is all that is needed for
 * client-side message keys.
 */
export function safeRandomUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return (
    "uid-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}
