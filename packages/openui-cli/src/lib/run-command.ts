import { spawn } from "node:child_process";

const STDERR_TAIL_LIMIT = 16_384;

export class CommandExecutionError extends Error {
  constructor(
    command: string,
    public readonly exitCode: number | null,
    public readonly signal: NodeJS.Signals | null,
    public readonly stderr: string,
  ) {
    super(
      signal
        ? `${command} was terminated by ${signal}`
        : `${command} exited with code ${exitCode ?? "unknown"}`,
    );
    this.name = "CommandExecutionError";
  }
}

/** Runs a command while showing its output and retaining only a small stderr tail for local classification. */
export function runCommand(command: string, args: string[], cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ["inherit", "inherit", "pipe"],
    });
    let stderrTail = "";

    child.stderr.on("data", (chunk: Buffer | string) => {
      process.stderr.write(chunk);
      stderrTail = `${stderrTail}${chunk.toString()}`.slice(-STDERR_TAIL_LIMIT);
    });
    child.once("error", reject);
    child.once("close", (exitCode, signal) => {
      if (exitCode === 0) resolve();
      else reject(new CommandExecutionError(command, exitCode, signal, stderrTail));
    });
  });
}
