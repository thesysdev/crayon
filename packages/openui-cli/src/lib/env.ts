import * as fs from "node:fs";
import * as path from "node:path";

import { CreateError } from "./telemetry";

/** True for `"1"` or `"true"` (any case). */
export const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";

const ENV_VAR_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;

function assignmentKind(line: string, name: string): "set" | "commented" | false {
  const match = line.match(new RegExp(`^\\s*(#)?\\s*${name}\\s*=`));
  if (!match) return false;
  return match[1] ? "commented" : "set";
}

/**
 * Create or update `name=value` in an env file. Replaces an existing assignment
 * (including a commented one) and otherwise appends. Other lines are left intact.
 */
export function upsertEnvVar(filePath: string, name: string, value: string): void {
  if (!ENV_VAR_NAME.test(name)) {
    throw new CreateError(
      "args_resolution",
      `Invalid env var name "${name}". Use letters, digits, and underscores.`,
      "invalid_input",
      "INVALID_ENV_VAR",
    );
  }
  if (/[\r\n]/.test(value)) {
    throw new CreateError(
      "args_resolution",
      "API key values cannot contain newlines.",
      "invalid_input",
      "INVALID_ENV_VALUE",
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

  const assignment = `${name}=${value}`;
  const setIndex = lines.findIndex((line) => assignmentKind(line, name) === "set");
  const commentedIndex = lines.findIndex((line) => assignmentKind(line, name) === "commented");
  const replaceAt = setIndex >= 0 ? setIndex : commentedIndex;
  if (replaceAt >= 0) lines[replaceAt] = assignment;
  else lines.push(assignment);

  fs.mkdirSync(path.dirname(resolved), { recursive: true });
  fs.writeFileSync(resolved, lines.join(newline) + newline);
}
