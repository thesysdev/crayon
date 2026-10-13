import { isTruthyEnv } from "./env";

export const UNKNOWN_AGENT_NAME = "unknown";

export type DetectedAgentName =
  | "claude-code"
  | "cline"
  | "codex"
  | "factory-droid"
  | "pi"
  | "other"
  | "ambiguous"
  | typeof UNKNOWN_AGENT_NAME;

const isPresent = (value?: string) => Boolean(value?.trim());

/**
 * Best-effort detection from environment markers set by coding-agent products.
 * These markers are not an authentication boundary: callers can spoof or inherit them.
 */
export function detectAgent(env: NodeJS.ProcessEnv = process.env): DetectedAgentName {
  const matches = new Set<Exclude<DetectedAgentName, "ambiguous" | "other" | "unknown">>();

  if (env["CLAUDE_CODE_CHILD_SESSION"] === "1" || env["CLAUDECODE"] === "1") {
    matches.add("claude-code");
  }
  if (isPresent(env["CODEX_THREAD_ID"])) matches.add("codex");
  if (isTruthyEnv(env["CLINE_ACTIVE"])) matches.add("cline");
  if (isPresent(env["FACTORY_PROJECT_DIR"])) matches.add("factory-droid");
  if (isTruthyEnv(env["PI_CODING_AGENT"])) matches.add("pi");

  // Generic cross-vendor marker (free-form value): only a fallback, so a
  // known agent that also sets it isn't reported as ambiguous.
  if (matches.size === 0) return isPresent(env["AI_AGENT"]) ? "other" : UNKNOWN_AGENT_NAME;
  if (matches.size > 1) return "ambiguous";
  return [...matches][0] ?? UNKNOWN_AGENT_NAME;
}

/**
 * The coding agent driving the CLI, or undefined for a human. Prefers the name
 * declared with `--agent-name`; agents often skip the flag, so falls back to
 * the env markers their harness sets.
 */
export function resolveAgent(
  declaredName: string = UNKNOWN_AGENT_NAME,
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  if (declaredName !== UNKNOWN_AGENT_NAME) return declaredName;
  const detected = detectAgent(env);
  return detected === UNKNOWN_AGENT_NAME ? undefined : detected;
}
