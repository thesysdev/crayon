/* Where a waitlist address actually goes.
 *
 * One function behind one result type, so the route handler never learns which
 * service is on the other end and changing providers is a change to this file
 * alone. Plain fetch, so no new dependency and no build-time coupling.
 *
 * Currently a Google Form. The addresses land in the Form's linked spreadsheet.
 *
 * CAVEAT, worth knowing before debugging this: `formResponse` is the endpoint
 * the Form's own page posts to, and Google does not document it. It is stable in
 * practice and has been for years, but it is not a contract. Two consequences:
 *
 *   - Google signals the outcome by status alone. A success is 200 carrying an
 *     HTML confirmation page; a rejected submission (wrong entry id, a required
 *     question left unanswered, sign-in required) is a 4xx. There is no JSON and
 *     nothing machine-readable to check beyond that, so status is the guard.
 *   - Duplicates are not detected. The same address twice writes two rows.
 *
 * We call it server-side, which sidesteps the CORS restriction that makes this
 * awkward from a browser, and the caller refuses to report success unless this
 * returns ok. So if Google ever changes the endpoint it surfaces immediately as
 * visible errors rather than as silently discarded signups.
 */

/* Upper bound on how long a signup may block the request. */
const TIMEOUT_MS = 8000;

export type WaitlistResult = { ok: true } | { ok: false; reason: "unconfigured" | "upstream" };

export async function addToWaitlist(email: string, signal?: AbortSignal): Promise<WaitlistResult> {
  const formId = process.env.GOOGLE_FORM_ID?.trim();
  const entry = process.env.GOOGLE_FORM_EMAIL_ENTRY?.trim();
  /* Missing config means the address has nowhere to go. Say so, rather than
     returning a success the caller would show to someone whose signup was
     discarded. */
  if (!formId || !entry) return { ok: false, reason: "unconfigured" };

  /* Accepts either the full "entry.123456789" or just the number, since the
     pre-filled link gives you the former and it is easy to paste either. */
  const field = entry.startsWith("entry.") ? entry : `entry.${entry}`;

  /* Give up rather than hold the request open if Google stalls. Combined with
     the caller's own signal, so a disconnected client cancels too. */
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`https://docs.google.com/forms/d/e/${formId}/formResponse`, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        /* Some runtimes send no User-Agent by default, which Google is more
           likely to reject. */
        "user-agent": "openui-website-waitlist",
      },
      body: new URLSearchParams({ [field]: email }).toString(),
      signal: combined,
    });
  } catch {
    return { ok: false, reason: "upstream" };
  }

  if (response.ok) return { ok: true };
  return { ok: false, reason: "upstream" };
}
