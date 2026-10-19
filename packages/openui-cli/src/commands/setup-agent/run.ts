import * as fs from "node:fs";
import * as path from "node:path";

import type { CliContext } from "../../lib/context";
import { CreateError } from "../../lib/errors";
import { fetchAgentsGuide, upsertAgentsGuide } from "../../lib/scaffold";

const RESULT_MESSAGES = {
  created: "Created",
  appended: "Added OpenUI instructions to",
  updated: "Updated the OpenUI instructions in",
} as const;

export async function runSetupAgent(options: { directory: string }, ctx: CliContext) {
  const projectDir = path.resolve(ctx.cwd, options.directory);
  if (!fs.statSync(projectDir, { throwIfNoEntry: false })?.isDirectory()) {
    throw new CreateError(
      "args_resolution",
      `Folder not found: ${projectDir}`,
      "invalid_input",
      "TARGET_NOT_FOUND",
    );
  }

  const guide = await fetchAgentsGuide({
    onRetry: ctx.telemetry.reportNetworkRetry("skill_fetch"),
  });
  const result = upsertAgentsGuide(projectDir, guide);
  ctx.telemetry.capture("cli_setup_agent_completed", { result });

  console.info(
    `✓ ${RESULT_MESSAGES[result]} ${path.relative(ctx.cwd, path.join(projectDir, "AGENTS.md")) || "AGENTS.md"}`,
  );
}
