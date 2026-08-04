import { runCommand, type CommandResult } from "./process-runner";
import { CliCancelledError } from "./telemetry";

const OPENUI_SKILL_SOURCE = "thesysdev/skills";

export async function shouldInstallSkill(
  option: boolean | undefined,
  interactive: boolean,
): Promise<boolean> {
  if (option !== undefined) return option;
  if (!interactive) return false;

  try {
    const { confirm } = await import("@inquirer/prompts");
    return await confirm({
      message: "Install the OpenUI agent skill for AI coding assistants?",
      default: true,
    });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError("skill_prompt");
    }
    throw err;
  }
}

export function runSkillInstall(targetDir: string): Promise<CommandResult> {
  console.info("\nInstalling OpenUI agent skill...\n");
  return runCommand(
    "npx",
    ["-y", "skills", "add", OPENUI_SKILL_SOURCE, "--skill", "openui", "-y"],
    targetDir,
  );
}
