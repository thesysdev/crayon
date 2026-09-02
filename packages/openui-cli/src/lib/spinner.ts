/**
 * Terminal spinner for long-running work. Safe in non-TTY (prints the label once).
 * Clears the spinner before resolving so callers can print a final status.
 *
 * `handleSignals` is off: the process runner already forwards SIGINT/SIGTERM.
 */
export async function withSpinner<T>(label: string, run: () => Promise<T>): Promise<T> {
  if (!process.stdout.isTTY) {
    console.info(label);
    return run();
  }

  // yocto-spinner is ESM-only; this package emits CJS.
  const { default: yoctoSpinner } = await import("yocto-spinner");
  const spinner = yoctoSpinner({ text: label, handleSignals: false }).start();
  try {
    return await run();
  } finally {
    spinner.stop();
  }
}
