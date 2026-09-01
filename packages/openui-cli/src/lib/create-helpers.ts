import { CliCancelledError } from "./telemetry";

const isInteractiveTerminal = () => Boolean(process.stdin.isTTY && process.stdout.isTTY);

export function resolveImmediate(
  immediate: boolean | undefined,
  noInstall: boolean | undefined,
  interactive: boolean,
): {
  immediate: boolean;
  installDependencies: boolean;
  source: "flag" | "interactive_default" | "no_install" | "noninteractive_default";
} {
  if (noInstall) {
    return { immediate: false, installDependencies: false, source: "no_install" };
  }
  if (immediate !== undefined) {
    return {
      immediate,
      installDependencies: true,
      source: "flag",
    };
  }
  if (!interactive || !isInteractiveTerminal()) {
    return {
      immediate: false,
      installDependencies: true,
      source: "noninteractive_default",
    };
  }
  return { immediate: true, installDependencies: true, source: "interactive_default" };
}

export async function promptForProviderKey(envKey = "OPENAI_API_KEY"): Promise<string | null> {
  try {
    const { input } = await import("@inquirer/prompts");
    const apiKey = (
      await input({
        message: `Enter your ${envKey} (leave blank to skip):`,
      })
    ).trim();
    return apiKey || null;
  } catch (error) {
    const { ExitPromptError } = await import("@inquirer/core");
    if (error instanceof ExitPromptError) {
      throw new CliCancelledError("environment_resolution");
    }
    throw error;
  }
}
