import { spawn } from "node:child_process";
import * as path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

import { context } from "../context";
import { detectAgent, UNKNOWN_AGENT_NAME } from "../detect-agent";
import { CreateError } from "../errors";
import {
  clearPendingLogin,
  isProcessAlive,
  loadSession,
  readPendingLogin,
  type PendingLogin,
} from "./session";

// Compiled layout: dist/lib/auth/background.js → dist/index.js
const CLI_ENTRY = path.resolve(__dirname, "..", "..", "index.js");
const URL_READY_TIMEOUT_MS = 15_000;

/** Exit code for `openui auth wait` when sign-in is still pending (EX_TEMPFAIL). */
export const SIGN_IN_PENDING_EXIT_CODE = 75;

/**
 * Whether this process can hold the terminal open while the user signs in.
 * Coding agents and non-TTY runs can't: their shell tools time out or only show
 * output after exit, so they get the background flow instead.
 */
export const canSignInInline = () =>
  Boolean(process.stdin.isTTY && process.stdout.isTTY) && detectAgent() === UNKNOWN_AGENT_NAME;

const authError = (code: string, message: string) =>
  new CreateError("cloud_auth", message, "authentication", code);

/**
 * Start (or reuse) a detached `openui auth login` that runs the normal browser
 * sign-in and saves the session when it completes. Resolves once the sign-in
 * URL is known, so the caller can hand it to the user and exit right away.
 */
export async function startBackgroundLogin(): Promise<PendingLogin & { url: string }> {
  const existing = readPendingLogin();
  if (
    existing?.status === "pending" &&
    existing.url &&
    existing.expiresAt > Date.now() &&
    isProcessAlive(existing.pid)
  ) {
    return { ...existing, url: existing.url };
  }
  clearPendingLogin();

  const child = spawn(process.execPath, [CLI_ENTRY, "auth", "login", "--background-child"], {
    detached: true,
    stdio: "ignore",
    windowsHide: true,
    env: context.telemetry.enabled
      ? process.env
      : { ...process.env, OPENUI_TELEMETRY_DISABLED: "1" },
  });
  child.unref();

  const deadline = Date.now() + URL_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const login = readPendingLogin();
    if (login && login.pid === child.pid) {
      if (login.status === "failed") {
        throw authError("SIGN_IN_START_FAILED", `Could not start sign-in: ${login.error}`);
      }
      if (login.url) return { ...login, url: login.url };
    }
    await sleep(200);
  }
  throw authError("SIGN_IN_START_TIMEOUT", "Timed out starting the browser sign-in.");
}

/**
 * Wait up to `timeoutMs` for a background sign-in to finish.
 * Resolves true once signed in, false if still pending; throws if it failed.
 */
export async function waitForSignIn(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (loadSession()) return true;
    const login = readPendingLogin();
    if (!login) {
      // The child saves the session before clearing its status file; re-check to close that gap.
      if (loadSession()) return true;
      throw authError("NO_SIGN_IN", "No sign-in in progress. Run `openui auth login` first.");
    }
    if (login.status === "failed") {
      clearPendingLogin();
      throw authError("SIGN_IN_FAILED", `Sign-in failed: ${login.error}`);
    }
    if (login.expiresAt <= Date.now() || !isProcessAlive(login.pid)) {
      clearPendingLogin();
      throw authError(
        "SIGN_IN_EXPIRED",
        "Sign-in expired before it was completed. Run `openui auth login` again.",
      );
    }
    if (Date.now() >= deadline) return false;
    await sleep(1000);
  }
}
