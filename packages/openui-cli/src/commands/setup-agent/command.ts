import { Command } from "commander";

import { context } from "../../lib/context";

import { runSetupAgent } from "./run";

export const setupAgentCommand = new Command("setup-agent")
  .description("Add OpenUI instructions for coding agents to a project's AGENTS.md")
  .argument("[directory]", "Project folder", ".")
  .addHelpText(
    "after",
    `
Appends the OpenUI skill to AGENTS.md, or creates the file. The instructions
sit between <!-- openui:start --> and <!-- openui:end -->, so running it again
refreshes them and leaves the rest of the file alone.

Examples:
  openui setup-agent
  openui setup-agent apps/web
`,
  )
  .action(async (directory: string) => {
    await runSetupAgent({ directory }, context);
  });
