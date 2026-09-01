import { printLogTail, QUIET_COMMAND_CAPTURE_LIMIT } from "./command-output";
import { runCommand, type CommandResult } from "./process-runner";
import { withSpinner } from "./spinner";
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

/** Spinner in quiet mode; print the label and stream output when `--verbose`. */
export async function withProgress<T>(
  label: string,
  run: () => Promise<T>,
  verbose?: boolean,
): Promise<T> {
  if (verbose) {
    console.info(`${label}\n`);
    return run();
  }
  return withSpinner(label, run);
}

export async function runDependencyInstall(params: {
  verbose?: boolean;
  command: string;
  args: string[];
  cwd: string;
  installCmd: string;
}): Promise<CommandResult> {
  const { verbose, command, args, cwd, installCmd } = params;
  const runInstall = () =>
    verbose
      ? runCommand(command, args, cwd)
      : runCommand(command, args, cwd, {
          echo: false,
          stdin: "ignore",
          captureLimit: QUIET_COMMAND_CAPTURE_LIMIT,
          env: {
            ...process.env,
            npm_config_loglevel: "error",
            NPM_CONFIG_LOGLEVEL: "error",
          },
        });

  if (verbose) console.info(`Installing dependencies with: ${installCmd}\n`);
  const result = verbose
    ? await runInstall()
    : await withSpinner("Installing dependencies...", runInstall);

  const ok = !result.error && result.status === 0;
  if (ok && !verbose) console.info("✓ Dependencies installed\n");
  if (!ok && !verbose) printLogTail(result.diagnosticTail, "install log (tail)");
  return result;
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
