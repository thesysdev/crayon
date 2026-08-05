import spawn from "cross-spawn";

const DIAGNOSTIC_TAIL_LIMIT = 16 * 1024;

export type CommandResult = {
  durationMs: number;
  status: number | null;
  signal: NodeJS.Signals | null;
  stdout?: string;
  error?: Error;
  diagnosticTail: string;
};

/** Stream child output normally while retaining only a bounded tail for classification. */
export function runCommand(
  command: string,
  args: string[],
  cwd: string,
  options: { captureStdout?: boolean } = {},
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let diagnosticTail = "";
    let capturedStdout = "";
    let settled = false;
    let forwardedSignal: NodeJS.Signals | null = null;
    let forceKillTimer: NodeJS.Timeout | undefined;

    const observe = (chunk: Buffer) => {
      diagnosticTail = (diagnosticTail + chunk.toString("utf8")).slice(-DIAGNOSTIC_TAIL_LIMIT);
    };
    child.stdout?.on("data", (chunk: Buffer) => {
      if (options.captureStdout) capturedStdout += chunk.toString("utf8");
      else {
        process.stdout.write(chunk);
        observe(chunk);
      }
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      process.stderr.write(chunk);
      observe(chunk);
    });

    const finish = (result: Omit<CommandResult, "diagnosticTail" | "durationMs">) => {
      if (settled) return;
      settled = true;
      process.off("SIGINT", onSigint);
      process.off("SIGTERM", onSigterm);
      if (forceKillTimer) clearTimeout(forceKillTimer);
      resolve({
        ...result,
        diagnosticTail,
        durationMs: Math.max(0, Date.now() - startedAt),
        ...(options.captureStdout ? { stdout: capturedStdout } : {}),
      });
    };

    const forwardSignal = (signal: NodeJS.Signals) => {
      if (forwardedSignal) {
        child.kill("SIGKILL");
        return;
      }
      forwardedSignal = signal;
      child.kill(signal);
      forceKillTimer = setTimeout(() => child.kill("SIGKILL"), 5000);
      forceKillTimer.unref();
    };
    const onSigint = () => forwardSignal("SIGINT");
    const onSigterm = () => forwardSignal("SIGTERM");

    process.on("SIGINT", onSigint);
    process.on("SIGTERM", onSigterm);
    child.once("error", (error) => finish({ status: null, signal: forwardedSignal, error }));
    child.once("close", (status, signal) => finish({ status, signal: forwardedSignal ?? signal }));
  });
}
