import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "./telemetry";

/** True for `"1"` or `"true"` (any case). */
export const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";

const ENV_ASSIGNMENT = /^[A-Za-z_][A-Za-z0-9_]*=[^\r\n]*$/;

function isKeyLine(line: string, name: string): boolean {
  return new RegExp(`^\\s*#?\\s*${name}\\s*=`).test(line);
}

/**
 * Create or update `name=value` in an env file. Replaces the first matching
 * assignment (including a commented one) and otherwise appends.
 */
export function upsertEnvVar(filePath: string, name: string, value: string): void {
  const assignment = `${name}=${value}`;
  if (!ENV_ASSIGNMENT.test(assignment)) {
    throw new CreateError(
      "args_resolution",
      "Invalid env assignment. Name must use letters, digits, and underscores; value cannot contain newlines.",
      "invalid_input",
      "INVALID_ENV_ASSIGNMENT",
    );
  }

  const resolved = path.resolve(filePath);
  let content = "";
  try {
    content = fs.readFileSync(resolved, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.length === 0 ? [] : content.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  const replaceAt = lines.findIndex((line) => isKeyLine(line, name));
  if (replaceAt >= 0) lines[replaceAt] = assignment;
  else lines.push(assignment);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, lines.join(newline) + newline);
}
