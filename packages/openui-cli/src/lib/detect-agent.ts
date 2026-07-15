export const UNKNOWN_AGENT_NAME = "unknown";

export type DetectedAgentName =
  | "claude-code"
  | "cline"
  | "codex"
  | "factory-droid"
  | "pi"
  | "ambiguous"
  | typeof UNKNOWN_AGENT_NAME;

const DECLARED_AGENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isTruthyEnv = (value?: string) => value === "1" || value?.toLowerCase() === "true";
const isPresent = (value?: string) => Boolean(value?.trim());

/**
 * Keep the declared telemetry dimension bounded and free of whitespace or opaque IDs.
 * Invalid values become `unknown`; the CLI's argument parser reports them to users first.
 */
export function normalizeAgentName(value?: string): string {
  const normalized = value?.trim().toLowerCase();
  if (!normalized || normalized.length > 64 || !DECLARED_AGENT_NAME_PATTERN.test(normalized)) {
    return UNKNOWN_AGENT_NAME;
  }
  return normalized;
}

/**
 * Best-effort detection from environment markers set by coding-agent products.
 * These markers are not an authentication boundary: callers can spoof or inherit them.
 */
export function detectAgent(env: NodeJS.ProcessEnv = process.env): DetectedAgentName {
  const matches = new Set<Exclude<DetectedAgentName, "ambiguous" | "unknown">>();

  if (env["CLAUDE_CODE_CHILD_SESSION"] === "1" || env["CLAUDECODE"] === "1") {
    matches.add("claude-code");
  }
  if (isPresent(env["CODEX_THREAD_ID"])) matches.add("codex");
  if (isTruthyEnv(env["CLINE_ACTIVE"])) matches.add("cline");
  if (isPresent(env["FACTORY_PROJECT_DIR"])) matches.add("factory-droid");
  if (isTruthyEnv(env["PI_CODING_AGENT"])) matches.add("pi");

  if (matches.size === 0) return UNKNOWN_AGENT_NAME;
  if (matches.size > 1) return "ambiguous";
  return [...matches][0] ?? UNKNOWN_AGENT_NAME;
}
