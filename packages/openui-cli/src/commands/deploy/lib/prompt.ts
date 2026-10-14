import { CliCancelledError } from "../../../lib/errors";

/**
 * Confirm with default yes when a TTY is available. `--yes` accepts without
 * asking. Without a prompt (no TTY, `--no-interactive`, or an agent) and no `--yes`
 * it returns false so secrets are not written remotely.
 */
export async function confirmOrDefault(
  message: string,
  opts: { yes?: boolean; canPrompt: boolean; cancelStage: string },
): Promise<boolean> {
  if (opts.yes) return true;
  if (!opts.canPrompt) return false;

  try {
    const { confirm } = await import("@inquirer/prompts");
    return await confirm({ message, default: true });
  } catch (err) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (err instanceof ExitPromptError) {
      throw new CliCancelledError(opts.cancelStage);
    }
    throw err;
  }
}
