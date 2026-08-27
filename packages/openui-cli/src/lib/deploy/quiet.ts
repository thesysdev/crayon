import type { CliInvocation } from "../cli-bin";
import { runCommand, type CommandResult } from "../process-runner";
import { withSpinner } from "../spinner";

/** Enough build output to dump a useful failure tail in quiet mode. */
export const QUIET_COMMAND_CAPTURE_LIMIT = 256 * 1024;

export type QuietCommandOptions = {
  invocation: CliInvocation;
  args: string[];
  cwd: string;
  label: string;
  env?: NodeJS.ProcessEnv;
  captureLimit?: number;
};

/** Run a platform CLI with output captured and a spinner in the terminal. */
export async function runQuietCommand(opts: QuietCommandOptions): Promise<CommandResult> {
  return withSpinner(opts.label, () =>
    runCommand(
      opts.invocation.command,
      [...opts.invocation.quietPrefixArgs, ...opts.args],
      opts.cwd,
      {
        echo: false,
        stdin: "ignore",
        captureLimit: opts.captureLimit ?? QUIET_COMMAND_CAPTURE_LIMIT,
        env: opts.env,
      },
    ),
  );
}

export type DeploySuccessSummary = {
  url?: string;
  inspect?: string;
};

export function printQuietDeploySuccess(summary: DeploySuccessSummary, durationMs: number): void {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  console.info(`✓ Deployed in ${seconds}s`);
  if (summary.url) console.info(`  ${summary.url}`);
  if (summary.inspect) console.info(`  Inspect  ${summary.inspect}`);
  console.info("");
}

export function dumpFailureLog(log: string, title = "build log (tail)"): void {
  const trimmed = log.trim();
  if (!trimmed) return;
  console.error(`\n--- ${title} ---\n`);
  process.stderr.write(trimmed + "\n");
  console.error("---\n");
}
