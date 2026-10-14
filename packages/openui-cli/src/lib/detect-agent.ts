import { determineAgent } from "@vercel/detect-agent";

import { isTruthyEnv } from "./env";

export const UNKNOWN_AGENT_NAME = "unknown";

const isPresent = (value?: string) => Boolean(value?.trim());

// Keeps names stable in telemetry where @vercel/detect-agent differs from ours.
const RENAMED: Record<string, string> = { claude: "claude-code" };

/** `claude` → `claude-code`, and raw `AI_AGENT` values like `claude-code_2-1-295_agent` → `claude-code`. */
function normalizeAgentName(name: string): string {
  const slug = (
    name
      .trim()
      .toLowerCase()
      .split(/[_@\s]/)[0] ?? ""
  ).replace(/[^a-z0-9-]/g, "");
  return RENAMED[slug] ?? (slug || "other");
}

/** Markers @vercel/detect-agent doesn't check. */
function detectUncoveredAgent(env: NodeJS.ProcessEnv): string | undefined {
  if (env["CLAUDE_CODE_CHILD_SESSION"] === "1") return "claude-code";
  if (isTruthyEnv(env["CLINE_ACTIVE"])) return "cline";
  if (isPresent(env["FACTORY_PROJECT_DIR"])) return "factory-droid";
  if (isTruthyEnv(env["PI_CODING_AGENT"])) return "pi";
  return undefined;
}

/**
 * Best-effort detection from environment markers set by coding-agent products.
 * These markers are not an authentication boundary: callers can spoof or inherit them.
 */
export async function detectAgent(
  env: NodeJS.ProcessEnv = process.env,
): Promise<string | undefined> {
  const result = await determineAgent().catch(() => undefined);
  if (result?.isAgent) return normalizeAgentName(result.agent.name);
  return detectUncoveredAgent(env);
}
