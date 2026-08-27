import * as fs from "node:fs";

/** Parse a dotenv-style file into key/value pairs (no expansion). */
export function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};
  const out: Record<string, string> = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Merge env files (later files win) and keep only allowlisted keys with
 * non-empty values. Values are never logged by this helper.
 */
export function loadAllowlistedEnvFiles(
  filePaths: string[],
  allowlist: readonly string[],
): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const filePath of filePaths) {
    Object.assign(merged, parseEnvFile(filePath));
  }
  const allowlisted: Record<string, string> = {};
  for (const key of allowlist) {
    const value = merged[key]?.trim();
    if (value) allowlisted[key] = value;
  }
  return allowlisted;
}

/** Extract the first JSON object from mixed CLI stdout/stderr. */
export function parseJsonObject(text: string): unknown | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
