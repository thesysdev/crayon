import { runCommand, type CommandResult } from "./process-runner";
import { CliCancelledError } from "./telemetry";

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
      throw new CliCancelledError("skill_install_prompt");
    }
    throw err;
  }
}

export async function runSkillInstall(targetDir: string): Promise<CommandResult> {
  console.info("\nInstalling OpenUI agent skill...\n");
  return runCommand(
    "npx",
    ["-y", "skills", "add", "thesysdev/openui", "--skill", "openui", "-y"],
    targetDir,
  );
}
