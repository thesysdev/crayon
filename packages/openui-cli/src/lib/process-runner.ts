import spawn from "cross-spawn";

const DIAGNOSTIC_TAIL_LIMIT = 16 * 1024;

export type CommandResult = {
  durationMs: number;
  status: number | null;
  signal: NodeJS.Signals | null;
  error?: Error;
  diagnosticTail: string;
};

/**
 * `spawn.sync(..., { stdio: "inherit" })` exposes exit status but not the output
 * needed to distinguish dependency, workspace, and package-compatibility failures.
 * This runner preserves normal terminal streaming while retaining only a bounded
 * local tail for allowlisted classification. The tail must never be sent to telemetry.
 *
 * Running asynchronously also lets the parent forward SIGINT/SIGTERM, wait for the
 * child to close, and return cancellation metadata before telemetry is flushed.
 */
export function runCommand(command: string, args: string[], cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      cwd,
      stdio: ["inherit", "pipe", "pipe"],
    });
    let diagnosticTail = "";
    let settled = false;
    let forwardedSignal: NodeJS.Signals | null = null;
    let forceKillTimer: NodeJS.Timeout | undefined;

    const observe = (chunk: Buffer) => {
      diagnosticTail = (diagnosticTail + chunk.toString("utf8")).slice(-DIAGNOSTIC_TAIL_LIMIT);
    };
    child.stdout?.on("data", (chunk: Buffer) => {
      process.stdout.write(chunk);
      observe(chunk);
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
      });
    };

    // Prevent the parent from exiting before the child reports which signal stopped it.
    const forwardSignal = (signal: NodeJS.Signals) => {
      if (forwardedSignal) {
        child.kill("SIGKILL");
        return;
      }
      forwardedSignal = signal;
      child.kill(signal);
      // Do not hang indefinitely when a child ignores the forwarded signal.
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
