import { SIGN_IN_TIMEOUT_MS } from "../../lib/auth/authenticator";
import {
  canSignInInline,
  SIGN_IN_PENDING_EXIT_CODE,
  startBackgroundLogin,
  waitForSignIn,
} from "../../lib/auth/background";
import { signIn } from "../../lib/auth/mint";
import {
  clearPendingLogin,
  clearSession,
  isProcessAlive,
  loadSession,
  readPendingLogin,
  writePendingLogin,
} from "../../lib/auth/session";
import { AuthTelemetryClient } from "../../lib/auth/telemetry";
import type { CliContext } from "../../lib/context";
import { CreateError } from "../../lib/errors";

type Output = { json?: boolean };

function report(opts: Output, data: Record<string, unknown>, text: string): void {
  console.info(opts.json ? JSON.stringify(data) : text);
}

/** Body of the detached child started by startBackgroundLogin(). */
async function runBackgroundChild(tel: AuthTelemetryClient): Promise<void> {
  const expiresAt = Date.now() + SIGN_IN_TIMEOUT_MS;
  try {
    await signIn(tel, (url) =>
      writePendingLogin({ status: "pending", pid: process.pid, url, expiresAt }),
    );
    clearPendingLogin();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    writePendingLogin({ status: "failed", pid: process.pid, error: message, expiresAt });
    throw error;
  }
}

export async function runAuthLogin(
  opts: Output & { backgroundChild?: boolean },
  ctx: CliContext,
): Promise<void> {
  const tel = new AuthTelemetryClient(ctx.telemetry);
  if (opts.backgroundChild) return runBackgroundChild(tel);

  const session = loadSession();
  if (session) {
    report(
      opts,
      { status: "signed_in", expiresAt: new Date(session.expiresAt).toISOString() },
      "✅ Already signed in to Thesys.",
    );
    return;
  }

  if (canSignInInline()) {
    await signIn(tel);
    report(opts, { status: "signed_in" }, "✅ Signed in to Thesys.");
    return;
  }

  const login = await startBackgroundLogin();
  report(
    opts,
    {
      status: "pending",
      url: login.url,
      expiresAt: new Date(login.expiresAt).toISOString(),
      next: "openui auth wait",
    },
    `Open this link to sign in to Thesys (it may already be open in your browser):\n  ${login.url}\n` +
      "Then run `openui auth wait`.",
  );
}

export async function runAuthWait(opts: Output & { timeout: string }): Promise<void> {
  const seconds = Number(opts.timeout);
  if (!Number.isInteger(seconds) || seconds < 0) {
    throw new CreateError(
      "auth_wait",
      `Invalid --timeout "${opts.timeout}". Use a whole number of seconds.`,
      "invalid_input",
      "INVALID_TIMEOUT",
    );
  }

  if (await waitForSignIn(seconds * 1000)) {
    report(opts, { status: "signed_in" }, "✅ Signed in to Thesys.");
    return;
  }
  report(
    opts,
    { status: "pending", next: "openui auth wait" },
    "Still waiting for sign-in. Run `openui auth wait` again.",
  );
  process.exitCode = SIGN_IN_PENDING_EXIT_CODE;
}

export function runAuthLogout(opts: Output): void {
  const login = readPendingLogin();
  if (login?.status === "pending" && isProcessAlive(login.pid)) {
    try {
      process.kill(login.pid);
    } catch {
      /* already gone */
    }
  }
  clearPendingLogin();
  clearSession();
  report(opts, { status: "signed_out" }, "Signed out of Thesys.");
}
