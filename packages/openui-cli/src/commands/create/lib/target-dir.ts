import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "../../../lib/errors";
import { resolveArgs } from "../../../lib/resolve-args";
import type { CreateTelemetryClient } from "./telemetry";

/** How many times an interactive run may re-prompt before aborting. */
const MAX_NAME_RETRIES = 5;

/** Suggest the next free `<base>-<n>` so the retry prompt has a usable default. */
function suggestAvailableName(name: string): string {
  const numbered = /^(.*?)-(\d+)$/.exec(name);
  const base = numbered?.[1] || name;
  let suffix = numbered ? Number(numbered[2]) + 1 : 2;
  while (suffix < 1000 && fs.existsSync(path.resolve(process.cwd(), `${base}-${suffix}`))) {
    suffix += 1;
  }
  return `${base}-${suffix}`;
}

/** `name` if that directory is free, otherwise the next free `<name>-<n>`. */
export function firstAvailableName(name: string): string {
  return fs.existsSync(path.resolve(process.cwd(), name)) ? suggestAvailableName(name) : name;
}

// Editor and agent folders that may already sit in a folder someone runs `create .` in.
const IGNORABLE_ENTRIES = new Set([
  ".git",
  ".DS_Store",
  ".idea",
  ".vscode",
  ".claude",
  ".cursor",
  ".codex",
  ".agents",
]);

/** A folder name as a valid npm package name ("My Agent" → "my-agent"). */
function packageNameFrom(folder: string): string {
  const slug = folder
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[._-]+|-+$/g, "");
  return slug || "openui-agent";
}

/** `create .`: scaffold into the current folder, named after it, if nothing would be overwritten. */
export function resolveCurrentDirTarget(): { name: string; targetDir: string } {
  const targetDir = process.cwd();
  const blocking = fs.readdirSync(targetDir).filter((entry) => !IGNORABLE_ENTRIES.has(entry));
  if (blocking.length > 0) {
    const listed = blocking.slice(0, 5).join(", ") + (blocking.length > 5 ? ", …" : "");
    throw new CreateError(
      "preflight",
      `The current folder isn't empty (${listed}). Run create . in an empty folder, or pass a name.`,
      "filesystem",
      "TARGET_NOT_EMPTY",
    );
  }
  return { name: packageNameFrom(path.basename(targetDir)), targetDir };
}

/** Resolve a project directory that does not exist yet */
export async function resolveAvailableTarget(
  requestedName: string,
  interactive: boolean,
  tel: CreateTelemetryClient,
): Promise<{ name: string; targetDir: string }> {
  let name = requestedName;
  let retries = 0;

  for (;;) {
    const targetDir = path.resolve(process.cwd(), name);
    if (!fs.existsSync(targetDir)) {
      if (retries > 0) tel.trackTargetNameRetried({ retries });
      return { name, targetDir };
    }

    const exhausted = retries >= MAX_NAME_RETRIES;

    // Fired on every collision, in both modes. Interactive runs now recover
    // instead of throwing, so without this the TARGET_EXISTS signal that used
    // to reach analytics via cli_create_failed would disappear for them.
    tel.trackTargetExists({
      attempt: retries + 1,
      exhausted,
      error_code: "TARGET_EXISTS",
    });

    if (!interactive || exhausted) {
      throw new CreateError(
        "preflight",
        exhausted
          ? `Directory "${name}" already exists. Aborting after ${MAX_NAME_RETRIES} attempts.`
          : `Directory "${name}" already exists.`,
        "filesystem",
        "TARGET_EXISTS",
      );
    }

    console.error(`Directory "${name}" already exists. Choose a different project name.`);
    retries += 1;
    const retry = await resolveArgs(
      {
        name: {
          prompt: {
            type: "input",
            message: "Project name?",
            default: suggestAvailableName(name),
          },
          required: true,
        },
      },
      interactive,
    );
    name = (retry as { name: string }).name.trim();
  }
}
