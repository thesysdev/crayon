import * as fs from "node:fs";
import * as path from "node:path";

import { resolveArgs } from "./resolve-args";
import { CreateError, telemetry } from "./telemetry";

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

/** Resolve a project directory that does not exist yet */
export async function resolveAvailableTarget(
  requestedName: string,
  interactive: boolean,
): Promise<{ name: string; targetDir: string }> {
  let name = requestedName;
  let retries = 0;

  for (;;) {
    const targetDir = path.resolve(process.cwd(), name);
    if (!fs.existsSync(targetDir)) {
      if (retries > 0) telemetry.capture("cli_target_name_retried", { retries });
      return { name, targetDir };
    }

    const exhausted = retries >= MAX_NAME_RETRIES;

    // Fired on every collision, in both modes. Interactive runs now recover
    // instead of throwing, so without this the TARGET_EXISTS signal that used
    // to reach analytics via cli_create_failed would disappear for them.
    telemetry.capture("cli_target_exists", {
      interactive,
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
