export interface CommandInvocation {
  command: string;
  args: readonly string[];
}

/**
 * Resolve code-defined CLI commands through cmd.exe on Windows, where package
 * managers are commonly .cmd shims. Callers must not pass user-controlled args.
 */
export function resolveCommandInvocation(
  command: string,
  args: readonly string[],
  platform: NodeJS.Platform = process.platform,
  windowsShell = process.env["ComSpec"] ?? process.env["COMSPEC"] ?? "cmd.exe",
): CommandInvocation {
  return platform === "win32"
    ? { command: windowsShell, args: ["/d", "/s", "/c", command, ...args] }
    : { command, args };
}
